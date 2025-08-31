"""
File API DTOs (Data Transfer Objects)
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
class FileUpdateRequest(BaseApiModel):
    """File update request"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_pinned: bool = Field(False, alias="isPinned")


# Response DTOs
class FileResponse(BaseApiModel):
    """File response"""
    id: str
    name: str
    description: Optional[str] = None
    filename: str
    file_path: str = Field(..., alias="filePath")
    file_size: int = Field(..., alias="fileSize")
    mime_type: str = Field(..., alias="mimeType")
    file_type: str = Field(..., alias="fileType")
    is_pinned: bool = Field(False, alias="isPinned")
    workspace_id: str = Field(..., alias="workspaceId")
    folder_id: Optional[str] = Field(None, alias="folderId")
    uploaded_by: str = Field(..., alias="uploadedBy")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")


class FileListResponse(BaseApiModel):
    """File list response"""
    files: List[FileResponse]
    total: int
    skip: int
    limit: int


class FileUploadResponse(BaseApiModel):
    """File upload response"""
    success: bool = True
    file: FileResponse
    message: str = "File uploaded successfully"


class FileDeleteResponse(BaseApiModel):
    """File delete response"""
    success: bool = True
    message: str
