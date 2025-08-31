# API DTO Standardization

This document summarizes the standardization of all API v1 endpoints to use proper DTOs with field aliases for camelCase conversion, following the established API field conventions.

## Overview

All API endpoints in the `backend/app/api/v1/` directory have been updated to use centralized DTOs with explicit field aliases for automatic camelCase ↔ snake_case conversion. This ensures consistent API responses and eliminates the need for manual case conversion utilities.

## Key Changes Made

### 1. Created Centralized DTOs

**New DTO files created:**
- `backend/app/api/v1/dtos/file_dtos.py` - File management DTOs
- `backend/app/api/v1/dtos/folder_dtos.py` - Folder management DTOs  
- `backend/app/api/v1/dtos/message_dtos.py` - Message and conversation DTOs
- `backend/app/api/v1/dtos/note_dtos.py` - Note management DTOs
- `backend/app/api/v1/dtos/tenant_dtos.py` - Tenant management DTOs
- `backend/app/api/v1/dtos/user_dtos.py` - User management DTOs

**Updated existing DTOs:**
- `backend/app/api/v1/dtos/workspace_dtos.py` - Already properly implemented
- `backend/app/api/v1/dtos/auth_dtos.py` - Already properly implemented

### 2. Updated API Endpoints

**Files updated with proper DTOs:**
- `backend/app/api/v1/files.py` - File management API
- `backend/app/api/v1/folders.py` - Folder management API
- `backend/app/api/v1/messages.py` - Message and conversation API
- `backend/app/api/v1/notes.py` - Note management API
- `backend/app/api/v1/tenants.py` - Tenant management API
- `backend/app/api/v1/users.py` - User management API

**Files already properly implemented:**
- `backend/app/api/v1/workspaces.py` - Already using proper DTOs
- `backend/app/api/v1/auth.py` - Already using proper DTOs

**Files not requiring DTOs:**
- `backend/app/api/v1/admin.py` - Simple responses, no complex data structures
- `backend/app/api/v1/examples.py` - Example implementations only

### 3. DTO Structure Pattern

All DTOs follow the same consistent pattern:

```python
class BaseApiModel(BaseModel):
    """Base model with consistent configuration for API responses"""
    class Config:
        populate_by_name = True
        from_attributes = True

# Request DTOs (snake_case with camelCase aliases)
class EntityCreateRequest(BaseApiModel):
    name: str
    is_private: bool = Field(False, alias="isPrivate")
    created_by: str = Field(..., alias="createdBy")

# Response DTOs (snake_case with camelCase aliases)
class EntityResponse(BaseApiModel):
    id: str
    name: str
    is_private: bool = Field(..., alias="isPrivate")
    created_at: datetime = Field(..., alias="createdAt")
    created_by: str = Field(..., alias="createdBy")
```

## API Endpoints Standardized

### File Management API (`/api/v1/files/`)

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| POST | `/upload` | - | `FileUploadResponse` |
| GET | `/` | - | `FileListResponse` |
| GET | `/search` | - | `FileListResponse` |
| GET | `/{file_id}` | - | `FileResponse` |
| PUT | `/{file_id}` | `FileUpdateRequest` | `FileResponse` |
| DELETE | `/{file_id}` | - | `FileDeleteResponse` |

### Folder Management API (`/api/v1/folders/`)

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| POST | `/` | `FolderCreateRequest` | `FolderCreateResponse` |
| GET | `/` | - | `FolderListResponse` |
| GET | `/{folder_id}` | - | `FolderResponse` |
| PUT | `/{folder_id}` | `FolderUpdateRequest` | `FolderResponse` |
| DELETE | `/{folder_id}` | - | `FolderDeleteResponse` |

### Message Management API (`/api/v1/messages/`)

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| POST | `/conversations` | `ConversationCreateRequest` | `ConversationCreateResponse` |
| GET | `/conversations` | - | `ConversationListResponse` |
| GET | `/conversations/{id}/messages` | - | `MessageListResponse` |
| POST | `/messages` | `MessageCreateRequest` | `MessageCreateResponse` |

