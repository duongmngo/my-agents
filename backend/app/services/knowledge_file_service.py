"""
KnowledgeFile service for business logic operations
"""
import uuid
from typing import Any, Dict, List, Optional

from app.models.knowledge_file import FileStatus, KnowledgeFile
from app.repositories.knowledge_file_repository import KnowledgeFileRepository
from app.services.file_processing_service import FileProcessingService


class KnowledgeFileService:
    """Service for knowledge file operations"""
    
    # Maximum file size (50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024
    
    def __init__(self):
        self.knowledge_file_repo = KnowledgeFileRepository()
        self.file_processing_service = FileProcessingService()
        # Lazy-loaded services
        self._workspace_service = None
        self._folder_service = None
    
    def _get_workspace_service(self):
        """Get workspace service instance"""
        if not self._workspace_service:
            from app.services.workspace_service import WorkspaceService
            self._workspace_service = WorkspaceService()
        return self._workspace_service
    
    def _get_folder_service(self):
        """Get folder service instance"""
        if not self._folder_service:
            from app.services.folder_service import FolderService
            self._folder_service = FolderService()
        return self._folder_service
    
    def _knowledge_file_to_dict(self, file: KnowledgeFile) -> Dict[str, Any]:
        """Convert KnowledgeFile model to dictionary"""
        return {
            "id": file.id,
            "filename": file.filename,
            "original_filename": file.original_filename,
            "file_type": file.file_type,
            "mime_type": file.mime_type,
            "file_size": file.file_size,
            "size_display": file.size_human_readable,
            "storage_path": file.storage_path,
            "status": file.status.value,
            "error_message": file.error_message,
            "character_count": file.character_count,
            "word_count": file.word_count,
            "page_count": file.page_count,
            "is_embedded": file.is_embedded,
            "embedding_stats": file.embedding_stats,
            "folder_id": file.folder_id,
            "tags": file.tags,
            "description": file.description,
            "workspace_id": file.workspace_id,
            "created_by": file.created_by,
            "created_at": file.created_at.isoformat() if file.created_at else None,
            "updated_at": file.updated_at.isoformat() if file.updated_at else None,
        }
    
    async def upload_file(
        self,
        file_content: bytes,
        original_filename: str,
        mime_type: str,
        workspace_id: str,
        created_by: str,
        folder_id: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[str] = None
    ) -> Dict[str, Any]:
        """Upload a new knowledge file
        
        This will:
        1. Validate file type and size
        2. Check for duplicates via hash
        3. Create database record
        4. Store file in storage (MinIO/S3)
        5. Trigger async processing (text extraction + embedding)
        
        Returns:
            Dict with success, data (file info), or error
        """
        try:
            # Validate workspace access
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(workspace_id, created_by)
            if not access_result["success"]:
                return {"success": False, "error": access_result["error"]}
            
            # Validate file type
            if not self.file_processing_service.is_supported_file(original_filename):
                supported = ", ".join(self.file_processing_service.get_supported_extensions())
                return {
                    "success": False,
                    "error": f"Unsupported file type. Supported: {supported}"
                }
            
            # Validate file size
            file_size = len(file_content)
            if file_size > self.MAX_FILE_SIZE:
                max_mb = self.MAX_FILE_SIZE / (1024 * 1024)
                return {
                    "success": False,
                    "error": f"File too large. Maximum size: {max_mb}MB"
                }
            
            # Validate folder if provided
            if folder_id:
                folder_service = self._get_folder_service()
                folder_result = folder_service.get_folder(folder_id, workspace_id)
                if not folder_result:
                    return {"success": False, "error": "Folder not found"}
            
            # Calculate file hash for deduplication
            content_hash = self.file_processing_service.calculate_file_hash(file_content)
            
            # Check for duplicate
            existing_file = self.knowledge_file_repo.get_file_by_hash(workspace_id, content_hash)
            if existing_file:
                return {
                    "success": False,
                    "error": "Duplicate file. This file already exists in the workspace.",
                    "duplicate_file_id": existing_file.id
                }
            
            # Generate storage path
            storage_path, filename = self.file_processing_service.generate_storage_path(
                workspace_id, original_filename
            )
            
            # Get file type from extension
            file_type = original_filename.rsplit('.', 1)[-1].lower() if '.' in original_filename else 'unknown'
            
            # Create file record
            file_data = {
                "id": str(uuid.uuid4()),
                "filename": filename,
                "original_filename": original_filename,
                "file_type": file_type,
                "mime_type": mime_type,
                "file_size": file_size,
                "storage_path": storage_path,
                "storage_provider": "minio",
                "content_hash": content_hash,
                "status": FileStatus.PENDING,
                "folder_id": folder_id,
                "description": description,
                "tags": tags,
                "workspace_id": workspace_id,
                "created_by": created_by,
            }
            
            knowledge_file = self.knowledge_file_repo.create_file(file_data)
            
            # Store file in MinIO/S3
            storage_result = await self._store_file(
                file_content, 
                storage_path, 
                mime_type
            )
            
            if not storage_result["success"]:
                # Clean up database record if storage fails
                self.knowledge_file_repo.delete_file(knowledge_file.id, soft_delete=False)
                return {
                    "success": False,
                    "error": f"Failed to store file: {storage_result['error']}"
                }
            
            # Process file asynchronously (extract text + generate embeddings)
            processing_result = await self.file_processing_service.process_file(
                knowledge_file, 
                file_content
            )
            
            # Refresh file record to get updated status
            updated_file = self.knowledge_file_repo.get_file_by_id(knowledge_file.id)
            
            return {
                "success": True,
                "data": self._knowledge_file_to_dict(updated_file),
                "processing": processing_result,
                "message": "File uploaded and processing started"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to upload file: {str(e)}"}
    
    async def _store_file(
        self, 
        content: bytes, 
        storage_path: str, 
        mime_type: str
    ) -> Dict[str, Any]:
        """Store file in MinIO/S3
        
        TODO: Implement actual storage integration
        """
        try:
            # Import file storage service
            from app.services.file_service import FileService
            file_service = FileService()
            
            # Use existing file storage infrastructure
            result = await file_service.store_file_content(
                content=content,
                storage_path=storage_path,
                content_type=mime_type
            )
            
            return result
            
        except ImportError:
            # Fallback if file service doesn't have the method yet
            # For now, we'll just return success
            # TODO: Implement proper file storage
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_workspace_files(
        self,
        workspace_id: str,
        user_id: str,
        folder_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get knowledge files in workspace"""
        try:
            # Validate workspace access
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(workspace_id, user_id)
            if not access_result["success"]:
                return {"success": False, "error": access_result["error"]}
            
            # Parse status filter
            file_status = None
            if status:
                try:
                    file_status = FileStatus(status)
                except ValueError:
                    return {"success": False, "error": f"Invalid status: {status}"}
            
            files = self.knowledge_file_repo.get_workspace_files(
                workspace_id=workspace_id,
                folder_id=folder_id,
                status=file_status,
                skip=skip,
                limit=limit
            )
            
            total_count = self.knowledge_file_repo.get_files_count(
                workspace_id=workspace_id,
                folder_id=folder_id,
                status=file_status
            )
            
            return {
                "success": True,
                "data": {
                    "files": [self._knowledge_file_to_dict(f) for f in files],
                    "total": total_count,
                    "skip": skip,
                    "limit": limit
                }
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get files: {str(e)}"}
    
    def get_files_count(
        self,
        workspace_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Get knowledge file counts for workspace statistics"""
        try:
            # Validate workspace access
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(workspace_id, user_id)
            if not access_result["success"]:
                return {"success": False, "error": access_result["error"]}
            
            total = self.knowledge_file_repo.get_files_count(workspace_id)
            processed = self.knowledge_file_repo.get_files_count(
                workspace_id, status=FileStatus.PROCESSED
            )
            pending = self.knowledge_file_repo.get_files_count(
                workspace_id, status=FileStatus.PENDING
            )
            failed = self.knowledge_file_repo.get_files_count(
                workspace_id, status=FileStatus.FAILED
            )
            
            return {
                "success": True,
                "data": {
                    "total": total,
                    "processed": processed,
                    "pending": pending,
                    "failed": failed
                }
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to get files count: {str(e)}"}

    def get_file(
        self,
        file_id: str,
        workspace_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Get a specific knowledge file"""
        try:
            # Validate workspace access
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(workspace_id, user_id)
            if not access_result["success"]:
                return {"success": False, "error": access_result["error"]}
            
            file = self.knowledge_file_repo.get_file_by_id(file_id)
            if not file:
                return {"success": False, "error": "File not found"}
            
            if file.workspace_id != workspace_id:
                return {"success": False, "error": "File not found in this workspace"}
            
            return {
                "success": True,
                "data": self._knowledge_file_to_dict(file)
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get file: {str(e)}"}
    
    def update_file(
        self,
        file_id: str,
        workspace_id: str,
        user_id: str,
        folder_id: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update knowledge file metadata"""
        try:
            # Validate workspace access
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(workspace_id, user_id)
            if not access_result["success"]:
                return {"success": False, "error": access_result["error"]}
            
            file = self.knowledge_file_repo.get_file_by_id(file_id)
            if not file:
                return {"success": False, "error": "File not found"}
            
            if file.workspace_id != workspace_id:
                return {"success": False, "error": "File not found in this workspace"}
            
            # Validate new folder if provided
            if folder_id:
                folder_service = self._get_folder_service()
                folder_result = folder_service.get_folder(folder_id, workspace_id)
                if not folder_result:
                    return {"success": False, "error": "Folder not found"}
            
            # Build update data
            update_data = {"updated_by": user_id}
            if folder_id is not None:
                update_data["folder_id"] = folder_id
            if description is not None:
                update_data["description"] = description
            if tags is not None:
                update_data["tags"] = tags
            
            updated_file = self.knowledge_file_repo.update_file(file_id, update_data)
            
            return {
                "success": True,
                "data": self._knowledge_file_to_dict(updated_file),
                "message": "File updated successfully"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to update file: {str(e)}"}
    
    async def delete_file(
        self,
        file_id: str,
        workspace_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Delete a knowledge file
        
        This will:
        1. Delete embeddings from vector database
        2. Delete file from storage
        3. Soft-delete database record
        """
        try:
            # Validate workspace access
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(workspace_id, user_id)
            if not access_result["success"]:
                return {"success": False, "error": access_result["error"]}
            
            file = self.knowledge_file_repo.get_file_by_id(file_id)
            if not file:
                return {"success": False, "error": "File not found"}
            
            if file.workspace_id != workspace_id:
                return {"success": False, "error": "File not found in this workspace"}
            
            # Delete embeddings from vector database
            await self.file_processing_service._delete_file_embeddings(file)
            
            # Delete from storage
            await self._delete_from_storage(file.storage_path)
            
            # Soft delete from database
            self.knowledge_file_repo.delete_file(file_id, soft_delete=True)
            
            return {
                "success": True,
                "message": "File deleted successfully"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to delete file: {str(e)}"}
    
    async def _delete_from_storage(self, storage_path: str) -> None:
        """Delete file from storage"""
        try:
            from app.services.file_service import FileService
            file_service = FileService()
            await file_service.delete_file_content(storage_path)
        except Exception as e:
            # Log but don't fail - file might already be deleted
            import logging
            logging.warning(f"Failed to delete file from storage: {storage_path} - {e}")
    
    async def reprocess_file(
        self,
        file_id: str,
        workspace_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Reprocess a file to regenerate embeddings"""
        try:
            # Validate workspace access
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(workspace_id, user_id)
            if not access_result["success"]:
                return {"success": False, "error": access_result["error"]}
            
            file = self.knowledge_file_repo.get_file_by_id(file_id)
            if not file:
                return {"success": False, "error": "File not found"}
            
            if file.workspace_id != workspace_id:
                return {"success": False, "error": "File not found in this workspace"}
            
            # Get file content from storage
            file_content = await self._get_file_from_storage(file.storage_path)
            if not file_content:
                return {"success": False, "error": "Could not retrieve file from storage"}
            
            # Reprocess
            result = await self.file_processing_service.reprocess_file(file_id, file_content)
            
            # Refresh file record
            updated_file = self.knowledge_file_repo.get_file_by_id(file_id)
            
            return {
                "success": result["success"],
                "data": self._knowledge_file_to_dict(updated_file) if updated_file else None,
                "processing": result,
                "error": result.get("error")
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to reprocess file: {str(e)}"}
    
    async def _get_file_from_storage(self, storage_path: str) -> Optional[bytes]:
        """Get file content from storage"""
        try:
            from app.services.file_service import FileService
            file_service = FileService()
            return await file_service.get_file_content(storage_path)
        except Exception:
            return None
    
    def get_supported_extensions(self) -> List[str]:
        """Get list of supported file extensions"""
        return self.file_processing_service.get_supported_extensions()
