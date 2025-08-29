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
class WorkspaceSettingsResponse(BaseApiModel):
    """Workspace settings response"""
    theme: str = "light"
    primary_color: str = Field("#3B82F6", alias="primaryColor")
    secondary_color: str = Field("#1E40AF", alias="secondaryColor")


class WorkspaceResponse(BaseApiModel):
    """Workspace response"""
    id: str
    name: str
    description: Optional[str] = None
    slug: Optional[str] = None
    tenant_id: str = Field(..., alias="tenantId")
    created_by: str = Field(..., alias="createdBy")
    is_private: bool = Field(..., alias="isPrivate")
    is_default: bool = Field(..., alias="isDefault")
    color: Optional[str] = None
    icon: Optional[str] = None
    settings: WorkspaceSettingsResponse
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class WorkspaceMemberResponse(BaseApiModel):
    """Workspace member response"""
    id: str
    user_id: str = Field(..., alias="userId")
    workspace_id: str = Field(..., alias="workspaceId")
    role: str
    permissions: dict
    joined_at: datetime = Field(..., alias="joinedAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    user: Optional[dict] = None


class WorkspacesListResponse(BaseApiModel):
    """Workspaces list response"""
    success: bool = True
    workspaces: List[WorkspaceResponse] = []
    total: int = 0


class WorkspaceMembersListResponse(BaseApiModel):
    """Workspace members list response"""
    success: bool = True
    members: List[WorkspaceMemberResponse] = []
    total: int = 0


class SuccessResponse(BaseApiModel):
    """Success response"""
    success: bool = True
    message: str
