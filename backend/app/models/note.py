"""
Note model for storing text-based content
"""
from sqlalchemy import Column, String, Text, ForeignKey, Boolean, Enum, Integer, JSON
from sqlalchemy.orm import relationship
from typing import Optional, Dict, Any
import enum

from app.models.base import BaseModel, UserOwnedMixin, WorkspaceMixin


class NoteFormat(enum.Enum):
    """Note format enumeration"""
    PLAIN_TEXT = "plain_text"
    MARKDOWN = "markdown"
    HTML = "html"
    RICH_TEXT = "rich_text"


class Note(BaseModel, UserOwnedMixin, WorkspaceMixin):
    """
    Note model for storing and organizing text-based content
    """
    __tablename__ = "notes"
    
    title = Column(String(500), nullable=False)
    # Content field with no length limitation - uses Text type which is unlimited
    content = Column(Text, nullable=True)
    excerpt = Column(String(500), nullable=True)  # Auto-generated summary
    
    # Content format and properties
    format = Column(Enum(NoteFormat, values_callable=lambda x: [e.value for e in x]), default=NoteFormat.MARKDOWN, nullable=False)
    word_count = Column(Integer, default=0, nullable=False)  # Fixed: was String, now Integer
    character_count = Column(Integer, default=0, nullable=False)  # Fixed: was String, now Integer
    
    # Organization
    tags = Column(Text, nullable=True)  # JSON array of tags
    category = Column(String(100), nullable=True)
    
    # Status and visibility
    is_published = Column(Boolean, default=False, nullable=False)
    is_template = Column(Boolean, default=False, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    
    # Access control
    access_permissions = Column(Text, nullable=True)  # JSON string for access permissions
    
    # Settings and metadata
    settings = Column(Text, nullable=True)  # JSON string for note settings
    note_metadata = Column(Text, nullable=True)  # JSON string for additional metadata
    
    # Embedding statistics (stored as JSON)
    embedding_stats = Column(JSON, nullable=True)  # JSON object containing embedding statistics
    
    # Foreign keys
    # tenant_id removed - no longer needed since each user is their own tenant
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    folder_id = Column(String, ForeignKey("folders.id"), nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="notes")
    folder = relationship("Folder", back_populates="notes")
    created_by_user = relationship("User", back_populates="created_notes")
    
    def __repr__(self):
        return f"<Note(id={self.id}, title={self.title}, format={self.format.value})>"
    
    def update_counts(self):
        """Update word and character counts based on content"""
        if self.content:
            self.character_count = len(self.content)
            # Simple word count (split by whitespace)
            words = self.content.split()
            self.word_count = len(words)
        else:
            self.character_count = 0
            self.word_count = 0
    
    def generate_excerpt(self, max_length: int = 200):
        """Generate excerpt from content"""
        if not self.content:
            self.excerpt = ""
            return
        
        # Remove markdown/HTML formatting for excerpt
        clean_content = self.content
        if self.format == NoteFormat.MARKDOWN:
            # Simple markdown cleanup (in production, use a proper library)
            import re
            clean_content = re.sub(r'[#*`_\[\]()]', '', clean_content)
        
        # Truncate to max length
        if len(clean_content) <= max_length:
            self.excerpt = clean_content
        else:
            self.excerpt = clean_content[:max_length].rsplit(' ', 1)[0] + "..."
    
    def update_embedding_stats(
        self,
        dimension: int,
        model: str,
        provider: str,
        latency_ms: int,
        tokens_processed: int,
        cost_estimate: Optional[float] = None
    ):
        """Update embedding statistics for this note"""
        from datetime import datetime
        
        # Initialize embedding_stats if it doesn't exist
        if self.embedding_stats is None:
            self.embedding_stats = {}
        
        # Update the JSON field with embedding statistics
        self.embedding_stats.update({
            "generated": True,
            "dimension": dimension,
            "model": model,
            "provider": provider,
            "latency_ms": latency_ms,
            "tokens_processed": tokens_processed,
            "generated_at": datetime.utcnow().isoformat(),
            "cost_estimate": cost_estimate
        })
    
    def get_embedding_stats(self) -> Optional[Dict[str, Any]]:
        """Get embedding statistics for this note"""
        return self.embedding_stats
    
    def has_embedding(self) -> bool:
        """Check if this note has an embedding generated"""
        return self.embedding_stats is not None and self.embedding_stats.get("generated", False)
