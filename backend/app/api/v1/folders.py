"""
Folder management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.folder_service import FolderService
from app.api.v1.dtos.folder_dtos import (
    FolderCreateRequest,
    FolderUpdateRequest,
    FolderResponse,
    FolderListResponse,
    FolderCreateResponse,
    FolderDeleteResponse,
    FolderCategory
)

router = APIRouter()


@router.post("/", response_model=FolderCreateResponse)
async def create_folder(
    folder_data: FolderCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new folder"""
    folder_service = FolderService(db)
    
    result = folder_service.create_folder(
        name=folder_data.name,
        workspace_id=folder_data.workspace_id,
        created_by=current_user.id,
        category=folder_data.category,
        parent_id=folder_data.parent_id,
        description=folder_data.description,
        color=folder_data.color,
        icon=folder_data.icon
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    folder = result["folder"]
    return FolderCreateResponse(
        folder=FolderResponse(
            id=folder["id"],
            name=folder["name"],
            description=folder["description"],
            category=folder["category"],
            workspace_id=folder["workspace_id"],
            parent_id=folder["parent_id"],
            path=folder["path"],
            level=folder["level"],
            color=folder["color"],
            icon=folder["icon"],
            is_private=folder["is_private"],
            is_pinned=folder["is_pinned"],
            is_archived=folder["is_archived"],
            created_by=folder["created_by"],
            created_at=folder["created_at"],
            updated_at=folder["updated_at"]
        )
    )


@router.get("/", response_model=FolderListResponse)
async def get_folders(
    workspace_id: str = Query(..., alias="workspaceId"),
    category: Optional[FolderCategory] = Query(default=None),
    parent_id: Optional[str] = Query(default=None, alias="parentId"),
    include_children: bool = Query(default=False, alias="includeChildren"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get folders in workspace"""
    folder_service = FolderService(db)
    
    folders = folder_service.get_workspace_folders(
        workspace_id=workspace_id,
        category=category,
        parent_id=parent_id,
        include_children=include_children
    )
    
    return FolderListResponse(
        folders=[
            FolderResponse(
                id=folder["id"],
                name=folder["name"],
                description=folder["description"],
                category=folder["category"],
                workspace_id=folder["workspace_id"],
                parent_id=folder["parent_id"],
                path=folder["path"],
                level=folder["level"],
                color=folder["color"],
                icon=folder["icon"],
                is_private=folder["is_private"],
                is_pinned=folder["is_pinned"],
                is_archived=folder["is_archived"],
                created_by=folder["created_by"],
                created_at=folder["created_at"],
                updated_at=folder["updated_at"]
            ) for folder in folders
        ],
        total=len(folders)
    )


@router.get("/knowledge-base", response_model=FolderListResponse)
async def get_knowledge_base_folders(
    workspace_id: str = Query(..., alias="workspaceId"),
    category: FolderCategory = Query(..., description="Folder category (files or notes)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get knowledge base folders by category (files or notes)"""
    folder_service = FolderService(db)
    
    folders = folder_service.get_workspace_folders(
        workspace_id=workspace_id,
        category=category,
        include_children=True
    )
    
    return FolderListResponse(
        folders=[
            FolderResponse(
                id=folder["id"],
                name=folder["name"],
                description=folder["description"],
                category=folder["category"],
                workspace_id=folder["workspace_id"],
                parent_id=folder["parent_id"],
                path=folder["path"],
                level=folder["level"],
                color=folder["color"],
                icon=folder["icon"],
                is_private=folder["is_private"],
                is_pinned=folder["is_pinned"],
                is_archived=folder["is_archived"],
                created_by=folder["created_by"],
                created_at=folder["created_at"],
                updated_at=folder["updated_at"]
            ) for folder in folders
        ],
        total=len(folders)
    )


@router.get("/{folder_id}", response_model=FolderResponse)
async def get_folder(
    folder_id: str,
    workspace_id: str = Query(..., alias="workspaceId"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get folder by ID"""
    folder_service = FolderService(db)
    
    folder = folder_service.get_folder(folder_id, workspace_id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    return FolderResponse(
        id=folder["id"],
        name=folder["name"],
        description=folder["description"],
        category=folder["category"],
        workspace_id=folder["workspace_id"],
        parent_id=folder["parent_id"],
        path=folder["path"],
        level=folder["level"],
        color=folder["color"],
        icon=folder["icon"],
        is_private=folder["is_private"],
        is_pinned=folder["is_pinned"],
        is_archived=folder["is_archived"],
        created_by=folder["created_by"],
        created_at=folder["created_at"],
        updated_at=folder["updated_at"]
    )


@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: str,
    update_data: FolderUpdateRequest,
    workspace_id: str = Query(..., alias="workspaceId"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update folder"""
    folder_service = FolderService(db)
    
    update_dict = update_data.dict(exclude_unset=True)
    result = folder_service.update_folder(folder_id, workspace_id, update_dict)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    folder = result["folder"]
    return FolderResponse(
        id=folder["id"],
        name=folder["name"],
        description=folder["description"],
        category=folder["category"],
        workspace_id=folder["workspace_id"],
        parent_id=folder["parent_id"],
        path=folder["path"],
        level=folder["level"],
        color=folder["color"],
        icon=folder["icon"],
        is_private=folder["is_private"],
        is_pinned=folder["is_pinned"],
        is_archived=folder["is_archived"],
        created_by=folder["created_by"],
        created_at=folder["created_at"],
        updated_at=folder["updated_at"]
    )


@router.delete("/{folder_id}", response_model=FolderDeleteResponse)
async def delete_folder(
    folder_id: str,
    workspace_id: str = Query(..., alias="workspaceId"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete folder"""
    folder_service = FolderService(db)
    
    result = folder_service.delete_folder(folder_id, workspace_id)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return FolderDeleteResponse(message=result["message"])


@router.post("/{folder_id}/move", response_model=FolderResponse)
async def move_folder(
    folder_id: str,
    new_parent_id: Optional[str] = None,
    workspace_id: str = Query(..., alias="workspaceId"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Move folder to a new parent"""
    folder_service = FolderService(db)
    
    result = folder_service.move_folder(folder_id, new_parent_id, workspace_id)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    folder = result["folder"]
    return FolderResponse(
        id=folder["id"],
        name=folder["name"],
        description=folder["description"],
        category=folder["category"],
        workspace_id=folder["workspace_id"],
        parent_id=folder["parent_id"],
        path=folder["path"],
        level=folder["level"],
        color=folder["color"],
        icon=folder["icon"],
        is_private=folder["is_private"],
        is_pinned=folder["is_pinned"],
        is_archived=folder["is_archived"],
        created_by=folder["created_by"],
        created_at=folder["created_at"],
        updated_at=folder["updated_at"]
    )


@router.get("/{folder_id}/breadcrumbs")
async def get_folder_breadcrumbs(
    folder_id: str,
    workspace_id: str = Query(..., alias="workspaceId"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get breadcrumb trail for a folder"""
    folder_service = FolderService(db)
    
    breadcrumbs = folder_service.get_folder_breadcrumbs(folder_id, workspace_id)
    return {"breadcrumbs": breadcrumbs}


@router.get("/search/")
async def search_folders(
    search_term: str = Query(..., alias="searchTerm"),
    workspace_id: str = Query(..., alias="workspaceId"),
    category: Optional[FolderCategory] = Query(default=None),
    skip: int = Query(default=0),
    limit: int = Query(default=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Search folders in workspace"""
    folder_service = FolderService(db)
    
    folders = folder_service.search_folders(search_term, workspace_id, category, skip, limit)
    return {
        "folders": [
            FolderResponse(
                id=folder["id"],
                name=folder["name"],
                description=folder["description"],
                category=folder["category"],
                workspace_id=folder["workspace_id"],
                parent_id=folder["parent_id"],
                path=folder["path"],
                level=folder["level"],
                color=folder["color"],
                icon=folder["icon"],
                is_private=folder["is_private"],
                is_pinned=folder["is_pinned"],
                is_archived=folder["is_archived"],
                created_by=folder["created_by"],
                created_at=folder["created_at"],
                updated_at=folder["updated_at"]
            ) for folder in folders
        ],
        "total": len(folders)
    }
