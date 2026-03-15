"""
Knowledge File management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from typing import Optional

from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.knowledge_file_service import KnowledgeFileService
from app.api.v1.dtos.knowledge_file_dtos import (
    KnowledgeFileResponse,
    KnowledgeFileListResponse,
    KnowledgeFileUploadResponse,
    KnowledgeFileDeleteResponse,
    KnowledgeFileReprocessResponse,
    KnowledgeFileUpdateRequest,
    SupportedExtensionsResponse,
    FileEmbeddingStatsResponse,
    KnowledgeFileCountResponse
)

router = APIRouter()


@router.post("/upload", response_model=KnowledgeFileUploadResponse)
async def upload_knowledge_file(
    file: UploadFile = File(..., description="File to upload"),
    workspace_id: str = Form(..., alias="workspaceId", description="Workspace ID"),
    folder_id: Optional[str] = Form(default=None, alias="folderId", description="Folder ID"),
    description: Optional[str] = Form(default=None, description="File description"),
    tags: Optional[str] = Form(default=None, description="Comma-separated tags"),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a file to the knowledge base
    
    Supports: PDF, DOCX, TXT, MD files.
    Files are automatically processed, text is extracted, and embeddings are generated.
    """
    knowledge_file_service = KnowledgeFileService()
    
    # Read file content
    file_content = await file.read()
    
    result = await knowledge_file_service.upload_file(
        file_content=file_content,
        original_filename=file.filename or "unknown",
        mime_type=file.content_type or "application/octet-stream",
        workspace_id=workspace_id,
        created_by=current_user.id,
        folder_id=folder_id,
        description=description,
        tags=tags
    )
    
    if not result["success"]:
        status_code = status.HTTP_400_BAD_REQUEST
        if "not found" in result.get("error", "").lower():
            status_code = status.HTTP_404_NOT_FOUND
        elif "duplicate" in result.get("error", "").lower():
            status_code = status.HTTP_409_CONFLICT
        
        raise HTTPException(
            status_code=status_code,
            detail=result["error"]
        )
    
    # Convert embedding stats if present
    embedding_stats = None
    if result["data"].get("embedding_stats"):
        embedding_stats = FileEmbeddingStatsResponse(**result["data"]["embedding_stats"])
    
    file_response = KnowledgeFileResponse(
        **{k: v for k, v in result["data"].items() if k != "embedding_stats"},
        embedding_stats=embedding_stats
    )
    
    return KnowledgeFileUploadResponse(
        success=True,
        file=file_response,
        message=result.get("message", "File uploaded successfully")
    )


