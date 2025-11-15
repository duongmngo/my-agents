"""
User management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime

from app.core.dependencies import get_current_active_user, get_admin_user
from app.models.user import User
from app.api.v1.dtos.user_dtos import (
    UserResponse,
    UserListResponse,
    UserActivateResponse,
    UserDeactivateResponse
)

router = APIRouter()


@router.get("/", response_model=UserListResponse)
async def get_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_admin_user)
):
    """Get users (admin only)"""
    # TODO: Implement user listing
    return UserListResponse(
        users=[],
        total=0,
        skip=skip,
        limit=limit
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get user by ID"""
    # TODO: Implement user retrieval
    return UserResponse(
        id=user_id,
        email="",
        username="",
        full_name="",
        role="",
        is_active=True,
        is_verified=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@router.put("/{user_id}/activate", response_model=UserActivateResponse)
async def activate_user(
    user_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Activate user (admin only)"""
    # TODO: Implement user activation
    return UserActivateResponse(message="User activated successfully")


@router.put("/{user_id}/deactivate", response_model=UserDeactivateResponse)
async def deactivate_user(
    user_id: str,
    current_user: User = Depends(get_admin_user)
):
    """Deactivate user (admin only)"""
    # TODO: Implement user deactivation
    return UserDeactivateResponse(message="User deactivated successfully")
