"""
Workspace model for organizing user work
"""
from sqlalchemy import Column, String, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import BaseModel, UserOwnedMixin


class Workspace(BaseModel, UserOwnedMixin):
    """
    Workspace model for organizing projects and collaboration
    """
    __tablename__ = "workspaces"
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    slug = Column(String(100), nullable=False, index=True)  # URL-friendly name
    
    # Visual settings
    color = Column(String(7), default="#3B82F6", nullable=False)  # Hex color
    icon = Column(String(100), nullable=True)  # Icon identifier
    avatar_url = Column(String(500), nullable=True)
    
    # Settings
    is_private = Column(Boolean, default=False, nullable=False)
    settings = Column(Text, nullable=True)  # JSON string for workspace settings
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    
    # Foreign keys
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by_user = relationship("User", back_populates="created_workspaces")
    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="workspace", cascade="all, delete-orphan")
    files = relationship("File", back_populates="workspace", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="workspace", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="workspace", cascade="all, delete-orphan")
    agents = relationship("Agent", back_populates="workspace", cascade="all, delete-orphan")
    embedding_providers = relationship("EmbeddingProviderConfig", back_populates="workspace", cascade="all, delete-orphan")
    embedding_settings = relationship("WorkspaceEmbeddingSettings", back_populates="workspace", cascade="all, delete-orphan", uselist=False)
    tools = relationship("Tool", back_populates="workspace", cascade="all, delete-orphan")
    tool_configs = relationship("ToolConfig", back_populates="workspace", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Workspace(id={self.id}, name={self.name}, slug={self.slug})>"


class WorkspaceMember(BaseModel):
    """
    Association model for workspace membership
    """
    __tablename__ = "workspace_members"
    
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Role and permissions
    role = Column(String(50), default="member", nullable=False)  # owner, admin, member, viewer
    permissions = Column(Text, nullable=True)  # JSON string for specific permissions
    
    # Timestamps
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="workspace_memberships")
    
    def __repr__(self):
        return f"<WorkspaceMember(workspace_id={self.workspace_id}, user_id={self.user_id}, role={self.role})>"
