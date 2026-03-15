"""
Note API DTOs (Data Transfer Objects)
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    class Config:
        populate_by_name = True
        from_attributes = True


class EmbeddingStatsResponse(BaseApiModel):
    """Embedding statistics response"""
    generated: bool = Field(..., description="Whether embedding was generated")
    dimension: Optional[int] = Field(None, description="Embedding dimension")
    model: Optional[str] = Field(None, description="Model used for embedding")
    provider: Optional[str] = Field(None, description="Provider used for embedding")
    latency_ms: Optional[int] = Field(None, alias="latencyMs", description="Generation latency in milliseconds")
    tokens_processed: Optional[int] = Field(None, alias="tokensProcessed", description="Number of tokens processed")
    generated_at: Optional[str] = Field(None, alias="generatedAt", description="When embedding was generated")
    cost_estimate: Optional[float] = Field(None, alias="costEstimate", description="Estimated cost for embedding")


# Request DTOs
class NoteCreateRequest(BaseApiModel):
    """Note creation request"""
    title: str = Field(..., min_length=1, max_length=500, description="Note title")
    content: Optional[str] = Field(None, description="Note content in markdown format")
    workspace_id: str = Field(..., alias="workspaceId", description="Workspace ID where note will be created")
    folder_id: Optional[str] = Field(None, alias="folderId", description="Folder ID where note will be stored")


class NoteUpdateRequest(BaseApiModel):
    """Note update request"""
    title: Optional[str] = Field(None, min_length=1, max_length=500, description="Note title")
    content: Optional[str] = Field(None, description="Note content in markdown format")
    folder_id: Optional[str] = Field(None, alias="folderId", description="Folder ID where note will be moved")
    is_pinned: Optional[bool] = Field(None, alias="isPinned", description="Whether note is pinned")
    is_archived: Optional[bool] = Field(None, alias="isArchived", description="Whether note is archived")
    is_public: Optional[bool] = Field(None, alias="isPublic", description="Whether note is public")
    tags: Optional[List[str]] = Field(None, description="List of tags for the note")
    category: Optional[str] = Field(None, max_length=100, description="Note category")


# Response DTOs
class NoteResponse(BaseApiModel):
    """Note response"""
    id: str
    title: str
    content: Optional[str] = None
    excerpt: Optional[str] = None
    format: str = Field(..., description="Note format (markdown, plain_text, etc.)")
    word_count: int = Field(..., alias="wordCount")
    character_count: int = Field(..., alias="characterCount")
    is_pinned: bool = Field(False, alias="isPinned")
    is_archived: bool = Field(False, alias="isArchived")
    is_public: bool = Field(False, alias="isPublic")
    is_published: bool = Field(False, alias="isPublished")
    is_template: bool = Field(False, alias="isTemplate")
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    workspace_id: str = Field(..., alias="workspaceId")
    folder_id: Optional[str] = Field(None, alias="folderId")
    created_by: str = Field(..., alias="createdBy")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    embedding_stats: Optional[EmbeddingStatsResponse] = Field(None, alias="embeddingStats", description="Embedding statistics and metadata")


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


# Count DTOs
class NoteCountResponse(BaseApiModel):
    """Note count response"""
    total: int = Field(..., description="Total number of notes")
    embedded: int = Field(..., description="Number of notes with embeddings")


# Embedding DTOs
class NoteEmbedResponse(BaseApiModel):
    """Note embedding response"""
    success: bool = True
    note_id: str = Field(..., alias="noteId")
    dimension: int = Field(..., description="Embedding dimension")
    model: str = Field(..., description="Model used for embedding")
    provider: str = Field(..., description="Provider used for embedding")
    latency_ms: int = Field(..., alias="latencyMs", description="Generation latency in milliseconds")
    tokens_processed: int = Field(..., alias="tokensProcessed", description="Number of tokens processed")
    message: str = "Note embedded successfully and stored in vector database"