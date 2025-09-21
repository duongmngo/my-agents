# Workspace API Integration

This document summarizes the integration of the workspace API from the backend to the frontend.

## Overview

The workspace API integration has been successfully implemented, replacing mock data with real API calls to the backend. The integration follows the API field conventions using Pydantic DTOs with explicit field aliases for camelCase conversion.

## Key Changes Made

### 1. Backend DTOs (`backend/app/api/v1/dtos/workspace_dtos.py`)

- **Created proper DTOs** following the API field conventions
- **Used Pydantic Field aliases** for automatic camelCase conversion
- **Organized DTOs in decentralized structure** under `dtos/` directory
- **Request DTOs**: Use snake_case field names with `Field(alias="camelCase")`
- **Response DTOs**: Use snake_case field names with `Field(alias="camelCase")`

### 2. Backend API (`backend/app/api/v1/workspaces.py`)

- **Updated to use proper DTOs** from the `dtos` module
- **Added response_model** to all endpoints for automatic serialization
- **Removed inline DTO definitions** in favor of centralized DTOs
- **Used proper Pydantic methods** like `model_dump(exclude_unset=True, by_alias=False)`

### 3. Backend Service (`backend/app/services/workspace_service.py`)

- **Updated `_workspace_to_dict`** to return snake_case fields (converted to camelCase by DTOs)
- **Updated `_member_to_dict`** to return snake_case fields (converted to camelCase by DTOs)
- **Removed manual camelCase conversion** from `update_workspace` method
- **Simplified field handling** since DTOs handle the conversion

### 4. Frontend Service (`frontend/src/services/workspace-service/index.ts`)

- **Removed case conversion utilities** - no longer needed
- **Updated interface definitions** to expect camelCase from API
- **Simplified API calls** - send camelCase, receive camelCase
- **Updated conversion functions** to map from camelCase API response to frontend types

### 5. Frontend Types (`frontend/src/types/common-types/index.ts`)

- **Updated `Workspace` interface** to include additional backend fields in camelCase
- **Updated `WorkspaceMember` interface** to include additional backend fields in camelCase

### 6. Frontend Store (`frontend/src/hooks/use-workspace/workspace-store.ts`)

- **Updated method signatures** to use camelCase field names
- **Added new methods** for archive/unarchive/search functionality
- **Removed mock data dependency**

### 7. Frontend Components

- **Updated `workspace-settings.tsx`** to use new API methods
- **Fixed field references** to use `member.userId` instead of `member.id`
- **Updated error handling** for new API responses

## Data Flow

### Frontend → Backend
1. Frontend sends camelCase data (e.g., `{ isPrivate: true, userId: "123" }`)
2. Pydantic DTOs automatically convert to snake_case using field aliases
3. Backend receives snake_case data (e.g., `{ is_private: true, user_id: "123" }`)

### Backend → Frontend
1. Backend service returns snake_case data (e.g., `{ is_private: true, user_id: "123" }`)
2. Pydantic DTOs automatically convert to camelCase using field aliases
3. Frontend receives camelCase data (e.g., `{ isPrivate: true, userId: "123" }`)

## API Endpoints Used

| Method | Endpoint | Description | Request DTO | Response DTO |
|--------|----------|-------------|-------------|--------------|
| GET | `/api/v1/workspaces/` | Get all user workspaces | - | `WorkspaceListResponse` |
| GET | `/api/v1/workspaces/{id}` | Get specific workspace | - | `WorkspaceResponse` |
| POST | `/api/v1/workspaces/` | Create new workspace | `WorkspaceCreateRequest` | `WorkspaceResponse` |
| PUT | `/api/v1/workspaces/{id}` | Update workspace | `WorkspaceUpdateRequest` | `WorkspaceResponse` |
| DELETE | `/api/v1/workspaces/{id}` | Delete workspace | - | `SuccessResponse` |
| GET | `/api/v1/workspaces/{id}/members` | Get workspace members | - | `WorkspaceMemberListResponse` |
| POST | `/api/v1/workspaces/{id}/members` | Add member to workspace | `WorkspaceMemberAddRequest` | `WorkspaceMemberResponse` |
| PUT | `/api/v1/workspaces/{id}/members/{userId}` | Update member role | `WorkspaceMemberUpdateRequest` | `SuccessResponse` |
| DELETE | `/api/v1/workspaces/{id}/members/{userId}` | Remove member | - | `SuccessResponse` |
| POST | `/api/v1/workspaces/{id}/archive` | Archive workspace | - | `SuccessResponse` |
| POST | `/api/v1/workspaces/{id}/unarchive` | Unarchive workspace | - | `SuccessResponse` |
| GET | `/api/v1/workspaces/search` | Search workspaces | - | `WorkspaceListResponse` |

## DTO Examples

### Request DTO (snake_case with camelCase alias)
```python
class WorkspaceCreateRequest(BaseApiModel):
    name: str
    description: Optional[str] = None
    is_private: bool = Field(False, alias="isPrivate")
    color: Optional[str] = None
```

### Response DTO (snake_case with camelCase alias)
```python
class WorkspaceResponse(BaseApiModel):
    id: str
    name: str
    is_private: bool = Field(..., alias="isPrivate")
    is_active: bool = Field(..., alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")
    created_by: str = Field(..., alias="createdBy")
```

## Testing

To test the workspace API integration:

1. Navigate to `/test/workspace-test` in the application
2. The page will automatically load user workspaces
3. Try creating a new workspace
4. Try switching between workspaces
5. Check the browser's network tab to verify API calls

## Benefits of This Approach

1. **Type Safety**: Clear contracts between frontend and backend
2. **Maintainability**: Easy to track field transformations
3. **Flexibility**: Custom mapping for complex scenarios
4. **Documentation**: Self-documenting through code
5. **Consistency**: Predictable patterns across the application
6. **No Manual Conversion**: Pydantic handles all field mapping automatically

## Notes

- **Authentication**: The API client automatically includes the JWT token from localStorage
- **Error Handling**: All API calls include proper error handling and user feedback
- **Loading States**: The store manages loading states for better UX
- **Persistence**: Workspace state is persisted in localStorage using Zustand persist middleware
- **Field Aliases**: All camelCase fields use explicit Pydantic field aliases for clarity

## Future Improvements

1. **User Lookup**: The member invitation currently uses placeholder user IDs. This should be updated to use actual user lookup by email.
2. **Real-time Updates**: Consider adding WebSocket support for real-time workspace updates
3. **Caching**: Implement proper caching strategies for workspace data
4. **Optimistic Updates**: Add optimistic updates for better perceived performance
