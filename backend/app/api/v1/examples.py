"""
Comprehensive examples of Pydantic models for camelCase API responses
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

router = APIRouter()


# ============================================================================
# EXAMPLE 1: Basic Field Aliases (Recommended Approach)
# ============================================================================

class UserBasic(BaseModel):
    """Basic user model with field aliases"""
    id: str
    email: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    is_active: bool = Field(alias="isActive")
    created_at: datetime = Field(alias="createdAt")
    
    class Config:
        populate_by_name = True
        allow_population_by_field_name = True


class UserProfileBasic(BaseModel):
    """User profile with nested objects"""
    id: str
    email: str
    username: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    full_name: str = Field(alias="fullName")
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    bio: Optional[str] = None
    role: str
    is_active: bool = Field(alias="isActive")
    is_verified: bool = Field(alias="isVerified")
    last_login: Optional[datetime] = Field(None, alias="lastLogin")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    preferences: Dict[str, Any] = {}
    
    class Config:
        populate_by_name = True
        allow_population_by_field_name = True


# ============================================================================
# EXAMPLE 2: Automatic CamelCase Conversion with ConfigDict
# ============================================================================

def to_camel_case(snake_str: str) -> str:
    """Convert snake_case to camelCase"""
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class AutoCamelCaseModel(BaseModel):
    """Base model with automatic camelCase conversion"""
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel_case,
        str_strip_whitespace=True,
        validate_assignment=True
    )


class UserAuto(UserBasic, AutoCamelCaseModel):
    """User model with automatic camelCase conversion"""
    pass


class UserProfileAuto(AutoCamelCaseModel):
    """User profile with automatic camelCase conversion"""
    id: str
    email: str
    username: str
    first_name: str = None
    last_name: str = None
    full_name: str
    avatar_url: str = None
    bio: str = None
    role: str
    is_active: bool
    is_verified: bool
    last_login: datetime = None
    created_at: datetime
    updated_at: datetime
    preferences: Dict[str, Any] = {}


# ============================================================================
# EXAMPLE 3: Complex Nested Models
# ============================================================================

class AddressModel(BaseModel):
    """Address model with camelCase aliases"""
    street_address: str = Field(alias="streetAddress")
    city: str
    state: str
    postal_code: str = Field(alias="postalCode")
    country: str
    
    class Config:
        populate_by_name = True
        allow_population_by_field_name = True


class PhoneModel(BaseModel):
    """Phone model with camelCase aliases"""
    type: str  # "mobile", "work", "home"
    number: str
    is_primary: bool = Field(alias="isPrimary")
    
    class Config:
        populate_by_name = True
        allow_population_by_field_name = True


class UserDetailed(BaseModel):
    """Detailed user model with nested objects"""
    id: str
    email: str
    username: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    full_name: str = Field(alias="fullName")
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    bio: Optional[str] = None
    role: str
    is_active: bool = Field(alias="isActive")
    is_verified: bool = Field(alias="isVerified")
    last_login: Optional[datetime] = Field(None, alias="lastLogin")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    
    # Nested objects
    address: Optional[AddressModel] = None
    phones: List[PhoneModel] = []
    preferences: Dict[str, Any] = {}
    
    class Config:
        populate_by_name = True
        allow_population_by_field_name = True


# ============================================================================
# EXAMPLE 4: Enum and Union Types
# ============================================================================

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class UserWithEnums(BaseModel):
    """User model with enums and camelCase"""
    id: str
    email: str
    username: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    role: UserRole
    status: UserStatus
    is_active: bool = Field(alias="isActive")
    created_at: datetime = Field(alias="createdAt")
    
    class Config:
        populate_by_name = True
        allow_population_by_field_name = True


# ============================================================================
# EXAMPLE 5: Response Models with Success/Error Handling
# ============================================================================

class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    message: str
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error_code: str = Field(alias="errorCode")
    message: str
    details: Optional[Dict[str, Any]] = None


class PaginatedResponse(BaseModel):
    """Paginated response with camelCase"""
    success: bool = True
    data: List[Any]
    total_count: int = Field(alias="totalCount")
    page_number: int = Field(alias="pageNumber")
    page_size: int = Field(alias="pageSize")
    total_pages: int = Field(alias="totalPages")
    has_next: bool = Field(alias="hasNext")
    has_previous: bool = Field(alias="hasPrevious")
    
    class Config:
        populate_by_name = True
        allow_population_by_field_name = True


# ============================================================================
# EXAMPLE 6: Request Models with Validation
# ============================================================================

class CreateUserRequest(BaseModel):
    """Request model for creating a user"""
    email: str = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    first_name: str = Field(None, alias="firstName", max_length=100)
    last_name: str = Field(None, alias="lastName", max_length=100)
    role: UserRole = UserRole.USER
    
    class Config:
        populate_by_name = True
        allow_population_by_field_name = True


class UpdateUserRequest(BaseModel):
    """Request model for updating a user"""
    first_name: str = Field(None, alias="firstName", max_length=100)
    last_name: str = Field(None, alias="lastName", max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    is_active: Optional[bool] = Field(None, alias="isActive")
    
    class Config:
        populate_by_name = True
        allow_population_by_field_name = True


# ============================================================================
# API ENDPOINTS EXAMPLES
# ============================================================================

@router.get("/user/basic/{user_id}", response_model=UserBasic)
async def get_user_basic(user_id: str):
    """Get basic user info with field aliases"""
    # Simulate user data
    user_data = {
        "id": user_id,
        "email": "john.doe@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "is_active": True,
        "created_at": datetime.now()
    }
    return UserBasic(**user_data)


@router.get("/user/auto/{user_id}", response_model=UserAuto)
async def get_user_auto(user_id: str):
    """Get user with automatic camelCase conversion"""
    user_data = {
        "id": user_id,
        "email": "john.doe@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "is_active": True,
        "created_at": datetime.now()
    }
    return UserAuto(**user_data)


@router.get("/user/detailed/{user_id}", response_model=UserDetailed)
async def get_user_detailed(user_id: str):
    """Get detailed user with nested objects"""
    user_data = {
        "id": user_id,
        "email": "john.doe@example.com",
        "username": "johndoe",
        "first_name": "John",
        "last_name": "Doe",
        "full_name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg",
        "bio": "Software developer",
        "role": "user",
        "is_active": True,
        "is_verified": True,
        "last_login": datetime.now(),
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "address": {
            "street_address": "123 Main St",
            "city": "New York",
            "state": "NY",
            "postal_code": "10001",
            "country": "USA"
        },
        "phones": [
            {
                "type": "mobile",
                "number": "+1-555-123-4567",
                "is_primary": True
            }
        ],
        "preferences": {
            "theme": "dark",
            "language": "en",
            "notifications": True
        }
    }
    return UserDetailed(**user_data)


@router.get("/users/paginated", response_model=PaginatedResponse)
async def get_users_paginated(page: int = 1, size: int = 10):
    """Get paginated users list"""
    # Simulate paginated data
    users = [
        {
            "id": f"user_{i}",
            "email": f"user{i}@example.com",
            "first_name": f"User{i}",
            "last_name": "Doe",
            "is_active": True,
            "created_at": datetime.now()
        }
        for i in range(1, 6)
    ]
    
    return PaginatedResponse(
        data=users,
        total_count=50,
        page_number=page,
        page_size=size,
        total_pages=5,
        has_next=page < 5,
        has_previous=page > 1
    )


@router.post("/user/create", response_model=SuccessResponse)
async def create_user(request: CreateUserRequest):
    """Create a new user"""
    # Simulate user creation
    user_data = {
        "id": "new_user_123",
        "email": request.email,
        "username": request.username,
        "first_name": request.first_name,
        "last_name": request.last_name,
        "role": request.role.value,
        "is_active": True,
        "created_at": datetime.now()
    }
    
    return SuccessResponse(
        message="User created successfully",
        data=user_data
    )


@router.put("/user/{user_id}", response_model=UserDetailed)
async def update_user(user_id: str, request: UpdateUserRequest):
    """Update user information"""
    # Simulate user update
    user_data = {
        "id": user_id,
        "email": "john.doe@example.com",
        "username": "johndoe",
        "first_name": request.first_name or "John",
        "last_name": request.last_name or "Doe",
        "full_name": f"{request.first_name or 'John'} {request.last_name or 'Doe'}",
        "avatar_url": request.avatar_url,
        "bio": request.bio,
        "role": "user",
        "is_active": request.is_active if request.is_active is not None else True,
        "is_verified": True,
        "last_login": datetime.now(),
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "address": None,
        "phones": [],
        "preferences": {}
    }
    
    return UserDetailed(**user_data)


@router.get("/user/error-example")
async def get_user_error():
    """Example of error response"""
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )
