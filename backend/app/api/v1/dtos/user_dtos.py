"""
User API DTOs (Data Transfer Objects)
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    class Config:
        populate_by_name = True
        from_attributes = True


# Response DTOs
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
