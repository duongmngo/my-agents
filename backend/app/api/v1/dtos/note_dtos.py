"""
Note API DTOs (Data Transfer Objects)
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
class NoteCreateRequest(BaseApiModel):
    """Note creation request"""
    title: str
    content: Optional[str] = None
    workspace_id: str = Field(..., alias="workspaceId")
    folder_id: Optional[str] = Field(None, alias="folderId")


class NoteUpdateRequest(BaseApiModel):
    """Note update request"""
    title: Optional[str] = None
    content: Optional[str] = None
    is_pinned: bool = Field(False, alias="isPinned")


# Response DTOs
class NoteResponse(BaseApiModel):
    """Note response"""
    id: str
    title: str
    content: Optional[str] = None
    is_pinned: bool = Field(False, alias="isPinned")
    workspace_id: str = Field(..., alias="workspaceId")
    folder_id: Optional[str] = Field(None, alias="folderId")
    created_by: str = Field(..., alias="createdBy")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class NoteListResponse(BaseApiModel):
    """Note list response"""
    notes: List[NoteResponse]
    total: int
    skip: int
    limit: int


class NoteCreateResponse(BaseApiModel):
    """Note creation response"""
    success: bool = True
    note: NoteResponse
    message: str = "Note created successfully"


class NoteDeleteResponse(BaseApiModel):
    """Note delete response"""
    success: bool = True
    message: str
