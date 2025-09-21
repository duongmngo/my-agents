"""
Abstract base class for embedding providers
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class EmbeddingRequest(BaseModel):
    """Request model for embedding generation"""
    text: str
    model: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class EmbeddingResponse(BaseModel):
    """Response model for embedding generation"""
    embedding: List[float]
    model: str
    usage: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class EmbeddingProvider(ABC):
    """Abstract base class for embedding providers"""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the embedding provider with configuration"""
        self.config = config
        self.model = config.get("model", "default")
        self.dimension = config.get("dimension", 1536)
    
    @abstractmethod
    async def generate_embedding(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embedding for the given text"""
        pass
    
    @abstractmethod
    async def generate_embeddings_batch(self, requests: List[EmbeddingRequest]) -> List[EmbeddingResponse]:
        """Generate embeddings for multiple texts in batch"""
        pass
    
    @abstractmethod
    async def get_models(self) -> List[str]:
        """Get available models for this provider"""
        pass
    
    @abstractmethod
    async def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get information about a specific model"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is healthy"""
        pass
    
    def get_provider_name(self) -> str:
        """Get the name of this provider"""
        return self.__class__.__name__.lower()
    
    def get_config(self) -> Dict[str, Any]:
        """Get the current configuration"""
        return self.config.copy()
    
    def update_config(self, new_config: Dict[str, Any]):
        """Update the configuration"""
        self.config.update(new_config)
        if "model" in new_config:
            self.model = new_config["model"]
        if "dimension" in new_config:
            self.dimension = new_config["dimension"]


class EmbeddingProviderFactory:
    """Factory for creating embedding providers"""
    
    _providers: Dict[str, type] = {}
    
    @classmethod
    def register_provider(cls, name: str, provider_class: type):
        """Register a new embedding provider"""
        if not issubclass(provider_class, EmbeddingProvider):
            raise ValueError(f"Provider class must inherit from EmbeddingProvider")
        cls._providers[name] = provider_class
    
    @classmethod
    def create_provider(cls, name: str, config: Dict[str, Any]) -> EmbeddingProvider:
        """Create an embedding provider instance"""
        if name not in cls._providers:
            raise ValueError(f"Unknown embedding provider: {name}")
        
        provider_class = cls._providers[name]
        return provider_class(config)
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """Get list of available provider names"""
        return list(cls._providers.keys())
    
    @classmethod
    def is_provider_available(cls, name: str) -> bool:
        """Check if a provider is available"""
        return name in cls._providers
