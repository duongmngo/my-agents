"""
Note repository for database operations
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import SessionLocal
from app.models.note import Note
from app.repositories.base_repository import BaseRepository


class NoteRepository(BaseRepository[Note]):
    """Repository for note operations"""
    
    def __init__(self):
        super().__init__(Note)
    
    def get_workspace_notes(
        self, 
        workspace_id: str, 
        folder_id: Optional[str] = None,
        skip: int = 0, 
        limit: int = 20
    ) -> List[Note]:
        """Get notes in workspace, optionally filtered by folder"""
        with self._get_db() as db:
            query = db.query(Note).filter(Note.workspace_id == workspace_id)
            
            if folder_id:
                query = query.filter(Note.folder_id == folder_id)
            
            return query.offset(skip).limit(limit).all()
    
    def get_note_by_id(self, note_id: str) -> Optional[Note]:
        """Get note by ID"""
        with self._get_db() as db:
            return db.query(Note).filter(Note.id == note_id).first()
    
    def create_note(self, note_data: dict) -> Note:
        """Create a new note"""
        db = self.db if self.db else SessionLocal()
        try:
            note = Note(**note_data)
            db.add(note)
            db.commit()
            db.refresh(note)
            
            # Eagerly load all attributes to prevent DetachedInstanceError
            _ = note.id
            _ = note.title
            _ = note.content
            _ = note.workspace_id
            _ = note.folder_id
            _ = note.created_by
            
            # Expunge from session to prevent DetachedInstanceError
            db.expunge(note)
            
            return note
        except Exception:
            db.rollback()
            raise
        finally:
            if not self.db:
                db.close()
    
    def update_note(self, note_id: str, update_data: dict) -> Optional[Note]:
        """Update an existing note"""
        with self._get_db() as db:
            note = db.query(Note).filter(Note.id == note_id).first()
            if note:
                for key, value in update_data.items():
                    if hasattr(note, key):
                        setattr(note, key, value)
                db.commit()
                db.refresh(note)
            return note
    
    def delete_note(self, note_id: str) -> bool:
        """Delete a note"""
        with self._get_db() as db:
            note = db.query(Note).filter(Note.id == note_id).first()
            if note:
                db.delete(note)
                db.commit()
                return True
            return False
    
    def get_notes_count(self, workspace_id: str, folder_id: Optional[str] = None) -> int:
        """Get total count of notes in workspace"""
        with self._get_db() as db:
            query = db.query(Note).filter(Note.workspace_id == workspace_id)
            
            if folder_id:
                query = query.filter(Note.folder_id == folder_id)
            
            return query.count()

    def get_embedded_notes_count(self, workspace_id: str) -> int:
        """Get count of notes with embeddings in workspace"""
        with self._get_db() as db:
            return db.query(Note).filter(
                Note.workspace_id == workspace_id,
                Note.embedding_stats.isnot(None), # type: ignore
                Note.embedding_stats["generated"].as_boolean() == True
            ).count()
