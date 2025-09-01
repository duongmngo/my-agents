"""
Note repository for database operations
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.note import Note
from app.repositories.base_repository import BaseRepository


class NoteRepository(BaseRepository[Note]):
    """Repository for note operations"""
    
    def __init__(self, db: Session):
        super().__init__(db, Note)
    
    def get_workspace_notes(
        self, 
        workspace_id: str, 
        folder_id: Optional[str] = None,
        skip: int = 0, 
        limit: int = 20
    ) -> List[Note]:
        """Get notes in workspace, optionally filtered by folder"""
        query = self.db.query(Note).filter(Note.workspace_id == workspace_id)
        
        if folder_id:
            query = query.filter(Note.folder_id == folder_id)
        
        return query.offset(skip).limit(limit).all()
    
    def get_note_by_id(self, note_id: str) -> Optional[Note]:
        """Get note by ID"""
        return self.db.query(Note).filter(Note.id == note_id).first()
    
    def create_note(self, note_data: dict) -> Note:
        """Create a new note"""
        note = Note(**note_data)
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note
    
    def update_note(self, note_id: str, update_data: dict) -> Optional[Note]:
        """Update an existing note"""
        note = self.get_note_by_id(note_id)
        if note:
            for key, value in update_data.items():
                if hasattr(note, key):
                    setattr(note, key, value)
            self.db.commit()
            self.db.refresh(note)
        return note
    
    def delete_note(self, note_id: str) -> bool:
        """Delete a note"""
        note = self.get_note_by_id(note_id)
        if note:
            self.db.delete(note)
            self.db.commit()
            return True
        return False
    
    def get_notes_count(self, workspace_id: str, folder_id: Optional[str] = None) -> int:
        """Get total count of notes in workspace"""
        query = self.db.query(Note).filter(Note.workspace_id == workspace_id)
        
        if folder_id:
            query = query.filter(Note.folder_id == folder_id)
        
        return query.count()