@router.get("/count", response_model=KnowledgeFileCountResponse)
async def get_knowledge_files_count(
    workspace_id: str = Query(..., alias="workspaceId", description="Workspace ID"),
    current_user: User = Depends(get_current_active_user)
):
    """Get knowledge file counts for workspace statistics"""
    knowledge_file_service = KnowledgeFileService()
    
    result = knowledge_file_service.get_files_count(
        workspace_id=workspace_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return KnowledgeFileCountResponse(
        total=result["data"]["total"],
        processed=result["data"]["processed"],
        pending=result["data"]["pending"],
        failed=result["data"]["failed"]
    )


@router.get("/", response_model=KnowledgeFileListResponse)
async def get_knowledge_files(
    workspace_id: str = Query(..., alias="workspaceId", description="Workspace ID"),
    folder_id: Optional[str] = Query(default=None, alias="folderId", description="Filter by folder"),
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by status"),
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of items to return"),
    current_user: User = Depends(get_current_active_user)
):
    """Get knowledge files in workspace"""
    knowledge_file_service = KnowledgeFileService()
    
    result = knowledge_file_service.get_workspace_files(
        workspace_id=workspace_id,
        user_id=current_user.id,
        folder_id=folder_id,
        status=status_filter,
        skip=skip,
        limit=limit
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    # Convert file responses
    files = []
    for file_data in result["data"]["files"]:
        embedding_stats = None
        if file_data.get("embedding_stats"):
            embedding_stats = FileEmbeddingStatsResponse(**file_data["embedding_stats"])
        
        file_response = KnowledgeFileResponse(
            **{k: v for k, v in file_data.items() if k != "embedding_stats"},
            embedding_stats=embedding_stats
        )
        files.append(file_response)
    
    return KnowledgeFileListResponse(
        files=files,
        total=result["data"]["total"],
        skip=result["data"]["skip"],
        limit=result["data"]["limit"]
    )


@router.get("/supported-extensions", response_model=SupportedExtensionsResponse)
async def get_supported_extensions(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of supported file extensions"""
    knowledge_file_service = KnowledgeFileService()
    extensions = knowledge_file_service.get_supported_extensions()
    
    return SupportedExtensionsResponse(extensions=extensions)


@router.get("/{file_id}", response_model=KnowledgeFileResponse)
async def get_knowledge_file(
    file_id: str,
    workspace_id: str = Query(..., alias="workspaceId", description="Workspace ID"),
    current_user: User = Depends(get_current_active_user)
):
    """Get knowledge file by ID"""
    knowledge_file_service = KnowledgeFileService()
    
    result = knowledge_file_service.get_file(
        file_id=file_id,
        workspace_id=workspace_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        status_code = status.HTTP_400_BAD_REQUEST
        if "not found" in result.get("error", "").lower():
            status_code = status.HTTP_404_NOT_FOUND
        
        raise HTTPException(
            status_code=status_code,
            detail=result["error"]
        )
    
    # Convert embedding stats if present
    embedding_stats = None
    if result["data"].get("embedding_stats"):
        embedding_stats = FileEmbeddingStatsResponse(**result["data"]["embedding_stats"])
    
    return KnowledgeFileResponse(
        **{k: v for k, v in result["data"].items() if k != "embedding_stats"},
        embedding_stats=embedding_stats
    )


@router.put("/{file_id}", response_model=KnowledgeFileResponse)
async def update_knowledge_file(
    file_id: str,
    update_data: KnowledgeFileUpdateRequest,
    workspace_id: str = Query(..., alias="workspaceId", description="Workspace ID"),
    current_user: User = Depends(get_current_active_user)
):
    """Update knowledge file metadata"""
    knowledge_file_service = KnowledgeFileService()
    
    result = knowledge_file_service.update_file(
        file_id=file_id,
        workspace_id=workspace_id,
        user_id=current_user.id,
        folder_id=update_data.folder_id,
        description=update_data.description,
        tags=update_data.tags
    )
    
    if not result["success"]:
        status_code = status.HTTP_400_BAD_REQUEST
        if "not found" in result.get("error", "").lower():
            status_code = status.HTTP_404_NOT_FOUND
        
        raise HTTPException(
            status_code=status_code,
            detail=result["error"]
        )
    
    # Convert embedding stats if present
    embedding_stats = None
    if result["data"].get("embedding_stats"):
        embedding_stats = FileEmbeddingStatsResponse(**result["data"]["embedding_stats"])
    
    return KnowledgeFileResponse(
        **{k: v for k, v in result["data"].items() if k != "embedding_stats"},
        embedding_stats=embedding_stats
    )


@router.delete("/{file_id}", response_model=KnowledgeFileDeleteResponse)
async def delete_knowledge_file(
    file_id: str,
    workspace_id: str = Query(..., alias="workspaceId", description="Workspace ID"),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a knowledge file
    
    This will remove the file from storage and delete all associated embeddings.
    """
    knowledge_file_service = KnowledgeFileService()
    
    result = await knowledge_file_service.delete_file(
        file_id=file_id,
        workspace_id=workspace_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        status_code = status.HTTP_400_BAD_REQUEST
        if "not found" in result.get("error", "").lower():
            status_code = status.HTTP_404_NOT_FOUND
        
        raise HTTPException(
            status_code=status_code,
            detail=result["error"]
        )
    
    return KnowledgeFileDeleteResponse(
        success=True,
        message=result.get("message", "File deleted successfully")
    )


@router.post("/{file_id}/reprocess", response_model=KnowledgeFileReprocessResponse)
async def reprocess_knowledge_file(
    file_id: str,
    workspace_id: str = Query(..., alias="workspaceId", description="Workspace ID"),
    current_user: User = Depends(get_current_active_user)
):
    """Reprocess a knowledge file to regenerate embeddings
    
    Use this if the original processing failed or if you want to update embeddings.
    """
    knowledge_file_service = KnowledgeFileService()
    
    result = await knowledge_file_service.reprocess_file(
        file_id=file_id,
        workspace_id=workspace_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        status_code = status.HTTP_400_BAD_REQUEST
        if "not found" in result.get("error", "").lower():
            status_code = status.HTTP_404_NOT_FOUND
        
        raise HTTPException(
            status_code=status_code,
            detail=result["error"]
        )
    
    # Convert file response if present
    file_response = None
    if result.get("data"):
        embedding_stats = None
        if result["data"].get("embedding_stats"):
            embedding_stats = FileEmbeddingStatsResponse(**result["data"]["embedding_stats"])
        
        file_response = KnowledgeFileResponse(
            **{k: v for k, v in result["data"].items() if k != "embedding_stats"},
            embedding_stats=embedding_stats
        )
    
    return KnowledgeFileReprocessResponse(
        success=True,
        file=file_response,
        message="File reprocessed successfully"
    )
