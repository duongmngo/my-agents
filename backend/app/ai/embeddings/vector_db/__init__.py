"""
Vector Database Module

Provides abstract interfaces and implementations for vector database operations.
Supports multiple backends (Qdrant, Pinecone, Weaviate, etc.) through a unified interface.

Architecture:
- BaseVectorService: Abstract base class defining the interface
- QdrantVectorService: Qdrant implementation
- VectorServiceFactory: Factory for creating service instances
- VectorDatabaseService: High-level service wrapping the abstract implementation

Usage:
    from app.ai.embeddings.vector_db import VectorServiceFactory, VectorRecord
    
    # Create a service (defaults to Qdrant)
    service = VectorServiceFactory.create()
    await service.initialize()
    
    # Store an embedding
    record = VectorRecord(
        id="doc-1",
        content="My document",
        embedding=[0.1, 0.2, ...],
        workspace_id="ws-123",
        source_type="note",
        source_id="note-456",
    )
    await service.store_embedding(record)
    
    # Search
    results = await service.search_similar(VectorSearchRequest(
        query_vector=[0.1, 0.2, ...],
        workspace_id="ws-123",
    ))

High-level Service Usage:
    from app.ai.embeddings.vector_db import VectorDatabaseService
    
    service = VectorDatabaseService()
    await service.initialize()
    
    # Store note embedding
    await service.store_note_embedding(
        note_id="note-123",
        content="My note content",
        embedding=[0.1, 0.2, ...],
        workspace_id="ws-123",
        created_by="user-456",
        note_metadata={"tags": ["tag1"]},
    )

To add a new backend:
    1. Create a new service class extending BaseVectorService
    2. Implement all abstract methods
    3. Register with: VectorServiceFactory.register("new_backend", NewService)
"""
from .base import (
    # DTOs
    VectorSearchRequest,
    VectorSearchResult,
    VectorRecord,
    CollectionStats,
    HealthCheckResult,
    # Abstract base
    BaseVectorService,
    # Factory
    VectorServiceFactory,
)

from .qdrant_service import QdrantVectorService

# High-level service wrapping the abstract BaseVectorService
from .vector_db_service import VectorDatabaseService

__all__ = [
    # DTOs
    "VectorSearchRequest",
    "VectorSearchResult",
    "VectorRecord",
    "CollectionStats",
    "HealthCheckResult",
    # Abstract base
    "BaseVectorService",
    # Factory
    "VectorServiceFactory",
    # Implementations
    "QdrantVectorService",
    # High-level service (wraps abstract implementation)
    "VectorDatabaseService",
]
