"""
User repository for user-specific database operations
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model operations"""
    
    def __init__(self, db: Session):
        super().__init__(db, User)
    
    def get_by_email(self, email: str, tenant_id: Optional[str] = None) -> Optional[User]:
        """Get user by email address"""
        query = self.db.query(User).filter(
            User.email == email,
            User.is_deleted == False
        )
        
        if tenant_id:
            query = query.filter(User.tenant_id == tenant_id)
        
        return query.first()
    
    def get_by_username(self, username: str, tenant_id: Optional[str] = None) -> Optional[User]:
        """Get user by username"""
        query = self.db.query(User).filter(
            User.username == username,
            User.is_deleted == False
        )
        
        if tenant_id:
            query = query.filter(User.tenant_id == tenant_id)
        
        return query.first()
    
    def get_by_email_or_username(self, identifier: str, tenant_id: Optional[str] = None) -> Optional[User]:
        """Get user by email or username"""
        query = self.db.query(User).filter(
            and_(
                (User.email == identifier) | (User.username == identifier),
                User.is_deleted == False
            )
        )
        
        if tenant_id:
            query = query.filter(User.tenant_id == tenant_id)
        
        return query.first()
    
    def email_exists(self, email: str, tenant_id: Optional[str] = None, exclude_user_id: Optional[str] = None) -> bool:
        """Check if email already exists"""
        query = self.db.query(User.id).filter(
            User.email == email,
            User.is_deleted == False
        )
        
        if tenant_id:
            query = query.filter(User.tenant_id == tenant_id)
        
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)
        
        return query.first() is not None
    
    def username_exists(self, username: str, tenant_id: Optional[str] = None, exclude_user_id: Optional[str] = None) -> bool:
        """Check if username already exists"""
        query = self.db.query(User.id).filter(
            User.username == username,
            User.is_deleted == False
        )
        
        if tenant_id:
            query = query.filter(User.tenant_id == tenant_id)
        
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)
        
        return query.first() is not None
    
    def get_active_users(self, tenant_id: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all active users for a tenant"""
        return self.db.query(User).filter(
            User.tenant_id == tenant_id,
            User.is_active == True,
            User.is_deleted == False
        ).offset(skip).limit(limit).all()
    
    def get_users_by_role(self, role: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Get users by role"""
        return self.db.query(User).filter(
            User.tenant_id == tenant_id,
            User.role == role,
            User.is_deleted == False
        ).offset(skip).limit(limit).all()
    
    def search_users(self, search_term: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Search users by name, email, or username"""
        search_fields = ['email', 'username', 'first_name', 'last_name']
        return self.search(search_term, search_fields, tenant_id, skip, limit)
    
    def activate_user(self, user_id: str, tenant_id: str) -> bool:
        """Activate a user"""
        user = self.get_by_id(user_id, tenant_id)
        if user:
            user.is_active = True
            self.db.commit()
            return True
        return False
    
    def deactivate_user(self, user_id: str, tenant_id: str) -> bool:
        """Deactivate a user"""
        user = self.get_by_id(user_id, tenant_id)
        if user:
            user.is_active = False
            self.db.commit()
            return True
        return False
    
    def verify_user(self, user_id: str, tenant_id: str) -> bool:
        """Mark user as verified"""
        user = self.get_by_id(user_id, tenant_id)
        if user:
            user.is_verified = True
            self.db.commit()
            return True
        return False
    
    def update_last_login(self, user_id: str, tenant_id: str) -> bool:
        """Update user's last login timestamp"""
        from datetime import datetime
        user = self.get_by_id(user_id, tenant_id)
        if user:
            user.last_login = datetime.utcnow()
            self.db.commit()
            return True
        return False
