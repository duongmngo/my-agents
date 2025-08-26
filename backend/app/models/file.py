"""
File model for file storage and management
"""
from sqlalchemy import Column, String, Text, ForeignKey, Boolean, Integer, BigInteger
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, TenantMixin, UserOwnedMixin, WorkspaceMixin


class File(BaseModel, TenantMixin, UserOwnedMixin, WorkspaceMixin):
    """
    File model for storing file metadata and references
    """
    __tablename__ = "files"
    
    name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)  # Original filename
    description = Column(Text, nullable=True)
    
    # File properties
    file_type = Column(String(100), nullable=False)  # MIME type
    file_extension = Column(String(10), nullable=False)
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    
    # Storage information
    storage_path = Column(String(1000), nullable=False)  # Path in storage system
    storage_bucket = Column(String(100), nullable=False)  # Bucket/container name
    storage_key = Column(String(500), nullable=False)  # Unique key in storage
    
    # Content information
    content_hash = Column(String(64), nullable=True, index=True)  # SHA-256 hash for deduplication
    encoding = Column(String(50), nullable=True)
    
    # Processing status
    processing_status = Column(String(50), default="pending", nullable=False)  # pending, processing, completed, failed
    processing_error = Column(Text, nullable=True)
    
    # Metadata
    file_metadata = Column(Text, nullable=True)  # JSON string for file metadata
    
    # Access control
    is_public = Column(Boolean, default=False, nullable=False)
    access_permissions = Column(Text, nullable=True)  # JSON string for access permissions
    
    # Organization
    tags = Column(Text, nullable=True)  # JSON array of tags
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    
    # Version control
    version = Column(Integer, default=1, nullable=False)
    parent_file_id = Column(String, ForeignKey("files.id"), nullable=True)  # For file versions
    
    # Foreign keys
    tenant_id = Column(String, nullable=False)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    folder_id = Column(String, ForeignKey("folders.id"), nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="files")
    folder = relationship("Folder", back_populates="files")
    created_by_user = relationship("User", back_populates="created_files")
    
    # Self-referential relationship for versions
    parent_file = relationship("File", remote_side=[id], backref="versions")
    
    def __repr__(self):
        return f"<File(id={self.id}, name={self.name}, type={self.file_type})>"
    
    @property
    def size_human_readable(self) -> str:
        """Get human-readable file size"""
        size = self.file_size
        units = ['B', 'KB', 'MB', 'GB', 'TB']
        unit_index = 0
        
        while size >= 1024 and unit_index < len(units) - 1:
            size /= 1024.0
            unit_index += 1
        
        return f"{size:.1f} {units[unit_index]}"
    
    @property
    def is_image(self) -> bool:
        """Check if file is an image"""
        return self.file_type.startswith('image/')
    
    @property
    def is_document(self) -> bool:
        """Check if file is a document"""
        document_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown'
        ]
        return self.file_type in document_types
