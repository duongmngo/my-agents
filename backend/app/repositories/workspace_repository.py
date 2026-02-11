"""
Workspace repository for workspace-specific database operations
"""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.models.workspace import Workspace, WorkspaceMember
from app.repositories.base_repository import BaseRepository


class WorkspaceRepository(BaseRepository[Workspace]):
    """Repository for Workspace model operations"""
    
    def __init__(self, db: Session = None):
        super().__init__(Workspace)
        self.db = db
    
    def get_by_slug(self, slug: str, user_id: str) -> Optional[Workspace]:
        """Get workspace by slug for a user"""
        with self._get_db() as db:
            return db.query(Workspace).filter(
                Workspace.slug == slug,
                Workspace.created_by == user_id,
                Workspace.is_deleted == False
            ).first()
    
    def slug_exists(self, slug: str, user_id: str, exclude_workspace_id: Optional[str] = None) -> bool:
        """Check if workspace slug already exists for a user"""
        with self._get_db() as db:
            query = db.query(Workspace.id).filter(
                Workspace.slug == slug,
                Workspace.created_by == user_id,
                Workspace.is_deleted == False
            )
            
            if exclude_workspace_id:
                query = query.filter(Workspace.id != exclude_workspace_id)
            
            return query.first() is not None
    
    def get_workspace_with_members(self, workspace_id: str) -> Optional[Workspace]:
        """Get workspace with its members loaded"""
        with self._get_db() as db:
            return db.query(Workspace).options(
                joinedload(Workspace.members).joinedload(WorkspaceMember.user)
            ).filter(
                Workspace.id == workspace_id,
                Workspace.is_deleted == False
            ).first()
    
    def search_workspaces(self, search_term: str, user_id: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Workspace]:
        """Search workspaces by name or description"""
        with self._get_db() as db:
            query = db.query(Workspace).filter(
                Workspace.is_deleted == False
            )
            
            # If user_id provided, only search workspaces user has access to
            if user_id:
                query = query.join(WorkspaceMember).filter(
                    WorkspaceMember.user_id == user_id,
                    WorkspaceMember.is_active == True
                )
            
            # Apply search filter
            search_filter = Workspace.name.ilike(f"%{search_term}%") | Workspace.description.ilike(f"%{search_term}%")
            query = query.filter(search_filter)
            
            return query.offset(skip).limit(limit).all()
    
    def archive_workspace(self, workspace_id: str) -> bool:
        """Archive a workspace"""
        with self._get_db() as db:
            workspace = db.query(Workspace).filter(
                Workspace.id == workspace_id,
                Workspace.is_deleted == False
            ).first()
            if workspace:
                workspace.is_archived = True
                # Context manager will commit on exit
                return True
            return False
    
    def unarchive_workspace(self, workspace_id: str) -> bool:
        """Unarchive a workspace"""
        with self._get_db() as db:
            workspace = db.query(Workspace).filter(
                Workspace.id == workspace_id,
                Workspace.is_deleted == False
            ).first()
            if workspace:
                workspace.is_archived = False
                # Context manager will commit on exit
                return True
            return False
