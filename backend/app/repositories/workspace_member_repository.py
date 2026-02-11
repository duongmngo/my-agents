"""
Workspace Member repository for workspace membership operations
"""
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload

from app.core.database import SessionLocal
from app.models.workspace import WorkspaceMember
from app.repositories.base_repository import BaseRepository


class WorkspaceMemberRepository(BaseRepository[WorkspaceMember]):
    """Repository for WorkspaceMember model operations"""
    
    def __init__(self):
        super().__init__(WorkspaceMember)
    
    def get_by_workspace_and_user(self, workspace_id: str, user_id: str) -> Optional[WorkspaceMember]:
        """Get a specific workspace member"""
        with self._get_db() as db:
            return db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id
            ).first()
    
    def get_active_member(self, workspace_id: str, user_id: str) -> Optional[WorkspaceMember]:
        """Get an active workspace member"""
        with self._get_db() as db:
            return db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.is_active == True
            ).first()
    
    def get_workspace_members(self, workspace_id: str, include_inactive: bool = False) -> List[WorkspaceMember]:
        """Get all members of a workspace"""
        with self._get_db() as db:
            query = db.query(WorkspaceMember).options(
                joinedload(WorkspaceMember.user)
            ).filter(
                WorkspaceMember.workspace_id == workspace_id
            )
            
            if not include_inactive:
                query = query.filter(WorkspaceMember.is_active == True)
            
            return query.all()
    
    def get_user_memberships(self, user_id: str, include_inactive: bool = False) -> List[WorkspaceMember]:
        """Get all workspace memberships for a user"""
        with self._get_db() as db:
            query = db.query(WorkspaceMember).filter(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.is_deleted == False
            )
            
            if not include_inactive:
                query = query.filter(WorkspaceMember.is_active == True)
            
            return query.all()
    
    def add_member(self, workspace_id: str, user_id: str, role: str = "member") -> WorkspaceMember:
        """Add or reactivate a member in workspace"""
        db = self.db if self.db else SessionLocal()
        should_close = self.db is None
        
        try:
            # Check if already exists
            existing = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id
            ).first()
            
            if existing:
                if not existing.is_active:
                    existing.is_active = True
                    existing.role = role
                    existing.is_deleted = False
                    db.commit()
                    db.refresh(existing)
                    db.expunge(existing)
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
            
            # Expunge from session to prevent DetachedInstanceError
            db.expunge(member)
            
            return member
        except Exception:
            db.rollback()
            raise
        finally:
            if should_close:
                db.close()
    
    def remove_member(self, workspace_id: str, user_id: str) -> bool:
        """Deactivate a member from workspace"""
        with self._get_db() as db:
            member = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id
            ).first()
            
            if member:
                member.is_active = False
                # Context manager will commit on exit
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
                # Context manager will commit on exit
                return True
            return False
    
    def count_by_role(self, workspace_id: str, role: str) -> int:
        """Count members in a workspace by role"""
        with self._get_db() as db:
            return db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.role == role,
                WorkspaceMember.is_active == True
            ).count()
    
    def user_has_access(self, workspace_id: str, user_id: str) -> bool:
        """Check if user has active membership in workspace"""
        with self._get_db() as db:
            return db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.is_active == True
            ).first() is not None
    
    def get_user_role(self, workspace_id: str, user_id: str) -> Optional[str]:
        """Get user's role in a workspace"""
        with self._get_db() as db:
            member = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.is_active == True
            ).first()
            
            return member.role if member else None
