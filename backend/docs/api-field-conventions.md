# API Field Conventions & Model Organization

## Overview

This document outlines the conventions and organization patterns used for API request/response data fields in our FastAPI backend application.

## Field Naming Conventions

### Backend (snake_case)
- **Internal Models**: All database models and internal business logic use `snake_case`
- **API DTOs**: Request/response models use `snake_case` internally with explicit field aliases
- **Database Fields**: All database columns use `snake_case`

### Frontend (camelCase)
- **API Responses**: All API responses are automatically converted to `camelCase` using Pydantic field aliases
- **Request Data**: Frontend sends data in `camelCase`, backend receives and converts to `snake_case`
- **JavaScript/TypeScript**: All frontend code uses `camelCase`

## Explicit Field Mapping Strategy

We use **explicit field mapping** rather than automatic conversion libraries to ensure:
- **Type Safety**: Clear contract between frontend and backend
- **Maintainability**: Easy to track field transformations
- **Flexibility**: Custom mapping for complex scenarios
- **Documentation**: Self-documenting field relationships

### Implementation Pattern

```python
# Backend DTO Example
class UserResponse(BaseApiModel):
    id: str
    email: str
    username: str
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    full_name: str = Field(..., alias="fullName")
    is_active: bool = Field(..., alias="isActive")
    is_verified: bool = Field(..., alias="isVerified")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
```

**Result**: Backend uses `first_name`, frontend receives `firstName`

## Model Organization Architecture

### Decentralized DTO Structure

Instead of centralized models, we organize DTOs co-located with their respective API controllers:

```
backend/app/api/v1/
├── dtos/
│   ├── __init__.py
│   ├── auth_dtos.py          # Authentication API DTOs
│   ├── workspace_dtos.py     # Workspace API DTOs
│   ├── user_dtos.py          # User API DTOs
│   └── file_dtos.py          # File API DTOs
├── auth.py                   # Uses auth_dtos.py
├── workspaces.py             # Uses workspace_dtos.py
├── users.py                  # Uses user_dtos.py
└── files.py                  # Uses file_dtos.py
```

### Benefits of Decentralized Approach

1. **Co-location**: DTOs are close to their usage
2. **Ownership**: Each API controller owns its data models
3. **Scalability**: Easy to add new DTOs for new controllers
4. **Maintainability**: Changes are isolated to specific domains
5. **Clear Boundaries**: No cross-contamination between different APIs

## DTO Structure Patterns

### Base Model Configuration

```python
class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    class Config:
        populate_by_name = True
        from_attributes = True
```

### Request DTOs

```python
# Naming: {Entity}{Action}Request
class UserRegisterRequest(BaseApiModel):
    email: EmailStr
    username: str
    password: str
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")

class WorkspaceCreateRequest(BaseApiModel):
    name: str
    description: Optional[str] = None
    is_private: bool = Field(False, alias="isPrivate")
```

### Response DTOs

```python
# Naming: {Entity}Response
class UserResponse(BaseApiModel):
    id: str
    email: str
    username: str
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    full_name: str = Field(..., alias="fullName")
    is_active: bool = Field(..., alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")

# Naming: {Entity}ListResponse for collections
class WorkspacesListResponse(BaseApiModel):
    success: bool = True
    workspaces: List[WorkspaceResponse] = []
    total: int = 0
```

## Field Mapping Examples

### Common Field Patterns

| Backend Field | Frontend Field | Description |
|---------------|----------------|-------------|
| `first_name` | `firstName` | User's first name |
| `last_name` | `lastName` | User's last name |
| `full_name` | `fullName` | User's full name |
| `is_active` | `isActive` | Active status |
| `is_verified` | `isVerified` | Verification status |
| `created_at` | `createdAt` | Creation timestamp |
| `updated_at` | `updatedAt` | Last update timestamp |
| `user_id` | `userId` | User identifier |
| `workspace_id` | `workspaceId` | Workspace identifier |
| `tenant_id` | `tenantId` | Tenant identifier |
| `created_by` | `createdBy` | Creator identifier |
| `is_private` | `isPrivate` | Privacy setting |
| `is_default` | `isDefault` | Default status |
| `access_token` | `accessToken` | JWT access token |
| `refresh_token` | `refreshToken` | JWT refresh token |
| `token_type` | `tokenType` | Token type (bearer) |
| `expires_in` | `expiresIn` | Token expiration |

### Complex Object Mapping

