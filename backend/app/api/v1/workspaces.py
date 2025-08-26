"""
Workspace API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.services.workspace_service import WorkspaceService
from app.models.user import User

router = APIRouter()


# Request/Response Models
class WorkspaceCreate(BaseModel):
    name: str
    description: str = None
    slug: str = None
    is_private: bool = False
    color: str = None
    icon: str = None


class WorkspaceUpdate(BaseModel):
    name: str = None
    description: str = None
    slug: str = None
    is_private: bool = None
    color: str = None
    icon: str = None


class WorkspaceMemberAdd(BaseModel):
    user_id: str
    role: str = "member"


class WorkspaceMemberUpdate(BaseModel):
    role: str


@router.post("/")
async def create_workspace(
    workspace_data: WorkspaceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new workspace"""
    workspace_service = WorkspaceService(db)
    
    result = workspace_service.create_workspace(
        name=workspace_data.name,
        description=workspace_data.description,
        tenant_id=current_user.tenant_id,
        created_by=current_user.id,
        slug=workspace_data.slug,
        is_private=workspace_data.is_private,
        color=workspace_data.color,
        icon=workspace_data.icon
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return result["workspace"]


@router.get("/")
async def get_user_workspaces(
    include_archived: bool = Query(default=False, description="Include archived workspaces"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all workspaces for the current user"""
    workspace_service = WorkspaceService(db)
    
    workspaces = workspace_service.get_user_workspaces(
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        include_archived=include_archived
    )
    
    return {"workspaces": workspaces}


@router.get("/search")
async def search_workspaces(
    q: str = Query(..., description="Search term"),
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of items to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Search workspaces"""
    workspace_service = WorkspaceService(db)
    
    workspaces = workspace_service.search_workspaces(
        search_term=q,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    return {"workspaces": workspaces}


@router.get("/{workspace_id}")
async def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get workspace by ID"""
    workspace_service = WorkspaceService(db)
    
    workspace = workspace_service.get_workspace(
        workspace_id=workspace_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    return workspace


@router.put("/{workspace_id}")
async def update_workspace(
    workspace_id: str,
    update_data: WorkspaceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update workspace"""
    workspace_service = WorkspaceService(db)
    
    result = workspace_service.update_workspace(
        workspace_id=workspace_id,
        update_data=update_data.dict(exclude_unset=True),
        tenant_id=current_user.tenant_id,
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
    
    return result["workspace"]


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete workspace"""
    workspace_service = WorkspaceService(db)
    
    result = workspace_service.delete_workspace(
        workspace_id=workspace_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        if "not found" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        elif "permission" in result["error"].lower() or "owner" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return {"message": result["message"]}


@router.get("/{workspace_id}/members")
async def get_workspace_members(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get workspace members"""
    workspace_service = WorkspaceService(db)
    
    members = workspace_service.get_workspace_members(
        workspace_id=workspace_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    
    return {"members": members}


@router.post("/{workspace_id}/members")
async def add_workspace_member(
    workspace_id: str,
    member_data: WorkspaceMemberAdd,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add member to workspace"""
    workspace_service = WorkspaceService(db)
    
    result = workspace_service.add_member(
        workspace_id=workspace_id,
        user_id=member_data.user_id,
        role=member_data.role,
        tenant_id=current_user.tenant_id,
        requester_id=current_user.id
    )
    
    if not result["success"]:
        if "permission" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return result["member"]


@router.put("/{workspace_id}/members/{user_id}")
async def update_workspace_member(
    workspace_id: str,
    user_id: str,
    member_data: WorkspaceMemberUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update workspace member role"""
    workspace_service = WorkspaceService(db)
    
    result = workspace_service.update_member_role(
        workspace_id=workspace_id,
        user_id=user_id,
        role=member_data.role,
        tenant_id=current_user.tenant_id,
        requester_id=current_user.id
    )
    
    if not result["success"]:
        if "permission" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=result["error"]
            )
        elif "not found" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return {"message": result["message"]}


@router.delete("/{workspace_id}/members/{user_id}")
async def remove_workspace_member(
    workspace_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove member from workspace"""
    workspace_service = WorkspaceService(db)
    
    result = workspace_service.remove_member(
        workspace_id=workspace_id,
        user_id=user_id,
        tenant_id=current_user.tenant_id,
        requester_id=current_user.id
    )
    
    if not result["success"]:
        if "permission" in result["error"].lower() or "owner" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=result["error"]
            )
        elif "not found" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return {"message": result["message"]}


@router.post("/{workspace_id}/archive")
async def archive_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Archive workspace"""
    workspace_service = WorkspaceService(db)
    
    result = workspace_service.archive_workspace(
        workspace_id=workspace_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        if "permission" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=result["error"]
            )
        elif "not found" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return {"message": result["message"]}


@router.post("/{workspace_id}/unarchive")
async def unarchive_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unarchive workspace"""
    workspace_service = WorkspaceService(db)
    
    result = workspace_service.unarchive_workspace(
        workspace_id=workspace_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        if "permission" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=result["error"]
            )
        elif "not found" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return {"message": result["message"]}
