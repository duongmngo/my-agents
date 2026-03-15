"""
Vector Database Service for managing vector operations.

This module provides a high-level service that wraps the abstract BaseVectorService,
currently using QdrantVectorService as the backend implementation.

The service can be swapped to use a different vector database by changing the
backend in the factory registration.
"""
from typing import List, Optional, Dict, Any
import logging

from app.core.qdrant_config import qdrant_config
from .qdrant_service import QdrantVectorService
from .base import (
    BaseVectorService,
    VectorSearchRequest,
    VectorSearchResult,
    VectorRecord,
    CollectionStats,
)

logger = logging.getLogger(__name__)


class VectorDatabaseService:
    """
    Service for managing vector database operations.
    
    Internally uses QdrantVectorService (implementing BaseVectorService abstract class).
    This allows switching to a different vector database backend without impacting
    dependent services.
    
    Usage:
        service = VectorDatabaseService()
        await service.initialize()
        
        # Store a note embedding
        await service.store_note_embedding(
            note_id="note-123",
            content="My note content",
            embedding=[0.1, 0.2, ...],
            workspace_id="ws-456",
            created_by="user-789",
            note_metadata={"tags": ["tag1"]}
        )
        
        # Search similar content
        results = await service.search_knowledge_base(
            query_vector=[0.1, 0.2, ...],
            workspace_id="ws-456",
            limit=10
        )
    """
    
    def __init__(self):
        """Initialize VectorDatabaseService with QdrantVectorService backend.
        
        The service auto-initializes on first use, so no need to call initialize() explicitly.
        """
        self._vector_service: Optional[BaseVectorService] = None
        self.collection_name = qdrant_config.default_collection_name
        self.vector_size = qdrant_config.vector_size
        self._init_lock = None  # Will be created lazily to avoid event loop issues
    
    async def _get_init_lock(self):
        """Get or create the initialization lock."""
        import asyncio
        if self._init_lock is None:
            self._init_lock = asyncio.Lock()
        return self._init_lock
    
    async def initialize(self) -> bool:
        """Initialize the vector service.
        
        Called automatically on first operation. Can be called explicitly for early initialization.
        """
        if self._vector_service and self._vector_service.is_initialized:
            return True
        
        lock = await self._get_init_lock()
        async with lock:
            # Double-check after acquiring lock
            if self._vector_service and self._vector_service.is_initialized:
                return True
            
            self._vector_service = QdrantVectorService(
                collection_name=self.collection_name,
                vector_size=self.vector_size,
            )
            return await self._vector_service.initialize()
    
    async def _ensure_initialized(self) -> BaseVectorService:
        """Ensure service is initialized and return it. Auto-initializes if needed."""
        if not self._vector_service or not self._vector_service.is_initialized:
            await self.initialize()
        
        if not self._vector_service:
            raise RuntimeError("Failed to initialize vector service")
        
        return self._vector_service
    
    async def store_embedding(
        self,
        source_id: str,
        content: str,
        embedding: List[float],
        workspace_id: str,
        created_by: str,
        source_type: str,
        metadata: Dict[str, Any],
    ) -> str:
        """Store embedding in the vector database.
        
        Args:
            source_id: Unique identifier for the source document
            content: The text content
            embedding: Vector embedding of the content
            workspace_id: Workspace the document belongs to
            created_by: User ID who created the document
            source_type: Type of source ('note', 'note_chunk', 'knowledge_file', 'knowledge_file_chunk')
            metadata: Additional metadata (tags, language, file info, etc.)
            
        Returns:
            The stored vector ID
        """
        try:
            vector_service = await self._ensure_initialized()
            
            # Create VectorRecord for the abstract service
            record = VectorRecord(
                id=source_id,
                content=content,
                embedding=embedding,
                workspace_id=workspace_id,
                source_type=source_type,
                source_id=source_id,
                created_by=created_by,
                tags=metadata.get("tags", []),
                language=metadata.get("language", "en"),
                content_type="text/markdown" if metadata.get("format") == "markdown" or metadata.get("note_format") == "markdown" else "text/plain",
                metadata={
                    "created_at": metadata.get("created_at"),
                    "updated_at": metadata.get("updated_at"),
                    # Include note-specific metadata
                    "note_title": metadata.get("note_title") or metadata.get("title"),
                    "note_format": metadata.get("note_format"),
                    "word_count": metadata.get("word_count"),
                    "character_count": metadata.get("character_count"),
                    "folder_id": metadata.get("folder_id"),
                    # Include file-specific metadata
                    "file_name": metadata.get("file_name"),
                    "file_type": metadata.get("file_type"),
                    "file_size": metadata.get("file_size"),
                    # Include chunk-specific metadata
                    "parent_id": metadata.get("parent_id"),
                    "chunk_index": metadata.get("chunk_index"),
                    "total_chunks": metadata.get("total_chunks"),
                    "char_start": metadata.get("char_start"),
                    "char_end": metadata.get("char_end"),
                    # Pass through any other custom metadata
                    **{k: v for k, v in metadata.items() if k not in [
                        "tags", "language", "format", "created_at", "updated_at",
                        "note_title", "title", "note_format", "word_count", "character_count",
                        "folder_id", "file_name", "file_type", "file_size",
                        "parent_id", "chunk_index", "total_chunks", "char_start", "char_end"
                    ]}
                }
            )
            
            stored_id = await vector_service.store_embedding(record)
            logger.info(f"Stored {source_type} embedding for {source_id} in workspace {workspace_id}")
            return stored_id
            
        except Exception as e:
            logger.error(f"Failed to store embedding for {source_type}/{source_id}: {str(e)}")
            raise Exception(f"Failed to store embedding: {str(e)}")
    
    async def search_knowledge_base(
        self,
        query_vector: List[float],
        workspace_id: str,
        limit: int = 10,
        threshold: float = 0.0,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[VectorSearchResult]:
        """Search for similar content in the knowledge base using vector similarity.
        
        Searches across all source types (notes, files, etc.) unless filtered.
        
        Args:
            query_vector: The query embedding vector
            workspace_id: Workspace to search within
            limit: Maximum number of results
            threshold: Minimum similarity threshold
            filters: Additional filters to apply (e.g., {"source_type": "note"})
            
        Returns:
            List of VectorSearchResult with matching content
        """
        try:
            vector_service = await self._ensure_initialized()
            
            # Use provided filters or empty dict (searches all source types by default)
            merged_filters = filters.copy() if filters else {}
            
            logger.info(f"Searching knowledge base: workspace_id={workspace_id}, limit={limit}, threshold={threshold}, filters={merged_filters}")
            
            # Create search request
            request = VectorSearchRequest(
                query_vector=query_vector,
                workspace_id=workspace_id,
                limit=limit,
                threshold=threshold,
                filters=merged_filters,
                include_metadata=True,
            )
            
            results = await vector_service.search_similar(request)
            logger.info(f"Found {len(results)} similar results for workspace {workspace_id}")
            
            # Log result details
            for i, result in enumerate(results):
                logger.info(f"  Result {i+1}: id={result.id}, score={result.score:.4f}, source_type={result.source_type}")
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to search knowledge base: {str(e)}")
            raise Exception(f"Failed to search knowledge base: {str(e)}")
    
    async def get_note_embedding(self, note_id: str) -> Optional[Dict[str, Any]]:
        """Get note embedding by ID."""
        try:
            vector_service = await self._ensure_initialized()
            return await vector_service.get_embedding(note_id)
        except Exception as e:
            logger.error(f"Failed to get note embedding: {str(e)}")
            raise Exception(f"Failed to get note embedding: {str(e)}")
    
    async def delete_note_embedding(self, note_id: str) -> bool:
        """Delete note embedding by ID."""
        try:
            vector_service = await self._ensure_initialized()
            return await vector_service.delete_embedding(note_id)
        except Exception as e:
            logger.error(f"Failed to delete note embedding: {str(e)}")
            raise Exception(f"Failed to delete note embedding: {str(e)}")
    
    async def update_note_embedding(
        self,
        note_id: str,
        content: str,
        embedding: List[float],
        note_metadata: Dict[str, Any]
    ) -> bool:
        """Update note embedding."""
        try:
            vector_service = await self._ensure_initialized()
            
            # Use the update method from the abstract service
            metadata = {
                "updated_at": note_metadata.get("updated_at"),
                **{k: v for k, v in note_metadata.items() if k != "updated_at"}
            }
            
            success = await vector_service.update_embedding(
                vector_id=note_id,
                content=content,
                embedding=embedding,
                metadata=metadata,
            )
            
            if success:
                logger.info(f"Updated note embedding for note {note_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to update note embedding: {str(e)}")
            raise Exception(f"Failed to update note embedding: {str(e)}")
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get vector database collection statistics."""
        try:
            vector_service = await self._ensure_initialized()
            stats = await vector_service.get_collection_stats()
            return {
                "collection_name": stats.collection_name,
                "total_vectors": stats.total_vectors,
                "by_source_type": stats.by_source_type,
            }
        except Exception as e:
            logger.error(f"Failed to get collection stats: {str(e)}")
            raise Exception(f"Failed to get collection stats: {str(e)}")
    
    async def get_workspace_stats(self, workspace_id: str) -> Dict[str, Any]:
        """Get statistics for a specific workspace."""
        try:
            vector_service = await self._ensure_initialized()
            stats = await vector_service.get_workspace_stats(workspace_id)
            return {
                "workspace_id": stats.workspace_id,
                "total_points": stats.total_vectors,
                "collection_name": stats.collection_name,
                "by_source_type": stats.by_source_type,
            }
            
        except Exception as e:
            logger.error(f"Failed to get workspace stats: {str(e)}")
            raise Exception(f"Failed to get workspace stats: {str(e)}")
    
    async def delete_workspace_data(self, workspace_id: str) -> bool:
        """Delete all data for a specific workspace."""
        try:
            vector_service = await self._ensure_initialized()
            count = await vector_service.delete_by_workspace(workspace_id)
            logger.info(f"Deleted {count} vectors for workspace {workspace_id}")
            return count > 0 or True  # Return True even if nothing to delete
            
        except Exception as e:
            logger.error(f"Failed to delete workspace data: {str(e)}")
            raise Exception(f"Failed to delete workspace data: {str(e)}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check the health of the vector database service."""
        try:
            vector_service = await self._ensure_initialized()
            result = await vector_service.health_check()
            return {
                "healthy": result.healthy,
                "backend": result.backend,
                "latency_ms": result.latency_ms,
                "error": result.error,
                "details": result.details,
            }
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {
                "healthy": False,
                "backend": "qdrant",
                "error": str(e),
            }
    
    async def disconnect(self):
        """Disconnect from vector database."""
        if self._vector_service:
            await self._vector_service.disconnect()
            self._vector_service = None
