"""
Database models for the multi-tenant chat application
"""
from app.models.base import BaseModel, UserOwnedMixin, WorkspaceMixin
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.folder import Folder
from app.models.file import File
from app.models.note import Note, NoteFormat
from app.models.message import (
    Conversation, 
    ConversationParticipant, 
    Message, 
    MessageType, 
    ConversationType
)
from app.models.embedding import (
    EmbeddingProviderConfig, 
    WorkspaceEmbeddingSettings, 
    EmbeddingProviderType
)
from app.models.embedding_usage import EmbeddingUsage
from app.models.agent import Agent, AgentStatus, AgentCapability
from app.models.tool import Tool, ToolConfig, AgentTool, ToolType
from app.models.knowledge_file import KnowledgeFile, FileStatus

__all__ = [
    # Base classes
    "BaseModel",
    "UserOwnedMixin", 
    "WorkspaceMixin",
    
    # Models
    "User",
    "Workspace",
    "WorkspaceMember",
    "Folder",
    "File",
    "Note",
    "Conversation",
    "ConversationParticipant",
    "Message",
    "Agent",
    "EmbeddingProviderConfig",
    "WorkspaceEmbeddingSettings",
    "EmbeddingUsage",
    "Tool",
    "ToolConfig",
    "AgentTool",
    "KnowledgeFile",
    
    # Enums
    "NoteFormat",
    "ToolType",
    "FileStatus",
    "MessageType",
    "ConversationType",
    "AgentStatus",
    "AgentCapability",
    "EmbeddingProviderType",
]
