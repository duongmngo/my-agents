"""
Authentication API DTOs (Data Transfer Objects)
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    class Config:
        populate_by_name = True
        from_attributes = True


# Request DTOs
class UserRegisterRequest(BaseApiModel):
    """User registration request"""
    email: EmailStr
    username: str
    password: str
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")


class UserLoginRequest(BaseApiModel):
    """User login request"""
    identifier: str  # email or username
    password: str


class RefreshTokenRequest(BaseApiModel):
    """Refresh token request"""
    refresh_token: str = Field(..., alias="refreshToken")


class ChangePasswordRequest(BaseApiModel):
    """Change password request"""
    current_password: str = Field(..., alias="currentPassword")
    new_password: str = Field(..., alias="newPassword")


class UserProfileUpdateRequest(BaseApiModel):
    """User profile update request"""
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    bio: Optional[str] = None
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    timezone: Optional[str] = None
    language: Optional[str] = None


# Response DTOs
class TokenResponse(BaseApiModel):
    """Token response"""
    access_token: str = Field(..., alias="accessToken")
    refresh_token: str = Field(..., alias="refreshToken")
    token_type: str = Field(..., alias="tokenType")
    expires_in: int = Field(..., alias="expiresIn")


class UserResponse(BaseApiModel):
    """User response"""
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
    last_login: Optional[datetime] = Field(None, alias="lastLogin")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    timezone: Optional[str] = None
    language: Optional[str] = None


class AuthResponse(BaseApiModel):
    """Authentication response"""
    success: bool
    user: Optional[UserResponse] = None
    tokens: Optional[TokenResponse] = None
    error: Optional[str] = None


class SuccessResponse(BaseApiModel):
    """Success response"""
    success: bool = True
    message: str
