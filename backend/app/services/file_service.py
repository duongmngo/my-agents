"""
File service for file upload, storage, and management
"""
from typing import Optional, List, Dict, Any, BinaryIO
from sqlalchemy.orm import Session
import hashlib
import mimetypes
import os
from datetime import datetime

from app.repositories.file_repository import FileRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.repositories.folder_repository import FolderRepository
from app.core.config import settings


class FileService:
    """Service for file operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.file_repo = FileRepository(db)
        self.workspace_repo = WorkspaceRepository(db)
        self.folder_repo = FolderRepository(db)
    
    def upload_file(
        self,
        file_data: BinaryIO,
        filename: str,
        workspace_id: str,
        tenant_id: str,
        user_id: str,
        folder_id: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Upload a new file"""
        
        # Check workspace access
        if not self.workspace_repo.user_has_access(workspace_id, user_id):
            return {"success": False, "error": "No access to workspace"}
        
        # Check folder access if provided
        if folder_id:
            folder = self.folder_repo.get_by_id(folder_id, tenant_id)
            if not folder or folder.workspace_id != workspace_id:
                return {"success": False, "error": "Invalid folder"}
        
        # Validate file
        validation_result = self._validate_file(file_data, filename)
        if not validation_result["valid"]:
            return {"success": False, "error": validation_result["error"]}
        
        try:
            # Calculate file hash for deduplication
            file_data.seek(0)
            content_hash = self._calculate_file_hash(file_data)
            file_data.seek(0)
            
            # Check for duplicate
            existing_file = self.file_repo.get_file_by_hash(content_hash, tenant_id)
            if existing_file:
                return {
                    "success": False, 
                    "error": "File already exists",
                    "existing_file_id": existing_file.id
                }
            
            # Generate storage information
            file_size = self._get_file_size(file_data)
            file_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            file_extension = os.path.splitext(filename)[1].lower()
            
            # Generate unique storage key
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            storage_key = f"{tenant_id}/{workspace_id}/{timestamp}_{content_hash[:8]}_{filename}"
            storage_path = f"files/{storage_key}"
            
            # TODO: Upload to actual storage (MinIO/S3)
            # For now, we'll just store the metadata
            
            file_record_data = {
                "name": os.path.splitext(filename)[0],
                "original_name": filename,
                "description": description,
                "file_type": file_type,
                "file_extension": file_extension,
                "file_size": file_size,
                "storage_path": storage_path,
                "storage_bucket": settings.MINIO_BUCKET_NAME,
                "storage_key": storage_key,
                "content_hash": content_hash,
                "processing_status": "completed",
                "workspace_id": workspace_id,
                "folder_id": folder_id,
                "tenant_id": tenant_id,
                "created_by": user_id
            }
            
            file_record = self.file_repo.create(file_record_data)
            
            return {
                "success": True,
                "file": self._file_to_dict(file_record)
            }
            
        except Exception as e:
            return {"success": False, "error": f"File upload failed: {str(e)}"}
    
    def get_file(self, file_id: str, tenant_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get file by ID with access check"""
        file_record = self.file_repo.get_by_id(file_id, tenant_id)
        
        if not file_record:
            return None
        
        # Check workspace access
        if not self.workspace_repo.user_has_access(file_record.workspace_id, user_id):
            return None
        
        return self._file_to_dict(file_record)
    
    def get_workspace_files(
        self,
        workspace_id: str,
        tenant_id: str,
        user_id: str,
        folder_id: Optional[str] = None,
        file_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get files in workspace with optional filtering"""
        
        # Check workspace access
        if not self.workspace_repo.user_has_access(workspace_id, user_id):
            return []
        
        if file_type:
            files = self.file_repo.get_files_by_type(workspace_id, file_type, tenant_id, skip, limit)
        else:
            files = self.file_repo.get_workspace_files(workspace_id, tenant_id, folder_id)
        
        return [self._file_to_dict(file) for file in files]
    
    def search_files(
        self,
        search_term: str,
        workspace_id: str,
        tenant_id: str,
        user_id: str,
        file_types: Optional[List[str]] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Search files in workspace"""
        
        # Check workspace access
        if not self.workspace_repo.user_has_access(workspace_id, user_id):
            return []
        
        files = self.file_repo.search_files(search_term, workspace_id, tenant_id, file_types, skip, limit)
        return [self._file_to_dict(file) for file in files]
    
    def update_file(
        self,
        file_id: str,
        update_data: Dict[str, Any],
        tenant_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Update file metadata"""
        
        file_record = self.file_repo.get_by_id(file_id, tenant_id)
        if not file_record:
            return {"success": False, "error": "File not found"}
        
        # Check workspace access
        if not self.workspace_repo.user_has_access(file_record.workspace_id, user_id):
            return {"success": False, "error": "No access to workspace"}
        
        # Safe fields that can be updated
        safe_fields = {
            "name", "description", "tags", "is_pinned"
        }
        
        filtered_data = {k: v for k, v in update_data.items() if k in safe_fields}
        
        if not filtered_data:
            return {"success": False, "error": "No valid fields to update"}
        
        try:
            file_record = self.file_repo.update(file_id, filtered_data, tenant_id)
            if file_record:
                return {
                    "success": True,
                    "file": self._file_to_dict(file_record)
                }
            else:
                return {"success": False, "error": "Update failed"}
        except Exception as e:
            return {"success": False, "error": f"Update failed: {str(e)}"}
    
    def move_file(
        self,
        file_id: str,
        new_folder_id: Optional[str],
        tenant_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Move file to different folder"""
        
        file_record = self.file_repo.get_by_id(file_id, tenant_id)
        if not file_record:
            return {"success": False, "error": "File not found"}
        
        # Check workspace access
        if not self.workspace_repo.user_has_access(file_record.workspace_id, user_id):
            return {"success": False, "error": "No access to workspace"}
        
        # Check target folder if provided
        if new_folder_id:
            folder = self.folder_repo.get_by_id(new_folder_id, tenant_id)
            if not folder or folder.workspace_id != file_record.workspace_id:
                return {"success": False, "error": "Invalid target folder"}
        
        try:
            success = self.file_repo.move_file(file_id, new_folder_id, tenant_id)
            if success:
                return {"success": True, "message": "File moved successfully"}
            else:
                return {"success": False, "error": "Move failed"}
        except Exception as e:
            return {"success": False, "error": f"Move failed: {str(e)}"}
    
    def delete_file(self, file_id: str, tenant_id: str, user_id: str) -> Dict[str, Any]:
        """Delete file (soft delete)"""
        
        file_record = self.file_repo.get_by_id(file_id, tenant_id)
        if not file_record:
            return {"success": False, "error": "File not found"}
        
        # Check workspace access
        if not self.workspace_repo.user_has_access(file_record.workspace_id, user_id):
            return {"success": False, "error": "No access to workspace"}
        
        try:
            success = self.file_repo.delete(file_id, tenant_id)
            if success:
                # TODO: Remove from actual storage
                return {"success": True, "message": "File deleted successfully"}
            else:
                return {"success": False, "error": "Deletion failed"}
        except Exception as e:
            return {"success": False, "error": f"Deletion failed: {str(e)}"}
    
    def get_file_versions(self, file_id: str, tenant_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Get all versions of a file"""
        
        file_record = self.file_repo.get_by_id(file_id, tenant_id)
        if not file_record:
            return []
        
        # Check workspace access
        if not self.workspace_repo.user_has_access(file_record.workspace_id, user_id):
            return []
        
        versions = self.file_repo.get_file_versions(file_id, tenant_id)
        return [self._file_to_dict(version) for version in versions]
    
    def toggle_pin(self, file_id: str, tenant_id: str, user_id: str) -> Dict[str, Any]:
        """Toggle pin status of file"""
        
        file_record = self.file_repo.get_by_id(file_id, tenant_id)
        if not file_record:
            return {"success": False, "error": "File not found"}
        
        # Check workspace access
        if not self.workspace_repo.user_has_access(file_record.workspace_id, user_id):
            return {"success": False, "error": "No access to workspace"}
        
        try:
            success = self.file_repo.toggle_pin(file_id, tenant_id)
            if success:
                return {"success": True, "message": "Pin status updated"}
            else:
                return {"success": False, "error": "Update failed"}
        except Exception as e:
            return {"success": False, "error": f"Update failed: {str(e)}"}
    
    def get_storage_stats(self, workspace_id: str, tenant_id: str, user_id: str) -> Dict[str, Any]:
        """Get storage statistics for workspace"""
        
        # Check workspace access
        if not self.workspace_repo.user_has_access(workspace_id, user_id):
            return {"success": False, "error": "No access to workspace"}
        
        try:
            stats = self.file_repo.get_storage_stats(workspace_id, tenant_id)
            extension_stats = self.file_repo.get_files_by_extension(workspace_id, tenant_id)
            
            return {
                "success": True,
                "stats": {
                    **stats,
                    "extensions": extension_stats
                }
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to get stats: {str(e)}"}
    
    def _validate_file(self, file_data: BinaryIO, filename: str) -> Dict[str, Any]:
        """Validate file before upload"""
        
        # Check file size
        file_size = self._get_file_size(file_data)
        if file_size > settings.MAX_FILE_SIZE:
            return {
                "valid": False,
                "error": f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE} bytes"
            }
        
        # Check file extension
        file_extension = os.path.splitext(filename)[1].lower()
        if file_extension not in settings.ALLOWED_FILE_TYPES:
            return {
                "valid": False,
                "error": f"File type {file_extension} is not allowed"
            }
        
        return {"valid": True}
    
    def _get_file_size(self, file_data: BinaryIO) -> int:
        """Get file size in bytes"""
        current_pos = file_data.tell()
        file_data.seek(0, 2)  # Seek to end
        size = file_data.tell()
        file_data.seek(current_pos)  # Return to original position
        return size
    
    def _calculate_file_hash(self, file_data: BinaryIO) -> str:
        """Calculate SHA-256 hash of file content"""
        hash_sha256 = hashlib.sha256()
        for chunk in iter(lambda: file_data.read(4096), b""):
            hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def _file_to_dict(self, file_record) -> Dict[str, Any]:
        """Convert file model to dictionary"""
        return {
            "id": file_record.id,
            "name": file_record.name,
            "original_name": file_record.original_name,
            "description": file_record.description,
            "file_type": file_record.file_type,
            "file_extension": file_record.file_extension,
            "file_size": file_record.file_size,
            "size_human_readable": file_record.size_human_readable,
            "is_image": file_record.is_image,
            "is_document": file_record.is_document,
            "processing_status": file_record.processing_status,
            "is_public": file_record.is_public,
            "is_pinned": file_record.is_pinned,
            "is_archived": file_record.is_archived,
            "version": file_record.version,
            "parent_file_id": file_record.parent_file_id,
            "workspace_id": file_record.workspace_id,
            "folder_id": file_record.folder_id,
            "created_at": file_record.created_at,
            "updated_at": file_record.updated_at,
            "created_by": file_record.created_by
        }
