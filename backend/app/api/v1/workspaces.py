"""
Workspace API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.core.dependencies import get_current_active_user
from app.services.workspace_service import WorkspaceService
from app.models.user import User
from app.api.v1.dtos.workspace_dtos import (
    WorkspaceCreateRequest,
    WorkspaceUpdateRequest,
    WorkspaceMemberAddRequest,
    WorkspaceMemberAddByEmailRequest,
    WorkspaceMemberUpdateRequest,
    WorkspaceResponse,
    WorkspaceCreateResponse,
    WorkspaceMemberResponse,
    WorkspaceListResponse,
    WorkspaceMemberListResponse,
    SuccessResponse
)
from app.core.dependencies import get_workspace_admin_or_owner, get_workspace_owner

router = APIRouter()


@router.post("/", response_model=WorkspaceCreateResponse)
async def create_workspace(
    workspace_data: WorkspaceCreateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new workspace with default knowledge base folders"""
    workspace_service = WorkspaceService()
    
    result = workspace_service.create_workspace(
        name=workspace_data.name,
        description=workspace_data.description,
        created_by=current_user.id,
        slug=workspace_data.slug,
        is_private=workspace_data.is_private,
        color=workspace_data.color,
        icon=workspace_data.icon,
        create_default_folders=workspace_data.create_default_folders
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return WorkspaceCreateResponse(
        workspace=WorkspaceResponse(**result["workspace"]),
        default_folders=result.get("default_folders", [])
    )


@router.get("/", response_model=WorkspaceListResponse)
async def get_user_workspaces(
    include_archived: bool = Query(default=False, description="Include archived workspaces"),
    current_user: User = Depends(get_current_active_user)
):
    """Get all workspaces for the current user"""
    workspace_service = WorkspaceService()
    
    workspaces = workspace_service.get_user_workspaces(
        user_id=current_user.id,
        include_archived=include_archived
    )
    
    return WorkspaceListResponse(workspaces=workspaces)


@router.get("/search", response_model=WorkspaceListResponse)
async def search_workspaces(
    q: str = Query(..., description="Search term"),
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of items to return"),
    current_user: User = Depends(get_current_active_user)
):
    """Search workspaces"""
    workspace_service = WorkspaceService()
    
    workspaces = workspace_service.search_workspaces(
        search_term=q,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    return WorkspaceListResponse(workspaces=workspaces)


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get workspace by ID"""
    workspace_service = WorkspaceService()
    
    workspace = workspace_service.get_workspace(
        workspace_id=workspace_id,
        user_id=current_user.id
    )
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    return WorkspaceResponse(**workspace)


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    update_data: WorkspaceUpdateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Update workspace"""
    workspace_service = WorkspaceService()
    
    result = workspace_service.update_workspace(
        workspace_id=workspace_id,
        update_data=update_data.model_dump(exclude_unset=True, by_alias=False),
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
    
    return WorkspaceResponse(**result["workspace"])


@router.delete("/{workspace_id}", response_model=SuccessResponse)
async def delete_workspace(
    workspace_id: str,
    current_user_and_role: tuple[User, str] = Depends(get_workspace_owner)
):
    """Delete workspace (requires owner role)"""
    current_user, user_role = current_user_and_role
    
    workspace_service = WorkspaceService()
    
    result = workspace_service.delete_workspace(
        workspace_id=workspace_id,
        user_id=current_user.id
    )
    
    if not result["success"]:
        if "owner" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return SuccessResponse(message=result["message"])


@router.get("/{workspace_id}/members", response_model=WorkspaceMemberListResponse)
async def get_workspace_members(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get workspace members"""
    workspace_service = WorkspaceService()
    
    members = workspace_service.get_workspace_members(
        workspace_id=workspace_id,
        user_id=current_user.id
    )
    
    return WorkspaceMemberListResponse(members=members)


@router.post("/{workspace_id}/members", response_model=WorkspaceMemberResponse)
async def add_workspace_member(
    workspace_id: str,
    member_data: WorkspaceMemberAddRequest,
    current_user_and_role: tuple[User, str] = Depends(get_workspace_admin_or_owner)
):
    """Add member to workspace with enhanced role-based validation"""
    current_user, user_role = current_user_and_role
    
    workspace_service = WorkspaceService()
    
    result = workspace_service.add_member(
        workspace_id=workspace_id,
        user_id=member_data.user_id,
        role=member_data.role,
        requester_id=current_user.id
    )
    
    if not result["success"]:
        error_detail = result["error"]
        
        # Map specific errors to appropriate HTTP status codes
        if any(keyword in error_detail.lower() for keyword in ["permission", "insufficient", "cannot", "only"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_detail
            )
        elif any(keyword in error_detail.lower() for keyword in ["not found", "doesn't exist"]):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_detail
            )
        elif any(keyword in error_detail.lower() for keyword in ["already", "maximum", "invalid"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail
            )
    
    return WorkspaceMemberResponse(**result["member"])


@router.post("/{workspace_id}/members/invite", response_model=WorkspaceMemberResponse)
async def add_workspace_member_by_email(
    workspace_id: str,
    member_data: WorkspaceMemberAddByEmailRequest,
    current_user_and_role: tuple[User, str] = Depends(get_workspace_admin_or_owner)
):
    """Add member to workspace by email address"""
    current_user, user_role = current_user_and_role
    
    workspace_service = WorkspaceService()
    
    result = workspace_service.add_member_by_email(
        workspace_id=workspace_id,
        email=member_data.email,
        role=member_data.role,
        requester_id=current_user.id
    )
    
    if not result["success"]:
        error_detail = result["error"]
        
        if any(keyword in error_detail.lower() for keyword in ["permission", "insufficient", "cannot", "only"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_detail
            )
        elif any(keyword in error_detail.lower() for keyword in ["not found", "no user found"]):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_detail
            )
        elif any(keyword in error_detail.lower() for keyword in ["already", "maximum", "invalid"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail
            )
    
    return WorkspaceMemberResponse(**result["member"])


@router.put("/{workspace_id}/members/{user_id}", response_model=SuccessResponse)
async def update_workspace_member(
    workspace_id: str,
    user_id: str,
    member_data: WorkspaceMemberUpdateRequest,
    current_user_and_role: tuple[User, str] = Depends(get_workspace_admin_or_owner)
):
    """Update workspace member role with enhanced role-based validation"""
    current_user, user_role = current_user_and_role
    
    workspace_service = WorkspaceService()
    
    result = workspace_service.update_member_role(
        workspace_id=workspace_id,
        user_id=user_id,
        role=member_data.role,
        requester_id=current_user.id
    )
    
    if not result["success"]:
        error_detail = result["error"]
        
        # Map specific errors to appropriate HTTP status codes
        if any(keyword in error_detail.lower() for keyword in ["permission", "insufficient", "cannot", "only"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_detail
            )
        elif any(keyword in error_detail.lower() for keyword in ["not found", "doesn't exist"]):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_detail
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail
            )
    
    return SuccessResponse(message=result["message"])


@router.delete("/{workspace_id}/members/{user_id}", response_model=SuccessResponse)
async def remove_workspace_member(
    workspace_id: str,
    user_id: str,
    current_user_and_role: tuple[User, str] = Depends(get_workspace_admin_or_owner)
):
    """Remove member from workspace with enhanced role-based validation"""
    current_user, user_role = current_user_and_role
    
    workspace_service = WorkspaceService()
    
    result = workspace_service.remove_member(
        workspace_id=workspace_id,
        user_id=user_id,
        requester_id=current_user.id
    )
    
    if not result["success"]:
        error_detail = result["error"]
        
        # Map specific errors to appropriate HTTP status codes
        if any(keyword in error_detail.lower() for keyword in ["permission", "insufficient", "cannot", "only", "owner"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_detail
            )
        elif any(keyword in error_detail.lower() for keyword in ["not found", "doesn't exist"]):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_detail
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail
            )
    
    return SuccessResponse(message=result["message"])


@router.post("/{workspace_id}/archive", response_model=SuccessResponse)
async def archive_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Archive workspace"""
    workspace_service = WorkspaceService()
    
    result = workspace_service.archive_workspace(
        workspace_id=workspace_id,
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
    
    return SuccessResponse(message=result["message"])


@router.post("/{workspace_id}/unarchive", response_model=SuccessResponse)
async def unarchive_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Unarchive workspace"""
    workspace_service = WorkspaceService()
    
    result = workspace_service.unarchive_workspace(
        workspace_id=workspace_id,
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
    
    return SuccessResponse(message=result["message"])


@router.post("/{workspace_id}/default-folders", response_model=SuccessResponse)
async def create_default_folders(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Create default knowledge base folders for an existing workspace"""
    workspace_service = WorkspaceService()
    folder_service = workspace_service.folder_service
    
    # Check if user has access to workspace
    workspace = workspace_service.get_workspace(workspace_id, current_user.id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Create default folders
    result = folder_service.create_default_knowledge_folders(workspace_id, current_user.id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return SuccessResponse(
        message=f"Created {len(result.get('folders', []))} default folders for workspace"
    )
