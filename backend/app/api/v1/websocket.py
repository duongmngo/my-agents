"""
WebSocket endpoint for real-time communication
"""
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends, status
from typing import Optional
import logging

from app.core.websocket.manager import WebSocketManager
from app.core.dependencies import get_websocket_manager
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    manager: WebSocketManager = Depends(get_websocket_manager)
):
    """
    WebSocket endpoint for real-time communication
    
    Query parameters:
    - token: JWT access token for authentication
    
    Protocol:
    1. Client connects with JWT token
    2. Server validates token and sends HELLO message
    3. Client joins rooms via JSON messages: {"action": "join", "room": "conversation:123"}
    4. Server sends real-time updates via envelopes
    5. Client can send actions: join, leave, ping, typing
    """
    client_id: Optional[str] = None
    
    try:
        logger.debug(f"WebSocket connection attempt with token: {token[:20] if token else 'None'}...")
        
        # Validate token and accept connection
        if not token:
            logger.warning("WebSocket connection rejected: Missing token")
            try:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
            except Exception as e:
                logger.debug(f"Error closing websocket: {e}")
            return
        
        logger.debug("Token present, calling manager.accept()")
        client_id = await manager.accept(websocket, token)
        logger.debug(f"manager.accept() returned: {client_id}")
        
        if not client_id:
            # Connection rejected (manager already closed the socket)
            logger.warning("WebSocket connection rejected: Invalid token or accept failed")
            return
        
        logger.info(f"WebSocket connection established for client {client_id}")
        
        # Connection loop
        while True:
            try:
                # Receive any message type from client (blocking wait)
                data = await websocket.receive()
                logger.debug(f"Received data from {client_id}: {data}")
                
                # Handle disconnect
                if data.get("type") == "websocket.disconnect":
                    code = data.get("code", "unknown")
                    reason = data.get("reason", "no reason")
                    logger.info(f"Client {client_id} disconnected - code: {code}, reason: {reason}")
                    break
                
                # Handle text messages
                if data.get("type") == "websocket.receive":
                    if "text" in data:
                        message = data["text"]
                        logger.debug(f"Received message from {client_id}: {message[:100] if len(message) > 100 else message}")
                        # Handle client message
                        await manager.handle_client_message(client_id, message)
                    elif "bytes" in data:
                        logger.warning(f"Received binary data from {client_id}, ignoring")

            except WebSocketDisconnect:
                logger.info(f"Client {client_id} disconnected")
                break
            
            except Exception as e:
                logger.error(f"Error handling message from client {client_id}: {e}", exc_info=True)
                break
    
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}", exc_info=True)
    
    finally:
        # Cleanup
        if client_id:
            logger.debug(f"Cleaning up client {client_id}")
            try:
                await manager.disconnect(client_id)
            except Exception as e:
                logger.error(f"Error during disconnect cleanup: {e}")
            except Exception as e:
                logger.error(f"Error during disconnect cleanup: {e}")
