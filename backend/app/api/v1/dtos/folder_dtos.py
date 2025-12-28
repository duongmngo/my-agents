"""
Folder API DTOs (Data Transfer Objects)
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class FolderCategory(str, Enum):
    """Folder category enumeration"""
    FILES = "FILES"
    NOTES = "NOTES"


class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    class Config:
        populate_by_name = True
        from_attributes = True


# Request DTOs
class FolderCreateRequest(BaseApiModel):
    """Folder creation request"""
    name: str = Field(..., min_length=1, max_length=255, description="Folder name")
    description: Optional[str] = Field(None, max_length=1000, description="Folder description")
    category: FolderCategory = Field(default=FolderCategory.FILES, description="Folder category")
    parent_id: Optional[str] = Field(None, alias="parentId", description="Parent folder ID")
    workspace_id: str = Field(..., alias="workspaceId", description="Workspace ID")
    color: Optional[str] = Field(None, max_length=50, description="Folder color")
    icon: Optional[str] = Field(None, max_length=100, description="Folder icon")


class FolderUpdateRequest(BaseApiModel):
    """Folder update request"""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[FolderCategory] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_pinned: Optional[bool] = Field(None, alias="isPinned")
    is_archived: Optional[bool] = Field(None, alias="isArchived")


# Response DTOs
class FolderResponse(BaseApiModel):
    """Folder response"""
    id: str
    name: str
    description: Optional[str] = None
    category: FolderCategory
    workspace_id: str = Field(..., alias="workspaceId")
    parent_id: Optional[str] = Field(None, alias="parentId")
    path: Optional[str] = None
    level: Optional[int] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_private: Optional[bool] = Field(None, alias="isPrivate")
    is_pinned: Optional[bool] = Field(None, alias="isPinned")
    is_archived: Optional[bool] = Field(None, alias="isArchived")
    created_by: str = Field(..., alias="createdBy")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")


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
