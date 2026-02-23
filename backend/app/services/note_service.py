"""
Note service for business logic operations
"""
from typing import Dict, Any, List, Optional
import uuid
import asyncio

from app.repositories.note_repository import NoteRepository
from app.models.note import Note, NoteFormat
from app.ai.embeddings.vector_db.vector_db_service import VectorDatabaseService


class NoteService:
    """Service for note operations"""
    
    def __init__(self):
        self.note_repo = NoteRepository()
        # Other services will be injected as needed
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
        
        try:
            # Validate workspace exists and user has access
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(workspace_id, created_by)
            if not access_result["success"]:
                return {"success": False, "error": access_result["error"]}
            
            # Validate folder if provided
            if folder_id:
                folder_service = self._get_folder_service()
                folder_result = folder_service.get_folder(folder_id, workspace_id)
                if not folder_result:
                    return {"success": False, "error": "Folder not found"}
            
            # Create note data
            note_data = {
                "id": str(uuid.uuid4()),
                "title": title,
                "content": content,
                "workspace_id": workspace_id,
                "folder_id": folder_id,
                "created_by": created_by,
                "format": format.value if isinstance(format, NoteFormat) else format,
                "is_pinned": False,
                "is_archived": False,
                "is_public": False,
                "is_published": False,
                "is_template": False
            }
            
            # Create note
            note = self.note_repo.create_note(note_data)
            
            # Update counts and generate excerpt
            note.update_counts()
            note.generate_excerpt()
            
            return {
                "success": True,
                "data": self._note_to_dict(note),
                "message": "Note created successfully"
            }
        except Exception as e:
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
        
        try:
            # Check if user has access to workspace
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(workspace_id, user_id)
            if not access_result["success"]:
                return {"success": False, "error": "No access to workspace"}
            
            notes = self.note_repo.get_workspace_notes(
                workspace_id=workspace_id,
                folder_id=folder_id,
                skip=skip,
                limit=limit
            )
            
            total = self.note_repo.get_notes_count(workspace_id, folder_id)
            
            return {
                "success": True,
                "data": {
                    "notes": [self._note_to_dict(note) for note in notes],
                    "total": total,
                    "skip": skip,
                    "limit": limit
                }
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to get notes: {str(e)}"}
    
    def get_note(self, note_id: str, user_id: str) -> Dict[str, Any]:
        """Get note by ID"""
        
        try:
            note = self.note_repo.get_note_by_id(note_id)
            if not note:
                return {"success": False, "error": "Note not found"}
            
            # Check if user has access to workspace
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(note.workspace_id, user_id)
            if not access_result["success"]:
                return {"success": False, "error": "No access to note"}
            
            return {
                "success": True,
                "data": self._note_to_dict(note)
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to get note: {str(e)}"}
    
    def update_note(
        self,
        note_id: str,
        update_data: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """Update note"""
        
        try:
            note = self.note_repo.get_note_by_id(note_id)
            if not note:
                return {"success": False, "error": "Note not found"}
            
            # Check if user has access to workspace
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(note.workspace_id, user_id)
            if not access_result["success"]:
                return {"success": False, "error": "No access to note"}
            
            # Check if user is note creator or has admin/owner role
            user_role = access_result["data"]["user_role"]
            if note.created_by != user_id and user_role not in ["admin", "owner"]:
                return {"success": False, "error": "Insufficient permissions to update note"}
            
            # Validate folder if changing
            if "folder_id" in update_data and update_data["folder_id"]:
                folder_service = self._get_folder_service()
                folder_result = folder_service.get_folder(update_data["folder_id"], note.workspace_id)
                if not folder_result:
                    return {"success": False, "error": "Invalid folder"}
            
            # Update note
            updated_note = self.note_repo.update_note(note_id, update_data)
            
            if updated_note:
                # Update counts and excerpt if content changed
                if "content" in update_data:
                    updated_note.update_counts()
                    updated_note.generate_excerpt()
                
                return {
                    "success": True,
                    "data": self._note_to_dict(updated_note),
                    "message": "Note updated successfully"
                }
            else:
                return {"success": False, "error": "Failed to update note"}
        except Exception as e:
            return {"success": False, "error": f"Failed to update note: {str(e)}"}
    
    def delete_note(self, note_id: str, user_id: str) -> Dict[str, Any]:
        """Delete note"""
        
        try:
            note = self.note_repo.get_note_by_id(note_id)
            if not note:
                return {"success": False, "error": "Note not found"}
            
            # Check if user has access to workspace
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(note.workspace_id, user_id)
            if not access_result["success"]:
                return {"success": False, "error": "No access to note"}
            
            # Check if user is note creator or has admin/owner role
            user_role = access_result["data"]["user_role"]
            if note.created_by != user_id and user_role not in ["admin", "owner"]:
                return {"success": False, "error": "Insufficient permissions to delete note"}
            
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
    
    def generate_note_embedding(
        self,
        note_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Generate embedding for a note"""
        
        try:
            # Get the note
            note = self.note_repo.get_note_by_id(note_id)
            if not note:
                return {"success": False, "error": "Note not found"}
            
            # Check if user has access to workspace
            workspace_service = self._get_workspace_service()
            access_result = workspace_service.check_user_access(note.workspace_id, user_id)
            if not access_result["success"]:
                return {"success": False, "error": "No access to note"}
            
            # Check if note has content
            if not note.content or not note.content.strip():
                return {"success": False, "error": "Note has no content to embed"}
            
            # Use asyncio.run to handle async operations in sync context
            result = asyncio.run(self._generate_embedding_async(note))
            
            # Note: Embedding stats are now updated by the embedding service
            # No need to update them here to avoid duplication
            
            return result
            
        except Exception as e:
            return {"success": False, "error": f"Failed to generate embedding: {str(e)}"}
    
    async def _generate_embedding_async(self, note) -> Dict[str, Any]:
        """Async helper method for generating embeddings and storing in vector database"""
        from app.services.embedding_service import EmbeddingProviderConfigService
        
        # Use EmbeddingProviderConfigService for all vector operations
        embedding_service = EmbeddingProviderConfigService()
        
        # Prepare note metadata
        note_metadata = {
            "note_title": note.title,
            "note_format": note.format.value,
            "word_count": note.word_count,
            "character_count": note.character_count,
            "is_pinned": note.is_pinned,
            "is_archived": note.is_archived,
            "folder_id": note.folder_id,
            "created_at": note.created_at.isoformat() if note.created_at else None,
            "updated_at": note.updated_at.isoformat() if note.updated_at else None
        }
        
        # Use the generic vector operation method
        result = await embedding_service.generate_and_store_vector(
            content=note.content,
            workspace_id=note.workspace_id,
            created_by=note.created_by,
            source_type="note",
            source_id=note.id,
            metadata=note_metadata
        )
        
        if not result["success"]:
            return {
                "success": False, 
                "error": result["error"],
                "error_code": result.get("error_code", "UNKNOWN_ERROR")
            }
        
        return {
            "success": True,
            "note_id": note.id,
            "dimension": result["data"]["dimension"],
            "model": result["data"]["model"],
            "provider": result["data"]["provider"],
            "latency_ms": result["data"]["latency_ms"],
            "tokens_processed": result["data"]["tokens_processed"],
            "message": "Note embedded successfully and stored in vector database"
        }
    
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
            "updated_at": note.updated_at,
            # Embedding statistics (from JSON field) - convert snake_case to camelCase
            "embedding_stats": self._convert_embedding_stats(note.embedding_stats) if note.embedding_stats else None
        }
    
    def _convert_embedding_stats(self, embedding_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Convert embedding stats from snake_case to camelCase for API response"""
        if not embedding_stats:
            return None
        
        converted = {
            "generated": embedding_stats.get("generated", False),
            "dimension": embedding_stats.get("dimension"),
            "model": embedding_stats.get("model"),
            "provider": embedding_stats.get("provider"),
            "latency_ms": embedding_stats.get("latency_ms"),
            "tokens_processed": embedding_stats.get("tokens_processed"),
            "generated_at": embedding_stats.get("generated_at"),
            "cost_estimate": embedding_stats.get("cost_estimate")
        }
        
        # Remove None values
        return {k: v for k, v in converted.items() if v is not None}
