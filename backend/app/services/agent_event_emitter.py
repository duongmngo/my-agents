"""
Agent event emitter for Redis pub/sub
"""
import redis.asyncio as redis
import json
import logging
import time
from typing import Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class AgentEventEmitter:
    """Emits agent events to Redis channels for WebSocket broadcasting"""
    
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or settings.redis_url
        self.redis_client: Optional[redis.Redis] = None
        self._connected = False
    
    async def connect(self):
        """Connect to Redis"""
        if self._connected:
            return
        
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_client.ping()
            self._connected = True
            logger.info("AgentEventEmitter connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect AgentEventEmitter to Redis: {e}")
            self.redis_client = None
            self._connected = False
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
            self._connected = False
    
    async def emit_step(
        self,
        conversation_id: str,
        message_id: str,
        step_index: int,
        kind: str,  # "plan", "tool_call", "tool_result", "reasoning"
        content: str,
        user_id: str,
        tool_name: Optional[str] = None,
        tool_input: Optional[Dict[str, Any]] = None
    ):
        """Emit an agent thinking/tool step"""
        if not self._connected:
            await self.connect()
        
        if not self.redis_client:
            logger.warning("Cannot emit step: Redis not connected")
            return
        
        channel = f"user:{user_id}"
        payload = {
            "type": "step",
            "conversationId": conversation_id,
            "messageId": message_id,
            "stepIndex": step_index,
            "kind": kind,
            "content": content,
            "ts": int(time.time() * 1000)
        }
        
        if tool_name:
            payload["toolName"] = tool_name
        if tool_input:
            payload["toolInput"] = tool_input
        
        try:
            await self.redis_client.publish(channel, json.dumps(payload))
            logger.debug(f"Emitted step {step_index} to {channel}")
        except Exception as e:
            logger.error(f"Failed to emit step to {channel}: {e}")
    
    async def emit_token(
        self,
        conversation_id: str,
        message_id: str,
        chunk: str,
        user_id: str,
        is_final: bool = False
    ):
        """Emit an agent response token/chunk"""
        if not self._connected:
            await self.connect()
        
        if not self.redis_client:
            logger.warning("Cannot emit token: Redis not connected")
            return
        
        channel = f"user:{user_id}"
        payload = {
            "type": "token",
            "conversationId": conversation_id,
            "messageId": message_id,
            "chunk": chunk,
            "isFinal": is_final
        }
        
        try:
            await self.redis_client.publish(channel, json.dumps(payload))
            logger.debug(f"Emitted token chunk to {channel}")
        except Exception as e:
            logger.error(f"Failed to emit token to {channel}: {e}")
    
    async def emit_complete(
        self,
        conversation_id: str,
        message_id: str,
        final_text: str,
        user_id: str,
        metadata: Optional[Dict[str, Any]] = None,
        message: Optional[Dict[str, Any]] = None
    ):
        """Emit agent response completion with full message payload"""
        if not self._connected:
            await self.connect()
        
        if not self.redis_client:
            logger.warning("Cannot emit complete: Redis not connected")
            return
        
        channel = f"user:{user_id}"
        payload = {
            "type": "complete",
            "conversationId": conversation_id,
            "messageId": message_id,
            "finalText": final_text,
            "metadata": metadata or {},
            "message": message  # Include full message payload
        }
        
        try:
            await self.redis_client.publish(channel, json.dumps(payload))
            logger.debug(f"Emitted completion to {channel}")
        except Exception as e:
            logger.error(f"Failed to emit complete to {channel}: {e}")
    
    async def emit_error(
        self,
        conversation_id: str,
        error: str,
        user_id: str,
        message_id: Optional[str] = None,
        code: Optional[str] = None
    ):
        """Emit agent error"""
        if not self._connected:
            await self.connect()
        
        if not self.redis_client:
            logger.warning("Cannot emit error: Redis not connected")
            return
        
        channel = f"user:{user_id}"
        payload = {
            "type": "error",
            "conversationId": conversation_id,
            "error": error,
        }
        
        if message_id:
            payload["messageId"] = message_id
        if code:
            payload["code"] = code
        
        try:
            await self.redis_client.publish(channel, json.dumps(payload))
            logger.debug(f"Emitted error to {channel}")
        except Exception as e:
            logger.error(f"Failed to emit error to {channel}: {e}")


# Global instance
_agent_event_emitter: Optional[AgentEventEmitter] = None


def get_agent_event_emitter() -> AgentEventEmitter:
    """Get the global agent event emitter instance"""
    global _agent_event_emitter
    if _agent_event_emitter is None:
        _agent_event_emitter = AgentEventEmitter()
    return _agent_event_emitter
