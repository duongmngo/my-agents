"""
KnowledgeFile model for storing uploaded files in the knowledge base
"""
from sqlalchemy import Column, String, Text, ForeignKey, Integer, BigInteger, Enum, JSON
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel, UserOwnedMixin, WorkspaceMixin


class FileStatus(enum.Enum):
    """Processing status for knowledge files"""
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class KnowledgeFile(BaseModel, UserOwnedMixin, WorkspaceMixin):
    """
    KnowledgeFile model for storing uploaded files with text extraction and embedding
    """
    __tablename__ = "knowledge_files"
    
    # File identification
    filename = Column(String(500), nullable=False)  # Generated unique filename
    original_filename = Column(String(500), nullable=False)  # User's original filename
    file_type = Column(String(50), nullable=False)  # pdf, docx, txt, md
    mime_type = Column(String(100), nullable=True)
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    
    # Storage information
    storage_path = Column(String(1000), nullable=False)  # S3/MinIO path
    storage_provider = Column(String(50), default="minio", nullable=False)
    content_hash = Column(String(64), nullable=True, index=True)  # SHA-256 for deduplication
    
    # Processing status
    status = Column(
        Enum(FileStatus, values_callable=lambda x: [e.value for e in x]),
        default=FileStatus.PENDING,
        nullable=False
    )
    error_message = Column(Text, nullable=True)  # Error details if failed
    
    # Extracted content
    extracted_text = Column(Text, nullable=True)  # Full extracted text
    character_count = Column(Integer, default=0, nullable=False)
    word_count = Column(Integer, default=0, nullable=False)
    page_count = Column(Integer, nullable=True)  # For PDF/DOCX
    
    # Embedding statistics (stored as JSON)
    embedding_stats = Column(JSON, nullable=True)
    # Example: {"chunk_count": 5, "model": "text-embedding-3-small", "indexed_at": "2024-01-01T00:00:00Z"}
    
    # Organization
    folder_id = Column(String, ForeignKey("folders.id"), nullable=True)
    tags = Column(Text, nullable=True)  # JSON array of tags
    description = Column(Text, nullable=True)  # Optional user description
    
    # Foreign keys
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="knowledge_files")
    folder = relationship("Folder", back_populates="knowledge_files")
    created_by_user = relationship("User", back_populates="created_knowledge_files")
    
    def __repr__(self):
        return f"<KnowledgeFile(id={self.id}, filename={self.original_filename}, status={self.status.value})>"
    
    def update_counts(self):
        """Update word and character counts based on extracted text"""
        if self.extracted_text:
            self.character_count = len(self.extracted_text)
            self.word_count = len(self.extracted_text.split())
        else:
            self.character_count = 0
            self.word_count = 0
    
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
    def is_embedded(self) -> bool:
        """Check if file has been embedded"""
        return (
            self.status == FileStatus.PROCESSED and 
            self.embedding_stats is not None and 
            self.embedding_stats.get("chunk_count", 0) > 0
        )
