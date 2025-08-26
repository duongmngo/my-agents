"""
Database models for the multi-tenant chat application
"""
from app.models.base import BaseModel, TenantMixin, UserOwnedMixin, WorkspaceMixin
from app.models.tenant import Tenant
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

__all__ = [
    # Base classes
    "BaseModel",
    "TenantMixin",
    "UserOwnedMixin", 
    "WorkspaceMixin",
    
    # Models
    "Tenant",
    "User",
    "Workspace",
    "WorkspaceMember",
    "Folder",
    "File",
    "Note",
    "Conversation",
    "ConversationParticipant",
    "Message",
    
    # Enums
    "NoteFormat",
    "MessageType",
    "ConversationType",
]
