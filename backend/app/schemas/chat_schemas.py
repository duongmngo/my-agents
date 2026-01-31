"""
Pydantic schemas for chat functionality
"""
from pydantic import BaseModel, Field, model_serializer
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from app.models.message import MessageType, ConversationType
from app.models.message import MessageStatus
from app.models.agent import AgentStatus, AgentType


# Base schemas
class MessageBase(BaseModel):
    """Base message schema"""
    content: Optional[str] = None
    type: Optional[MessageType] = MessageType.TEXT
    status: Optional[MessageStatus] = None  # For tracking AI response generation
    reply_to_message_id: Optional[str] = None
    thread_id: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    ai_model: Optional[str] = None
    ai_prompt_tokens: Optional[int] = None
    ai_completion_tokens: Optional[int] = None


class MessageCreate(MessageBase):
    """Schema for creating a message"""
    # Accept both snake_case and camelCase for conversation_id
    conversation_id: str = Field(..., alias="conversationId", validation_alias="conversationId")
    content: str = ""  # Allow empty string for streaming messages
    
    class Config:
        populate_by_name = True  # Allow both field name and alias


class MessageUpdate(BaseModel):
    """Schema for updating a message"""
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    is_pinned: Optional[bool] = None


class MessageResponse(MessageBase):
    """Schema for message response"""
    id: str
    conversation_id: str
    sender_id: Optional[str] = None
    status: Optional[MessageStatus] = None
    is_edited: bool
    is_deleted: bool
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    role: Optional[str] = None  # 'user' or 'assistant'
    
    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        """Convert ORM object to response with computed role"""
        data = {
            'id': obj.id,
            'conversation_id': obj.conversation_id,
            'sender_id': obj.sender_id,
            'content': obj.content,
            'type': obj.type,
            'is_edited': obj.is_edited,
            'is_deleted': obj.is_deleted,
            'is_pinned': obj.is_pinned,
            'reply_to_message_id': obj.reply_to_message_id,
            'thread_id': obj.thread_id,
            'attachments': obj.attachments,
            'metadata': obj.message_metadata,
            'ai_model': obj.ai_model,
            'ai_prompt_tokens': obj.ai_prompt_tokens,
            'ai_completion_tokens': obj.ai_completion_tokens,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
            'role': 'assistant' if obj.type == MessageType.AI_RESPONSE else 'user'
        }
        return cls(**data)


# Conversation schemas
class ConversationBase(BaseModel):
    """Base conversation schema"""
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    type: Optional[ConversationType] = ConversationType.AI_CHAT
    is_private: bool = True
    agent_type: str = Field(default="built_in", alias="agentType")  # 'built_in' or 'custom'
    agent_id: str = Field(default="default", alias="agentId")  # Agent identifier
    ai_model: Optional[str] = None
    ai_system_prompt: Optional[str] = None
    ai_temperature: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    
    class Config:
        populate_by_name = True


class ConversationCreate(ConversationBase):
    """Schema for creating a conversation"""
    title: str = Field(..., min_length=1, max_length=500)


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    is_private: Optional[bool] = None
    is_archived: Optional[bool] = None
    is_pinned: Optional[bool] = None
    agent_type: Optional[str] = Field(None, alias="agentType")
    agent_id: Optional[str] = Field(None, alias="agentId")
    settings: Optional[Dict[str, Any]] = None
    
    class Config:
        populate_by_name = True


class ConversationResponse(ConversationBase):
    """Schema for conversation response"""
    id: str
    workspace_id: str
    created_by: str
    is_archived: bool
    is_pinned: bool
    message_count: int
    participant_count: int
    created_at: datetime
    updated_at: datetime
    
    @classmethod
    def from_orm_object(cls, obj):
        """Convert ORM object to response schema with proper field mapping"""
        data = {
            'id': str(obj.id),
            'title': obj.title,
            'description': obj.description,
            'type': obj.type,
            'is_private': obj.is_private,
            'is_archived': obj.is_archived,
            'is_pinned': obj.is_pinned,
            'agentType': obj.agent_type,
            'agentId': obj.agent_id,
            'ai_model': obj.ai_model,
            'ai_system_prompt': obj.ai_system_prompt,
            'ai_temperature': obj.ai_temperature,
            'workspace_id': str(obj.workspace_id),
            'created_by': str(obj.created_by),
            'message_count': obj.message_count,
            'participant_count': obj.participant_count,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
        }
        return cls(**data)
    
    class Config:
        from_attributes = True
        populate_by_name = True


