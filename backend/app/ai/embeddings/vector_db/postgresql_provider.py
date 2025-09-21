"""
PostgreSQL + pgvector vector database implementation
"""
import asyncio
from typing import List, Optional, Dict, Any
from sqlalchemy import text, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import VECTOR
import numpy as np

from .base import VectorDatabase, VectorSearchRequest, VectorSearchResult
# from app.models.embedding import Embedding, EmbeddingSourceType  # No longer used - embeddings not stored in PostgreSQL


class PostgreSQLVectorDatabase(VectorDatabase):
    """PostgreSQL + pgvector vector database implementation"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.db_session: Optional[AsyncSession] = None
        self.table_name = config.get("table_name", "embeddings")
        self.connection_string = config.get("connection_string")
    
    async def connect(self) -> bool:
        """Connect to PostgreSQL database"""
        try:
            # Connection is managed by the session dependency
            # This method is kept for interface compatibility
            return True
        except Exception as e:
            print(f"Failed to connect to PostgreSQL: {e}")
            return False
    
    async def disconnect(self) -> bool:
        """Disconnect from PostgreSQL database"""
        try:
            if self.db_session:
                await self.db_session.close()
            return True
        except Exception as e:
            print(f"Failed to disconnect from PostgreSQL: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Check if PostgreSQL is healthy"""
        try:
            if not self.db_session:
                return False
            
            # Simple query to check connection
            result = await self.db_session.execute(text("SELECT 1"))
            return result.scalar() == 1
        except Exception:
            return False
    
    async def create_collection(self, name: str, dimension: int, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Create embeddings table if it doesn't exist"""
        try:
            # Table creation is handled by SQLAlchemy models
            # This method ensures pgvector extension is enabled
            await self.db_session.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await self.db_session.commit()
            return True
        except Exception as e:
            print(f"Failed to create collection: {e}")
            return False
    
    async def delete_collection(self, name: str) -> bool:
        """Delete embeddings table"""
        try:
            await self.db_session.execute(text(f"DROP TABLE IF EXISTS {name}"))
            await self.db_session.commit()
            return True
        except Exception as e:
            print(f"Failed to delete collection: {e}")
            return False
    
    async def list_collections(self) -> List[str]:
        """List all tables in the database"""
        try:
            result = await self.db_session.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            tables = [row[0] for row in result.fetchall()]
            return tables
        except Exception as e:
            print(f"Failed to list collections: {e}")
            return []
    
    async def insert_vectors(self, collection: str, vectors: List[Dict[str, Any]]) -> List[str]:
        """Insert vectors into the database - DISABLED: embeddings not stored in PostgreSQL"""
        # This method is disabled since we're no longer storing embeddings in PostgreSQL
        # Embeddings are generated on-demand using the active provider
        print("Warning: insert_vectors is disabled - embeddings not stored in PostgreSQL")
        return []
        
        # try:
        #     inserted_ids = []
        #     
        #     for vector_data in vectors:
        #         # Create embedding record
        #         embedding = Embedding(
        #             content=vector_data["content"],
        #             content_hash=vector_data.get("content_hash", ""),
        #             embedding_vector=vector_data["vector"],
        #             source_type=EmbeddingSourceType(vector_data["source_type"]),
        #             source_id=vector_data["source_id"],
        #             source_version=vector_data.get("source_version"),
        #             status=vector_data.get("status", "completed"),
        #             metadata=vector_data.get("metadata"),
        #             tags=vector_data.get("tags"),
        #             language=vector_data.get("language"),
        #             content_type=vector_data.get("content_type"),
        #             workspace_id=vector_data["workspace_id"],
        #             created_by=vector_data["created_by"]
        #         )
        #         
        #         self.db_session.add(embedding)
        #         await self.db_session.flush()
        #         inserted_ids.append(embedding.id)
        #     
        #     await self.db_session.commit()
        #     return inserted_ids
        #     
        # except Exception as e:
        #     await self.db_session.rollback()
        #     print(f"Failed to insert vectors: {e}")
        #     return []
    
    async def update_vector(self, collection: str, id: str, vector: List[float], metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Update a vector in the database - DISABLED: embeddings not stored in PostgreSQL"""
        # This method is disabled since we're no longer storing embeddings in PostgreSQL
        print("Warning: update_vector is disabled - embeddings not stored in PostgreSQL")
        return False
        
        # try:
        #     # Find the embedding by ID
        #     stmt = select(Embedding).where(Embedding.id == id)
        #     result = await self.db_session.execute(stmt)
        #     embedding = result.scalar_one_or_none()
        #     
        #     if not embedding:
        #         return False
        #     
        #     # Update the vector and metadata
        #     embedding.embedding_vector = vector
        #     if metadata:
        #         embedding.metadata = metadata
        #     
        #     await self.db_session.commit()
        #     return True
        #     
        # except Exception as e:
        #     await self.db_session.rollback()
        #     print(f"Failed to update vector: {e}")
        #     return False
    
    async def delete_vector(self, collection: str, id: str) -> bool:
        """Delete a vector from the database - DISABLED: embeddings not stored in PostgreSQL"""
        # This method is disabled since we're no longer storing embeddings in PostgreSQL
        print("Warning: delete_vector is disabled - embeddings not stored in PostgreSQL")
        return False
        
        # try:
        #     stmt = select(Embedding).where(Embedding.id == id)
        #     result = await self.db_session.execute(stmt)
        #     embedding = result.scalar_one_or_none()
        #     
        #     if not embedding:
        #         return False
        #     
        #     await self.db_session.delete(embedding)
        #     await self.db_session.commit()
        #     return True
        #     
        # except Exception as e:
        #     await self.db_session.rollback()
        #     print(f"Failed to delete vector: {e}")
        #     return False
    
    async def search_similar(self, collection: str, request: VectorSearchRequest) -> List[VectorSearchResult]:
        """Search for similar vectors - DISABLED: embeddings not stored in PostgreSQL"""
        # This method is disabled since we're no longer storing embeddings in PostgreSQL
        print("Warning: search_similar is disabled - embeddings not stored in PostgreSQL")
        return []
        
        # try:
        #     # Build the query with tenant filtering
        #     base_query = f"""
        #         SELECT 
        #             e.id,
        #             e.content,
        #             e.metadata,
        #             e.source_type,
        #             e.source_id,
        #             1 - (e.embedding_vector <=> :query_vector) as similarity
        #         FROM {collection} e
        #         WHERE e.workspace_id = :workspace_id
        #     """
        #     
        #     # Add additional filters
        #     params = {
        #         "query_vector": request.query_vector,
        #         "workspace_id": request.filters.get("workspace_id") if request.filters else None
        #     }
        #     
        #     if request.filters:
        #         if "source_type" in request.filters:
        #             base_query += " AND e.source_type = :source_type"
        #             params["source_type"] = request.filters["source_type"]
        #         
        #         if "source_id" in request.filters:
        #             base_query += " AND e.source_id = :source_id"
        #             params["source_id"] = request.filters["source_id"]
        #         
        #         if "tags" in request.filters:
        #             base_query += " AND e.tags @> :tags"
        #             params["tags"] = request.filters["tags"]
        #     
        #     # Add similarity threshold and ordering
        #     base_query += f"""
        #         AND 1 - (e.embedding_vector <=> :query_vector) >= :threshold
        #         ORDER BY e.embedding_vector <=> :query_vector
        #         LIMIT :limit
        #     """
        #     
        #     params["threshold"] = request.threshold
        #     params["limit"] = request.limit
        #     
        #     # Execute the query
        #     result = await self.db_session.execute(text(base_query), params)
        #     rows = result.fetchall()
        #     
        #     # Convert to VectorSearchResult objects
        #     results = []
        #     for row in rows:
        #         results.append(VectorSearchResult(
        #             id=row[0],
        #             content=row[1],
        #             similarity=row[5],
        #             metadata=row[2] if request.include_metadata else None,
        #             source_type=row[3],
        #             source_id=row[4]
        #         ))
        #     
        #     return results
        #     
        # except Exception as e:
        #     print(f"Failed to search similar vectors: {e}")
        #     return []
    
    async def get_vector(self, collection: str, id: str) -> Optional[Dict[str, Any]]:
        """Get a vector by ID - DISABLED: embeddings not stored in PostgreSQL"""
        # This method is disabled since we're no longer storing embeddings in PostgreSQL
        print("Warning: get_vector is disabled - embeddings not stored in PostgreSQL")
        return None
        
        # try:
        #     stmt = select(Embedding).where(Embedding.id == id)
        #     result = await self.db_session.execute(stmt)
        #     embedding = result.scalar_one_or_none()
        #     
        #     if not embedding:
        #         return None
        #     
        #     return {
        #         "id": embedding.id,
        #         "content": embedding.content,
        #         "vector": embedding.embedding_vector,
        #         "metadata": embedding.metadata,
        #         "source_type": embedding.source_type.value,
        #         "source_id": embedding.source_id,
        #         "workspace_id": embedding.workspace_id,
        #         "created_by": embedding.created_by
        #     }
        #     
        # except Exception as e:
        #     print(f"Failed to get vector: {e}")
        #     return None
    
    async def get_collection_stats(self, collection: str) -> Dict[str, Any]:
        """Get statistics about the embeddings collection - DISABLED: embeddings not stored in PostgreSQL"""
        # This method is disabled since we're no longer storing embeddings in PostgreSQL
        print("Warning: get_collection_stats is disabled - embeddings not stored in PostgreSQL")
        return {
            "total_embeddings": 0,
            "status_counts": {},
            "source_type_counts": {},
            "message": "Embeddings not stored in PostgreSQL - use embedding providers instead"
        }
        
        # try:
        #     # Count total embeddings
        #     count_result = await self.db_session.execute(
        #         select(func.count(Embedding.id))
        #     )
        #     total_count = count_result.scalar()
        #     
        #     # Count by status
        #     status_result = await self.db_session.execute(
        #         select(Embedding.status, func.count(Embedding.id))
        #         .group_by(Embedding.status)
        #     )
        #     status_counts = dict(status_result.fetchall())
        #     
        #     # Count by source type
        #     source_result = await self.db_session.execute(
        #         select(Embedding.source_type, func.count(Embedding.id))
        #         .group_by(Embedding.source_type)
        #     )
        #     source_counts = dict(source_result.fetchall())
        #     
        #     return {
        #         "total_embeddings": total_count,
        #         "status_counts": status_counts,
        #         "source_type_counts": source_counts
        #     }
        #     
        # except Exception as e:
        #     print(f"Failed to get collection stats: {e}")
        #     return {}
    
    async def create_index(self, collection: str, index_type: str = "default") -> bool:
        """Create vector index for similarity search"""
        try:
            if index_type == "default":
                # Create IVFFlat index for cosine similarity
                await self.db_session.execute(text(f"""
                    CREATE INDEX IF NOT EXISTS idx_{collection}_vector_cosine 
                    ON {collection} USING ivfflat (embedding_vector vector_cosine_ops) 
                    WITH (lists = 100)
                """))
            elif index_type == "l2":
                # Create IVFFlat index for L2 distance
                await self.db_session.execute(text(f"""
                    CREATE INDEX IF NOT EXISTS idx_{collection}_vector_l2 
                    ON {collection} USING ivfflat (embedding_vector vector_l2_ops) 
                    WITH (lists = 100)
                """))
            
            await self.db_session.commit()
            return True
            
        except Exception as e:
            await self.db_session.rollback()
            print(f"Failed to create index: {e}")
            return False
    
    def set_session(self, session: AsyncSession):
        """Set the database session for this instance"""
        self.db_session = session
