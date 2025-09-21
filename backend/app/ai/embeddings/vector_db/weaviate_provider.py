"""
Weaviate vector database implementation for production use
"""
import asyncio
from typing import List, Optional, Dict, Any
import weaviate
from weaviate import WeaviateClient
from weaviate.classes import Query
from weaviate.classes.query import Filter
from weaviate.util import generate_uuid5

from .base import VectorDatabase, VectorSearchRequest, VectorSearchResult


class WeaviateVectorDatabase(VectorDatabase):
    """Weaviate vector database implementation for production"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.url = config.get("url", "http://localhost:8080")
        self.api_key = config.get("api_key")
        self.client: Optional[WeaviateClient] = None
        self.collection_name = "Embeddings"
        
    async def connect(self) -> bool:
        """Connect to Weaviate database"""
        try:
            # Create Weaviate client
            if self.api_key:
                self.client = weaviate.connect_to_wcs(
                    cluster_url=self.url,
                    auth_credentials=weaviate.auth.Auth.api_key(self.api_key)
                )
            else:
                self.client = weaviate.connect_to_local(
                    host=self.url.replace("http://", "").replace("https://", "")
                )
            
            # Ensure collection exists
            await self.create_collection(self.collection_name, self.dimension)
            return True
            
        except Exception as e:
            print(f"Failed to connect to Weaviate: {e}")
            return False
    
    async def disconnect(self) -> bool:
        """Disconnect from Weaviate database"""
        try:
            if self.client:
                self.client.close()
            return True
        except Exception as e:
            print(f"Failed to disconnect from Weaviate: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Check if Weaviate is healthy"""
        try:
            if not self.client:
                return False
            
            # Check if we can query the collection
            collections = self.client.collections.list_all()
            return len(collections) > 0
            
        except Exception:
            return False
    
    async def create_collection(self, name: str, dimension: int, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Create embeddings collection in Weaviate"""
        try:
            if not self.client:
                return False
            
            # Check if collection already exists
            try:
                collection = self.client.collections.get(name)
                return True
            except:
                pass
            
            # Create collection with proper schema
            collection = self.client.collections.create(
                name=name,
                properties=[
                    weaviate.classes.config.Property(
                        name="content",
                        data_type=weaviate.classes.config.DataType.TEXT,
                        description="Original text content"
                    ),
                    weaviate.classes.config.Property(
                        name="content_hash",
                        data_type=weaviate.classes.config.DataType.TEXT,
                        description="SHA256 hash of content"
                    ),
                    weaviate.classes.config.Property(
                        name="source_type",
                        data_type=weaviate.classes.config.DataType.TEXT,
                        description="Type of source document"
                    ),
                    weaviate.classes.config.Property(
                        name="source_id",
                        data_type=weaviate.classes.config.DataType.TEXT,
                        description="ID of source document"
                    ),
                    weaviate.classes.config.Property(
                        name="source_version",
                        data_type=weaviate.classes.config.DataType.TEXT,
                        description="Version of source document"
                    ),
                    weaviate.classes.config.Property(
                        name="status",
                        data_type=weaviate.classes.config.DataType.TEXT,
                        description="Processing status"
                    ),
                    weaviate.classes.config.Property(
                        name="workspace_id",
                        data_type=weaviate.classes.config.DataType.TEXT,
                        description="Workspace identifier"
                    ),
                    weaviate.classes.config.Property(
                        name="created_by",
                        data_type=weaviate.classes.config.DataType.TEXT,
                        description="User who created the embedding"
                    ),
                    weaviate.classes.config.Property(
                        name="tags",
                        data_type=weaviate.classes.config.DataType.TEXT_ARRAY,
                        description="Tags for categorization"
                    ),
                    weaviate.classes.config.Property(
                        name="language",
                        data_type=weaviate.classes.config.DataType.TEXT,
                        description="Content language"
                    ),
                    weaviate.classes.config.Property(
                        name="content_type",
                        data_type=weaviate.classes.config.DataType.TEXT,
                        description="MIME type or format"
                    ),
                    weaviate.classes.config.Property(
                        name="metadata",
                        data_type=weaviate.classes.config.DataType.OBJECT,
                        description="Additional metadata"
                    )
                ],
                vectorizer_config=weaviate.classes.config.Configure.Vectorizer.none(),
                vector_index_config=weaviate.classes.config.Configure.VectorIndex.hnsw(
                    distance_metric=weaviate.classes.config.VectorDistances.COSINE
                )
            )
            
            return True
            
        except Exception as e:
            print(f"Failed to create Weaviate collection: {e}")
            return False
    
    async def delete_collection(self, name: str) -> bool:
        """Delete collection from Weaviate"""
        try:
            if not self.client:
                return False
            
            self.client.collections.delete(name)
            return True
            
        except Exception as e:
            print(f"Failed to delete Weaviate collection: {e}")
            return False
    
    async def list_collections(self) -> List[str]:
        """List all collections in Weaviate"""
        try:
            if not self.client:
                return []
            
            collections = self.client.collections.list_all()
            return [col.name for col in collections]
            
        except Exception as e:
            print(f"Failed to list Weaviate collections: {e}")
            return []
    
    async def insert_vectors(self, collection: str, vectors: List[Dict[str, Any]]) -> List[str]:
        """Insert vectors into Weaviate collection"""
        try:
            if not self.client:
                return []
            
            weaviate_collection = self.client.collections.get(collection)
            inserted_ids = []
            
            for vector_data in vectors:
                # Generate deterministic UUID based on content
                uuid = generate_uuid5(vector_data["content"])
                
                # Prepare object for insertion
                obj_data = {
                    "content": vector_data["content"],
                    "content_hash": vector_data.get("content_hash", ""),
                    "source_type": vector_data["source_type"],
                    "source_id": vector_data["source_id"],
                    "source_version": vector_data.get("source_version", "1.0"),
                    "status": vector_data.get("status", "completed"),
                    "workspace_id": vector_data["workspace_id"],
                    "created_by": vector_data["created_by"],
                    "tags": vector_data.get("tags", []),
                    "language": vector_data.get("language", "en"),
                    "content_type": vector_data.get("content_type", "text/plain"),
                    "metadata": vector_data.get("metadata", {})
                }
                
                # Insert with vector
                weaviate_collection.data.insert(
                    properties=obj_data,
                    vector=vector_data["vector"],
                    uuid=uuid
                )
                
                inserted_ids.append(uuid)
            
            return inserted_ids
            
        except Exception as e:
            print(f"Failed to insert vectors into Weaviate: {e}")
            return []
    
    async def update_vector(self, collection: str, id: str, vector: List[float], metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Update a vector in Weaviate collection"""
        try:
            if not self.client:
                return False
            
            weaviate_collection = self.client.collections.get(collection)
            
            # Update properties if metadata provided
            if metadata:
                weaviate_collection.data.update(
                    uuid=id,
                    properties=metadata
                )
            
            # Update vector
            weaviate_collection.data.update(
                uuid=id,
                vector=vector
            )
            
            return True
            
        except Exception as e:
            print(f"Failed to update vector in Weaviate: {e}")
            return False
    
    async def delete_vector(self, collection: str, id: str) -> bool:
        """Delete a vector from Weaviate collection"""
        try:
            if not self.client:
                return False
            
            weaviate_collection = self.client.collections.get(collection)
            weaviate_collection.data.delete_by_id(id)
            return True
            
        except Exception as e:
            print(f"Failed to delete vector from Weaviate: {e}")
            return False
    
    async def search_similar(self, collection: str, request: VectorSearchRequest) -> List[VectorSearchResult]:
        """Search for similar vectors using Weaviate"""
        try:
            if not self.client:
                return []
            
            weaviate_collection = self.client.collections.get(collection)
            
            # Build filters
            filters = []
            if request.filters:
                if "workspace_id" in request.filters:
                    filters.append(
                        Filter.by_property("workspace_id").equal(request.filters["workspace_id"])
                    )
                
                if "source_type" in request.filters:
                    filters.append(
                        Filter.by_property("source_type").equal(request.filters["source_type"])
                    )
                
                if "source_id" in request.filters:
                    filters.append(
                        Filter.by_property("source_id").equal(request.filters["source_id"])
                    )
                
                if "tags" in request.filters:
                    filters.append(
                        Filter.by_property("tags").contains_any(request.filters["tags"])
                    )
            
            # Combine filters
            combined_filter = None
            if filters:
                combined_filter = Filter.and(*filters)
            
            # Perform vector search
            response = weaviate_collection.query.near_vector(
                near_vector=request.query_vector,
                limit=request.limit,
                where=combined_filter,
                return_properties=[
                    "content", "source_type", "source_id", "metadata", "tags"
                ],
                return_metadata=["distance"]
            )
            
            # Convert to VectorSearchResult objects
            results = []
            for obj in response.objects:
                # Convert distance to similarity (cosine similarity)
                distance = obj.metadata.distance
                similarity = 1 - distance  # Convert distance to similarity
                
                if similarity >= request.threshold:
                    results.append(VectorSearchResult(
                        id=obj.uuid,
                        content=obj.properties["content"],
                        similarity=similarity,
                        metadata=obj.properties.get("metadata"),
                        source_type=obj.properties.get("source_type"),
                        source_id=obj.properties.get("source_id")
                    ))
            
            # Sort by similarity (highest first)
            results.sort(key=lambda x: x.similarity, reverse=True)
            return results[:request.limit]
            
        except Exception as e:
            print(f"Failed to search similar vectors in Weaviate: {e}")
            return []
    
    async def get_vector(self, collection: str, id: str) -> Optional[Dict[str, Any]]:
        """Get a vector by ID from Weaviate"""
        try:
            if not self.client:
                return None
            
            weaviate_collection = self.client.collections.get(collection)
            
            # Get object by ID
            response = weaviate_collection.query.fetch_object_by_id(
                id,
                return_properties=[
                    "content", "source_type", "source_id", "workspace_id", 
                    "created_by", "metadata", "tags"
                ],
                return_vector=True
            )
            
            if not response:
                return None
            
            obj = response
            return {
                "id": obj.uuid,
                "content": obj.properties["content"],
                "vector": obj.vector,
                "metadata": obj.properties.get("metadata"),
                "source_type": obj.properties.get("source_type"),
                "source_id": obj.properties.get("source_id"),
                "workspace_id": obj.properties.get("workspace_id"),
                "created_by": obj.properties.get("created_by")
            }
            
        except Exception as e:
            print(f"Failed to get vector from Weaviate: {e}")
            return None
    
    async def get_collection_stats(self, collection: str) -> Dict[str, Any]:
        """Get statistics about the Weaviate collection"""
        try:
            if not self.client:
                return {}
            
            weaviate_collection = self.client.collections.get(collection)
            
            # Get collection info
            collection_info = weaviate_collection.config.get()
            
            # Get object count
            response = weaviate_collection.query.aggregate.over_all(
                total_count=True
            )
            total_count = response.total_count
            
            return {
                "total_embeddings": total_count,
                "dimension": collection_info.vectorizer_config.vector_index_config.distance_metric,
                "metric": "cosine",
                "collection_name": collection,
                "vectorizer": "none"  # We provide vectors externally
            }
            
        except Exception as e:
            print(f"Failed to get collection stats from Weaviate: {e}")
            return {}
    
    async def create_index(self, collection: str, index_type: str = "default") -> bool:
        """Create index for Weaviate collection (handled automatically)"""
        try:
            # Weaviate creates indexes automatically based on configuration
            # This method is kept for interface compatibility
            return True
            
        except Exception as e:
            print(f"Failed to create index in Weaviate: {e}")
            return False
    
    def get_database_name(self) -> str:
        """Get the name of this database type"""
        return "weaviate"
