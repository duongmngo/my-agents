"""
User repository for user-specific database operations
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model operations"""
    
    def __init__(self):
        super().__init__(User)
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address"""
        with self._get_db() as db:
            return db.query(User).filter(
                User.email == email,
                User.is_deleted == False
            ).first()
    
    def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        with self._get_db() as db:
            return db.query(User).filter(
                User.username == username,
                User.is_deleted == False
            ).first()
    
    def get_by_email_or_username(self, identifier: str) -> Optional[User]:
        """Get user by email or username"""
        with self._get_db() as db:
            return db.query(User).filter(
                and_(
                    or_(User.email == identifier, User.username == identifier),
                    User.is_deleted == False
                )
            ).first()
    
    def email_exists(self, email: str, exclude_user_id: Optional[str] = None) -> bool:
        """Check if email already exists"""
        with self._get_db() as db:
            query = db.query(User.id).filter(
                User.email == email,
                User.is_deleted == False
            )
            
            if exclude_user_id:
                query = query.filter(User.id != exclude_user_id)
            
            return query.first() is not None
    
    def username_exists(self, username: str, exclude_user_id: Optional[str] = None) -> bool:
        """Check if username already exists"""
        with self._get_db() as db:
            query = db.query(User.id).filter(
                User.username == username,
                User.is_deleted == False
            )
            
            if exclude_user_id:
                query = query.filter(User.id != exclude_user_id)
            
            return query.first() is not None
    
    def get_active_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all active users"""
        with self._get_db() as db:
            return db.query(User).filter(
                User.is_active == True,
                User.is_deleted == False
            ).offset(skip).limit(limit).all()
    
    def get_users_by_role(self, role: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Get users by role"""
        with self._get_db() as db:
            return db.query(User).filter(
                User.role == role,
                User.is_deleted == False
            ).offset(skip).limit(limit).all()
    
    def search_users(self, search_term: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Search users by name, email, or username"""
        search_fields = ['email', 'username', 'first_name', 'last_name']
        return self.search(search_term, search_fields, skip, limit)
    
    def activate_user(self, user_id: str) -> bool:
        """Activate a user"""
        with self._get_db() as db:
            user = db.query(User).filter(
                User.id == user_id,
                User.is_deleted == False
            ).first()
            if user:
                user.is_active = True
                # Context manager will commit on exit
                return True
            return False
    
    def deactivate_user(self, user_id: str) -> bool:
        """Deactivate a user"""
        with self._get_db() as db:
            user = db.query(User).filter(
                User.id == user_id,
                User.is_deleted == False
            ).first()
            if user:
                user.is_active = False
                # Context manager will commit on exit
                return True
            return False
    
    def verify_user(self, user_id: str) -> bool:
        """Mark user as verified"""
        with self._get_db() as db:
            user = db.query(User).filter(
                User.id == user_id,
                User.is_deleted == False
            ).first()
            if user:
                user.is_verified = True
                # Context manager will commit on exit
                return True
            return False
    
    def update_last_login(self, user_id: str) -> bool:
        """Update user's last login timestamp"""
        from datetime import datetime
        with self._get_db() as db:
            user = db.query(User).filter(
                User.id == user_id,
                User.is_deleted == False
            ).first()
            if user:
                user.last_login = datetime.utcnow()
                # Context manager will commit on exit
                return True
            return False
