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
    
    def get_user_membership(self, user_id: str) -> Optional[WorkspaceMember]:
        """Get user's workspace membership"""
        if self.db:
            return self.db.query(WorkspaceMember).filter(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.is_deleted == False
            ).first()
        else:
            with self._get_db() as db:
                return db.query(WorkspaceMember).filter(
                    WorkspaceMember.user_id == user_id,
                    WorkspaceMember.is_deleted == False
                ).first()
    
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
    
    def get_user_workspaces(self, user_id: str, include_archived: bool = False) -> List[Workspace]:
        """Get all workspaces a user has access to"""
        with self._get_db() as db:
            query = db.query(Workspace).join(WorkspaceMember).filter(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.is_active == True,
                Workspace.is_deleted == False
            )
            
            if not include_archived:
                query = query.filter(Workspace.is_archived == False)
            
            return query.all()
    
    def get_workspace_with_members(self, workspace_id: str) -> Optional[Workspace]:
        """Get workspace with its members loaded"""
        with self._get_db() as db:
            return db.query(Workspace).options(
                joinedload(Workspace.members).joinedload(WorkspaceMember.user)
            ).filter(
                Workspace.id == workspace_id,
                Workspace.is_deleted == False
            ).first()
    
    def user_has_access(self, workspace_id: str, user_id: str) -> bool:
        """Check if user has access to workspace"""
        with self._get_db() as db:
            return db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.is_active == True
            ).first() is not None
    
    def get_user_role_in_workspace(self, workspace_id: str, user_id: str) -> Optional[str]:
        """Get user's role in a workspace"""
        with self._get_db() as db:
            member = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.is_active == True
            ).first()
            
            return member.role if member else None
    
    def add_member(self, workspace_id: str, user_id: str, role: str = "member") -> Optional[WorkspaceMember]:
        """Add a member to workspace"""
        with self._get_db() as db:
            # Check if already a member
            existing = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id
            ).first()
            
            if existing:
                if not existing.is_active:
                    existing.is_active = True
                    existing.role = role
                    db.commit()
                    return existing
                return existing
            
            # Create new membership
            member = WorkspaceMember(
                workspace_id=workspace_id,
                user_id=user_id,
                role=role
            )
            db.add(member)
            db.commit()
            db.refresh(member)
            return member
    
    def remove_member(self, workspace_id: str, user_id: str) -> bool:
        """Remove a member from workspace"""
        with self._get_db() as db:
            member = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id
            ).first()
            
            if member:
                member.is_active = False
                db.commit()
                return True
            return False
    
    def update_member_role(self, workspace_id: str, user_id: str, role: str) -> bool:
        """Update member role in workspace"""
        with self._get_db() as db:
            member = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.is_active == True
            ).first()
            
            if member:
                member.role = role
                db.commit()
                return True
            return False
    
    def get_workspace_members(self, workspace_id: str) -> List[WorkspaceMember]:
        """Get all active members of a workspace"""
        with self._get_db() as db:
            return db.query(WorkspaceMember).options(
                joinedload(WorkspaceMember.user)
            ).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.is_active == True
            ).all()
    
    def get_workspace_member(self, workspace_id: str, user_id: str) -> Optional[WorkspaceMember]:
        """Get a specific workspace member"""
        with self._get_db() as db:
            return db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id
            ).first()
    
    def count_workspace_owners(self, workspace_id: str) -> int:
        """Count the number of owners in a workspace"""
        with self._get_db() as db:
            return db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.role == "owner",
                WorkspaceMember.is_active == True
            ).count()
    
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
                db.commit()
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
                db.commit()
                return True
            return False
