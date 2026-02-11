"""
Shared dependencies for FastAPI application
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import get_user_from_token
from app.models.user import User
from app.models.workspace import Workspace

# Security scheme
security = HTTPBearer()

# Workspace header name
WORKSPACE_HEADER = "X-Workspace-Id"

# Global WebSocket manager instance
_websocket_manager = None


def get_websocket_manager():
    """Get the WebSocket manager instance"""
    global _websocket_manager
    if _websocket_manager is None:
        raise RuntimeError("WebSocket manager not initialized")
    return _websocket_manager


def set_websocket_manager(manager):
    """Set the WebSocket manager instance"""
    global _websocket_manager
    _websocket_manager = manager


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


async def get_workspace_id_from_header(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: User = Depends(get_current_active_user)
) -> str:
    """
    Get workspace ID from X-Workspace-Id header.
    Validates that the user has access to this workspace.
    """
    if not x_workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Workspace-Id header is required"
        )
    
    # Validate user has access to this workspace
    from app.repositories.workspace_member_repository import WorkspaceMemberRepository
    member_repo = WorkspaceMemberRepository()
    
    member = member_repo.get_active_member(x_workspace_id, current_user.id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this workspace"
        )
    
    return x_workspace_id


async def get_optional_workspace_id_from_header(
    x_workspace_id: Optional[str] = Header(None, alias="X-Workspace-Id"),
    current_user: User = Depends(get_current_active_user)
) -> Optional[str]:
    """
    Get optional workspace ID from X-Workspace-Id header.
    Returns None if header is not provided.
    If provided, validates that the user has access.
    """
    if not x_workspace_id:
        return None
    
    # Validate user has access to this workspace
    from app.repositories.workspace_member_repository import WorkspaceMemberRepository
    member_repo = WorkspaceMemberRepository()
    
    member = member_repo.get_active_member(x_workspace_id, current_user.id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this workspace"
        )
    
    return x_workspace_id


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
