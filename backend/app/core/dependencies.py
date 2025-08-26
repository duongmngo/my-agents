"""
Shared dependencies for FastAPI application
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_user_from_token
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.workspace_repository import WorkspaceRepository

# Security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user = get_user_from_token(db, credentials.credentials)
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


async def get_current_tenant_id(
    current_user: User = Depends(get_current_active_user)
) -> str:
    """
    Get current user's tenant ID
    """
    return current_user.tenant_id


async def get_current_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Workspace:
    """
    Get current workspace and verify user access
    """
    workspace_repo = WorkspaceRepository(db)
    workspace = workspace_repo.get_by_id(workspace_id, current_user.tenant_id)
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Check if user has access to this workspace
    if not workspace_repo.user_has_access(workspace_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this workspace"
        )
    
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


def get_tenant_from_request(request: Request) -> Optional[str]:
    """
    Extract tenant ID from request headers or subdomain
    """
    # Try to get tenant from header first
    tenant_id = request.headers.get("X-Tenant-ID")
    
    if not tenant_id:
        # Try to extract from subdomain
        host = request.headers.get("host", "")
        if "." in host:
            subdomain = host.split(".")[0]
            # Only use subdomain if it's not 'www' or 'api'
            if subdomain not in ["www", "api"]:
                tenant_id = subdomain
    
    return tenant_id


def validate_tenant_access(user_tenant: str, request_tenant: str) -> bool:
    """
    Validate that user has access to the requested tenant
    """
    return user_tenant == request_tenant
