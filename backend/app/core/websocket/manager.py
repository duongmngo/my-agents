"""
WebSocket connection manager for real-time communication
"""
from fastapi import WebSocket, WebSocketDisconnect, status
from typing import Dict, Set, Optional, List
import logging
import asyncio
import json
import time
import uuid
from datetime import datetime

from app.core.websocket.types import (
    WebSocketEnvelope,
    WebSocketMessageType,
    ClientMessage,
    HelloPayload,
    JoinAckPayload,
    LeaveAckPayload,
    ErrorPayload,
)
from app.core.websocket.redis_adapter import RedisAdapter
from app.core.security import verify_token

logger = logging.getLogger(__name__)


class AuthContext:
    """Authentication context for WebSocket connections"""
    def __init__(self, user_id: str, username: str, email: str):
        self.user_id = user_id
        self.username = username
        self.email = email


class WebSocketConnection:
    """Represents a single WebSocket connection"""
    def __init__(self, websocket: WebSocket, client_id: str, auth_ctx: AuthContext):
        self.websocket = websocket
        self.client_id = client_id
        self.auth_ctx = auth_ctx
        self.rooms: Set[str] = set()
        self.connected_at = datetime.now()
        self.last_ping = time.time()
        self.message_count = 0
        self.is_alive = True


