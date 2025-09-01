"""
Note management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.note_service import NoteService
from app.api.v1.dtos.note_dtos import (
    NoteCreateRequest,
    NoteUpdateRequest,
    NoteResponse,
    NoteListResponse,
    NoteCreateResponse,
    NoteDeleteResponse
)

router = APIRouter()


@router.post("/", response_model=NoteCreateResponse)
async def create_note(
    note_data: NoteCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new note"""
    note_service = NoteService(db)
    
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
        note=NoteResponse(**result["note"]),
        message="Note created successfully"
    )


@router.get("/", response_model=NoteListResponse)
async def get_notes(
    workspace_id: str = Query(..., alias="workspaceId", description="Workspace ID"),
    folder_id: Optional[str] = Query(default=None, alias="folderId", description="Folder ID to filter by"),
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of items to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notes in workspace"""
    note_service = NoteService(db)
    
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
        notes=[NoteResponse(**note) for note in result["notes"]],
        total=result["total"],
        skip=skip,
        limit=limit
    )


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get note by ID"""
    note_service = NoteService(db)
    
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
    
    return NoteResponse(**result["note"])


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    update_data: NoteUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update note"""
    note_service = NoteService(db)
    
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
    
    return NoteResponse(**result["note"])


@router.delete("/{note_id}", response_model=NoteDeleteResponse)
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete note"""
    note_service = NoteService(db)
    
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
