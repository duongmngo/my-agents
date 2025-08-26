"""
File repository for file-specific database operations
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func

from app.models.file import File
from app.repositories.base_repository import BaseRepository


class FileRepository(BaseRepository[File]):
    """Repository for File model operations"""
    
    def __init__(self, db: Session):
        super().__init__(db, File)
    
    def get_workspace_files(self, workspace_id: str, tenant_id: str, folder_id: Optional[str] = None) -> List[File]:
        """Get files in a workspace, optionally filtered by folder"""
        query = self.db.query(File).filter(
            File.workspace_id == workspace_id,
            File.tenant_id == tenant_id,
            File.is_deleted == False
        )
        
        if folder_id:
            query = query.filter(File.folder_id == folder_id)
        else:
            query = query.filter(File.folder_id.is_(None))
        
        return query.order_by(desc(File.created_at)).all()
    
    def get_file_by_storage_key(self, storage_key: str, tenant_id: str) -> Optional[File]:
        """Get file by storage key"""
        return self.db.query(File).filter(
            File.storage_key == storage_key,
            File.tenant_id == tenant_id,
            File.is_deleted == False
        ).first()
    
    def get_file_by_hash(self, content_hash: str, tenant_id: str) -> Optional[File]:
        """Get file by content hash (for deduplication)"""
        return self.db.query(File).filter(
            File.content_hash == content_hash,
            File.tenant_id == tenant_id,
            File.is_deleted == False
        ).first()
    
    def get_files_by_type(self, workspace_id: str, file_type: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[File]:
        """Get files filtered by type"""
        return self.db.query(File).filter(
            File.workspace_id == workspace_id,
            File.file_type.like(f"{file_type}%"),
            File.tenant_id == tenant_id,
            File.is_deleted == False
        ).order_by(desc(File.created_at)).offset(skip).limit(limit).all()
    
    def get_recent_files(self, workspace_id: str, tenant_id: str, days: int = 7, limit: int = 50) -> List[File]:
        """Get recently created/modified files"""
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        return self.db.query(File).filter(
            File.workspace_id == workspace_id,
            File.tenant_id == tenant_id,
            File.created_at >= cutoff_date,
            File.is_deleted == False
        ).order_by(desc(File.created_at)).limit(limit).all()
    
    def get_large_files(self, workspace_id: str, tenant_id: str, min_size_bytes: int, skip: int = 0, limit: int = 100) -> List[File]:
        """Get files larger than specified size"""
        return self.db.query(File).filter(
            File.workspace_id == workspace_id,
            File.file_size >= min_size_bytes,
            File.tenant_id == tenant_id,
            File.is_deleted == False
        ).order_by(desc(File.file_size)).offset(skip).limit(limit).all()
    
    def search_files(self, search_term: str, workspace_id: str, tenant_id: str, file_types: Optional[List[str]] = None, skip: int = 0, limit: int = 100) -> List[File]:
        """Search files by name, description, or tags"""
        query = self.db.query(File).filter(
            File.workspace_id == workspace_id,
            File.tenant_id == tenant_id,
            (File.name.ilike(f"%{search_term}%") | 
             File.original_name.ilike(f"%{search_term}%") |
             File.description.ilike(f"%{search_term}%")),
            File.is_deleted == False
        )
        
        if file_types:
            query = query.filter(File.file_type.in_(file_types))
        
        return query.order_by(desc(File.created_at)).offset(skip).limit(limit).all()
    
    def get_file_versions(self, parent_file_id: str, tenant_id: str) -> List[File]:
        """Get all versions of a file"""
        return self.db.query(File).filter(
            File.parent_file_id == parent_file_id,
            File.tenant_id == tenant_id,
            File.is_deleted == False
        ).order_by(desc(File.version)).all()
    
    def get_latest_version(self, parent_file_id: str, tenant_id: str) -> Optional[File]:
        """Get the latest version of a file"""
        return self.db.query(File).filter(
            File.parent_file_id == parent_file_id,
            File.tenant_id == tenant_id,
            File.is_deleted == False
        ).order_by(desc(File.version)).first()
    
    def create_file_version(self, original_file_id: str, file_data: Dict[str, Any], tenant_id: str) -> Optional[File]:
        """Create a new version of an existing file"""
        original_file = self.get_by_id(original_file_id, tenant_id)
        if not original_file:
            return None
        
        # Determine version number
        latest_version = self.get_latest_version(original_file_id, tenant_id)
        new_version = (latest_version.version + 1) if latest_version else 2
        
        # Create new version
        file_data.update({
            "parent_file_id": original_file_id,
            "version": new_version,
            "workspace_id": original_file.workspace_id,
            "folder_id": original_file.folder_id,
            "tenant_id": tenant_id
        })
        
        return self.create(file_data)
    
    def get_storage_stats(self, workspace_id: str, tenant_id: str) -> Dict[str, Any]:
        """Get storage statistics for a workspace"""
        query = self.db.query(
            func.count(File.id).label('total_files'),
            func.sum(File.file_size).label('total_size'),
            func.avg(File.file_size).label('average_size')
        ).filter(
            File.workspace_id == workspace_id,
            File.tenant_id == tenant_id,
            File.is_deleted == False
        )
        
        result = query.first()
        
        return {
            'total_files': result.total_files or 0,
            'total_size': result.total_size or 0,
            'average_size': float(result.average_size) if result.average_size else 0
        }
    
    def get_files_by_extension(self, workspace_id: str, tenant_id: str) -> Dict[str, int]:
        """Get file count grouped by extension"""
        query = self.db.query(
            File.file_extension,
            func.count(File.id).label('count')
        ).filter(
            File.workspace_id == workspace_id,
            File.tenant_id == tenant_id,
            File.is_deleted == False
        ).group_by(File.file_extension)
        
        return {row.file_extension: row.count for row in query.all()}
    
    def move_file(self, file_id: str, new_folder_id: Optional[str], tenant_id: str) -> bool:
        """Move file to a different folder"""
        file = self.get_by_id(file_id, tenant_id)
        if file:
            file.folder_id = new_folder_id
            self.db.commit()
            return True
        return False
    
    def toggle_pin(self, file_id: str, tenant_id: str) -> bool:
        """Toggle pin status of a file"""
        file = self.get_by_id(file_id, tenant_id)
        if file:
            file.is_pinned = not file.is_pinned
            self.db.commit()
            return True
        return False
    
    def get_pinned_files(self, workspace_id: str, tenant_id: str) -> List[File]:
        """Get pinned files in a workspace"""
        return self.db.query(File).filter(
            File.workspace_id == workspace_id,
            File.tenant_id == tenant_id,
            File.is_pinned == True,
            File.is_deleted == False
        ).order_by(desc(File.created_at)).all()
    
    def update_processing_status(self, file_id: str, status: str, error: Optional[str] = None, tenant_id: Optional[str] = None) -> bool:
        """Update file processing status"""
        file = self.get_by_id(file_id, tenant_id)
        if file:
            file.processing_status = status
            if error:
                file.processing_error = error
            self.db.commit()
            return True
        return False
