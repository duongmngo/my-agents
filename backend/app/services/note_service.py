"""
Note service for business logic operations
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import uuid

from app.repositories.note_repository import NoteRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.models.note import Note, NoteFormat


class NoteService:
    """Service for note operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.note_repo = NoteRepository(db)
        self.folder_repo = FolderRepository(db)
        self.workspace_repo = WorkspaceRepository(db)
    
    def create_note(
        self,
        title: str,
        content: str,
        workspace_id: str,
        created_by: str,
        folder_id: Optional[str] = None,
        format: NoteFormat = NoteFormat.MARKDOWN
    ) -> Dict[str, Any]:
        """Create a new note"""
        
        # Validate workspace exists and user has access
        workspace = self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            return {"success": False, "error": "Workspace not found"}
        
        # Validate folder if provided
        if folder_id:
            folder = self.folder_repo.get_by_id(folder_id)
            if not folder:
                return {"success": False, "error": "Folder not found"}
            if folder.workspace_id != workspace_id:
                return {"success": False, "error": "Folder does not belong to workspace"}
        
        # Create note data
        note_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "content": content,
            "workspace_id": workspace_id,
            "folder_id": folder_id,
            "created_by": created_by,
            "format": format,
            "is_pinned": False,
            "is_archived": False,
            "is_public": False,
            "is_published": False,
            "is_template": False
        }
        
        try:
            # Create note
            note = self.note_repo.create_note(note_data)
            
            # Update counts and generate excerpt
            note.update_counts()
            note.generate_excerpt()
            
            # Commit changes
            self.db.commit()
            self.db.refresh(note)
            
            return {
                "success": True,
                "note": self._note_to_dict(note)
            }
        except Exception as e:
            self.db.rollback()
            return {"success": False, "error": f"Failed to create note: {str(e)}"}
    
    def get_workspace_notes(
        self,
        workspace_id: str,
        user_id: str,
        folder_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get notes in workspace"""
        
        # Check if user has access to workspace
        if not self.workspace_repo.user_has_access(workspace_id, user_id):
            return {"success": False, "error": "No access to workspace"}
        
        try:
            notes = self.note_repo.get_workspace_notes(
                workspace_id=workspace_id,
                folder_id=folder_id,
                skip=skip,
                limit=limit
            )
            
            total = self.note_repo.get_notes_count(workspace_id, folder_id)
            
            return {
                "success": True,
                "notes": [self._note_to_dict(note) for note in notes],
                "total": total,
                "skip": skip,
                "limit": limit
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to get notes: {str(e)}"}
    
    def get_note(self, note_id: str, user_id: str) -> Dict[str, Any]:
        """Get note by ID"""
        
        note = self.note_repo.get_note_by_id(note_id)
        if not note:
            return {"success": False, "error": "Note not found"}
        
        # Check if user has access to workspace
        if not self.workspace_repo.user_has_access(note.workspace_id, user_id):
            return {"success": False, "error": "No access to note"}
        
        return {
            "success": True,
            "note": self._note_to_dict(note)
        }
    
    def update_note(
        self,
        note_id: str,
        update_data: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """Update note"""
        
        note = self.note_repo.get_note_by_id(note_id)
        if not note:
            return {"success": False, "error": "Note not found"}
        
        # Check if user has access to workspace
        if not self.workspace_repo.user_has_access(note.workspace_id, user_id):
            return {"success": False, "error": "No access to note"}
        
        # Check if user is note creator or has admin/owner role
        user_role = self.workspace_repo.get_user_role_in_workspace(note.workspace_id, user_id)
        if note.created_by != user_id and user_role not in ["admin", "owner"]:
            return {"success": False, "error": "Insufficient permissions to update note"}
        
        # Validate folder if changing
        if "folder_id" in update_data and update_data["folder_id"]:
            folder = self.folder_repo.get_by_id(update_data["folder_id"])
            if not folder or folder.workspace_id != note.workspace_id:
                return {"success": False, "error": "Invalid folder"}
        
        try:
            # Update note
            updated_note = self.note_repo.update_note(note_id, update_data)
            
            if updated_note:
                # Update counts and excerpt if content changed
                if "content" in update_data:
                    updated_note.update_counts()
                    updated_note.generate_excerpt()
                
                self.db.commit()
                self.db.refresh(updated_note)
                
                return {
                    "success": True,
                    "note": self._note_to_dict(updated_note)
                }
            else:
                return {"success": False, "error": "Failed to update note"}
        except Exception as e:
            self.db.rollback()
            return {"success": False, "error": f"Failed to update note: {str(e)}"}
    
    def delete_note(self, note_id: str, user_id: str) -> Dict[str, Any]:
        """Delete note"""
        
        note = self.note_repo.get_note_by_id(note_id)
        if not note:
            return {"success": False, "error": "Note not found"}
        
        # Check if user has access to workspace
        if not self.workspace_repo.user_has_access(note.workspace_id, user_id):
            return {"success": False, "error": "No access to note"}
        
        # Check if user is note creator or has admin/owner role
        user_role = self.workspace_repo.get_user_role_in_workspace(note.workspace_id, user_id)
        if note.created_by != user_id and user_role not in ["admin", "owner"]:
            return {"success": False, "error": "Insufficient permissions to delete note"}
        
        try:
            success = self.note_repo.delete_note(note_id)
            if success:
                return {
                    "success": True,
                    "message": "Note deleted successfully"
                }
            else:
                return {"success": False, "error": "Failed to delete note"}
        except Exception as e:
            return {"success": False, "error": f"Failed to delete note: {str(e)}"}
    
    def _note_to_dict(self, note: Note) -> Dict[str, Any]:
        """Convert note model to dictionary"""
        return {
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "excerpt": note.excerpt,
            "format": note.format.value if note.format else "markdown",
            "word_count": note.word_count,
            "character_count": note.character_count,
            "is_pinned": note.is_pinned,
            "is_archived": note.is_archived,
            "is_public": note.is_public,
            "is_published": note.is_published,
            "is_template": note.is_template,
            "workspace_id": note.workspace_id,
            "folder_id": note.folder_id,
            "created_by": note.created_by,
            "created_at": note.created_at,
            "updated_at": note.updated_at
        }
