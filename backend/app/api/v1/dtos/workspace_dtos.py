"""
Workspace API DTOs (Data Transfer Objects)
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    class Config:
        populate_by_name = True
        from_attributes = True


# Request DTOs
class WorkspaceCreateRequest(BaseApiModel):
    """Workspace creation request"""
    name: str
    description: Optional[str] = None
    slug: Optional[str] = None
    is_private: bool = Field(False, alias="isPrivate")
    color: Optional[str] = None
    icon: Optional[str] = None
    create_default_folders: bool = Field(True, alias="createDefaultFolders", description="Whether to create default knowledge base folders")


class WorkspaceUpdateRequest(BaseApiModel):
    """Workspace update request"""
    name: Optional[str] = None
    description: Optional[str] = None
    slug: Optional[str] = None
    is_private: Optional[bool] = Field(None, alias="isPrivate")
    color: Optional[str] = None
    icon: Optional[str] = None


class WorkspaceMemberAddRequest(BaseApiModel):
    """Add workspace member request"""
    user_id: str = Field(..., alias="userId")
    role: str = "member"


class WorkspaceMemberUpdateRequest(BaseApiModel):
    """Update workspace member request"""
    role: str


# Response DTOs
class WorkspaceResponse(BaseApiModel):
    """Workspace response"""
    id: str
    name: str
    description: Optional[str] = None
    slug: str
    color: str
    icon: Optional[str] = None
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    is_private: bool = Field(..., alias="isPrivate")
    is_active: bool = Field(..., alias="isActive")
    is_archived: bool = Field(..., alias="isArchived")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    created_by: str = Field(..., alias="createdBy")
    user_role: Optional[str] = Field(None, alias="userRole")


class WorkspaceCreateResponse(BaseApiModel):
    """Workspace creation response with default folders information"""
    workspace: WorkspaceResponse
    default_folders: List[dict] = Field(..., alias="defaultFolders")
    message: str = "Workspace created successfully with default knowledge base folders"


class WorkspaceMemberResponse(BaseApiModel):
    """Workspace member response"""
    id: str
    workspace_id: str = Field(..., alias="workspaceId")
    user_id: str = Field(..., alias="userId")
    role: str
    is_active: bool = Field(..., alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")
    user: Optional[dict] = None


class WorkspaceListResponse(BaseApiModel):
    """Workspace list response"""
    workspaces: List[WorkspaceResponse]


class WorkspaceMemberListResponse(BaseApiModel):
    """Workspace member list response"""
    members: List[WorkspaceMemberResponse]


class SuccessResponse(BaseApiModel):
    """Success response"""
    success: bool = True
    message: str