# Agent schemas
class AgentBase(BaseModel):
    """Base agent schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    agent_type: Optional[str] = Field(default="user-agent", pattern="^(default-agent|user-agent)$", alias="agentType")
    ai_model: str = Field(default="gpt-4", max_length=100, alias="aiModel")
    temperature: str = Field(default="0.7", max_length=10)
    max_tokens: Optional[int] = Field(None, ge=1, le=32000, alias="maxTokens")
    capabilities: Optional[List[str]] = None
    tools: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = Field(None, alias="systemPrompt")
    avatar_url: Optional[str] = Field(None, max_length=500, alias="avatarUrl")
    color: Optional[str] = Field(None, max_length=7)
    is_public: bool = Field(False, alias="isPublic")
    conversation_starters: Optional[List[Dict[str, Any]]] = Field(None, alias="conversationStarters")
    
    class Config:
        populate_by_name = True


class AgentCreate(AgentBase):
    """Schema for creating an agent"""
    pass


class AgentUpdate(BaseModel):
    """Schema for updating an agent"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    instructions: Optional[str] = None
    agent_type: Optional[str] = Field(None, pattern="^(default-agent|user-agent)$", alias="agentType")
    ai_model: Optional[str] = Field(None, max_length=100, alias="aiModel")
    temperature: Optional[str] = Field(None, max_length=10)
    max_tokens: Optional[int] = Field(None, ge=1, le=32000, alias="maxTokens")
    capabilities: Optional[List[str]] = None
    tools: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = Field(None, alias="systemPrompt")
    avatar_url: Optional[str] = Field(None, max_length=500, alias="avatarUrl")
    color: Optional[str] = Field(None, max_length=7)
    is_public: Optional[bool] = Field(None, alias="isPublic")
    is_active: Optional[bool] = Field(None, alias="isActive")
    conversation_starters: Optional[List[Dict[str, Any]]] = Field(None, alias="conversationStarters")
    
    class Config:
        populate_by_name = True


class AgentResponse(AgentBase):
    """Schema for agent response"""
    id: str
    workspace_id: str = Field(..., alias="workspaceId")
    created_by: str = Field(..., alias="createdBy")
    is_built_in: bool = Field(..., alias="isBuiltIn")
    status: str
    is_active: bool = Field(..., alias="isActive")
    conversation_count: int = Field(..., alias="conversationCount")
    message_count: int = Field(..., alias="messageCount")
    total_tokens_used: int = Field(..., alias="totalTokensUsed")
    version: str
    parent_agent_id: Optional[str] = Field(None, alias="parentAgentId")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True
    
    @classmethod
    def from_orm_object(cls, obj: Any) -> "AgentResponse":
        """Convert ORM object to response, handling enum serialization"""
        # Extract enum values
        agent_type_val = obj.agent_type.value if hasattr(obj.agent_type, 'value') else obj.agent_type
        status_val = obj.status.value if hasattr(obj.status, 'value') else obj.status
        
        return cls(
            id=obj.id,
            name=obj.name,
            description=obj.description,
            instructions=obj.instructions,
            agentType=agent_type_val,
            aiModel=obj.ai_model,
            temperature=obj.temperature,
            maxTokens=obj.max_tokens,
            capabilities=obj.capabilities,
            tools=obj.tools,
            systemPrompt=obj.system_prompt,
            avatarUrl=obj.avatar_url,
            color=obj.color,
            isPublic=obj.is_public,
            conversationStarters=obj.conversation_starters,
            workspaceId=obj.workspace_id,
            createdBy=obj.created_by,
            isBuiltIn=obj.is_built_in,
            status=status_val,
            isActive=obj.is_active,
            conversationCount=obj.conversation_count,
            messageCount=obj.message_count,
            totalTokensUsed=obj.total_tokens_used,
            version=obj.version,
            parentAgentId=obj.parent_agent_id,
            createdAt=obj.created_at,
            updatedAt=obj.updated_at
        )


# WebSocket schemas
class WebSocketMessage(BaseModel):
    """Schema for WebSocket messages"""
    type: str  # "message", "typing", "agent_response", "error"
    data: Dict[str, Any]
    conversation_id: str
    user_id: Optional[str] = None


class TypingIndicator(BaseModel):
    """Schema for typing indicators"""
    user_id: str
    conversation_id: str
    is_typing: bool


class AgentResponseChunk(BaseModel):
    """Schema for streaming agent responses"""
    conversation_id: str
    message_id: str
    chunk: str
    is_final: bool
    metadata: Optional[Dict[str, Any]] = None


# Search and filter schemas
class ConversationSearch(BaseModel):
    """Schema for conversation search"""
    query: Optional[str] = None
    agent_id: Optional[str] = None
    type: Optional[ConversationType] = None
    is_archived: Optional[bool] = None
    is_pinned: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


class MessageSearch(BaseModel):
    """Schema for message search"""
    query: Optional[str] = None
    type: Optional[MessageType] = None
    sender_id: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None


# Statistics schemas
class ConversationStats(BaseModel):
    """Schema for conversation statistics"""
    total_conversations: int
    active_conversations: int
    total_messages: int
    messages_today: int
    messages_this_week: int
    messages_this_month: int


class AgentStats(BaseModel):
    """Schema for agent statistics"""
    agent_id: str
    agent_name: str
    conversation_count: int
    message_count: int
    total_tokens_used: int
    avg_response_time: Optional[float] = None
    last_used: Optional[datetime] = None
