"""
User model for authentication and user management
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class User(BaseModel):
    """
    User model for authentication and user management
    """
    __tablename__ = "users"
    
    # Authentication fields
    email = Column(String(255), nullable=False, index=True)
    username = Column(String(100), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile fields
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Status fields
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    role = Column(String(50), default="user", nullable=False)  # user, admin, super_admin
    
    # Timestamps
    last_login = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Settings
    preferences = Column(Text, nullable=True)  # JSON string for user preferences
    timezone = Column(String(50), default="UTC", nullable=False)
    language = Column(String(10), default="en", nullable=False)
    
    # Relationships (user is their own tenant)
    workspace_memberships = relationship("WorkspaceMember", back_populates="user", cascade="all, delete-orphan")
    created_workspaces = relationship("Workspace", back_populates="created_by_user")
    created_folders = relationship("Folder", back_populates="created_by_user")
    created_files = relationship("File", back_populates="created_by_user")
    created_notes = relationship("Note", back_populates="created_by_user")
    sent_messages = relationship("Message", back_populates="sender")
    created_embedding_providers = relationship("EmbeddingProviderConfig", back_populates="created_by_user", cascade="all, delete-orphan")
    created_knowledge_files = relationship("KnowledgeFile", back_populates="created_by_user")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        else:
            return self.username
