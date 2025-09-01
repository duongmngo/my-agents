"""
Folder model for organizing files and notes
"""
from sqlalchemy import Column, String, Text, ForeignKey, Boolean, Integer, Enum
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel, UserOwnedMixin, WorkspaceMixin


class FolderCategory(enum.Enum):
    """Folder category enumeration"""
    FILES = "FILES"
    NOTES = "NOTES"


class Folder(BaseModel, UserOwnedMixin, WorkspaceMixin):
    """
    Folder model for hierarchical organization of files and notes
    """
    __tablename__ = "folders"
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Category to distinguish between file folders and note folders
    category = Column(Enum(FolderCategory), default=FolderCategory.FILES, nullable=False)
    
    # Hierarchy
    parent_id = Column(String, ForeignKey("folders.id"), nullable=True, index=True)
    path = Column(String(1000), nullable=False, index=True)  # Full path for easy querying
    level = Column(Integer, default=0, nullable=False)  # Depth level in hierarchy
    
    # Visual settings
    color = Column(String(7), nullable=True)  # Hex color
    icon = Column(String(100), nullable=True)  # Icon identifier
    
    # Settings
    is_private = Column(Boolean, default=False, nullable=False)
    settings = Column(Text, nullable=True)  # JSON string for folder settings
    
    # Status
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    
    # Foreign keys
    # tenant_id removed - no longer needed since each user is their own tenant
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="folders")
    created_by_user = relationship("User", back_populates="created_folders")
    
    # Self-referential relationship for hierarchy
    parent = relationship("Folder", remote_side="Folder.id", backref="children")
    
    # Child relationships
    files = relationship("File", back_populates="folder", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="folder", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Folder(id={self.id}, name={self.name}, category={self.category.value}, path={self.path})>"
    
    @property
    def full_path(self) -> str:
        """Get the full path of the folder"""
        return self.path
    
    def get_breadcrumbs(self):
        """Get breadcrumb trail for the folder"""
        if not self.path:
            return []
        
        path_parts = self.path.strip('/').split('/')
        breadcrumbs = []
        current_path = ""
        
        for part in path_parts:
            current_path += f"/{part}"
            breadcrumbs.append({
                "name": part,
                "path": current_path
            })
        
        return breadcrumbs