```python
class WorkspaceSettingsResponse(BaseApiModel):
    theme: str = "light"
    primary_color: str = Field("#3B82F6", alias="primaryColor")
    secondary_color: str = Field("#1E40AF", alias="secondaryColor")

class WorkspaceResponse(BaseApiModel):
    id: str
    name: str
    settings: WorkspaceSettingsResponse  # Nested object
    created_at: datetime = Field(..., alias="createdAt")
```

## API Usage Examples

### Backend Controller

```python
from app.api.v1.dtos.auth_dtos import (
    UserLoginRequest,
    AuthResponse,
    UserResponse
)

@router.post("/login", response_model=AuthResponse)
async def login(
    login_data: UserLoginRequest,  # Receives camelCase, converts to snake_case
    db: Session = Depends(get_db)
):
    # Internal logic uses snake_case
    result = auth_service.login(
        identifier=login_data.identifier,
        password=login_data.password
    )
    
    # Returns Pydantic model that automatically converts to camelCase
    return AuthResponse(**result)
```

### Frontend Usage

```typescript
// Frontend sends camelCase
const loginData = {
  identifier: "user@example.com",
  password: "password123"
};

// Frontend receives camelCase
const response = await apiClient.post<AuthResponse>("/auth/login", loginData);
console.log(response.user.firstName);  // camelCase
console.log(response.tokens.accessToken);  // camelCase
```

## Migration from Centralized to Decentralized

### Before (Centralized)
```python
# ❌ Single large file
backend/app/models/api_models.py  # 374 lines, all models mixed
```

### After (Decentralized)
```python
# ✅ Co-located with controllers
backend/app/api/v1/dtos/auth_dtos.py      # Auth-specific DTOs
backend/app/api/v1/dtos/workspace_dtos.py # Workspace-specific DTOs
```

## Best Practices

### 1. Consistent Naming
- Use descriptive, consistent field names
- Follow established patterns for similar fields
- Document any deviations from standard patterns

### 2. Field Aliases
- Always use `Field(alias="camelCase")` for response fields
- Use `Field(alias="camelCase")` for request fields that need conversion
- Keep internal field names in `snake_case`

### 3. Type Safety
- Use proper type hints for all fields
- Use `Optional[T]` for nullable fields
- Use `EmailStr` for email validation
- Use `datetime` for timestamps

### 4. Documentation
- Include docstrings for all DTOs
- Document field purposes and constraints
- Use examples in docstrings

### 5. Validation
- Use Pydantic validators for complex validation
- Set appropriate field constraints (min_length, max_length, etc.)
- Use enums for constrained values

## Common Pitfalls to Avoid

### ❌ Don't Use Automatic Conversion
```python
# Avoid automatic camelCase libraries
# They can be unpredictable and hard to debug
```

### ❌ Don't Mix Naming Conventions
```python
# Avoid mixing snake_case and camelCase in same model
class BadModel(BaseModel):
    first_name: str  # snake_case
    lastName: str    # camelCase - inconsistent!
```

### ❌ Don't Centralize Everything
```python
# Avoid putting all DTOs in one file
# Makes maintenance difficult and creates tight coupling
```

### ✅ Do Use Explicit Mapping
```python
# Always use explicit field aliases
class GoodModel(BaseModel):
    first_name: str = Field(..., alias="firstName")
    last_name: str = Field(..., alias="lastName")
```

## Testing Considerations

### Backend Testing
```python
def test_user_response_serialization():
    user_data = {
        "id": "123",
        "first_name": "John",
        "last_name": "Doe",
        "is_active": True
    }
    
    user_response = UserResponse(**user_data)
    serialized = user_response.model_dump(by_alias=True)
    
    assert serialized["firstName"] == "John"  # camelCase
    assert serialized["isActive"] == True     # camelCase
```

### Frontend Testing
```typescript
// Test that API responses match expected camelCase format
const response = await apiClient.get<UserResponse>("/auth/me");
expect(response.firstName).toBeDefined();  // camelCase
expect(response.isActive).toBeDefined();   // camelCase
```

## Conclusion

This explicit field mapping approach provides:
- **Type Safety**: Clear contracts between frontend and backend
- **Maintainability**: Easy to track and modify field transformations
- **Scalability**: Simple to add new fields and APIs
- **Documentation**: Self-documenting through code
- **Consistency**: Predictable patterns across the application

The decentralized DTO organization ensures that each API controller owns its data models, making the codebase more maintainable and scalable.
