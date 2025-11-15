"""
Shared dependencies for FastAPI application
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import get_user_from_token
from app.models.user import User
from app.models.workspace import Workspace

# Security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user = get_user_from_token(credentials.credentials)
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (must be active)
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


# get_current_tenant_id removed - no longer needed since each user is their own tenant


async def get_current_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Workspace:
    """
    Get current workspace and verify user access
    """
    from app.services.workspace_service import WorkspaceService
    
    workspace_service = WorkspaceService()
    workspace_dict = workspace_service.get_workspace(workspace_id, current_user.id)
    
    if not workspace_dict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Convert dict to Workspace model for compatibility
    from app.models.workspace import Workspace
    workspace = Workspace(**workspace_dict)
    
    return workspace


async def get_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get current user and verify admin privileges
    """
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


async def get_super_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get current user and verify super admin privileges
    """
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required"
        )
    return current_user


async def get_workspace_admin_or_owner(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user)
) -> tuple[User, str]:
    """
    Get current user and verify they have admin or owner role in the workspace
    Returns tuple of (user, user_role_in_workspace)
    """
    from app.services.workspace_service import WorkspaceService
    
    workspace_service = WorkspaceService()
    access_result = workspace_service.check_user_access(workspace_id, current_user.id)
    
    if not access_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this workspace"
        )
    
    # Get user's role in workspace
    user_role = access_result["data"]["user_role"]
    
    if user_role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or owner role required for this operation"
        )
    
    return current_user, user_role


async def get_workspace_owner(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user)
) -> tuple[User, str]:
    """
    Get current user and verify they have owner role in the workspace
    Returns tuple of (user, user_role_in_workspace)
    """
    from app.services.workspace_service import WorkspaceService
    
    workspace_service = WorkspaceService()
    access_result = workspace_service.check_user_access(workspace_id, current_user.id)
    
    if not access_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this workspace"
        )
    
    # Get user's role in workspace
    user_role = access_result["data"]["user_role"]
    
    if user_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner role required for this operation"
        )
    
    return current_user, user_role


async def get_workspace_member(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user)
) -> tuple[User, str]:
    """
    Get current user and verify they are a member of the workspace
    Returns tuple of (user, user_role_in_workspace)
    """
    from app.services.workspace_service import WorkspaceService
    
    workspace_service = WorkspaceService()
    access_result = workspace_service.check_user_access(workspace_id, current_user.id)
    
    if not access_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this workspace"
        )
    
    # Get user's role in workspace
    user_role = access_result["data"]["user_role"]
    
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace"
        )
    
    return current_user, user_role


# Tenant-related functions removed - no longer needed since each user is their own tenant