### Note Management API (`/api/v1/notes/`)

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| POST | `/` | `NoteCreateRequest` | `NoteCreateResponse` |
| GET | `/` | - | `NoteListResponse` |
| GET | `/{note_id}` | - | `NoteResponse` |
| PUT | `/{note_id}` | `NoteUpdateRequest` | `NoteResponse` |
| DELETE | `/{note_id}` | - | `NoteDeleteResponse` |

### Tenant Management API (`/api/v1/tenants/`)

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| POST | `/` | `TenantCreateRequest` | `TenantCreateResponse` |
| GET | `/` | - | `TenantListResponse` |
| GET | `/{tenant_id}` | - | `TenantResponse` |

### User Management API (`/api/v1/users/`)

| Method | Endpoint | Request DTO | Response DTO |
|--------|----------|-------------|--------------|
| GET | `/` | - | `UserListResponse` |
| GET | `/{user_id}` | - | `UserResponse` |
| PUT | `/{user_id}/activate` | - | `UserActivateResponse` |
| PUT | `/{user_id}/deactivate` | - | `UserDeactivateResponse` |

## Field Aliases Examples

### Common Field Patterns

```python
# Boolean fields
is_private: bool = Field(..., alias="isPrivate")
is_active: bool = Field(..., alias="isActive")
is_verified: bool = Field(..., alias="isVerified")
is_pinned: bool = Field(..., alias="isPinned")

# Date/time fields
created_at: datetime = Field(..., alias="createdAt")
updated_at: datetime = Field(..., alias="updatedAt")
last_login: datetime = Field(..., alias="lastLogin")

# ID fields
workspace_id: str = Field(..., alias="workspaceId")
folder_id: str = Field(..., alias="folderId")
user_id: str = Field(..., alias="userId")
conversation_id: str = Field(..., alias="conversationId")

# URL fields
avatar_url: str = Field(..., alias="avatarUrl")
file_path: str = Field(..., alias="filePath")

# Count fields
participant_count: int = Field(..., alias="participantCount")
file_size: int = Field(..., alias="fileSize")

# Type fields
mime_type: str = Field(..., alias="mimeType")
file_type: str = Field(..., alias="fileType")
```

## Benefits of This Approach

1. **Consistency**: All APIs follow the same pattern for field naming
2. **Type Safety**: Clear contracts between frontend and backend
3. **Maintainability**: Centralized DTO definitions
4. **Documentation**: Self-documenting through explicit field aliases
5. **No Manual Conversion**: Pydantic handles all field mapping automatically
6. **Frontend Compatibility**: Frontend receives camelCase data directly

## Data Flow

### Frontend → Backend
1. Frontend sends camelCase data (e.g., `{ isPrivate: true, workspaceId: "123" }`)
2. Pydantic DTOs automatically convert to snake_case using field aliases
3. Backend receives snake_case data (e.g., `{ is_private: true, workspace_id: "123" }`)

### Backend → Frontend
1. Backend service returns snake_case data (e.g., `{ is_private: true, workspace_id: "123" }`)
2. Pydantic DTOs automatically convert to camelCase using field aliases
3. Frontend receives camelCase data (e.g., `{ isPrivate: true, workspaceId: "123" }`)

## Implementation Notes

- **BaseApiModel**: All DTOs inherit from `BaseApiModel` with consistent configuration
- **Field Aliases**: All camelCase fields use explicit `Field(alias="camelCase")` for clarity
- **Response Models**: All endpoints use `response_model` for automatic serialization
- **Request Validation**: All request DTOs use `model_dump(exclude_unset=True, by_alias=False)`
- **Error Handling**: Consistent error responses across all endpoints

## Future Considerations

1. **Service Layer Updates**: Backend services should return snake_case data that gets converted by DTOs
2. **Frontend Integration**: Frontend services should expect camelCase data directly from APIs
3. **Testing**: Add comprehensive tests for DTO field mapping
4. **Documentation**: Generate OpenAPI documentation that reflects the camelCase field names

## Migration Checklist

- [x] Create DTOs for all API endpoints
- [x] Update API endpoints to use proper DTOs
- [x] Add response_model to all endpoints
- [x] Remove inline Pydantic models from API files
- [x] Update imports to use centralized DTOs
- [ ] Update backend services to return snake_case data
- [ ] Update frontend services to expect camelCase data
- [ ] Add comprehensive testing
- [ ] Update API documentation
