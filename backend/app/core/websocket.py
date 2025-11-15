"""
WebSocket support for real-time chat functionality
"""
from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List, Set, Optional
import json
import asyncio
import logging
from datetime import datetime

from app.core.database import get_db
from app.models import User
from app.core.dependencies import get_current_user
from app.schemas.chat_schemas import WebSocketMessage, TypingIndicator, AgentResponseChunk

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""
    
    def __init__(self):
        # Store active connections by conversation_id
        self.conversation_connections: Dict[str, Set[WebSocket]] = {}
        # Store user connections for typing indicators
        self.user_connections: Dict[str, WebSocket] = {}
        # Store typing indicators by conversation
        self.typing_indicators: Dict[str, Dict[str, datetime]] = {}
    
    async def connect(self, websocket: WebSocket, conversation_id: str, user_id: str):
        """Accept a WebSocket connection"""
        await websocket.accept()
        
        # Add to conversation connections
        if conversation_id not in self.conversation_connections:
            self.conversation_connections[conversation_id] = set()
        self.conversation_connections[conversation_id].add(websocket)
        
        # Add to user connections
        self.user_connections[user_id] = websocket
        
        logger.info(f"User {user_id} connected to conversation {conversation_id}")
    
    def disconnect(self, websocket: WebSocket, conversation_id: str, user_id: str):
        """Remove a WebSocket connection"""
        # Remove from conversation connections
        if conversation_id in self.conversation_connections:
            self.conversation_connections[conversation_id].discard(websocket)
            if not self.conversation_connections[conversation_id]:
                del self.conversation_connections[conversation_id]
        
        # Remove from user connections
        if user_id in self.user_connections:
            del self.user_connections[user_id]
        
        # Remove typing indicator
        if conversation_id in self.typing_indicators and user_id in self.typing_indicators[conversation_id]:
            del self.typing_indicators[conversation_id][user_id]
        
        logger.info(f"User {user_id} disconnected from conversation {conversation_id}")
    
    async def send_message_to_conversation(
        self, 
        conversation_id: str, 
        message: WebSocketMessage,
        exclude_user: Optional[str] = None
    ):
        """Send a message to all users in a conversation"""
        if conversation_id not in self.conversation_connections:
            return
        
        message_data = message.dict()
        disconnected_connections = set()
        
        for websocket in self.conversation_connections[conversation_id]:
            try:
                # Skip if this is the sender
                if exclude_user and message.user_id == exclude_user:
                    continue
                
                await websocket.send_text(json.dumps(message_data))
            except Exception as e:
                logger.error(f"Error sending message to websocket: {e}")
                disconnected_connections.add(websocket)
        
        # Clean up disconnected connections
        for websocket in disconnected_connections:
            self.conversation_connections[conversation_id].discard(websocket)
    
    async def send_typing_indicator(
        self, 
        conversation_id: str, 
        typing_data: TypingIndicator
    ):
        """Send typing indicator to conversation participants"""
        if conversation_id not in self.conversation_connections:
            return
        
        # Update typing indicators
        if conversation_id not in self.typing_indicators:
            self.typing_indicators[conversation_id] = {}
        
        if typing_data.is_typing:
            self.typing_indicators[conversation_id][typing_data.user_id] = datetime.utcnow()
        else:
            self.typing_indicators[conversation_id].pop(typing_data.user_id, None)
        
        # Send to all participants except the sender
        typing_message = WebSocketMessage(
            type="typing",
            data=typing_data.dict(),
            conversation_id=conversation_id,
            user_id=typing_data.user_id
        )
        
        await self.send_message_to_conversation(
            conversation_id, 
            typing_message, 
            exclude_user=typing_data.user_id
        )
    
    async def send_agent_response_chunk(
        self, 
        conversation_id: str, 
        chunk_data: AgentResponseChunk
    ):
        """Send a chunk of agent response to conversation participants"""
        chunk_message = WebSocketMessage(
            type="agent_response_chunk",
            data=chunk_data.dict(),
            conversation_id=conversation_id
        )
        
        await self.send_message_to_conversation(conversation_id, chunk_message)
    
    async def send_agent_response_complete(
        self, 
        conversation_id: str, 
        message_id: str,
        metadata: Optional[Dict] = None
    ):
        """Send completion signal for agent response"""
        complete_message = WebSocketMessage(
            type="agent_response_complete",
            data={
                "message_id": message_id,
                "metadata": metadata or {}
            },
            conversation_id=conversation_id
        )
        
        await self.send_message_to_conversation(conversation_id, complete_message)
    
    def get_typing_users(self, conversation_id: str) -> List[str]:
        """Get list of users currently typing in a conversation"""
        if conversation_id not in self.typing_indicators:
            return []
        
        # Filter out old typing indicators (older than 5 seconds)
        now = datetime.utcnow()
        active_typing = {}
        
        for user_id, last_typing in self.typing_indicators[conversation_id].items():
            if (now - last_typing).total_seconds() < 5:
                active_typing[user_id] = last_typing
        
        self.typing_indicators[conversation_id] = active_typing
        return list(active_typing.keys())


