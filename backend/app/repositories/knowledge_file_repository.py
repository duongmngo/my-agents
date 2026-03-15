"""
KnowledgeFile repository for database operations
"""
from typing import List, Optional
from app.core.database import SessionLocal
from app.models.knowledge_file import KnowledgeFile, FileStatus
from app.repositories.base_repository import BaseRepository


class KnowledgeFileRepository(BaseRepository[KnowledgeFile]):
    """Repository for knowledge file operations"""
    
    def __init__(self):
        super().__init__(KnowledgeFile)
    
    def get_workspace_files(
        self, 
        workspace_id: str, 
        folder_id: Optional[str] = None,
        status: Optional[FileStatus] = None,
        skip: int = 0, 
        limit: int = 20
    ) -> List[KnowledgeFile]:
        """Get knowledge files in workspace, optionally filtered by folder and status"""
        with self._get_db() as db:
            query = db.query(KnowledgeFile).filter(
                KnowledgeFile.workspace_id == workspace_id,
                KnowledgeFile.is_deleted == False
            )
            
            if folder_id:
                query = query.filter(KnowledgeFile.folder_id == folder_id)
            
            if status:
                query = query.filter(KnowledgeFile.status == status)
            
            return query.order_by(KnowledgeFile.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_file_by_id(self, file_id: str) -> Optional[KnowledgeFile]:
        """Get knowledge file by ID"""
        with self._get_db() as db:
            return db.query(KnowledgeFile).filter(
                KnowledgeFile.id == file_id,
                KnowledgeFile.is_deleted == False
            ).first()
    
    def get_file_by_hash(self, workspace_id: str, content_hash: str) -> Optional[KnowledgeFile]:
        """Get knowledge file by content hash for deduplication"""
        with self._get_db() as db:
            return db.query(KnowledgeFile).filter(
                KnowledgeFile.workspace_id == workspace_id,
                KnowledgeFile.content_hash == content_hash,
                KnowledgeFile.is_deleted == False
            ).first()
    
    def create_file(self, file_data: dict) -> KnowledgeFile:
        """Create a new knowledge file"""
        db = self.db if self.db else SessionLocal()
        try:
            knowledge_file = KnowledgeFile(**file_data)
            db.add(knowledge_file)
            db.commit()
            db.refresh(knowledge_file)
            
            # Eagerly load all attributes to prevent DetachedInstanceError
            _ = knowledge_file.id
            _ = knowledge_file.filename
            _ = knowledge_file.original_filename
            _ = knowledge_file.status
            _ = knowledge_file.workspace_id
            _ = knowledge_file.folder_id
            _ = knowledge_file.created_by
            
            # Expunge from session to prevent DetachedInstanceError
            db.expunge(knowledge_file)
            
            return knowledge_file
        except Exception:
            db.rollback()
            raise
        finally:
            if not self.db:
                db.close()
    
    def update_file(self, file_id: str, update_data: dict) -> Optional[KnowledgeFile]:
        """Update an existing knowledge file"""
        with self._get_db() as db:
            knowledge_file = db.query(KnowledgeFile).filter(
                KnowledgeFile.id == file_id
            ).first()
            if knowledge_file:
                for key, value in update_data.items():
                    if hasattr(knowledge_file, key):
                        setattr(knowledge_file, key, value)
                db.commit()
                db.refresh(knowledge_file)
            return knowledge_file
    
    def update_status(
        self, 
        file_id: str, 
        status: FileStatus, 
        error_message: Optional[str] = None
    ) -> Optional[KnowledgeFile]:
        """Update file processing status"""
        update_data = {"status": status}
        if error_message:
            update_data["error_message"] = error_message
        return self.update_file(file_id, update_data)
    
    def update_extracted_content(
        self, 
        file_id: str, 
        extracted_text: str,
        page_count: Optional[int] = None
    ) -> Optional[KnowledgeFile]:
        """Update extracted text content and counts"""
        update_data = {
            "extracted_text": extracted_text,
            "character_count": len(extracted_text),
            "word_count": len(extracted_text.split())
        }
        if page_count is not None:
            update_data["page_count"] = page_count
        return self.update_file(file_id, update_data)
    
    def update_embedding_stats(self, file_id: str, embedding_stats: dict) -> Optional[KnowledgeFile]:
        """Update embedding statistics"""
        return self.update_file(file_id, {"embedding_stats": embedding_stats})
    
    def delete_file(self, file_id: str, soft_delete: bool = True) -> bool:
        """Delete a knowledge file (soft or hard delete)"""
        with self._get_db() as db:
            knowledge_file = db.query(KnowledgeFile).filter(
                KnowledgeFile.id == file_id
            ).first()
            if knowledge_file:
                if soft_delete:
                    knowledge_file.is_deleted = True
                    db.commit()
                else:
                    db.delete(knowledge_file)
                    db.commit()
                return True
            return False
    
    def get_files_count(
        self, 
        workspace_id: str, 
        folder_id: Optional[str] = None,
        status: Optional[FileStatus] = None
    ) -> int:
        """Get total count of knowledge files in workspace"""
        with self._get_db() as db:
            query = db.query(KnowledgeFile).filter(
                KnowledgeFile.workspace_id == workspace_id,
                KnowledgeFile.is_deleted == False
            )
            
            if folder_id:
                query = query.filter(KnowledgeFile.folder_id == folder_id)
            
            if status:
                query = query.filter(KnowledgeFile.status == status)
            
            return query.count()
    
    def get_pending_files(self, limit: int = 10) -> List[KnowledgeFile]:
        """Get files pending processing"""
        with self._get_db() as db:
            return db.query(KnowledgeFile).filter(
                KnowledgeFile.status == FileStatus.PENDING,
                KnowledgeFile.is_deleted == False
            ).order_by(KnowledgeFile.created_at.asc()).limit(limit).all()
    
    def get_files_for_embedding(self, workspace_id: str) -> List[KnowledgeFile]:
        """Get all processed files with extracted text for RAG"""
        with self._get_db() as db:
            return db.query(KnowledgeFile).filter(
                KnowledgeFile.workspace_id == workspace_id,
                KnowledgeFile.status == FileStatus.PROCESSED,
                KnowledgeFile.extracted_text.isnot(None),
                KnowledgeFile.is_deleted == False
            ).all()
