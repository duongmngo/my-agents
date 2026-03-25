"""
User service for user profile management
"""
from typing import Optional, Dict, Any
from datetime import datetime
import io
import json

from PIL import Image
from minio import Minio
from minio.error import S3Error

from app.repositories.user_repository import UserRepository
from app.core.security import get_password_hash, verify_password
from app.core.config import settings


class UserService:
    """Service for user profile operations"""
    
    # Allowed avatar file extensions
    ALLOWED_AVATAR_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    MAX_AVATAR_SIZE = 256  # Max width/height in pixels
    
    def __init__(self):
        self.user_repo = UserRepository()
        self._minio_client = None
    
    def _get_minio_client(self) -> Minio:
        """Get or create MinIO client"""
        if self._minio_client is None:
            self._minio_client = Minio(
                endpoint=settings.minio_endpoint,
                access_key=settings.minio_access_key,
                secret_key=settings.minio_secret_key,
                secure=settings.minio_secure.lower() == "true"
            )
            # Ensure bucket exists
            try:
                if not self._minio_client.bucket_exists(settings.minio_bucket_name):
                    self._minio_client.make_bucket(settings.minio_bucket_name)
                
                # Set public read policy for users/ prefix (avatars)
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{settings.minio_bucket_name}/users/*"]
                        }
                    ]
                }
                self._minio_client.set_bucket_policy(settings.minio_bucket_name, json.dumps(policy))
            except S3Error:
                pass  # Bucket might already exist or policy already set
        return self._minio_client
    
    def get_profile(self, user_id: str) -> Dict[str, Any]:
        """Get user profile by ID
        
        Args:
            user_id: User ID
            
        Returns:
            Dict with success status and profile data
        """
        try:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                return {"success": False, "error": "User not found"}
            
            return {
                "success": True,
                "profile": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "full_name": user.full_name,
                    "avatar_url": user.avatar_url,
                    "bio": user.bio,
                    "role": user.role,
                    "is_active": user.is_active,
                    "is_verified": user.is_verified,
                    "timezone": user.timezone or "UTC",
                    "language": user.language or "en",
                    "last_login": user.last_login,
                    "password_changed_at": user.password_changed_at,
                    "created_at": user.created_at,
                    "updated_at": user.updated_at
                }
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to get profile: {str(e)}"}
    
    def update_profile(self, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile
        
        Args:
            user_id: User ID
            update_data: Dict with fields to update (first_name, last_name, bio, timezone, language)
            
        Returns:
            Dict with success status and updated profile
        """
        # Only allow safe fields to be updated
        safe_fields = {"first_name", "last_name", "bio", "timezone", "language"}
        filtered_data = {k: v for k, v in update_data.items() if k in safe_fields and v is not None}
        
        if not filtered_data:
            return {"success": False, "error": "No valid fields to update"}
        
        try:
            # Add updated_at timestamp
            filtered_data["updated_at"] = datetime.utcnow()
            
            user = self.user_repo.update(user_id, filtered_data)
            if user:
                return self.get_profile(user_id)
            else:
                return {"success": False, "error": "User not found"}
        except Exception as e:
            return {"success": False, "error": f"Failed to update profile: {str(e)}"}
    
    def change_password(
        self, 
        user_id: str, 
        current_password: str, 
        new_password: str
    ) -> Dict[str, Any]:
        """Change user password
        
        Args:
            user_id: User ID
            current_password: Current password for verification
            new_password: New password to set
            
        Returns:
            Dict with success status and message
        """
        try:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                return {"success": False, "error": "User not found"}
            
            # Verify current password
            if not verify_password(current_password, user.hashed_password):
                return {"success": False, "error": "Current password is incorrect"}
            
            # Check if new password is same as current
            if verify_password(new_password, user.hashed_password):
                return {"success": False, "error": "New password must be different from current password"}
            
            # Update password
            hashed_password = get_password_hash(new_password)
            update_data = {
                "hashed_password": hashed_password,
                "password_changed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            user = self.user_repo.update(user_id, update_data)
            if user:
                return {
                    "success": True,
                    "message": "Password changed successfully"
                }
            else:
                return {"success": False, "error": "Failed to update password"}
        except Exception as e:
            return {"success": False, "error": f"Failed to change password: {str(e)}"}
    
    def upload_avatar(
        self, 
        user_id: str, 
        file_content: bytes,
        filename: str,
        content_type: str
    ) -> Dict[str, Any]:
        """Upload and process user avatar
        
        Args:
            user_id: User ID
            file_content: Avatar file content as bytes
            filename: Original filename
            content_type: MIME type of the file
            
        Returns:
            Dict with success status and avatar URL
        """
        try:
            # Validate file extension
            extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
            if extension not in self.ALLOWED_AVATAR_EXTENSIONS:
                return {
                    "success": False, 
                    "error": f"Invalid file type. Allowed: {', '.join(self.ALLOWED_AVATAR_EXTENSIONS)}"
                }
            
            # Validate content type
            allowed_content_types = {'image/jpeg', 'image/png', 'image/webp'}
            if content_type not in allowed_content_types:
                return {
                    "success": False,
                    "error": "Invalid content type. Only JPEG, PNG, and WebP images are allowed"
                }
            
            # Process image: resize to max dimensions
            try:
                image = Image.open(io.BytesIO(file_content))
                
                # Convert to RGB if necessary (for JPEG output)
                if image.mode in ('RGBA', 'P'):
                    image = image.convert('RGB')
                
                # Resize if larger than max size
                if image.width > self.MAX_AVATAR_SIZE or image.height > self.MAX_AVATAR_SIZE:
                    image.thumbnail((self.MAX_AVATAR_SIZE, self.MAX_AVATAR_SIZE), Image.Resampling.LANCZOS)
                
                # Save to bytes
                output = io.BytesIO()
                output_format = 'JPEG' if extension in ('jpg', 'jpeg') else extension.upper()
                if output_format == 'WEBP':
                    image.save(output, format='WEBP', quality=85)
                else:
                    image.save(output, format=output_format, quality=85)
                processed_content = output.getvalue()
            except Exception as e:
                return {"success": False, "error": f"Failed to process image: {str(e)}"}
            
            # Upload to MinIO
            storage_path = f"users/{user_id}/avatar.{extension}"
            output_content_type = f"image/{extension}" if extension != 'jpg' else 'image/jpeg'
            
            try:
                client = self._get_minio_client()
                
                # Delete existing avatar if exists
                try:
                    client.remove_object(settings.minio_bucket_name, storage_path)
                except S3Error:
                    pass  # File might not exist
                
                # Upload new avatar
                client.put_object(
                    bucket_name=settings.minio_bucket_name,
                    object_name=storage_path,
                    data=io.BytesIO(processed_content),
                    length=len(processed_content),
                    content_type=output_content_type
                )
                
                # Generate avatar URL
                # Use public URL if available, otherwise construct internal URL
                if hasattr(settings, 'minio_public_url') and settings.minio_public_url:
                    avatar_url = f"{settings.minio_public_url}/{settings.minio_bucket_name}/{storage_path}"
                else:
                    protocol = "https" if settings.minio_secure.lower() == "true" else "http"
                    avatar_url = f"{protocol}://{settings.minio_endpoint}/{settings.minio_bucket_name}/{storage_path}"
                
            except S3Error as e:
                return {"success": False, "error": f"Failed to upload avatar: {str(e)}"}
            
            # Update user record with new avatar URL
            update_data = {
                "avatar_url": avatar_url,
                "updated_at": datetime.utcnow()
            }
            
            user = self.user_repo.update(user_id, update_data)
            if user:
                return {
                    "success": True,
                    "avatar_url": avatar_url,
                    "message": "Avatar uploaded successfully"
                }
            else:
                return {"success": False, "error": "Failed to update user record"}
                
        except Exception as e:
            return {"success": False, "error": f"Failed to upload avatar: {str(e)}"}
    
    def search_users_by_email(self, email: str, limit: int = 10) -> Dict[str, Any]:
        """Search users by email (for adding workspace members)
        
        Args:
            email: Email to search for
            limit: Maximum number of results
            
        Returns:
            Dict with success status and list of matching users
        """
        try:
            users = self.user_repo.search_users(email, skip=0, limit=limit)
            
            # Filter to only return basic info needed for member selection
            user_list = [
                {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "full_name": user.full_name,
                    "avatar_url": user.avatar_url
                }
                for user in users
            ]
            
            return {
                "success": True,
                "users": user_list
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to search users: {str(e)}"}
