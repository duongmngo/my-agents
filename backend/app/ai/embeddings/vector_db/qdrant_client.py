"""
Qdrant client for vector database operations
"""
# pyright: reportUnknownMemberType=false, reportUnknownVariableType=false, reportUnknownArgumentType=false
import asyncio
from typing import List, Dict, Any, Optional, Union
from qdrant_client import QdrantClient as QdrantClientLib  # type: ignore
from qdrant_client.models import (  # type: ignore
    Distance, VectorParams, PointStruct, Filter, 
    FieldCondition, MatchValue, SearchRequest
)
import logging

from app.core.qdrant_config import qdrant_config

logger = logging.getLogger(__name__)


class QdrantClient:
    """Qdrant client wrapper for vector database operations"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize Qdrant client"""
        self.config = config or qdrant_config.model_dump()
        self.url = self.config["url"]
        self.api_key = self.config.get("api_key")
        self.timeout = self.config.get("timeout", 60)
        self._client: Any = None

        # Initialize client
        self._client = self._get_client()
    
    def _get_client(self) -> Any:
        """Get Qdrant client instance (lazy initialization)"""
        if self._client is None:
            # Use URL-based initialization as per official documentation
            if self.api_key:
                self._client = QdrantClientLib(url=self.url, api_key=self.api_key)  # type: ignore[call-arg]
            else:
                self._client = QdrantClientLib(url=self.url)  # type: ignore[call-arg]
        
        return self._client
    
    async def create_collection(self, collection_name: str, vector_size: Optional[int] = None) -> bool:
        """Create a Qdrant collection"""
        try:
            client = self._get_client()
            vector_size = vector_size or self.config["vector_size"]
            
            # Check if collection already exists
            collections = client.get_collections()
            if collection_name in [col.name for col in collections.collections]:
                logger.info(f"Collection {collection_name} already exists")
                return True
            
            # Create collection
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Created Qdrant collection: {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create collection {collection_name}: {str(e)}")
            return False
    
    async def store_vectors(
        self, 
        collection_name: str, 
        points: List[Dict[str, Any]]
    ) -> List[str]:
        """Store vectors in Qdrant"""
        try:
            client = self._get_client()
            
            if not points:
                logger.warning("store_vectors called with empty points list")
                return []
            
            # Convert points to Qdrant format
            qdrant_points = []
            for point in points:
                qdrant_point = PointStruct(
                    id=point["id"],
                    vector=point["vector"],
                    payload=point.get("payload", {})
                )
                qdrant_points.append(qdrant_point)
            
            # Log before upsert
            logger.info(f"Upserting {len(qdrant_points)} points to collection {collection_name}")
            for point in points:
                logger.info(f"  Point ID: {point['id']}, workspace_id: {point.get('payload', {}).get('workspace_id')}")
            
            # Upsert points - run in thread to avoid blocking event loop
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: client.upsert(
                    collection_name=collection_name,
                    points=qdrant_points
                )
            )
            
            stored_ids = [point["id"] for point in points]
            logger.info(f"Successfully stored {len(stored_ids)} points in collection {collection_name}, result: {result}")
            return stored_ids
            
        except Exception as e:
            logger.error(f"Failed to store vectors: {str(e)}", exc_info=True)
            raise  # Re-raise instead of returning empty list
    
    async def search_vectors(
        self,
        collection_name: str,
        query_vector: List[float],
        limit: int = 10,
        filter_conditions: Optional[Dict[str, Any]] = None,
        score_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors in Qdrant"""
        try:
            client = self._get_client()
            
            # Build filter if provided
            query_filter = None
            if filter_conditions:
                conditions = []
                for key, value in filter_conditions.items():
                    condition = FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    )
                    conditions.append(condition)
                query_filter = Filter(must=conditions)
            
            # Log the search details
            logger.info(
                f"Qdrant search: collection={collection_name}, "
                f"filters={filter_conditions}, "
                f"limit={limit}, "
                f"score_threshold={score_threshold}, "
                f"vector_dim={len(query_vector)}"
            )
            
            # Search using query_points (new API) - run in thread to avoid blocking event loop
            loop = asyncio.get_event_loop()
            search_results = await loop.run_in_executor(
                None,
                lambda: client.query_points(
                    collection_name=collection_name,
                    query=query_vector,
                    limit=limit,
                    query_filter=query_filter,
                    score_threshold=score_threshold,
                    with_payload=True
                )
            )
            
            # Log raw results count
            points = search_results.points if hasattr(search_results, 'points') else []
            logger.info(f"Qdrant search returned {len(points)} raw results")
            
            # Convert results to our format
            results = []
            for point in points:
                results.append({
                    "id": point.id,
                    "score": point.score,
                    "payload": point.payload
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to search vectors: {str(e)}")
            return []
    
    async def delete_points(self, collection_name: str, point_ids: List[str]) -> bool:
        """Delete points from Qdrant"""
        try:
            client = self._get_client()
            
            client.delete(
                collection_name=collection_name,
                points_selector=point_ids
            )
            
            logger.info(f"Deleted {len(point_ids)} points from collection {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete points: {str(e)}")
            return False
    
    async def get_point(self, collection_name: str, point_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific point from Qdrant"""
        try:
            client = self._get_client()
            
            result = client.retrieve(
                collection_name=collection_name,
                ids=[point_id]
            )
            
            if result:
                point = result[0]
                return {
                    "id": point.id,
                    "vector": point.vector,
                    "payload": point.payload
                }
            return None
            
        except Exception as e:
            logger.error(f"Failed to get point {point_id}: {str(e)}")
            return None
    
    async def get_collection_info(self, collection_name: str) -> Optional[Dict[str, Any]]:
        """Get collection information"""
        try:
            client = self._get_client()
            
            info = client.get_collection(collection_name)
            return {
                "name": info.config.params.vectors.size,
                "vector_size": info.config.params.vectors.size,
                "distance": info.config.params.vectors.distance,
                "points_count": info.points_count,
                "status": info.status
            }
            
        except Exception as e:
            logger.error(f"Failed to get collection info: {str(e)}")
            return None
    
    async def list_collections(self) -> List[str]:
        """List all collections"""
        try:
            client = self._get_client()
            
            collections = client.get_collections()
            return [col.name for col in collections.collections]
            
        except Exception as e:
            logger.error(f"Failed to list collections: {str(e)}")
            return []
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Qdrant health"""
        try:
            client = self._get_client()
            
            # Get collections to test connection
            collections = client.get_collections()
            
            return {
                "connected": True,
                "collections_count": len(collections.collections),
                "collections": [col.name for col in collections.collections]
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {
                "connected": False,
                "error": str(e)
            }
