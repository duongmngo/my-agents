"""
Embedding provider configuration model for storing workspace embedding settings
"""
from sqlalchemy import Column, String, Text, ForeignKey, JSON, Integer, Index, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel, UserOwnedMixin, WorkspaceMixin


class EmbeddingProviderType(enum.Enum):
    """Type of embedding provider"""
    OPENAI = "openai"
    AZURE = "azure"
    HUGGINGFACE = "huggingface"




class EmbeddingProviderConfig(BaseModel, UserOwnedMixin, WorkspaceMixin):
    """
    Model for storing workspace embedding provider configurations
    """
    __tablename__ = "embedding_provider_configs"
    
    # Provider identification
    name = Column(String(255), nullable=False)  # Display name for the provider
    provider_type = Column(Enum(EmbeddingProviderType), nullable=False)  # Type of provider
    
    # Provider status
    is_active = Column(Boolean, default=False, nullable=False)  # Whether this provider is currently active
    
    # Provider configuration (stored as JSON for flexibility)
    config = Column(JSON, nullable=False)  # Provider-specific configuration (API keys, models, etc.)
    
    # Metadata
    description = Column(Text, nullable=True)  # Optional description
    version = Column(String(50), nullable=True)  # Provider version
    last_used = Column(String, nullable=True)  # Last time this provider was used
    usage_count = Column(Integer, default=0, nullable=False)  # Number of times used
    
    # Performance metrics
    average_latency = Column(Integer, nullable=True)  # Average response time in ms
    error_rate = Column(Integer, nullable=True)  # Error rate as percentage
    total_tokens_processed = Column(Integer, default=0, nullable=False)  # Total tokens processed
    
    # Foreign keys
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    workspace = relationship("Workspace", back_populates="embedding_providers")
    created_by_user = relationship("User", back_populates="created_embedding_providers")
    usage_records = relationship("EmbeddingUsage", back_populates="provider", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<EmbeddingProviderConfig(id={self.id}, name='{self.name}', provider_type={self.provider_type.value}, is_active={self.is_active})>"
    
    def update_usage_stats(self, tokens_processed: int, latency_ms: int = None, success: bool = True):
        """Update usage statistics"""
        from datetime import datetime
        
        self.usage_count += 1
        self.total_tokens_processed += tokens_processed
        self.last_used = datetime.utcnow().isoformat()
        
        if latency_ms is not None:
            if self.average_latency is None:
                self.average_latency = latency_ms
            else:
                # Simple moving average
                self.average_latency = (self.average_latency + latency_ms) // 2
        
        if not success:
            if self.error_rate is None:
                self.error_rate = 1
            else:
                # Simple error rate calculation
                self.error_rate = min(100, self.error_rate + 1)
    
    def activate(self):
        """Activate this provider"""
        self.is_active = True
    
    def deactivate(self):
        """Deactivate this provider"""
        self.is_active = False
    
    
    def get_config_value(self, key: str, default=None):
        """Get a configuration value safely"""
        return self.config.get(key, default)
    
    def update_config(self, new_config: dict):
        """Update the configuration"""
        self.config.update(new_config)
    
    def get_sanitized_config(self) -> dict:
        """Get configuration with sensitive fields masked"""
        if not self.config:
            return {}
        
        sanitized = self.config.copy()
        
        # Mask sensitive fields (both snake_case and camelCase)
        sensitive_fields = ['api_key', 'apiKey', 'secret', 'password', 'token', 'key', 'organizationId']
        for field in sensitive_fields:
            if field in sanitized:
                sanitized[field] = "***masked***"
        
        return sanitized


class WorkspaceEmbeddingSettings(BaseModel, WorkspaceMixin):
    """
    Model for storing workspace-level embedding settings
    """
    __tablename__ = "workspace_embedding_settings"
    
    # Workspace reference
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, unique=True)
    
    # General settings
    auto_rotate = Column(Boolean, default=False, nullable=False)  # Auto-rotate between providers
    fallback_provider_id = Column(String, ForeignKey("embedding_provider_configs.id"), nullable=True)
    
    # Performance settings
    batch_size = Column(Integer, default=100, nullable=False)  # Batch size for processing
    retry_attempts = Column(Integer, default=3, nullable=False)  # Number of retry attempts
    timeout = Column(Integer, default=30000, nullable=False)  # Timeout in milliseconds
    
    # Advanced settings
    enable_caching = Column(Boolean, default=True, nullable=False)  # Enable embedding caching
    cache_ttl = Column(Integer, default=3600, nullable=False)  # Cache TTL in seconds
    enable_monitoring = Column(Boolean, default=True, nullable=False)  # Enable performance monitoring
    
    # Relationships
    workspace = relationship("Workspace", back_populates="embedding_settings")
    fallback_provider = relationship("EmbeddingProviderConfig", foreign_keys=[fallback_provider_id])
    
    def __repr__(self):
        return f"<WorkspaceEmbeddingSettings(workspace_id={self.workspace_id}, auto_rotate={self.auto_rotate})>"


# Create indexes for performance
Index('idx_embedding_provider_configs_workspace_id', EmbeddingProviderConfig.workspace_id)
Index('idx_embedding_provider_configs_provider_type', EmbeddingProviderConfig.provider_type)
Index('idx_embedding_provider_configs_is_active', EmbeddingProviderConfig.is_active)
Index('idx_embedding_provider_configs_created_at', EmbeddingProviderConfig.created_at)

Index('idx_workspace_embedding_settings_workspace_id', WorkspaceEmbeddingSettings.workspace_id)
