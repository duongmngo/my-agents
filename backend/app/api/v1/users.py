"""
User management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from datetime import datetime

from app.core.dependencies import get_current_active_user, get_admin_user
from app.models.user import User
from app.services.user_service import UserService
from app.api.v1.dtos.user_dtos import (
    ProfileResponse,
    ProfileUpdateRequest,
    PasswordChangeRequest,
    PasswordChangeResponse,
    AvatarUploadResponse,
    UserResponse,
    UserListResponse,
    UserActivateResponse,
    UserDeactivateResponse,
    SuccessResponse
)

router = APIRouter()


# ==================== Current User Profile Endpoints ====================

@router.get("/me", response_model=ProfileResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's profile"""
    user_service = UserService()
    
    result = user_service.get_profile(current_user.id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"]
        )
    
    return ProfileResponse(**result["profile"])


@router.put("/me", response_model=ProfileResponse)
async def update_current_user_profile(
    update_data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Update current user's profile"""
    user_service = UserService()
    
    result = user_service.update_profile(
        user_id=current_user.id,
        update_data=update_data.model_dump(exclude_unset=True, by_alias=False)
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return ProfileResponse(**result["profile"])


@router.put("/me/password", response_model=PasswordChangeResponse)
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Change current user's password"""
    user_service = UserService()
    
    result = user_service.change_password(
        user_id=current_user.id,
        current_password=password_data.current_password,
        new_password=password_data.new_password
    )
    
    if not result["success"]:
        if "incorrect" in result["error"].lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=result["error"]
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return PasswordChangeResponse(message=result["message"])


@router.post("/me/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload user avatar
    
    Accepts JPEG, PNG, or WebP images. Images will be resized to max 256x256 pixels.
    """
    user_service = UserService()
    
    # Read file content
    content = await file.read()
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB"
        )
    
    result = user_service.upload_avatar(
        user_id=current_user.id,
        file_content=content,
        filename=file.filename or "avatar.jpg",
        content_type=file.content_type or "image/jpeg"
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return AvatarUploadResponse(
        avatar_url=result["avatar_url"],
        message=result["message"]
    )


# ==================== User Search Endpoints ====================

@router.get("/search", response_model=UserListResponse)
async def search_users(
    q: str = Query(..., min_length=2, description="Search query (email, username, or name)"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user)
):
    """Search users by email, username, or name (for adding workspace members)"""
    user_service = UserService()
    
    result = user_service.search_users_by_email(q, limit=limit)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    users = [UserResponse(
        id=u["id"],
        email=u["email"],
        username=u["username"],
        full_name=u["full_name"],
        avatar_url=u.get("avatar_url"),
        role="user",  # Don't expose actual role in search
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow(),  # Don't expose actual timestamps in search
        updated_at=None
    ) for u in result["users"]]
    
    return UserListResponse(
        users=users,
        total=len(users),
        skip=skip,
        limit=limit
    )


# ==================== Admin User Management Endpoints ====================

@router.get("/", response_model=UserListResponse)
async def get_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_admin_user)
):
    """Get users (admin only)"""
    # TODO: Implement user listing with pagination
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
    user_service = UserService()
    
    result = user_service.get_profile(user_id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"]
        )
    
    profile = result["profile"]
    return UserResponse(
        id=profile["id"],
        email=profile["email"],
        username=profile["username"],
        full_name=profile["full_name"],
        avatar_url=profile.get("avatar_url"),
        role=profile["role"],
        is_active=profile["is_active"],
        is_verified=profile["is_verified"],
        last_login=profile.get("last_login"),
        created_at=profile["created_at"],
        updated_at=profile.get("updated_at")
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
