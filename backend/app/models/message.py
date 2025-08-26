"""
Message and conversation models for chat functionality
"""
from sqlalchemy import Column, String, Text, ForeignKey, Boolean, Enum, Integer
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel, TenantMixin, UserOwnedMixin, WorkspaceMixin


class MessageType(enum.Enum):
    """Message type enumeration"""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"
    AI_RESPONSE = "ai_response"


class ConversationType(enum.Enum):
    """Conversation type enumeration"""
    DIRECT = "direct"  # 1-on-1 conversation
    GROUP = "group"    # Group conversation
    AI_CHAT = "ai_chat"  # AI-powered conversation


class Conversation(BaseModel, TenantMixin, WorkspaceMixin):
    """
    Conversation model for organizing messages
    """
    __tablename__ = "conversations"
    
    title = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    
    # Conversation properties
    type = Column(Enum(ConversationType), default=ConversationType.DIRECT, nullable=False)
    is_private = Column(Boolean, default=True, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    
    # Settings
    settings = Column(Text, nullable=True)  # JSON string for conversation settings
    
    # AI-specific settings
    ai_model = Column(String(100), nullable=True)  # AI model identifier
    ai_system_prompt = Column(Text, nullable=True)  # System prompt for AI
    ai_temperature = Column(String, nullable=True)  # AI temperature setting
    
    # Statistics
    message_count = Column(Integer, default=0, nullable=False)
    participant_count = Column(Integer, default=0, nullable=False)
    
    # Foreign keys
    tenant_id = Column(String, nullable=False)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="conversations")
    created_by_user = relationship("User", foreign_keys=[created_by])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Conversation(id={self.id}, title={self.title}, type={self.type.value})>"


class ConversationParticipant(BaseModel):
    """
    Association model for conversation participants
    """
    __tablename__ = "conversation_participants"
    
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Participant role and permissions
    role = Column(String(50), default="participant", nullable=False)  # admin, participant, viewer
    permissions = Column(Text, nullable=True)  # JSON string for specific permissions
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_muted = Column(Boolean, default=False, nullable=False)
    
    # Read status
    last_read_message_id = Column(String, nullable=True)
    unread_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User")
    
    def __repr__(self):
        return f"<ConversationParticipant(conversation_id={self.conversation_id}, user_id={self.user_id})>"


class Message(BaseModel, TenantMixin, WorkspaceMixin):
    """
    Message model for storing chat messages
    """
    __tablename__ = "messages"
    
    content = Column(Text, nullable=True)
    
    # Message properties
    type = Column(Enum(MessageType), default=MessageType.TEXT, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    
    # Reply and threading
    reply_to_message_id = Column(String, ForeignKey("messages.id"), nullable=True)
    thread_id = Column(String, nullable=True)  # For message threading
    
    # Attachments and metadata
    attachments = Column(Text, nullable=True)  # JSON array of attachment references
    message_metadata = Column(Text, nullable=True)  # JSON string for additional metadata
    
    # AI-specific fields
    ai_model = Column(String(100), nullable=True)  # AI model used (for AI responses)
    ai_prompt_tokens = Column(Integer, nullable=True)  # Token count for prompt
    ai_completion_tokens = Column(Integer, nullable=True)  # Token count for completion
    
    # Foreign keys
    tenant_id = Column(String, nullable=False)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=True)  # Null for system messages
    
    # Relationships
    workspace = relationship("Workspace")
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])
    reply_to = relationship("Message", remote_side=[id], backref="replies")
    
    def __repr__(self):
        return f"<Message(id={self.id}, type={self.type.value}, conversation_id={self.conversation_id})>"
    
    @property
    def is_ai_message(self) -> bool:
        """Check if message is from AI"""
        return self.type == MessageType.AI_RESPONSE
    
    @property
    def is_system_message(self) -> bool:
        """Check if message is a system message"""
        return self.type == MessageType.SYSTEM
    
    @property
    def has_attachments(self) -> bool:
        """Check if message has attachments"""
        return bool(self.attachments)
