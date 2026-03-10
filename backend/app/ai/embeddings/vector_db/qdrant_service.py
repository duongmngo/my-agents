"""
Qdrant implementation of BaseVectorService.

This module provides QdrantVectorService which implements
all abstract methods from BaseVectorService using Qdrant as the backend.
"""
import hashlib
import logging
import time
from typing import List, Optional, Dict, Any

from app.core.qdrant_config import qdrant_config
from .qdrant_client import QdrantClient
from .base import (
    BaseVectorService,
    VectorSearchRequest,
    VectorSearchResult,
    VectorRecord,
    CollectionStats,
    HealthCheckResult,
    VectorServiceFactory,
)

logger = logging.getLogger(__name__)


class QdrantVectorService(BaseVectorService):
    """
    Qdrant implementation of BaseVectorService.
    
    Uses Qdrant vector database for storing and searching embeddings.
    Supports payload-based filtering via workspace_id.
    
    Usage:
        service = QdrantVectorService()
        await service.initialize()
        
        # Store an embedding
        record = VectorRecord(
            id="note-123",
            content="My note content",
            embedding=[0.1, 0.2, ...],
            workspace_id="ws-456",
            source_type="note",
            source_id="note-123",
        )
        await service.store_embedding(record)
        
        # Search
        results = await service.search_similar(VectorSearchRequest(
            query_vector=[0.1, 0.2, ...],
            workspace_id="ws-456",
        ))
    """
    
    def __init__(
        self,
        collection_name: Optional[str] = None,
        vector_size: Optional[int] = None,
    ):
        """
        Initialize QdrantVectorService.
        
        Args:
            collection_name: Collection name (defaults to config)
            vector_size: Vector dimension (defaults to config)
        """
        super().__init__(
            collection_name=collection_name or qdrant_config.default_collection_name,
            vector_size=vector_size or qdrant_config.vector_size,
        )
        self._client: Optional[QdrantClient] = None
    
    def get_backend_name(self) -> str:
        """Return 'qdrant' as the backend name"""
        return "qdrant"
    
    # =========================================================================
    # Lifecycle Methods
    # =========================================================================
    
    async def initialize(self) -> bool:
        """Initialize connection and ensure collection exists"""
        if self._initialized:
            return True
        
        try:
            self._client = QdrantClient()
            await self._client.create_collection(self.collection_name, self.vector_size)
            self._initialized = True
            logger.info(f"QdrantVectorService initialized with collection '{self.collection_name}'")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize QdrantVectorService: {e}")
            return False
    
    async def disconnect(self) -> None:
        """Close Qdrant connection"""
        if self._client:
            await self._client.disconnect() # type: ignore
            self._client = None
        self._initialized = False
        logger.info("QdrantVectorService disconnected")
    
    async def health_check(self) -> HealthCheckResult:
        """Check Qdrant connectivity"""
        start_time = time.time()
        
        try:
            if not self._client:
                return HealthCheckResult(
                    healthy=False,
                    backend="qdrant",
                    error="Service not initialized",
                )
            
            health = await self._client.health_check()
            latency_ms = int((time.time() - start_time) * 1000)
            
            return HealthCheckResult(
                healthy=health.get("connected", False),
                backend="qdrant",
                latency_ms=latency_ms,
                details=health,
            )
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            return HealthCheckResult(
                healthy=False,
                backend="qdrant",
                latency_ms=latency_ms,
                error=str(e),
            )
    
    async def _ensure_client(self) -> QdrantClient:
        """Ensure client is initialized, raise if not"""
        if not self._client or not self._initialized:
            # Auto-initialize if not done
            await self.initialize()
        
        if not self._client:
            raise RuntimeError("QdrantVectorService not initialized")
        
        return self._client
    
    # =========================================================================
    # Core CRUD Operations
    # =========================================================================
    
    async def store_embedding(self, record: VectorRecord) -> str:
        """Store a single embedding in Qdrant"""
        client = await self._ensure_client()
        
        try:
            # Compute content hash for deduplication
            content_hash = hashlib.sha256(record.content.encode()).hexdigest()
            
            # Build payload with all metadata
            point_data = {
                "id": record.id,
                "vector": record.embedding,
                "payload": {
                    # Content
                    "content": record.content,
                    "content_hash": content_hash,
                    
                    # Source identification
                    "source_type": record.source_type,
                    "source_id": record.source_id,
                    
                    # Workspace filtering
                    "workspace_id": record.workspace_id,
                    "created_by": record.created_by,
                    
                    # Additional metadata
                    "tags": record.tags,
                    "language": record.language,
                    "content_type": record.content_type,
                    
                    # Custom metadata
                    **record.metadata,
                }
            }
            
            stored_ids = await client.store_vectors(self.collection_name, [point_data])
            
            if not stored_ids:
                raise Exception("Failed to store embedding in Qdrant")
            
            logger.info(f"Stored embedding {record.id} in workspace {record.workspace_id}")
            return stored_ids[0]
            
        except Exception as e:
            logger.error(f"Failed to store embedding: {e}")
            raise
    
    async def store_embeddings_batch(self, records: List[VectorRecord]) -> List[str]:
        """Store multiple embeddings in batch"""
        if not records:
            return []
        
        client = await self._ensure_client()
        
        try:
            points = []
            for record in records:
                content_hash = hashlib.sha256(record.content.encode()).hexdigest()
                
                point_data = {
                    "id": record.id,
                    "vector": record.embedding,
                    "payload": {
                        "content": record.content,
                        "content_hash": content_hash,
                        "source_type": record.source_type,
                        "source_id": record.source_id,
                        "workspace_id": record.workspace_id,
                        "created_by": record.created_by,
                        "tags": record.tags,
                        "language": record.language,
                        "content_type": record.content_type,
                        **record.metadata,
                    }
                }
                points.append(point_data)
            
            stored_ids = await client.store_vectors(self.collection_name, points)
            logger.info(f"Stored {len(stored_ids)} embeddings in batch")
            return stored_ids
            
        except Exception as e:
            logger.error(f"Failed to store embeddings batch: {e}")
            raise
    
    async def get_embedding(self, vector_id: str) -> Optional[Dict[str, Any]]:
        """Get a vector by ID"""
        client = await self._ensure_client()
        
        try:
            return await client.get_point(self.collection_name, vector_id)
        except Exception as e:
            logger.error(f"Failed to get embedding {vector_id}: {e}")
            return None
    
    async def update_embedding(
        self,
        vector_id: str,
        content: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Update an existing embedding"""
        client = await self._ensure_client()
        
        try:
            # Get existing point to preserve workspace info
            existing = await client.get_point(self.collection_name, vector_id)
            if not existing:
                logger.warning(f"Embedding {vector_id} not found for update")
                return False
            
            existing_payload = existing.get("payload", {})
            
            # Merge metadata
            updated_payload = {
                **existing_payload,
                "content": content,
                "content_hash": hashlib.sha256(content.encode()).hexdigest(),
            }
            
            if metadata:
                updated_payload.update(metadata)
            
            # Upsert with updated data
            point_data = {
                "id": vector_id,
                "vector": embedding,
                "payload": updated_payload,
            }
            
            stored_ids = await client.store_vectors(self.collection_name, [point_data])
            
            if stored_ids:
                logger.info(f"Updated embedding {vector_id}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to update embedding {vector_id}: {e}")
            return False
    
    async def delete_embedding(self, vector_id: str) -> bool:
        """Delete a vector by ID"""
        client = await self._ensure_client()
        
        try:
            result = await client.delete_points(self.collection_name, [vector_id])
            if result:
                logger.info(f"Deleted embedding {vector_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to delete embedding {vector_id}: {e}")
            return False
    
    async def delete_embeddings_batch(self, vector_ids: List[str]) -> int:
        """Delete multiple vectors by IDs"""
        if not vector_ids:
            return 0
        
        client = await self._ensure_client()
        
        try:
            result = await client.delete_points(self.collection_name, vector_ids)
            count = len(vector_ids) if result else 0
            logger.info(f"Deleted {count} embeddings in batch")
            return count
        except Exception as e:
            logger.error(f"Failed to delete embeddings batch: {e}")
            return 0
    
    # =========================================================================
    # Search Operations
    # =========================================================================
    
    async def search_similar(
        self,
        request: VectorSearchRequest,
    ) -> List[VectorSearchResult]:
        """Search for similar vectors with filtering"""
        client = await self._ensure_client()
        
        try:
            # Build filters for workspace
            search_filters = {
                "workspace_id": request.workspace_id,
            }
            
            # Add source type filter if specified
            if request.source_type:
                search_filters["source_type"] = request.source_type
            
            # Merge additional filters
            if request.filters:
                search_filters.update(request.filters)
            
            logger.info(f"QdrantService.search_similar: collection={self.collection_name}, filters={search_filters}")
            
            # Execute search
            raw_results = await client.search_vectors(
                collection_name=self.collection_name,
                query_vector=request.query_vector,
                limit=request.limit,
                filter_conditions=search_filters,
                score_threshold=request.threshold if request.threshold > 0 else None,
            )
            
            logger.info(f"QdrantService.search_similar: got {len(raw_results)} raw results")
            
            # Convert to VectorSearchResult
            results = []
            for item in raw_results:
                payload = item.get("payload", {})
                
                result = VectorSearchResult(
                    id=str(item["id"]),
                    content=payload.get("content", ""),
                    score=item["score"],
                    metadata=payload if request.include_metadata else None,
                    source_type=payload.get("source_type"),
                    source_id=payload.get("source_id"),
                )
                results.append(result)
            
            logger.debug(f"Search returned {len(results)} results for workspace {request.workspace_id}")
            return results
            
        except Exception as e:
            logger.error(f"Failed to search similar: {e}")
            return []
    
    # =========================================================================
    # Workspace Operations
    # =========================================================================
    
    async def delete_by_workspace(self, workspace_id: str) -> int:
        """Delete all vectors in a workspace"""
        client = await self._ensure_client()
        
        try:
            # Search for all points in workspace
            results = await client.search_vectors(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.vector_size,
                limit=10000,
                filter_conditions={"workspace_id": workspace_id},
            )
            
            if not results:
                logger.info(f"No vectors found for workspace {workspace_id}")
                return 0
            
            # Delete all found points
            point_ids = [str(r["id"]) for r in results]
            success = await client.delete_points(self.collection_name, point_ids)
            
            count = len(point_ids) if success else 0
            logger.info(f"Deleted {count} vectors from workspace {workspace_id}")
            return count
            
        except Exception as e:
            logger.error(f"Failed to delete workspace {workspace_id}: {e}")
            return 0
    
    async def delete_by_source(
        self,
        workspace_id: str,
        source_type: str,
        source_id: Optional[str] = None,
    ) -> int:
        """Delete vectors by source"""
        client = await self._ensure_client()
        
        try:
            filters = {
                "workspace_id": workspace_id,
                "source_type": source_type,
            }
            
            if source_id:
                filters["source_id"] = source_id
            
            # Search for matching points
            results = await client.search_vectors(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.vector_size,
                limit=10000,
                filter_conditions=filters,
            )
            
            if not results:
                return 0
            
            # Delete
            point_ids = [str(r["id"]) for r in results]
            success = await client.delete_points(self.collection_name, point_ids)
            
            count = len(point_ids) if success else 0
            logger.info(f"Deleted {count} vectors for source_type={source_type}")
            return count
            
        except Exception as e:
            logger.error(f"Failed to delete by source: {e}")
            return 0
    
    async def get_workspace_stats(self, workspace_id: str) -> CollectionStats:
        """Get statistics for a workspace"""
        client = await self._ensure_client()
        
        try:
            # Search all vectors in workspace
            results = await client.search_vectors(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.vector_size,
                limit=10000,
                filter_conditions={"workspace_id": workspace_id},
            )
            
            # Count by source type
            by_source_type: Dict[str, int] = {}
            for r in results:
                payload = r.get("payload", {})
                st = payload.get("source_type", "unknown")
                by_source_type[st] = by_source_type.get(st, 0) + 1
            
            return CollectionStats(
                collection_name=self.collection_name,
                total_vectors=len(results),
                workspace_id=workspace_id,
                by_source_type=by_source_type,
            )
            
        except Exception as e:
            logger.error(f"Failed to get workspace stats: {e}")
            return CollectionStats(
                collection_name=self.collection_name,
                workspace_id=workspace_id,
            )
    
    async def get_collection_stats(self) -> CollectionStats:
        """Get overall collection statistics"""
        client = await self._ensure_client()
        
        try:
            info = await client.get_collection_info(self.collection_name)
            
            if info:
                return CollectionStats(
                    collection_name=self.collection_name,
                    total_vectors=info.get("points_count", 0),
                )
            
            return CollectionStats(collection_name=self.collection_name)
            
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return CollectionStats(collection_name=self.collection_name)


# Register QdrantVectorService with the factory
VectorServiceFactory.register("qdrant", QdrantVectorService)
