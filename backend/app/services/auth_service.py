"""
Authentication service for user login, registration, and token management
"""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import uuid

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token
)
from app.repositories.user_repository import UserRepository
from app.services.workspace_service import WorkspaceService
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.api.v1.dtos.auth_dtos import UserResponse, TokenResponse
from app.core.config import settings


class AuthService:
    """Service for authentication operations"""
    
    def __init__(self):
        self.user_repo = UserRepository()
        self.workspace_service = WorkspaceService()
    
    def _create_default_workspace(self, user_id: str, username: str) -> Optional[Workspace]:
        """Create a default workspace for a new user"""
        try:
            # Generate workspace slug from username
            workspace_slug = f"{username.lower().replace(' ', '-')}-workspace"
            
            # Create workspace
            workspace_data = {
                "name": "My Workspace",
                "description": "Default workspace for getting started",
                "slug": workspace_slug,
                "color": "#3B82F6",
                "icon": "briefcase",
                "is_private": False,
                "is_active": True,
                "is_archived": False,
                "created_by": user_id
            }
            
            # Create workspace through service
            workspace_result = self.workspace_service.create_workspace(
                name=workspace_data["name"],
                description=workspace_data["description"],
                created_by=user_id,
                slug=workspace_data["slug"],
                is_private=workspace_data["is_private"],
                color=workspace_data["color"],
                icon=workspace_data["icon"],
                create_default_folders=False  # Don't create default folders for default workspace
            )
            
            if not workspace_result["success"]:
                return None
            
            workspace_dict = workspace_result["workspace"]
            # Create a mock Workspace object for return compatibility
            from app.models.workspace import Workspace
            workspace = Workspace(**workspace_dict)
            
            return workspace
        except Exception as e:
            print(f"Failed to create default workspace for user {user_id}: {str(e)}")
            return None
    
    def register_user(
        self,
        email: str,
        username: str,
        password: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Register a new user and return tokens for auto-login"""
        
        # Check if email already exists
        if self.user_repo.email_exists(email):
            return {"success": False, "error": "Email already registered"}
        
        # Check if username already exists
        if self.user_repo.username_exists(username):
            return {"success": False, "error": "Username already taken"}
        
        # Create user
        user_data = {
            "email": email,
            "username": username,
            "hashed_password": get_password_hash(password),
            "first_name": first_name,
            "last_name": last_name,
            "is_active": True,
            "is_verified": False,
            "role": "user"
        }
        
        try:
            user = self.user_repo.create(user_data)
            
            # Create default workspace for the new user
            default_workspace = self._create_default_workspace(user.id, username)
            
            # Generate tokens for auto-login after registration
            tokens = self.create_tokens(user)
            
            user_response = UserResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                full_name=user.full_name,
                avatar_url=user.avatar_url,
                bio=user.bio,
                role=user.role,
                is_active=user.is_active,
                is_verified=user.is_verified,
                last_login=user.last_login,
                created_at=user.created_at,
                updated_at=user.updated_at,
                timezone=user.timezone,
                language=user.language
            )
            return {
                "success": True,
                "user": user_response,
                "tokens": tokens
            }
        except Exception as e:
            return {"success": False, "error": f"Registration failed: {str(e)}"}
    
    def authenticate_user(self, identifier: str, password: str) -> Optional[User]:
        """Authenticate user with email/username and password"""
        user = self.user_repo.get_by_email_or_username(identifier)
        
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        if not user.is_active:
            return None
        
        # Update last login
        self.user_repo.update_last_login(user.id)
        
        return user
    
    def create_tokens(self, user: User) -> TokenResponse:
        """Create access and refresh tokens for user"""
        token_data = {
            "sub": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": user.id})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60
        )
    
    def login(self, identifier: str, password: str) -> Dict[str, Any]:
        """Login user and return tokens"""
        user = self.authenticate_user(identifier, password)
        
        if not user:
            return {"success": False, "error": "Invalid credentials"}
        
        tokens = self.create_tokens(user)
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            bio=user.bio,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at,
            timezone=user.timezone,
            language=user.language
        )
        
        return {
            "success": True,
            "user": user_response,
            "tokens": tokens
        }
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        payload = verify_token(refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            return {"success": False, "error": "Invalid refresh token"}
        
        user_id = payload.get("sub")
        
        if not user_id:
            return {"success": False, "error": "Invalid token payload"}
        
        user = self.user_repo.get_by_id(user_id)
        
        if not user or not user.is_active:
            return {"success": False, "error": "User not found or inactive"}
        
        tokens = self.create_tokens(user)
        
        return {
            "success": True,
            "tokens": tokens
        }
    
    def change_password(self, user_id: str, current_password: str, new_password: str) -> Dict[str, Any]:
        """Change user password"""
        user = self.user_repo.get_by_id(user_id)
        
        if not user:
            return {"success": False, "error": "User not found"}
        
        if not verify_password(current_password, user.hashed_password):
            return {"success": False, "error": "Current password is incorrect"}
        
        # Update password
        hashed_password = get_password_hash(new_password)
        update_data = {
            "hashed_password": hashed_password,
            "password_changed_at": datetime.utcnow()
        }
        
        try:
            self.user_repo.update(user_id, update_data)
            return {"success": True, "message": "Password changed successfully"}
        except Exception as e:
            return {"success": False, "error": f"Password change failed: {str(e)}"}
    
    def verify_user_email(self, user_id: str) -> Dict[str, Any]:
        """Mark user email as verified"""
        try:
            success = self.user_repo.verify_user(user_id)
            if success:
                return {"success": True, "message": "Email verified successfully"}
            else:
                return {"success": False, "error": "User not found"}
        except Exception as e:
            return {"success": False, "error": f"Verification failed: {str(e)}"}
    
    def deactivate_user(self, user_id: str) -> Dict[str, Any]:
        """Deactivate user account"""
        try:
            success = self.user_repo.deactivate_user(user_id)
            if success:
                return {"success": True, "message": "User deactivated successfully"}
            else:
                return {"success": False, "error": "User not found"}
        except Exception as e:
            return {"success": False, "error": f"Deactivation failed: {str(e)}"}
    
    def activate_user(self, user_id: str) -> Dict[str, Any]:
        """Activate user account"""
        try:
            success = self.user_repo.activate_user(user_id)
            if success:
                return {"success": True, "message": "User activated successfully"}
            else:
                return {"success": False, "error": "User not found"}
        except Exception as e:
            return {"success": False, "error": f"Activation failed: {str(e)}"}
    
    def get_user_profile(self, user_id: str) -> Optional[UserResponse]:
        """Get user profile information"""
        user = self.user_repo.get_by_id(user_id)
        
        if not user:
            return None
        
        return UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            bio=user.bio,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            last_login=user.last_login,
            created_at=user.created_at,
            updated_at=user.updated_at,
            timezone=user.timezone,
            language=user.language
        )
    
    def update_user_profile(self, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile"""
        # Remove sensitive fields that shouldn't be updated through this method
        safe_fields = {
            "first_name", "last_name", "avatar_url", "bio", 
            "timezone", "language", "preferences"
        }
        
        filtered_data = {k: v for k, v in update_data.items() if k in safe_fields}
        
        if not filtered_data:
            return {"success": False, "error": "No valid fields to update"}
        
        try:
            user = self.user_repo.update(user_id, filtered_data)
            if user:
                return {
                    "success": True,
                    "user": self.get_user_profile(user_id)
                }
            else:
                return {"success": False, "error": "User not found"}
        except Exception as e:
            return {"success": False, "error": f"Update failed: {str(e)}"}
