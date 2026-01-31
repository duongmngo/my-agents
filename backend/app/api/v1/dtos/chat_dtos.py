"""
Chat API DTOs (Data Transfer Objects) - camelCase output
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import Field


class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    class Config:
        populate_by_name = True
        from_attributes = True


# Request DTOs
class ConversationCreateRequest(BaseApiModel):
    title: Optional[str] = None
    type: Optional[str] = "ai_chat"
    agent_id: Optional[str] = Field(None, alias="agentId")
    is_private: bool = Field(True, alias="isPrivate")


# Response DTOs
class ConversationItem(BaseApiModel):
    id: str
    title: Optional[str] = None
    type: str
    agent_type: Optional[str] = Field(None, alias="agentType")
    agent_id: Optional[str] = Field(None, alias="agentId")
    agent_name: Optional[str] = Field(None, alias="agentName")
    workspace_id: str = Field(..., alias="workspaceId")
    created_by: str = Field(..., alias="createdBy")
    participant_count: int = Field(..., alias="participantCount")
    message_count: int = Field(..., alias="messageCount")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")


class ConversationCreateResponse(BaseApiModel):
    success: bool = True
    conversation: ConversationItem
    message: str = "Conversation created successfully"


class ConversationListResponse(BaseApiModel):
    conversations: List[ConversationItem]
    total: int
    skip: int
    limit: int


class ConversationResponseDto(BaseApiModel):
    """Response wrapper for a single conversation (GET)

    Matches the create response pattern: { success, conversation, message }
    """
    success: bool = True
    conversation: ConversationItem
    message: Optional[str] = None


# Message DTOs
class MessageCreateRequest(BaseApiModel):
    conversation_id: str = Field(..., alias="conversationId")
    content: Optional[str] = None
    type: Optional[str] = "text"
    reply_to_message_id: Optional[str] = Field(None, alias="replyToMessageId")
    thread_id: Optional[str] = Field(None, alias="threadId")
    attachments: Optional[str] = None
    metadata: Optional[str] = None
    ai_model: Optional[str] = Field(None, alias="aiModel")
    ai_prompt_tokens: Optional[int] = Field(None, alias="aiPromptTokens")
    ai_completion_tokens: Optional[int] = Field(None, alias="aiCompletionTokens")


class MessageItem(BaseApiModel):
    id: str
    conversation_id: str = Field(..., alias="conversationId")
    content: Optional[str] = None
    type: str
    status: Optional[str] = None  # pending, streaming, complete, error
    sender_id: Optional[str] = Field(None, alias="senderId")
    is_edited: bool = Field(False, alias="isEdited")
    is_deleted: bool = Field(False, alias="isDeleted")
    is_pinned: bool = Field(False, alias="isPinned")
    reply_to_message_id: Optional[str] = Field(None, alias="replyToMessageId")
    thread_id: Optional[str] = Field(None, alias="threadId")
    attachments: Optional[str] = None
    metadata: Optional[str] = None
    steps: Optional[List[Dict[str, Any]]] = None  # Agent thinking steps
    ai_model: Optional[str] = Field(None, alias="aiModel")
    ai_prompt_tokens: Optional[int] = Field(None, alias="aiPromptTokens")
    ai_completion_tokens: Optional[int] = Field(None, alias="aiCompletionTokens")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    role: Optional[str] = None  # 'user' or 'assistant'


class MessageResponseDto(BaseApiModel):
    success: bool = True
    data: MessageItem
    message: Optional[str] = None
