"""
Redis adapter for WebSocket pub/sub and room management
"""
import redis.asyncio as redis
from typing import Callable, List, Optional, Set, Dict, Any
import json
import logging
import asyncio
from datetime import datetime

from app.core.websocket.types import WebSocketEnvelope, WebSocketMessageType
from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisAdapter:
    """Redis pub/sub adapter for multi-instance WebSocket coordination"""
    
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or settings.redis_url
        self.redis_client: Optional[redis.Redis] = None  # type: ignore
        self.pubsub = None
        self.subscriptions: Set[str] = set()
        self.message_handlers: List[Callable] = []
        self._listen_task: Optional[asyncio.Task] = None
        
    async def connect(self):
        """Connect to Redis and set up pub/sub"""
        try:
            print(f"Connecting to Redis at {self.redis_url}...")
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await self.redis_client.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
            
            # Set up pubsub
            self.pubsub = self.redis_client.pubsub()
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self._listen_task:
            self._listen_task.cancel()
            try:
                await self._listen_task
            except asyncio.CancelledError:
                pass
        
        if self.pubsub:
            await self.pubsub.unsubscribe()
            await self.pubsub.close()
        
        if self.redis_client:
            await self.redis_client.close()
        
        logger.info("Disconnected from Redis")
    
    def _transform_agent_message(self, channel: str, data: Dict[str, Any]) -> WebSocketEnvelope:
        """Transform agent channel message to WebSocket envelope"""
        import uuid
        import time
        
        # Parse channel: agent:{conversation_id}:{event_type}
        parts = channel.split(":")
        conversation_id = parts[1] if len(parts) >= 2 else "unknown"
        event_type = parts[2] if len(parts) >= 3 else "unknown"
        
        # Map event type to WebSocket message type
        type_mapping = {
            "step": WebSocketMessageType.AGENT_STEP,
            "token": WebSocketMessageType.AGENT_TOKEN,
            "complete": WebSocketMessageType.AGENT_COMPLETE,
            "error": WebSocketMessageType.AGENT_ERROR,
        }
        
        message_type = type_mapping.get(event_type, WebSocketMessageType.AGENT_ERROR)
        room = f"conversation:{conversation_id}"
        
        # Create envelope
        return WebSocketEnvelope(
            version=1,
            type=message_type,
            room=room,
            ts=int(time.time() * 1000),
            id=str(uuid.uuid4()),
            payload=data
        )
    
    async def subscribe(self, patterns: List[str]):
        """Subscribe to Redis pub/sub patterns"""
        if not self.pubsub:
            raise RuntimeError("Redis pubsub not initialized. Call connect() first.")
        
        for pattern in patterns:
            if pattern not in self.subscriptions:
                if "*" in pattern:
                    await self.pubsub.psubscribe(pattern)
                else:
                    await self.pubsub.subscribe(pattern)
                self.subscriptions.add(pattern)
                logger.info(f"Subscribed to pattern: {pattern}")
        
        # Start listening if not already started
        if not self._listen_task or self._listen_task.done():
            self._listen_task = asyncio.create_task(self._listen())
    
    async def _listen(self):
        """Listen for Redis pub/sub messages"""
        try:
            async for message in self.pubsub.listen():  # type: ignore
                if message["type"] in ("message", "pmessage"):
                    channel = message["channel"]
                    data = message["data"]
                    
                    try:
                        # Parse data
                        envelope_data = json.loads(data) if isinstance(data, str) else data
                        
                        # Transform agent channel messages to envelope format
                        if channel.startswith("agent:"):
                            envelope = self._transform_agent_message(channel, envelope_data)
                        else:
                            envelope = WebSocketEnvelope(**envelope_data)
                        
                        # Call all handlers
                        for handler in self.message_handlers:
                            try:
                                await handler(channel, envelope)
                            except Exception as e:
                                logger.error(f"Error in message handler: {e}", exc_info=True)
                    
                    except Exception as e:
                        logger.error(f"Failed to parse envelope from channel {channel}: {e}")
        
        except asyncio.CancelledError:
            logger.info("Redis listener task cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in Redis listener: {e}", exc_info=True)
    
    def on_message(self, callback: Callable):
        """Register a callback for incoming messages"""
        self.message_handlers.append(callback)
    
    async def publish(self, room_id: str, envelope: WebSocketEnvelope):
        """Publish an envelope to a room channel"""
        if not self.redis_client:
            raise RuntimeError("Redis client not initialized")
        
        channel = f"ws:room:{room_id}"
        try:
            envelope_json = envelope.model_dump_json(by_alias=True)
            await self.redis_client.publish(channel, envelope_json)
            logger.debug(f"Published to {channel}: {envelope.type}")
        except Exception as e:
            logger.error(f"Failed to publish to {channel}: {e}")
            raise
    
    async def add_to_room(self, room_id: str, client_id: str):
        """Add a client to a room set (for debugging/presence)"""
        if not self.redis_client:
            return
        
        try:
            key = f"ws:room:{room_id}:members"
            await self.redis_client.sadd(key, client_id)  # type: ignore
            # Set TTL to auto-cleanup stale memberships
            await self.redis_client.expire(key, 3600)  # type: ignore # 1 hour
        except Exception as e:
            logger.error(f"Failed to add {client_id} to room {room_id}: {e}")
    
    async def remove_from_room(self, room_id: str, client_id: str):
        """Remove a client from a room set"""
        if not self.redis_client:
            return
        
        try:
            key = f"ws:room:{room_id}:members"
            await self.redis_client.srem(key, client_id)  # type: ignore
        except Exception as e:
            logger.error(f"Failed to remove {client_id} from room {room_id}: {e}")
    
    async def get_room_members(self, room_id: str) -> Set[str]:
        """Get all members of a room"""
        if not self.redis_client:
            return set()
        
        try:
            key = f"ws:room:{room_id}:members"
            members = await self.redis_client.smembers(key)  # type: ignore
            return members if members else set()
        except Exception as e:
            logger.error(f"Failed to get members of room {room_id}: {e}")
            return set()
    
    async def presence_set(self, user_id: str, status: str, ttl: int = 300):
        """Set user presence with TTL"""
        if not self.redis_client:
            return
        
        try:
            key = f"presence:user:{user_id}"
            await self.redis_client.setex(key, ttl, status)
        except Exception as e:
            logger.error(f"Failed to set presence for user {user_id}: {e}")
    
    async def presence_get(self, user_id: str) -> Optional[str]:
        """Get user presence status"""
        if not self.redis_client:
            return None
        
        try:
            key = f"presence:user:{user_id}"
            return await self.redis_client.get(key)
        except Exception as e:
            logger.error(f"Failed to get presence for user {user_id}: {e}")
            return None
    
    async def transform_agent_event(self, channel: str, data: Dict[str, Any]) -> Optional[WebSocketEnvelope]:
        """
        Transform agent events to WebSocket envelopes
        
        Agent event channels:
        - agent:{conversation_id}:step
        - agent:{conversation_id}:token
        - agent:{conversation_id}:complete
        - agent:{conversation_id}:error
        """
        try:
            # Parse channel to extract conversation_id and event type
            parts = channel.split(":")
            if len(parts) < 3 or parts[0] != "agent":
                return None
            
            conversation_id = parts[1]
            event_type = parts[2]
            
            # Map event type to WebSocket message type
            type_mapping = {
                "step": WebSocketMessageType.AGENT_STEP,
                "token": WebSocketMessageType.AGENT_RESPONSE_CHUNK,
                "complete": WebSocketMessageType.AGENT_RESPONSE_COMPLETE,
                "error": WebSocketMessageType.AGENT_ERROR,
            }
            
            ws_type = type_mapping.get(event_type)
            if not ws_type:
                return None
            
            # Create envelope
            room = f"conversation:{conversation_id}"
            import uuid
            import time
            
            envelope = WebSocketEnvelope(
                version=1,
                type=ws_type,
                room=room,
                ts=int(time.time() * 1000),
                id=str(uuid.uuid4()),
                payload=data,
                meta={"source": "agent"}
            )
            
            return envelope
        
        except Exception as e:
            logger.error(f"Failed to transform agent event from {channel}: {e}")
            return None