# Global connection manager instance
manager = ConnectionManager()


class WebSocketHandler:
    """Handles WebSocket connections and message processing"""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.manager = connection_manager
    
    async def handle_websocket(
        self, 
        websocket: WebSocket, 
        conversation_id: str, 
        user_id: str
    ):
        """Handle a WebSocket connection"""
        await self.manager.connect(websocket, conversation_id, user_id)
        
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Process different message types
                await self._process_websocket_message(
                    websocket, 
                    conversation_id, 
                    user_id, 
                    message_data
                )
                
        except WebSocketDisconnect:
            self.manager.disconnect(websocket, conversation_id, user_id)
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            self.manager.disconnect(websocket, conversation_id, user_id)
    
    async def _process_websocket_message(
        self, 
        websocket: WebSocket, 
        conversation_id: str, 
        user_id: str, 
        message_data: Dict
    ):
        """Process incoming WebSocket messages"""
        message_type = message_data.get("type")
        
        if message_type == "typing":
            # Handle typing indicator
            typing_data = TypingIndicator(
                user_id=user_id,
                conversation_id=conversation_id,
                is_typing=message_data.get("data", {}).get("is_typing", False)
            )
            await self.manager.send_typing_indicator(conversation_id, typing_data)
        
        elif message_type == "message":
            # Handle regular message (this would typically be processed by the API)
            # and then broadcast to other participants
            pass
        
        elif message_type == "ping":
            # Handle ping/pong for connection health
            await websocket.send_text(json.dumps({"type": "pong"}))
        
        else:
            logger.warning(f"Unknown WebSocket message type: {message_type}")


# WebSocket endpoint handler
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: str,
    user_id: str = Depends(get_current_user)
):
    """WebSocket endpoint for chat conversations"""
    handler = WebSocketHandler(manager)
    await handler.handle_websocket(websocket, conversation_id, user_id.id)


# Utility functions for sending messages from other parts of the application
async def broadcast_message_to_conversation(
    conversation_id: str, 
    message: WebSocketMessage
):
    """Broadcast a message to all participants in a conversation"""
    await manager.send_message_to_conversation(conversation_id, message)


async def broadcast_agent_response_chunk(
    conversation_id: str, 
    chunk_data: AgentResponseChunk
):
    """Broadcast an agent response chunk to conversation participants"""
    await manager.send_agent_response_chunk(conversation_id, chunk_data)


async def broadcast_agent_response_complete(
    conversation_id: str, 
    message_id: str,
    metadata: Optional[Dict] = None
):
    """Broadcast agent response completion to conversation participants"""
    await manager.send_agent_response_complete(conversation_id, message_id, metadata)
