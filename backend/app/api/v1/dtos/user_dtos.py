"""
User API DTOs (Data Transfer Objects)
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re


class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    class Config:
        populate_by_name = True
        from_attributes = True


# Request DTOs
class ProfileUpdateRequest(BaseApiModel):
    """Profile update request"""
    first_name: Optional[str] = Field(None, alias="firstName", max_length=100)
    last_name: Optional[str] = Field(None, alias="lastName", max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    timezone: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=10)

    @field_validator('timezone')
    @classmethod
    def validate_timezone(cls, v):
        if v is not None:
            # Common timezone validation
            valid_timezones = [
                'UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
                'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
                'Asia/Shanghai', 'Asia/Singapore', 'Asia/Ho_Chi_Minh', 'Australia/Sydney'
            ]
            # Allow any timezone format like Region/City
            if not re.match(r'^[A-Za-z_]+(/[A-Za-z_]+)?$', v):
                raise ValueError('Invalid timezone format')
        return v

    @field_validator('language')
    @classmethod
    def validate_language(cls, v):
        if v is not None:
            valid_languages = ['en', 'vi', 'ja', 'zh', 'ko', 'fr', 'de', 'es']
            if v not in valid_languages:
                raise ValueError(f'Language must be one of: {", ".join(valid_languages)}')
        return v


class PasswordChangeRequest(BaseApiModel):
    """Password change request"""
    current_password: str = Field(..., alias="currentPassword", min_length=1)
    new_password: str = Field(..., alias="newPassword", min_length=8, max_length=128)

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


# Response DTOs
class ProfileResponse(BaseApiModel):
    """User profile response"""
    id: str
    email: str
    username: str
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    full_name: str = Field(..., alias="fullName")
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    bio: Optional[str] = None
    role: str
    is_active: bool = Field(..., alias="isActive")
    is_verified: bool = Field(..., alias="isVerified")
    timezone: str = "UTC"
    language: str = "en"
    last_login: Optional[datetime] = Field(None, alias="lastLogin")
    password_changed_at: Optional[datetime] = Field(None, alias="passwordChangedAt")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")


class UserResponse(BaseApiModel):
    """User response"""
    id: str
    email: str
    username: str
    full_name: str = Field(..., alias="fullName")
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    role: str
    is_active: bool = Field(..., alias="isActive")
    is_verified: bool = Field(..., alias="isVerified")
    last_login: Optional[datetime] = Field(None, alias="lastLogin")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")


class UserListResponse(BaseApiModel):
    """User list response"""
    users: List[UserResponse]
    total: int
    skip: int
    limit: int


class UserActivateResponse(BaseApiModel):
    """User activation response"""
    success: bool = True
    message: str


class UserDeactivateResponse(BaseApiModel):
    """User deactivation response"""
    success: bool = True
    message: str


class AvatarUploadResponse(BaseApiModel):
    """Avatar upload response"""
    success: bool = True
    avatar_url: str = Field(..., alias="avatarUrl")
    message: str = "Avatar uploaded successfully"


class PasswordChangeResponse(BaseApiModel):
    """Password change response"""
    success: bool = True
    message: str = "Password changed successfully"


class SuccessResponse(BaseApiModel):
    """Generic success response"""
    success: bool = True
    message: str
