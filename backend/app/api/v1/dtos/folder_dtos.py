"""
Folder API DTOs (Data Transfer Objects)
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
class FolderCreateRequest(BaseApiModel):
    """Folder creation request"""
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = Field(None, alias="parentId")
    workspace_id: str = Field(..., alias="workspaceId")


class FolderUpdateRequest(BaseApiModel):
    """Folder update request"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_pinned: bool = Field(False, alias="isPinned")


# Response DTOs
class FolderResponse(BaseApiModel):
    """Folder response"""
    id: str
    name: str
    description: Optional[str] = None
    is_pinned: bool = Field(False, alias="isPinned")
    workspace_id: str = Field(..., alias="workspaceId")
    parent_id: Optional[str] = Field(None, alias="parentId")
    created_by: str = Field(..., alias="createdBy")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class FolderListResponse(BaseApiModel):
    """Folder list response"""
    folders: List[FolderResponse]
    total: int


class FolderCreateResponse(BaseApiModel):
    """Folder creation response"""
    success: bool = True
    folder: FolderResponse
    message: str = "Folder created successfully"


class FolderDeleteResponse(BaseApiModel):
    """Folder delete response"""
    success: bool = True
    message: str
