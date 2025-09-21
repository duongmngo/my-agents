"""
Vector Database Service for managing vector operations with Qdrant
"""
import asyncio
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
import hashlib
import logging

from app.core.qdrant_config import qdrant_config
from .qdrant_client import QdrantClient
from .base import VectorSearchRequest, VectorSearchResult

logger = logging.getLogger(__name__)


class VectorDatabaseService:
    """Service for managing vector database operations with Qdrant using payload-based tenancy"""
    
    def __init__(self):
        self.qdrant_client: Optional[QdrantClient] = None
        self.collection_name = qdrant_config.default_collection_name
        self.vector_size = qdrant_config.vector_size
    
    async def _get_qdrant_client(self) -> QdrantClient:
        """Get or create Qdrant client instance"""
        if not self.qdrant_client:
            self.qdrant_client = QdrantClient()
            
            
            # Ensure collection exists
            await self.qdrant_client.create_collection(self.collection_name, self.vector_size)
        
        return self.qdrant_client
    
    async def store_note_embedding(
        self,
        note_id: str,
        content: str,
        embedding: List[float],
        workspace_id: str,
        created_by: str,
        note_metadata: Dict[str, Any],
        tenant_id: Optional[str] = None
    ) -> str:
        """Store note embedding in Qdrant with payload-based tenancy"""
        try:
            qdrant_client = await self._get_qdrant_client()
            
            # Use provided tenant_id or fallback to workspace_id
            effective_tenant_id = tenant_id or workspace_id
            
            # Prepare vector data for storage with payload-based tenancy
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            
            # Create point with comprehensive tenant tracking
            point_data = {
                "id": note_id,  # Use note_id as the point ID
                "vector": embedding,
                "payload": {
                    # Content and metadata
                    "content": content,
                    "content_hash": content_hash,
                    "source_type": "note",
                    "source_id": note_id,
                    "source_version": "1.0",
                    "status": "completed",
                    
                    # Multi-tenancy fields (payload-based) - Comprehensive tracking
                    "workspace_id": workspace_id,      # Workspace identifier
                    "tenant_id": effective_tenant_id,  # Primary tenant identifier
                    "created_by": created_by,
                    "tenant_type": "workspace",        # Type of tenant
                    "tenant_created_at": note_metadata.get("created_at"),
                    
                    # Additional metadata
                    "tags": note_metadata.get("tags", []),
                    "language": note_metadata.get("language", "en"),
                    "content_type": "text/markdown" if note_metadata.get("format") == "markdown" else "text/plain",
                    "created_at": note_metadata.get("created_at"),
                    "updated_at": note_metadata.get("updated_at"),
                    "metadata": note_metadata
                }
            }
            
            # Store in Qdrant
            stored_ids = await qdrant_client.store_vectors(self.collection_name, [point_data])
            
            if not stored_ids:
                raise Exception("Failed to store embedding in Qdrant")
            
            logger.info(f"Stored note embedding for note {note_id} in tenant {effective_tenant_id} (workspace {workspace_id})")
            return stored_ids[0]
            
        except Exception as e:
            logger.error(f"Failed to store note embedding: {str(e)}")
            raise Exception(f"Failed to store note embedding: {str(e)}")
    
    async def search_similar_notes(
        self,
        query_vector: List[float],
        workspace_id: str,
        limit: int = 10,
        threshold: float = 0.0,
        filters: Optional[Dict[str, Any]] = None,
        tenant_id: Optional[str] = None
    ) -> List[VectorSearchResult]:
        """Search for similar notes using vector similarity with payload-based tenancy"""
        try:
            qdrant_client = await self._get_qdrant_client()
            
            # Use provided tenant_id or fallback to workspace_id
            effective_tenant_id = tenant_id or workspace_id
            
            # Prepare search filters with comprehensive tenant isolation
            search_filters = {
                "workspace_id": workspace_id,      # Workspace filter
                "tenant_id": effective_tenant_id,  # Primary tenant filter
                "source_type": "note"
            }
            
            # Add additional filters if provided
            if filters:
                search_filters.update(filters)
            
            # Search in Qdrant with tenant filtering
            search_results = await qdrant_client.search_vectors(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit,
                filter_conditions=search_filters,
                score_threshold=threshold
            )
            
            # Convert Qdrant results to VectorSearchResult format
            results = []
            for result in search_results:
                vector_result = VectorSearchResult(
                    id=str(result["id"]),
                    score=result["score"],
                    metadata=result["payload"]
                )
                results.append(vector_result)
            
            logger.info(f"Found {len(results)} similar notes for tenant {effective_tenant_id} (workspace {workspace_id})")
            return results
            
        except Exception as e:
            logger.error(f"Failed to search similar notes: {str(e)}")
            raise Exception(f"Failed to search similar notes: {str(e)}")
    
    async def get_note_embedding(self, note_id: str) -> Optional[Dict[str, Any]]:
        """Get note embedding by ID"""
        try:
            qdrant_client = await self._get_qdrant_client()
            return await qdrant_client.get_point(self.collection_name, note_id)
        except Exception as e:
            logger.error(f"Failed to get note embedding: {str(e)}")
            raise Exception(f"Failed to get note embedding: {str(e)}")
    
    async def delete_note_embedding(self, note_id: str) -> bool:
        """Delete note embedding by ID"""
        try:
            qdrant_client = await self._get_qdrant_client()
            return await qdrant_client.delete_points(self.collection_name, [note_id])
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
        """Update note embedding"""
        try:
            qdrant_client = await self._get_qdrant_client()
            
            # Get existing point to preserve tenant information
            existing_point = await qdrant_client.get_point(self.collection_name, note_id)
            if not existing_point:
                raise Exception(f"Note embedding {note_id} not found")
            
            # Preserve tenant information from existing point
            existing_payload = existing_point.get("payload", {})
            
            # Update the point with new content and embedding
            updated_point = {
                "id": note_id,
                "vector": embedding,
                "payload": {
                    **existing_payload,  # Preserve existing payload including tenant info
                    "content": content,
                    "content_hash": hashlib.sha256(content.encode()).hexdigest(),
                    "updated_at": note_metadata.get("updated_at"),
                    "metadata": note_metadata
                }
            }
            
            # Store updated point (upsert will update existing)
            stored_ids = await qdrant_client.store_vectors(self.collection_name, [updated_point])
            
            success = len(stored_ids) > 0
            if success:
                logger.info(f"Updated note embedding for note {note_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to update note embedding: {str(e)}")
            raise Exception(f"Failed to update note embedding: {str(e)}")
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get vector database collection statistics"""
        try:
            qdrant_client = await self._get_qdrant_client()
            return await qdrant_client.get_collection_info(self.collection_name)
        except Exception as e:
            logger.error(f"Failed to get collection stats: {str(e)}")
            raise Exception(f"Failed to get collection stats: {str(e)}")
    
    async def get_workspace_stats(self, workspace_id: str) -> Dict[str, Any]:
        """Get statistics for a specific workspace (tenant)"""
        try:
            qdrant_client = await self._get_qdrant_client()
            
            # Search for all points in the workspace to get count
            # This is a simplified approach - in production, you might want to use aggregation
            search_results = await qdrant_client.search_vectors(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.vector_size,  # Dummy vector
                limit=10000,  # Large limit to get all points
                filter_conditions={"workspace_id": workspace_id}
            )
            
            return {
                "workspace_id": workspace_id,
                "total_points": len(search_results),
                "collection_name": self.collection_name
            }
            
        except Exception as e:
            logger.error(f"Failed to get workspace stats: {str(e)}")
            raise Exception(f"Failed to get workspace stats: {str(e)}")
    
    async def get_tenant_stats(self, tenant_id: str) -> Dict[str, Any]:
        """Get comprehensive statistics for a specific tenant"""
        try:
            qdrant_client = await self._get_qdrant_client()
            
            # Search for all points for the tenant
            search_results = await qdrant_client.search_vectors(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.vector_size,  # Dummy vector
                limit=10000,  # Large limit to get all points
                filter_conditions={"tenant_id": tenant_id}
            )
            
            # Analyze tenant data
            tenant_info = {
                "tenant_id": tenant_id,
                "total_points": len(search_results),
                "collection_name": self.collection_name,
                "workspaces": set(),
                "source_types": set(),
                "created_by_users": set(),
                "languages": set(),
                "content_types": set(),
                "tags": set(),
                "date_range": {"earliest": None, "latest": None}
            }
            
            for result in search_results:
                payload = result["payload"]
                
                # Collect workspace information
                if "workspace_id" in payload:
                    tenant_info["workspaces"].add(payload["workspace_id"])
                
                # Collect source types
                if "source_type" in payload:
                    tenant_info["source_types"].add(payload["source_type"])
                
                # Collect users
                if "created_by" in payload:
                    tenant_info["created_by_users"].add(payload["created_by"])
                
                # Collect languages
                if "language" in payload:
                    tenant_info["languages"].add(payload["language"])
                
                # Collect content types
                if "content_type" in payload:
                    tenant_info["content_types"].add(payload["content_type"])
                
                # Collect tags
                if "tags" in payload and isinstance(payload["tags"], list):
                    tenant_info["tags"].update(payload["tags"])
                
                # Track date range
                if "created_at" in payload:
                    created_at = payload["created_at"]
                    if tenant_info["date_range"]["earliest"] is None or created_at < tenant_info["date_range"]["earliest"]:
                        tenant_info["date_range"]["earliest"] = created_at
                    if tenant_info["date_range"]["latest"] is None or created_at > tenant_info["date_range"]["latest"]:
                        tenant_info["date_range"]["latest"] = created_at
            
            # Convert sets to lists for JSON serialization
            tenant_info["workspaces"] = list(tenant_info["workspaces"])
            tenant_info["source_types"] = list(tenant_info["source_types"])
            tenant_info["created_by_users"] = list(tenant_info["created_by_users"])
            tenant_info["languages"] = list(tenant_info["languages"])
            tenant_info["content_types"] = list(tenant_info["content_types"])
            tenant_info["tags"] = list(tenant_info["tags"])
            
            logger.info(f"Retrieved comprehensive stats for tenant {tenant_id}")
            return tenant_info
            
        except Exception as e:
            logger.error(f"Failed to get tenant stats: {str(e)}")
            raise Exception(f"Failed to get tenant stats: {str(e)}")
    
    async def list_all_tenants(self) -> List[Dict[str, Any]]:
        """List all tenants with their basic information"""
        try:
            qdrant_client = await self._get_qdrant_client()
            
            # Get all collections first
            collections = await qdrant_client.list_collections()
            
            all_tenants = []
            
            for collection_name in collections:
                # Search for all points to extract tenant information
                search_results = await qdrant_client.search_vectors(
                    collection_name=collection_name,
                    query_vector=[0.0] * self.vector_size,  # Dummy vector
                    limit=10000,  # Large limit to get all points
                    filter_conditions={}  # No filters to get all points
                )
                
                # Extract unique tenants
                tenant_map = {}
                for result in search_results:
                    payload = result["payload"]
                    tenant_id = payload.get("tenant_id")
                    
                    if tenant_id and tenant_id not in tenant_map:
                        tenant_map[tenant_id] = {
                            "tenant_id": tenant_id,
                            "workspace_id": payload.get("workspace_id"),
                            "tenant_type": payload.get("tenant_type", "unknown"),
                            "created_at": payload.get("tenant_created_at"),
                            "collection_name": collection_name,
                            "point_count": 0
                        }
                    
                    if tenant_id:
                        tenant_map[tenant_id]["point_count"] += 1
                
                all_tenants.extend(list(tenant_map.values()))
            
            logger.info(f"Found {len(all_tenants)} tenants across all collections")
            return all_tenants
            
        except Exception as e:
            logger.error(f"Failed to list all tenants: {str(e)}")
            raise Exception(f"Failed to list all tenants: {str(e)}")
    
    async def get_tenant_data_summary(self, tenant_id: str) -> Dict[str, Any]:
        """Get a summary of all data for a specific tenant"""
        try:
            qdrant_client = await self._get_qdrant_client()
            
            # Get all points for the tenant
            search_results = await qdrant_client.search_vectors(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.vector_size,  # Dummy vector
                limit=10000,  # Large limit to get all points
                filter_conditions={"tenant_id": tenant_id}
            )
            
            summary = {
                "tenant_id": tenant_id,
                "total_points": len(search_results),
                "data_breakdown": {
                    "by_workspace": {},
                    "by_source_type": {},
                    "by_user": {},
                    "by_language": {},
                    "by_content_type": {}
                },
                "recent_activity": [],
                "storage_size_estimate": 0
            }
            
            for result in search_results:
                payload = result["payload"]
                
                # Breakdown by workspace
                workspace_id = payload.get("workspace_id", "unknown")
                summary["data_breakdown"]["by_workspace"][workspace_id] = \
                    summary["data_breakdown"]["by_workspace"].get(workspace_id, 0) + 1
                
                # Breakdown by source type
                source_type = payload.get("source_type", "unknown")
                summary["data_breakdown"]["by_source_type"][source_type] = \
                    summary["data_breakdown"]["by_source_type"].get(source_type, 0) + 1
                
                # Breakdown by user
                created_by = payload.get("created_by", "unknown")
                summary["data_breakdown"]["by_user"][created_by] = \
                    summary["data_breakdown"]["by_user"].get(created_by, 0) + 1
                
                # Breakdown by language
                language = payload.get("language", "unknown")
                summary["data_breakdown"]["by_language"][language] = \
                    summary["data_breakdown"]["by_language"].get(language, 0) + 1
                
                # Breakdown by content type
                content_type = payload.get("content_type", "unknown")
                summary["data_breakdown"]["by_content_type"][content_type] = \
                    summary["data_breakdown"]["by_content_type"].get(content_type, 0) + 1
                
                # Estimate storage size (rough calculation)
                content = payload.get("content", "")
                summary["storage_size_estimate"] += len(content.encode('utf-8'))
                
                # Track recent activity
                if "updated_at" in payload:
                    summary["recent_activity"].append({
                        "point_id": result["id"],
                        "updated_at": payload["updated_at"],
                        "source_type": source_type
                    })
            
            # Sort recent activity by date
            summary["recent_activity"].sort(
                key=lambda x: x["updated_at"], 
                reverse=True
            )
            summary["recent_activity"] = summary["recent_activity"][:10]  # Keep only 10 most recent
            
            logger.info(f"Generated data summary for tenant {tenant_id}")
            return summary
            
        except Exception as e:
            logger.error(f"Failed to get tenant data summary: {str(e)}")
            raise Exception(f"Failed to get tenant data summary: {str(e)}")
    
    async def delete_workspace_data(self, workspace_id: str) -> bool:
        """Delete all data for a specific workspace (tenant)"""
        try:
            qdrant_client = await self._get_qdrant_client()
            
            # Get all points for the workspace
            search_results = await qdrant_client.search_vectors(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.vector_size,  # Dummy vector
                limit=10000,  # Large limit to get all points
                filter_conditions={"workspace_id": workspace_id}
            )
            
            if not search_results:
                logger.info(f"No data found for workspace {workspace_id}")
                return True
            
            # Extract point IDs
            point_ids = [str(result["id"]) for result in search_results]
            
            # Delete all points
            success = await qdrant_client.delete_points(self.collection_name, point_ids)
            
            if success:
                logger.info(f"Deleted {len(point_ids)} points for workspace {workspace_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to delete workspace data: {str(e)}")
            raise Exception(f"Failed to delete workspace data: {str(e)}")
    
    async def delete_tenant_data(self, tenant_id: str) -> bool:
        """Delete all data for a specific tenant"""
        try:
            qdrant_client = await self._get_qdrant_client()
            
            # Get all points for the tenant
            search_results = await qdrant_client.search_vectors(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.vector_size,  # Dummy vector
                limit=10000,  # Large limit to get all points
                filter_conditions={"tenant_id": tenant_id}
            )
            
            if not search_results:
                logger.info(f"No data found for tenant {tenant_id}")
                return True
            
            # Extract point IDs
            point_ids = [str(result["id"]) for result in search_results]
            
            # Delete all points
            success = await qdrant_client.delete_points(self.collection_name, point_ids)
            
            if success:
                logger.info(f"Deleted {len(point_ids)} points for tenant {tenant_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to delete tenant data: {str(e)}")
            raise Exception(f"Failed to delete tenant data: {str(e)}")
    
    async def migrate_tenant_data(self, old_tenant_id: str, new_tenant_id: str) -> bool:
        """Migrate all data from one tenant to another"""
        try:
            qdrant_client = await self._get_qdrant_client()
            
            # Get all points for the old tenant
            search_results = await qdrant_client.search_vectors(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.vector_size,  # Dummy vector
                limit=10000,  # Large limit to get all points
                filter_conditions={"tenant_id": old_tenant_id}
            )
            
            if not search_results:
                logger.info(f"No data found for tenant {old_tenant_id}")
                return True
            
            # Update each point with new tenant_id
            updated_points = []
            for result in search_results:
                payload = result["payload"].copy()
                payload["tenant_id"] = new_tenant_id
                payload["migrated_at"] = "2024-01-01T00:00:00Z"  # Add migration timestamp
                payload["migrated_from"] = old_tenant_id
                
                updated_point = {
                    "id": result["id"],
                    "vector": result.get("vector", []),
                    "payload": payload
                }
                updated_points.append(updated_point)
            
            # Store updated points
            stored_ids = await qdrant_client.store_vectors(self.collection_name, updated_points)
            
            if len(stored_ids) == len(search_results):
                logger.info(f"Successfully migrated {len(stored_ids)} points from tenant {old_tenant_id} to {new_tenant_id}")
                return True
            else:
                logger.error(f"Migration incomplete: {len(stored_ids)}/{len(search_results)} points migrated")
                return False
            
        except Exception as e:
            logger.error(f"Failed to migrate tenant data: {str(e)}")
            raise Exception(f"Failed to migrate tenant data: {str(e)}")
    
    async def get_tenant_usage_analytics(self, tenant_id: str, days: int = 30) -> Dict[str, Any]:
        """Get usage analytics for a specific tenant over a time period"""
        try:
            qdrant_client = await self._get_qdrant_client()
            
            # Get all points for the tenant
            search_results = await qdrant_client.search_vectors(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.vector_size,  # Dummy vector
                limit=10000,  # Large limit to get all points
                filter_conditions={"tenant_id": tenant_id}
            )
            
            analytics = {
                "tenant_id": tenant_id,
                "analysis_period_days": days,
                "total_points": len(search_results),
                "daily_activity": {},
                "user_activity": {},
                "content_analysis": {
                    "total_content_length": 0,
                    "average_content_length": 0,
                    "languages": {},
                    "content_types": {}
                },
                "storage_metrics": {
                    "estimated_size_bytes": 0,
                    "vector_dimensions": self.vector_size,
                    "total_vectors": len(search_results)
                }
            }
            
            for result in search_results:
                payload = result["payload"]
                
                # Daily activity tracking
                created_at = payload.get("created_at", "")
                if created_at:
                    date_key = created_at[:10]  # Extract date part
                    analytics["daily_activity"][date_key] = analytics["daily_activity"].get(date_key, 0) + 1
                
                # User activity tracking
                created_by = payload.get("created_by", "unknown")
                analytics["user_activity"][created_by] = analytics["user_activity"].get(created_by, 0) + 1
                
                # Content analysis
                content = payload.get("content", "")
                content_length = len(content)
                analytics["content_analysis"]["total_content_length"] += content_length
                
                # Language tracking
                language = payload.get("language", "unknown")
                analytics["content_analysis"]["languages"][language] = \
                    analytics["content_analysis"]["languages"].get(language, 0) + 1
                
                # Content type tracking
                content_type = payload.get("content_type", "unknown")
                analytics["content_analysis"]["content_types"][content_type] = \
                    analytics["content_analysis"]["content_types"].get(content_type, 0) + 1
                
                # Storage metrics
                analytics["storage_metrics"]["estimated_size_bytes"] += content_length
            
            # Calculate averages
            if analytics["total_points"] > 0:
                analytics["content_analysis"]["average_content_length"] = \
                    analytics["content_analysis"]["total_content_length"] / analytics["total_points"]
            
            logger.info(f"Generated usage analytics for tenant {tenant_id}")
            return analytics
            
        except Exception as e:
            logger.error(f"Failed to get tenant usage analytics: {str(e)}")
            raise Exception(f"Failed to get tenant usage analytics: {str(e)}")
    
    async def disconnect(self):
        """Disconnect from vector database"""
        if self.qdrant_client:
            await self.qdrant_client.disconnect()
            self.qdrant_client = None
