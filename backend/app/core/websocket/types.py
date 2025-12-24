"""
WebSocket message types and envelope schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum


class WebSocketMessageType(str, Enum):
    """WebSocket message types"""
    # Agent streaming
    AGENT_RESPONSE_CHUNK = "agent_response_chunk"
    AGENT_RESPONSE_COMPLETE = "agent_response_complete"
    AGENT_STEP = "agent_step"
    AGENT_TOKEN = "agent_token"  # Alias for AGENT_RESPONSE_CHUNK
    AGENT_COMPLETE = "agent_complete"  # Alias for AGENT_RESPONSE_COMPLETE
    AGENT_ERROR = "agent_error"
    
    # UI feedback
    TYPING_INDICATOR = "typing_indicator"
    
    # Notifications
    NOTIFICATION = "notification"
    
    # System
    HELLO = "hello"
    PING = "ping"
    PONG = "pong"
    JOIN_ACK = "join_ack"
    LEAVE_ACK = "leave_ack"
    ERROR = "error"


class AgentStepPayload(BaseModel):
    """Agent thinking/tool execution step"""
    conversation_id: str = Field(alias="conversationId")
    message_id: str = Field(alias="messageId")
    step_index: int = Field(alias="stepIndex")
    kind: Literal["plan", "tool_call", "tool_result", "reasoning"]
    content: str
    tool_name: Optional[str] = Field(None, alias="toolName")
    tool_input: Optional[Dict[str, Any]] = Field(None, alias="toolInput")
    ts: int

    class Config:
        populate_by_name = True


class AgentResponseChunkPayload(BaseModel):
    """Agent response streaming chunk"""
    conversation_id: str = Field(alias="conversationId")
    message_id: str = Field(alias="messageId")
    chunk: str
    is_final: bool = Field(False, alias="isFinal")

    class Config:
        populate_by_name = True


class AgentResponseCompletePayload(BaseModel):
    """Agent response completion signal"""
    conversation_id: str = Field(alias="conversationId")
    message_id: str = Field(alias="messageId")
    final_text: str = Field(alias="finalText")
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True


class AgentErrorPayload(BaseModel):
    """Agent error payload"""
    conversation_id: str = Field(alias="conversationId")
    message_id: Optional[str] = Field(None, alias="messageId")
    error: str
    code: Optional[str] = None

    class Config:
        populate_by_name = True


class TypingIndicatorPayload(BaseModel):
    """Typing indicator payload"""
    conversation_id: str = Field(alias="conversationId")
    user_id: str = Field(alias="userId")
    is_typing: bool = Field(alias="isTyping")

    class Config:
        populate_by_name = True


class NotificationPayload(BaseModel):
    """Generic notification payload"""
    title: str
    message: str
    level: Literal["info", "success", "warning", "error"] = "info"
    action_url: Optional[str] = Field(None, alias="actionUrl")
    data: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True


class HelloPayload(BaseModel):
    """Server hello payload"""
    server_time: int = Field(alias="serverTime")
    client_id: str = Field(alias="clientId")
    version: str = "1.0"

    class Config:
        populate_by_name = True


class JoinAckPayload(BaseModel):
    """Room join acknowledgment"""
    room: str
    joined_at: int = Field(alias="joinedAt")

    class Config:
        populate_by_name = True


class LeaveAckPayload(BaseModel):
    """Room leave acknowledgment"""
    room: str
    left_at: int = Field(alias="leftAt")

    class Config:
        populate_by_name = True


class ErrorPayload(BaseModel):
    """Error payload"""
    error: str
    code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class WebSocketEnvelope(BaseModel):
    """Unified WebSocket message envelope"""
    version: int = 1
    type: WebSocketMessageType
    room: str
    ts: int
    id: str
    payload: Dict[str, Any]
    meta: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True
        use_enum_values = True

    @staticmethod
    def create(
        message_type: WebSocketMessageType,
        room: str,
        payload: BaseModel,
        meta: Optional[Dict[str, Any]] = None,
    ) -> "WebSocketEnvelope":
        """Create an envelope from a typed payload"""
        import uuid
        import time
        
        return WebSocketEnvelope(
            version=1,
            type=message_type,
            room=room,
            ts=int(time.time() * 1000),
            id=str(uuid.uuid4()),
            payload=payload.model_dump(by_alias=True),
            meta=meta,
        )


class ClientMessage(BaseModel):
    """Client-to-server message format"""
    action: Literal["join", "leave", "ping", "typing"]
    room: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