class WebSocketManager:
    """Manages WebSocket connections, rooms, and message routing"""
    
    def __init__(self, redis_adapter: RedisAdapter):
        self.redis_adapter = redis_adapter
        
        # Active connections
        self.connections: Dict[str, WebSocketConnection] = {}
        
        # Room memberships: room_id -> set of client_ids
        self.rooms: Dict[str, Set[str]] = {}
        
        # User to client mapping: user_id -> client_id
        self.user_clients: Dict[str, str] = {}
        
        # Rate limiting: client_id -> (count, window_start)
        self.rate_limits: Dict[str, tuple[int, float]] = {}
        
        # Heartbeat task
        self._heartbeat_task: Optional[asyncio.Task] = None
        
        # Maximum message size (1MB)
        self.max_message_size = 1024 * 1024
        
        # Rate limit: 100 messages per 60 seconds
        self.rate_limit_messages = 100
        self.rate_limit_window = 60
    
    async def start(self):
        """Start the WebSocket manager"""
        # Subscribe to all room channels via Redis
        await self.redis_adapter.subscribe([
            "ws:room:*",  # All room messages
            "agent:*:*",  # All agent events
        ])
        
        # Register Redis message handler
        self.redis_adapter.on_message(self._handle_redis_message)
        
        # Start heartbeat task
        self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        
        logger.info("WebSocket manager started")
    
    async def stop(self):
        """Stop the WebSocket manager"""
        # Cancel heartbeat
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass
        
        # Disconnect all clients
        for client_id in list(self.connections.keys()):
            await self.disconnect(client_id)
        
        logger.info("WebSocket manager stopped")
    
    async def validate_auth(self, token: str) -> Optional[AuthContext]:
        """Validate JWT token and return auth context"""
        try:
            payload = verify_token(token)
            if not payload:
                return None
            
            user_id = payload.get("sub")
            username = payload.get("username")
            email = payload.get("email")
            
            if not user_id:
                return None
            
            return AuthContext(user_id=user_id, username=username or "", email=email or "")
        
        except Exception as e:
            logger.error(f"Token validation failed: {e}")
            return None
    
    def validate_origin(self, origin: Optional[str]) -> bool:
        """Validate WebSocket origin"""
        if not origin:
            return False
        
        # In production, check against allowed origins
        # For now, allow all origins from settings
        from app.core.config import settings
        allowed = settings.allowed_origins
        
        return origin in allowed or "*" in allowed
    
    async def can_access_room(self, auth_ctx: AuthContext, room_id: str) -> bool:
        """Check if user can access a room"""
        # Parse room type
        if ":" not in room_id:
            return False
        
        room_type, room_value = room_id.split(":", 1)
        
        # User can only access their own user room
        if room_type == "user":
            return room_value == auth_ctx.user_id
        
        # For conversation rooms, check participation
        # TODO: Query database to verify user is participant
        if room_type == "conversation":
            # For now, allow all authenticated users
            # In production: check conversation_participants table
            return True
        
        # System broadcast is read-only for all authenticated users
        if room_type == "system" and room_value == "broadcast":
            return True
        
        return False
    
    def _check_rate_limit(self, client_id: str) -> bool:
        """Check if client exceeds rate limit"""
        now = time.time()
        
        if client_id in self.rate_limits:
            count, window_start = self.rate_limits[client_id]
            
            # Reset window if expired
            if now - window_start >= self.rate_limit_window:
                self.rate_limits[client_id] = (1, now)
                return True
            
            # Check limit
            if count >= self.rate_limit_messages:
                return False
            
            # Increment counter
            self.rate_limits[client_id] = (count + 1, window_start)
            return True
        else:
            self.rate_limits[client_id] = (1, now)
            return True
    
    async def accept(self, websocket: WebSocket, token: str) -> Optional[str]:
        """
        Accept a WebSocket connection
        
        Returns client_id on success, None on failure
        """
        try:
            # Accept connection FIRST before any async operations
            # This prevents the client from timing out during validation
            logger.info("Step 1: About to accept WebSocket")
            await websocket.accept()
            logger.info("Step 2: WebSocket accepted, validating auth")
            
            # Now validate authentication
            auth_ctx = await self.validate_auth(token)
            logger.info(f"Step 3: Auth validation result: {auth_ctx is not None}")
            if not auth_ctx:
                logger.warning("Step 3a: Auth failed, closing connection")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
                return None
            
            # Generate client ID
            client_id = str(uuid.uuid4())
            logger.info(f"Step 4: Generated client_id: {client_id}")
            
            # Create connection (but don't register yet to avoid heartbeat race)
            logger.info(f"Step 5: Creating connection object")
            conn = WebSocketConnection(websocket, client_id, auth_ctx)
            self.user_clients[auth_ctx.user_id] = client_id
            logger.info(f"Step 6: User {auth_ctx.user_id} mapped to client {client_id}")
            
            # Silently add to user's personal room (without sending JOIN_ACK)
            user_room = f"user:{auth_ctx.user_id}"
            if user_room not in self.rooms:
                self.rooms[user_room] = set()
            self.rooms[user_room].add(client_id)
            conn.rooms.add(user_room)
            await self.redis_adapter.add_to_room(user_room, client_id)
            logger.info(f"Step 7: Client {client_id} auto-joined room {user_room}")
            
            # Register connection now that everything is set up
            self.connections[client_id] = conn
            logger.info(f"Step 8: Connection registered in connections dict")
            
            # # Send HELLO message to client
            # hello_payload = HelloPayload(
            #     serverTime=int(time.time() * 1000),
            #     clientId=client_id,
            #     version="1.0"
            # )
            # hello_envelope = WebSocketEnvelope.create(
            #     WebSocketMessageType.HELLO,
            #     room="system",
            #     payload=hello_payload
            # )
            # await self._send_to_client(client_id, hello_envelope)
            # logger.info(f"Step 9: HELLO message sent to client")
            
            logger.info(f"Client {client_id} connected for user {auth_ctx.user_id}")
            
            return client_id
        except Exception as e:
            logger.error(f"Failed to accept WebSocket connection: {e}", exc_info=True)
            try:
                await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Connection failed")
            except:
                pass
            return None
    
    async def disconnect(self, client_id: str):
        """Disconnect a client and cleanup resources"""
        conn = self.connections.get(client_id)
        if not conn:
            return
        
        # Leave all rooms
        for room_id in list(conn.rooms):
            await self.leave_room(client_id, room_id)
        
        # Remove from user clients
        if conn.auth_ctx.user_id in self.user_clients:
            if self.user_clients[conn.auth_ctx.user_id] == client_id:
                del self.user_clients[conn.auth_ctx.user_id]
        
        # Mark as disconnected
        conn.is_alive = False
        
        # Remove connection
        del self.connections[client_id]
        
        # Cleanup rate limits
        if client_id in self.rate_limits:
            del self.rate_limits[client_id]
        
        logger.info(f"Client {client_id} disconnected")
    
    async def join_room(self, client_id: str, room_id: str) -> bool:
        """Join a room"""
        conn = self.connections.get(client_id)
        if not conn:
            return False
        
        # Check authorization
        if not await self.can_access_room(conn.auth_ctx, room_id):
            logger.warning(f"Client {client_id} denied access to room {room_id}")
            # Send error
            error_payload = ErrorPayload(
                error=f"Access denied to room {room_id}",
                code="ROOM_ACCESS_DENIED"
            )
            error_envelope = WebSocketEnvelope.create(
                WebSocketMessageType.ERROR,
                room="system",
                payload=error_payload
            )
            await self._send_to_client(client_id, error_envelope)
            return False
        
        # Add to room
        conn.rooms.add(room_id)
        
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(client_id)
        
        # Update Redis
        await self.redis_adapter.add_to_room(room_id, client_id)
        
        # Send acknowledgment
        ack_payload = JoinAckPayload(
            room=room_id,
            joinedAt=int(time.time() * 1000)
        )
        ack_envelope = WebSocketEnvelope.create(
            WebSocketMessageType.JOIN_ACK,
            room=room_id,
            payload=ack_payload
        )
        await self._send_to_client(client_id, ack_envelope)
        
        logger.info(f"Client {client_id} joined room {room_id}")
        return True
    
    async def leave_room(self, client_id: str, room_id: str):
        """Leave a room"""
        conn = self.connections.get(client_id)
        if not conn:
            return
        
        # Remove from room
        conn.rooms.discard(room_id)
        
        if room_id in self.rooms:
            self.rooms[room_id].discard(client_id)
            if not self.rooms[room_id]:
                del self.rooms[room_id]
        
        # Update Redis
        await self.redis_adapter.remove_from_room(room_id, client_id)
        
        # Send acknowledgment
        ack_payload = LeaveAckPayload(
            room=room_id,
            leftAt=int(time.time() * 1000)
        )
        ack_envelope = WebSocketEnvelope.create(
            WebSocketMessageType.LEAVE_ACK,
            room=room_id,
            payload=ack_payload
        )
        await self._send_to_client(client_id, ack_envelope)
        
        logger.info(f"Client {client_id} left room {room_id}")
    
    async def broadcast(self, room_id: str, envelope: WebSocketEnvelope):
        """Broadcast a message to all clients in a room (local + Redis)"""
        # Send to local clients
        if room_id in self.rooms:
            for client_id in list(self.rooms[room_id]):
                await self._send_to_client(client_id, envelope)
        
        # Publish to Redis for other instances
        await self.redis_adapter.publish(room_id, envelope)
    
    async def dispatch(self, client_id: str, envelope: WebSocketEnvelope):
        """Send a message directly to a specific client"""
        await self._send_to_client(client_id, envelope)
    
    async def _send_to_client(self, client_id: str, envelope: WebSocketEnvelope):
        """Send an envelope to a specific client"""
        # conn = self.connections.get(client_id)
        # if not conn or not conn.is_alive:
        #     return
        
        # try:
        #     data = envelope.model_dump_json(by_alias=True)
        #     await conn.websocket.send_text(data)
        #     conn.message_count += 1
        # except WebSocketDisconnect:
        #     logger.debug(f"Client {client_id} disconnected while sending")
        #     await self.disconnect(client_id)
        # except RuntimeError as e:
        #     error_msg = str(e).lower()
        #     if "no close frame" in error_msg or "websocket is closed" in error_msg or "websocket" in error_msg:
        #         logger.debug(f"Client {client_id} connection not ready or closed: {e}")
        #         # Don't disconnect on connection not ready errors, it might just be initializing
        #         if conn.message_count > 0:  # Only disconnect if we've successfully sent messages before
        #             await self.disconnect(client_id)
        #     else:
        #         logger.error(f"Failed to send to client {client_id}: {e}")
        # except Exception as e:
        #     logger.error(f"Failed to send to client {client_id}: {e}")
        #     # Don't auto-disconnect on unknown errors, let connection loop handle it
    
    async def _handle_redis_message(self, channel: str, envelope: WebSocketEnvelope):
        """Handle incoming Redis pub/sub messages"""
        # Extract room from channel
        if channel.startswith("ws:room:"):
            room_id = channel[8:]  # Remove "ws:room:" prefix
        elif channel.startswith("agent:"):
            # Transform agent event to envelope
            # Channel format: agent:{conversation_id}:event_type
            parts = channel.split(":")
            if len(parts) >= 3:
                conversation_id = parts[1]
                room_id = f"conversation:{conversation_id}"
            else:
                return
        else:
            return
        
        # Send to local clients in this room
        if room_id in self.rooms:
            for client_id in list(self.rooms[room_id]):
                await self._send_to_client(client_id, envelope)
    
    async def handle_client_message(self, client_id: str, message: str):
        """Handle incoming message from client"""
        conn = self.connections.get(client_id)
        if not conn:
            return
        
        # Check message size
        if len(message) > self.max_message_size:
            logger.warning(f"Client {client_id} sent oversized message")
            error_payload = ErrorPayload(
                error="Message too large",
                code="MESSAGE_TOO_LARGE"
            )
            error_envelope = WebSocketEnvelope.create(
                WebSocketMessageType.ERROR,
                room="system",
                payload=error_payload
            )
            await self._send_to_client(client_id, error_envelope)
            return
        
        # Check rate limit
        if not self._check_rate_limit(client_id):
            logger.warning(f"Client {client_id} exceeded rate limit")
            error_payload = ErrorPayload(
                error="Rate limit exceeded",
                code="RATE_LIMIT_EXCEEDED"
            )
            error_envelope = WebSocketEnvelope.create(
                WebSocketMessageType.ERROR,
                room="system",
                payload=error_payload
            )
            await self._send_to_client(client_id, error_envelope)
            return
        
        # Parse message - try envelope format first, then client message format
        try:
            parsed = json.loads(message)
            print("Parsed message:", parsed)
            
            # Check if it's an envelope format (has 'version' and 'type' fields)
            if isinstance(parsed, dict) and 'version' in parsed and 'type' in parsed:
                # It's an envelope - extract action from 'type' field
                action = parsed.get('type')
                room = parsed.get('room')
                data = parsed.get('payload', {})
                
                # Map envelope type to action
                if action == 'ping':
                    action = 'ping'
                elif action == 'join_ack':
                    action = 'join'
                elif action == 'leave_ack':
                    action = 'leave'
                elif action == 'typing':
                    action = 'typing'
                
                # Create a client message object
                client_msg = ClientMessage(action=action, room=room, data=data)
            else:
                # It's a simple client message format
                client_msg = ClientMessage(**parsed)
                
        except Exception as e:
            logger.error(f"Failed to parse client message: {e}")
            error_payload = ErrorPayload(
                error="Invalid message format",
                code="INVALID_MESSAGE"
            )
            error_envelope = WebSocketEnvelope.create(
                WebSocketMessageType.ERROR,
                room="system",
                payload=error_payload
            )
            await self._send_to_client(client_id, error_envelope)
            return
        
        # Handle action
        if client_msg.action == "join" and client_msg.room:
            await self.join_room(client_id, client_msg.room)
        
        elif client_msg.action == "leave" and client_msg.room:
            await self.leave_room(client_id, client_msg.room)
        
        elif client_msg.action == "ping":
            conn.last_ping = time.time()
            pong_envelope = WebSocketEnvelope(
                version=1,
                type=WebSocketMessageType.PONG,
                room="system",
                ts=int(time.time() * 1000),
                id=str(uuid.uuid4()),
                payload={}
            )
            await self._send_to_client(client_id, pong_envelope)
        
        elif client_msg.action == "typing" and client_msg.room and client_msg.data:
            # Broadcast typing indicator to room
            from app.core.websocket.types import TypingIndicatorPayload
            typing_payload = TypingIndicatorPayload(
                conversationId=client_msg.room.split(":")[-1],
                userId=conn.auth_ctx.user_id,
                isTyping=client_msg.data.get("isTyping", False)
            )
            typing_envelope = WebSocketEnvelope.create(
                WebSocketMessageType.TYPING_INDICATOR,
                room=client_msg.room,
                payload=typing_payload
            )
            await self.broadcast(client_msg.room, typing_envelope)
    
    async def _heartbeat_loop(self):
        """Periodically send pings and cleanup stale connections"""
        while True:
            try:
                await asyncio.sleep(30)  # Check every 30 seconds
                
                now = time.time()
                stale_clients = []
                
                for client_id, conn in self.connections.items():
                    # Check if connection is stale (no ping in 60 seconds)
                    if now - conn.last_ping > 60:
                        stale_clients.append(client_id)
                        continue
                    
                    # Send ping
                    ping_envelope = WebSocketEnvelope(
                        version=1,
                        type=WebSocketMessageType.PING,
                        room="system",
                        ts=int(time.time() * 1000),
                        id=str(uuid.uuid4()),
                        payload={}
                    )
                    await self._send_to_client(client_id, ping_envelope)
                
                # Disconnect stale clients
                for client_id in stale_clients:
                    logger.info(f"Disconnecting stale client {client_id}")
                    await self.disconnect(client_id)
            
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in heartbeat loop: {e}", exc_info=True)
