"""
Message API DTOs (Data Transfer Objects)
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    class Config:
        populate_by_name = True
        from_attributes = True


# Request DTOs
class ConversationCreateRequest(BaseApiModel):
    """Conversation creation request"""
    title: Optional[str] = None
    workspace_id: str = Field(..., alias="workspaceId")
    type: str = "direct"


class MessageCreateRequest(BaseApiModel):
    """Message creation request"""
    content: str
    conversation_id: str = Field(..., alias="conversationId")
    type: str = "text"


# Response DTOs
class MessageResponse(BaseApiModel):
    """Message response"""
    id: str
    content: str
    type: str
    conversation_id: str = Field(..., alias="conversationId")
    sender_id: str = Field(..., alias="senderId")
    sender_name: str = Field(..., alias="senderName")
    sender_avatar: Optional[str] = Field(None, alias="senderAvatar")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class ConversationResponse(BaseApiModel):
    """Conversation response"""
    id: str
    title: Optional[str] = None
    type: str
    workspace_id: str = Field(..., alias="workspaceId")
    created_by: str = Field(..., alias="createdBy")
    last_message: Optional[MessageResponse] = Field(None, alias="lastMessage")
    participant_count: int = Field(..., alias="participantCount")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class ConversationListResponse(BaseApiModel):
    """Conversation list response"""
    conversations: List[ConversationResponse]
    total: int
    skip: int
    limit: int


class MessageListResponse(BaseApiModel):
    """Message list response"""
    messages: List[MessageResponse]
    total: int
    skip: int
    limit: int


class ConversationCreateResponse(BaseApiModel):
    """Conversation creation response"""
    success: bool = True
    conversation: ConversationResponse
    message: str = "Conversation created successfully"


class MessageCreateResponse(BaseApiModel):
    """Message creation response"""
    success: bool = True
    message: MessageResponse
    message_text: str = "Message sent successfully"
