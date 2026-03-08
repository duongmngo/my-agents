"""
Abstract base class for Vector Database Services.

This module provides:
- Data Transfer Objects (DTOs) for vector operations
- Abstract BaseVectorService class for database-agnostic operations
- Factory pattern for creating service instances

To add a new vector database:
1. Create a new service class extending BaseVectorService
2. Implement all abstract methods
3. Register with VectorServiceFactory
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Type
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# Data Transfer Objects (DTOs)
# =============================================================================

class VectorSearchRequest(BaseModel):
    """Request model for vector similarity search"""
    query_vector: List[float]
    workspace_id: str
    limit: int = Field(default=10, ge=1, le=100)
    threshold: float = Field(default=0.0, ge=0.0, le=1.0)
    filters: Optional[Dict[str, Any]] = None
    include_metadata: bool = True
    source_type: Optional[str] = None  # Filter by source type (note, file, etc.)


class VectorSearchResult(BaseModel):
    """Result model for vector similarity search"""
    id: str
    content: str = ""
    score: float  # Similarity score (higher = more similar for cosine)
    metadata: Optional[Dict[str, Any]] = None
    source_type: Optional[str] = None
    source_id: Optional[str] = None
    
    @property
    def similarity(self) -> float:
        """Alias for score for backwards compatibility"""
        return self.score


class VectorRecord(BaseModel):
    """Model for storing a vector with its metadata"""
    id: str
    content: str
    embedding: List[float]
    workspace_id: str
    source_type: str  # note, file, document, chunk, etc.
    source_id: str
    created_by: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    language: str = "en"
    content_type: str = "text/plain"


class CollectionStats(BaseModel):
    """Statistics for a vector collection"""
    collection_name: str
    total_vectors: int = 0
    workspace_id: Optional[str] = None
    # Breakdown by source type
    by_source_type: Dict[str, int] = Field(default_factory=dict)


class HealthCheckResult(BaseModel):
    """Health check result for vector service"""
    healthy: bool
    backend: str
    latency_ms: Optional[int] = None
    error: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)


# =============================================================================
# Abstract Base Service
# =============================================================================

class BaseVectorService(ABC):
    """
    Abstract base class for vector database services.
    
    Implementations handle:
    - Connection management to specific vector databases
    - Storing and retrieving embeddings
    - Similarity search with workspace filtering
    - Collection/workspace management
    
    To switch databases, create a new implementation (e.g., PineconeVectorService)
    and register it with VectorServiceFactory.
    """
    
    def __init__(self, collection_name: str = "documents", vector_size: int = 1536):
        """
        Initialize the vector service.
        
        Args:
            collection_name: Default collection/index name
            vector_size: Dimension of vectors (default: 1536 for OpenAI)
        """
        self.collection_name = collection_name
        self.vector_size = vector_size
        self._initialized = False
    
    @property
    def is_initialized(self) -> bool:
        """Check if the service is initialized and ready"""
        return self._initialized
    
    @abstractmethod
    def get_backend_name(self) -> str:
        """Return the name of the vector database backend (e.g., 'qdrant', 'pinecone')"""
        pass
    
    # =========================================================================
    # Lifecycle Methods
    # =========================================================================
    
    @abstractmethod
    async def initialize(self) -> bool:
        """
        Initialize the service (connect to DB, ensure collection exists).
        
        Returns:
            True if initialization successful
        """
        pass
    
    @abstractmethod
    async def disconnect(self) -> None:
        """Close connections and cleanup resources"""
        pass
    
    @abstractmethod
    async def health_check(self) -> HealthCheckResult:
        """
        Check service health and connectivity.
        
        Returns:
            HealthCheckResult with status details
        """
        pass
    
    # =========================================================================
    # Core CRUD Operations
    # =========================================================================
    
    @abstractmethod
    async def store_embedding(
        self,
        record: VectorRecord,
    ) -> str:
        """
        Store a single embedding with its metadata.
        
        Args:
            record: VectorRecord containing embedding and metadata
            
        Returns:
            ID of the stored vector
            
        Raises:
            Exception: If storage fails
        """
        pass
    
    @abstractmethod
    async def store_embeddings_batch(
        self,
        records: List[VectorRecord],
    ) -> List[str]:
        """
        Store multiple embeddings in batch.
        
        Args:
            records: List of VectorRecords to store
            
        Returns:
            List of stored vector IDs
        """
        pass
    
    @abstractmethod
    async def get_embedding(
        self,
        vector_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Get a vector by its ID.
        
        Args:
            vector_id: ID of the vector
            
        Returns:
            Vector data with payload, or None if not found
        """
        pass
    
    @abstractmethod
    async def update_embedding(
        self,
        vector_id: str,
        content: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Update an existing embedding.
        
        Args:
            vector_id: ID of the vector to update
            content: New content
            embedding: New embedding vector
            metadata: Updated metadata (merged with existing)
            
        Returns:
            True if update successful
        """
        pass
    
    @abstractmethod
    async def delete_embedding(
        self,
        vector_id: str,
    ) -> bool:
        """
        Delete a vector by ID.
        
        Args:
            vector_id: ID of the vector to delete
            
        Returns:
            True if deletion successful
        """
        pass
    
    @abstractmethod
    async def delete_embeddings_batch(
        self,
        vector_ids: List[str],
    ) -> int:
        """
        Delete multiple vectors by IDs.
        
        Args:
            vector_ids: List of vector IDs to delete
            
        Returns:
            Number of vectors deleted
        """
        pass
    
    # =========================================================================
    # Search Operations
    # =========================================================================
    
    @abstractmethod
    async def search_similar(
        self,
        request: VectorSearchRequest,
    ) -> List[VectorSearchResult]:
        """
        Search for similar vectors.
        
        Args:
            request: Search request with query vector and filters
            
        Returns:
            List of search results sorted by similarity (descending)
        """
        pass
    
    async def search_by_source_type(
        self,
        query_vector: List[float],
        workspace_id: str,
        source_type: str,
        limit: int = 10,
        threshold: float = 0.0,
    ) -> List[VectorSearchResult]:
        """
        Convenience method to search within a specific source type.
        
        Args:
            query_vector: Query embedding
            workspace_id: Workspace for filtering
            source_type: Filter by source type (e.g., "note", "file")
            limit: Max results
            threshold: Minimum similarity threshold
            
        Returns:
            Search results
        """
        request = VectorSearchRequest(
            query_vector=query_vector,
            workspace_id=workspace_id,
            source_type=source_type,
            limit=limit,
            threshold=threshold,
        )
        return await self.search_similar(request)
    
    # =========================================================================
    # Workspace Operations
    # =========================================================================
    
    @abstractmethod
    async def delete_by_workspace(
        self,
        workspace_id: str,
    ) -> int:
        """
        Delete all vectors in a workspace.
        
        Args:
            workspace_id: Workspace ID
            
        Returns:
            Number of vectors deleted (or -1 if unknown)
        """
        pass
    
    @abstractmethod
    async def delete_by_source(
        self,
        workspace_id: str,
        source_type: str,
        source_id: Optional[str] = None,
    ) -> int:
        """
        Delete vectors by source.
        
        Args:
            workspace_id: Workspace ID
            source_type: Source type to delete
            source_id: Optional specific source ID
            
        Returns:
            Number of vectors deleted
        """
        pass
    
    @abstractmethod
    async def get_workspace_stats(
        self,
        workspace_id: str,
    ) -> CollectionStats:
        """
        Get statistics for a workspace.
        
        Args:
            workspace_id: Workspace ID
            
        Returns:
            CollectionStats with counts
        """
        pass
    
    @abstractmethod
    async def get_collection_stats(self) -> CollectionStats:
        """
        Get overall collection statistics.
        
        Returns:
            CollectionStats for the entire collection
        """
        pass


# =============================================================================
# Factory Pattern
# =============================================================================

class VectorServiceFactory:
    """
    Factory for creating vector service instances.
    
    Usage:
        # Register a service implementation
        VectorServiceFactory.register("qdrant", QdrantVectorService)
        
        # Create an instance
        service = VectorServiceFactory.create("qdrant")
        await service.initialize()
    """
    
    _services: Dict[str, Type[BaseVectorService]] = {}
    _default_backend: str = "qdrant"
    
    @classmethod
    def register(cls, name: str, service_class: Type[BaseVectorService]) -> None:
        """
        Register a vector service implementation.
        
        Args:
            name: Backend name (e.g., "qdrant", "pinecone", "weaviate")
            service_class: Class implementing BaseVectorService
        """
        if not issubclass(service_class, BaseVectorService):
            raise ValueError(f"Service class must inherit from BaseVectorService")
        cls._services[name.lower()] = service_class
        logger.info(f"Registered vector service: {name}")
    
    @classmethod
    def create(
        cls,
        name: Optional[str] = None,
        collection_name: str = "documents",
        vector_size: int = 1536,
        **kwargs,
    ) -> BaseVectorService:
        """
        Create a vector service instance.
        
        Args:
            name: Backend name (uses default if None)
            collection_name: Collection/index name
            vector_size: Vector dimension
            **kwargs: Additional backend-specific arguments
            
        Returns:
            BaseVectorService instance
            
        Raises:
            ValueError: If backend not registered
        """
        backend = (name or cls._default_backend).lower()
        
        if backend not in cls._services:
            available = ", ".join(cls._services.keys()) or "none"
            raise ValueError(f"Unknown vector service: {backend}. Available: {available}")
        
        service_class = cls._services[backend]
        return service_class(
            collection_name=collection_name,
            vector_size=vector_size,
            **kwargs,
        )
    
    @classmethod
    def get_available_backends(cls) -> List[str]:
        """Get list of registered backend names"""
        return list(cls._services.keys())
    
    @classmethod
    def is_backend_available(cls, name: str) -> bool:
        """Check if a backend is registered"""
        return name.lower() in cls._services
    
    @classmethod
    def set_default_backend(cls, name: str) -> None:
        """Set the default backend"""
        if name.lower() not in cls._services:
            raise ValueError(f"Backend '{name}' not registered")
        cls._default_backend = name.lower()
