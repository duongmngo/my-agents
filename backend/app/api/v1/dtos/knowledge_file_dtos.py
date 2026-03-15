"""
KnowledgeFile API DTOs (Data Transfer Objects)
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True  # Serialize using alias (camelCase)
    )


# Embedding stats response
class FileEmbeddingStatsResponse(BaseApiModel):
    """File embedding statistics"""
    chunk_count: int = Field(0, alias="chunkCount", description="Number of chunks indexed")
    model: Optional[str] = Field(None, description="Embedding model used")
    tokens_processed: Optional[int] = Field(None, alias="tokensProcessed", description="Total tokens processed")
    latency_ms: Optional[int] = Field(None, alias="latencyMs", description="Processing latency in ms")
    indexed_at: Optional[str] = Field(None, alias="indexedAt", description="When file was indexed")


# Request DTOs
class KnowledgeFileUploadRequest(BaseApiModel):
    """Request metadata for file upload (sent as form data)"""
    workspace_id: str = Field(..., alias="workspaceId", description="Workspace ID")
    folder_id: Optional[str] = Field(None, alias="folderId", description="Folder ID for organization")
    description: Optional[str] = Field(None, max_length=1000, description="File description")
    tags: Optional[str] = Field(None, description="Comma-separated tags")


class KnowledgeFileUpdateRequest(BaseApiModel):
    """Update knowledge file metadata"""
    folder_id: Optional[str] = Field(None, alias="folderId", description="Move to folder")
    description: Optional[str] = Field(None, max_length=1000, description="File description")
    tags: Optional[str] = Field(None, description="Comma-separated tags")


# Response DTOs
class KnowledgeFileResponse(BaseApiModel):
    """Knowledge file response"""
    id: str
    filename: str
    original_filename: str = Field(..., alias="originalFilename")
    file_type: str = Field(..., alias="fileType")
    mime_type: Optional[str] = Field(None, alias="mimeType")
    file_size: int = Field(..., alias="fileSize")
    size_display: str = Field(..., alias="sizeDisplay", description="Human-readable file size")
    
    # Processing status
    status: str = Field(..., description="Processing status: pending, processing, processed, failed")
    error_message: Optional[str] = Field(None, alias="errorMessage")
    
    # Content info
    character_count: int = Field(0, alias="characterCount")
    word_count: int = Field(0, alias="wordCount")
    page_count: Optional[int] = Field(None, alias="pageCount")
    
    # Embedding info
    is_embedded: bool = Field(False, alias="isEmbedded")
    embedding_stats: Optional[FileEmbeddingStatsResponse] = Field(None, alias="embeddingStats")
    
    # Organization
    folder_id: Optional[str] = Field(None, alias="folderId")
    description: Optional[str] = None
    tags: Optional[str] = None
    
    # Ownership
    workspace_id: str = Field(..., alias="workspaceId")
    created_by: str = Field(..., alias="createdBy")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")


class KnowledgeFileListResponse(BaseApiModel):
    """Knowledge file list response"""
    files: List[KnowledgeFileResponse]
    total: int
    skip: int
    limit: int


class KnowledgeFileUploadResponse(BaseApiModel):
    """File upload response"""
    success: bool = True
    file: KnowledgeFileResponse
    message: str = "File uploaded successfully"


class KnowledgeFileDeleteResponse(BaseApiModel):
    """File delete response"""
    success: bool = True
    message: str = "File deleted successfully"


class KnowledgeFileReprocessResponse(BaseApiModel):
    """Reprocess file response"""
    success: bool
    file: Optional[KnowledgeFileResponse] = None
    message: Optional[str] = None
    error: Optional[str] = None


class SupportedExtensionsResponse(BaseApiModel):
    """Response listing supported file extensions"""
    extensions: List[str]


class KnowledgeFileCountResponse(BaseApiModel):
    """Knowledge file count response"""
    total: int = Field(..., description="Total number of files")
    processed: int = Field(..., description="Number of processed/embedded files")
    pending: int = Field(..., description="Number of pending files")
    failed: int = Field(..., description="Number of failed files")
