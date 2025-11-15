"""
Note management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime
from typing import Optional

from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.note_service import NoteService
from app.api.v1.dtos.note_dtos import (
    NoteCreateRequest,
    NoteUpdateRequest,
    NoteResponse,
    NoteListResponse,
    NoteCreateResponse,
    NoteDeleteResponse,
    NoteEmbedResponse
)

router = APIRouter()


@router.post("/", response_model=NoteCreateResponse)
async def create_note(
    note_data: NoteCreateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new note"""
    note_service = NoteService()
    
    result = note_service.create_note(
        title=note_data.title,
        content=note_data.content or "",
        workspace_id=note_data.workspace_id,
        created_by=current_user.id,
        folder_id=note_data.folder_id
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return NoteCreateResponse(
        note=NoteResponse(**result["data"]),
        message=result["message"]
    )


@router.get("/", response_model=NoteListResponse)
async def get_notes(
    workspace_id: str = Query(..., alias="workspaceId", description="Workspace ID"),
    folder_id: Optional[str] = Query(default=None, alias="folderId", description="Folder ID to filter by"),
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of items to return"),
    current_user: User = Depends(get_current_active_user)
):
    """Get notes in workspace"""
    note_service = NoteService()
    
    result = note_service.get_workspace_notes(
        workspace_id=workspace_id,
        user_id=current_user.id,
        folder_id=folder_id,
        skip=skip,
        limit=limit
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return NoteListResponse(
        notes=[NoteResponse(**note) for note in result["data"]["notes"]],
        total=result["data"]["total"],
        skip=result["data"]["skip"],
        limit=result["data"]["limit"]
    )


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get note by ID"""
    note_service = NoteService()
    
    result = note_service.get_note(note_id, current_user.id)
    
    if not result["success"]:
        if "not found" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return NoteResponse(**result["data"])


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    update_data: NoteUpdateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Update note"""
    note_service = NoteService()
    
    # Convert DTO to dict, excluding None values
    update_dict = update_data.model_dump(exclude_unset=True, by_alias=False)
    
    result = note_service.update_note(
        note_id=note_id,
        update_data=update_dict,
        user_id=current_user.id
    )
    
    if not result["success"]:
        if "not found" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        elif "permission" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return NoteResponse(**result["data"])


@router.delete("/{note_id}", response_model=NoteDeleteResponse)
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete note"""
    note_service = NoteService()
    
    result = note_service.delete_note(note_id, current_user.id)
    
    if not result["success"]:
        if "not found" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        elif "permission" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return NoteDeleteResponse(message=result["message"])


@router.post("/{note_id}/embed", response_model=NoteEmbedResponse)
def embed_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Generate embedding for a note using workspace's active embedding provider"""
    note_service = NoteService()
    
    result = note_service.generate_note_embedding(
        note_id=note_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        error_code = result.get("error_code", "UNKNOWN_ERROR")
        
        if "not found" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "message": result["error"],
                    "error_code": error_code
                }
            )
        elif "access" in result["error"].lower() or "permission" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "message": result["error"],
                    "error_code": error_code
                }
            )
        elif error_code == "NO_ACTIVE_EMBEDDING_PROVIDER":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "No active embedding provider configured for this workspace. Please configure an embedding provider in workspace settings.",
                    "error_code": error_code
                }
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": result["error"],
                    "error_code": error_code
                }
            )
    
    return NoteEmbedResponse(
        note_id=result["note_id"],
        dimension=result["dimension"],
        model=result["model"],
        provider=result["provider"],
        latency_ms=result["latency_ms"],
        tokens_processed=result["tokens_processed"],
        message=result["message"]
    )
