"""
Embedding usage tracking model for storing detailed usage statistics
"""
from sqlalchemy import Column, String, Text, ForeignKey, JSON, Integer, Float, Boolean, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import BaseModel, UserOwnedMixin, WorkspaceMixin


class EmbeddingUsage(BaseModel, UserOwnedMixin, WorkspaceMixin):
    """
    Model for tracking detailed embedding usage statistics
    """
    __tablename__ = "embedding_usage"
    
    # Provider reference
    provider_id = Column(String, ForeignKey("embedding_provider_configs.id"), nullable=False)
    
    # Usage details
    model_used = Column(String(255), nullable=False)  # The specific model used
    tokens_processed = Column(Integer, nullable=False, default=0)  # Number of tokens processed
    latency_ms = Column(Integer, nullable=True)  # Response latency in milliseconds
    success = Column(Boolean, nullable=False, default=True)  # Whether the operation was successful
    
    # Request context
    request_type = Column(String(100), nullable=True)  # Type of request (e.g., 'embedding', 'test', 'batch')
    source_type = Column(String(100), nullable=True)  # Source of the request (e.g., 'note', 'file', 'test')
    source_id = Column(String, nullable=True)  # ID of the source object
    
    # Performance metrics
    embedding_dimension = Column(Integer, nullable=True)  # Dimension of the generated embedding
    cost_estimate = Column(Float, nullable=True)  # Estimated cost for this operation
    
    # Metadata
    error_message = Column(Text, nullable=True)  # Error message if operation failed
    request_metadata = Column(JSON, nullable=True)  # Additional metadata about the request
    
    # Timestamps
    used_at = Column(DateTime, default=datetime.utcnow, nullable=False)  # When the usage occurred
    
    # Relationships
    provider = relationship("EmbeddingProviderConfig", back_populates="usage_records")
    
    def __repr__(self):
        return f"<EmbeddingUsage(id={self.id}, provider_id={self.provider_id}, model='{self.model_used}', tokens={self.tokens_processed}, success={self.success})>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "provider_id": self.provider_id,
            "model_used": self.model_used,
            "tokens_processed": self.tokens_processed,
            "latency_ms": self.latency_ms,
            "success": self.success,
            "request_type": self.request_type,
            "source_type": self.source_type,
            "source_id": self.source_id,
            "embedding_dimension": self.embedding_dimension,
            "cost_estimate": self.cost_estimate,
            "error_message": self.error_message,
            "used_at": self.used_at.isoformat() if self.used_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# Create indexes for performance
Index('idx_embedding_usage_provider_id', EmbeddingUsage.provider_id)
Index('idx_embedding_usage_workspace_id', EmbeddingUsage.workspace_id)
Index('idx_embedding_usage_used_at', EmbeddingUsage.used_at)
Index('idx_embedding_usage_success', EmbeddingUsage.success)
Index('idx_embedding_usage_model_used', EmbeddingUsage.model_used)
Index('idx_embedding_usage_source_type', EmbeddingUsage.source_type)
