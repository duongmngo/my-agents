"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_active_user
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter()


# Request/Response Models
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    first_name: str = None
    last_name: str = None
    tenant_id: str


class UserLogin(BaseModel):
    identifier: str  # email or username
    password: str
    tenant_id: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class AuthResponse(BaseModel):
    success: bool
    user: dict = None
    tokens: TokenResponse = None
    error: str = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UserProfileUpdate(BaseModel):
    first_name: str = None
    last_name: str = None
    bio: str = None
    avatar_url: str = None
    timezone: str = None
    language: str = None


@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    auth_service = AuthService(db)
    
    result = auth_service.register_user(
        email=user_data.email,
        username=user_data.username,
        password=user_data.password,
        tenant_id=user_data.tenant_id,
        first_name=user_data.first_name,
        last_name=user_data.last_name
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return AuthResponse(**result)


@router.post("/login", response_model=AuthResponse)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login user and return tokens"""
    auth_service = AuthService(db)
    
    result = auth_service.login(
        identifier=login_data.identifier,
        password=login_data.password,
        tenant_id=login_data.tenant_id
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["error"]
        )
    
    return AuthResponse(**result)


@router.post("/refresh", response_model=dict)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    auth_service = AuthService(db)
    
    result = auth_service.refresh_token(token_data.refresh_token)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["error"]
        )
    
    return result["tokens"]


@router.get("/me")
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    auth_service = AuthService(db)
    
    profile = auth_service.get_user_profile(current_user.id, current_user.tenant_id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    return profile


@router.put("/me")
async def update_current_user_profile(
    update_data: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    auth_service = AuthService(db)
    
    result = auth_service.update_user_profile(
        user_id=current_user.id,
        update_data=update_data.dict(exclude_unset=True),
        tenant_id=current_user.tenant_id
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return result["user"]


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    auth_service = AuthService(db)
    
    result = auth_service.change_password(
        user_id=current_user.id,
        current_password=password_data.current_password,
        new_password=password_data.new_password,
        tenant_id=current_user.tenant_id
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return {"message": result["message"]}


@router.post("/verify-email/{user_id}")
async def verify_email(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Verify user email (admin only or self)"""
    auth_service = AuthService(db)
    
    # Only allow users to verify their own email or admins to verify any email
    if current_user.id != user_id and current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    result = auth_service.verify_user_email(user_id, current_user.tenant_id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return {"message": result["message"]}


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Logout user (client should discard tokens)"""
    # In a more sophisticated setup, you might want to:
    # - Add token to blacklist
    # - Clear server-side sessions
    # - Log the logout event
    
    return {"message": "Logged out successfully"}
