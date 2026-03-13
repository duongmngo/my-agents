# Folder Category Update - Backend Changes

## Overview
This update adds category support to the folder system to distinguish between file folders and note folders in the knowledge base. Each workspace now has specific default note folders: Meeting Notes and Technical Notes. The workspace creation flow has been enhanced to provide better control over default folder creation.

## Changes Made

### 1. Database Model Updates

#### `app/models/folder.py`
- Added `FolderCategory` enum with values `FILES` and `NOTES`
- Added `category` column to the `Folder` model with default value `FILES`
- Updated `__repr__` method to include category information

### 2. API DTOs Updates

#### `app/api/v1/dtos/folder_dtos.py`
- Added `FolderCategory` enum for API requests/responses
- Updated `FolderCreateRequest` to include optional `category` field (defaults to `FILES`)
- Updated `FolderUpdateRequest` to include optional `category` field
- Updated `FolderResponse` to include `category` field

#### `app/api/v1/dtos/workspace_dtos.py`
- Added `create_default_folders` parameter to `WorkspaceCreateRequest` (defaults to `true`)
- Added `WorkspaceCreateResponse` to include information about created default folders
- Enhanced workspace creation response with folder details

### 3. API Endpoints Updates

#### `app/api/v1/folders.py`
- Updated all existing endpoints to include category in responses
- Added category filtering to `get_folders` endpoint
- Added category filtering to `search_folders` endpoint
- Added new `/knowledge-base` endpoint specifically for knowledge base folders
- Updated all folder creation and update operations to handle category

#### `app/api/v1/workspaces.py`
- Updated `POST /` endpoint to return `WorkspaceCreateResponse` with default folders information
- Added `create_default_folders` parameter to control default folder creation
- Added `POST /{workspace_id}/default-folders` endpoint to create default folders for existing workspaces

### 4. Service Layer Updates

#### `app/services/folder_service.py`
- Updated `create_folder` method to accept and validate category
- Added category validation to ensure parent folders have the same category
- Updated `get_workspace_folders` to support category filtering
- Updated `search_folders` to support category filtering
- Added category validation in `update_folder` and `move_folder` methods
- Updated `create_default_knowledge_folders` to create specific note folders:
  - **Documents** (FILES category) - Store and organize documents
  - **Meeting Notes** (NOTES category) - Store meeting notes and discussions
  - **Technical Notes** (NOTES category) - Store technical documentation and notes

#### `app/services/workspace_service.py`
- Updated `create_workspace` method to accept `create_default_folders` parameter
- Enhanced response to include information about created default folders
- Made default folder creation optional and configurable

### 5. Repository Layer Updates

#### `app/repositories/folder_repository.py`
- Updated `get_workspace_folders` to support category filtering
- Updated `get_folder_tree` to support category filtering
- Updated `search_folders` to support category filtering
- Updated `get_pinned_folders` to support category filtering
- Updated `create_folder_with_path` to include category parameter

### 6. Database Migrations

#### `alembic/versions/872a740bc11d_add_category_to_folders.py`
- Created migration to add `category` column to `folders` table
- Added PostgreSQL enum type `foldercategory` with values `FILES` and `NOTES`
- Set default value to `FILES` for existing records
- Added proper rollback support

#### `alembic/versions/511c46b0ef5f_add_default_note_folders.py`
- Data migration to add default note folders to existing workspaces
- Creates "Meeting Notes" and "Technical Notes" folders for each workspace
- Updates existing "Notes" folders to "General Notes" to avoid conflicts
- Handles existing workspaces gracefully

## Enhanced Workspace Creation Flow

### New Workspace Creation Request
```json
{
  "name": "My Workspace",
  "description": "A new workspace for my team",
  "isPrivate": false,
  "color": "#3B82F6",
  "icon": "building",
  "createDefaultFolders": true
}
```

### Enhanced Workspace Creation Response
```json
{
  "workspace": {
    "id": "workspace-123",
    "name": "My Workspace",
    "description": "A new workspace for my team",
    "slug": "my-workspace",
    "color": "#3B82F6",
    "icon": "building",
    "isPrivate": false,
    "isActive": true,
    "isArchived": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "createdBy": "user-123",
    "userRole": "owner"
  },
  "defaultFolders": [
    {
      "id": "folder-1",
      "name": "Documents",
      "description": "Store and organize your documents",
      "category": "FILES",
      "color": "#3B82F6",
      "icon": "file-text"
    },
    {
      "id": "folder-2",
      "name": "Meeting Notes",
      "description": "Store meeting notes and discussions",
      "category": "NOTES",
      "color": "#10B981",
      "icon": "sticky-note"
    },
    {
      "id": "folder-3",
      "name": "Technical Notes",
      "description": "Store technical documentation and notes",
      "category": "NOTES",
      "color": "#F59E0B",
      "icon": "code"
    }
  ],
  "message": "Workspace created successfully with default knowledge base folders"
}
```

## Default Folder Structure

When a new workspace is created, the following folders are automatically created:

### File Folders
- **Documents** - Store and organize your documents
  - Color: `#3B82F6` (Blue)
  - Icon: `file-text`

### Note Folders
- **Meeting Notes** - Store meeting notes and discussions
  - Color: `#10B981` (Green)
  - Icon: `sticky-note`
- **Technical Notes** - Store technical documentation and notes
  - Color: `#F59E0B` (Amber)
  - Icon: `code`

## New API Endpoints

### GET `/api/v1/folders/knowledge-base`
- **Purpose**: Get knowledge base folders by category
- **Parameters**:
  - `workspaceId` (required): Workspace ID
  - `category` (required): Folder category (`files` or `notes`)
- **Response**: List of folders with full hierarchy for the specified category

### POST `/api/v1/workspaces/{workspace_id}/default-folders`
- **Purpose**: Create default knowledge base folders for an existing workspace
- **Parameters**:
  - `workspace_id` (path): Workspace ID
- **Response**: Success message with number of folders created

## Updated API Endpoints

### POST `/api/v1/workspaces/`
- **New Parameter**: `createDefaultFolders` (optional, defaults to `true`) - Control default folder creation
- **Enhanced Response**: Now includes `WorkspaceCreateResponse` with workspace and default folders information

### GET `/api/v1/folders/`
- **New Parameter**: `category` (optional) - Filter folders by category
- **Response**: Now includes `category` field in all folder responses

### POST `/api/v1/folders/`
- **New Parameter**: `category` (optional, defaults to `files`) - Set folder category
- **Validation**: Ensures parent folder has the same category

### PUT `/api/v1/folders/{folder_id}`
- **New Parameter**: `category` (optional) - Update folder category
- **Validation**: Ensures all child folders have the same category

### GET `/api/v1/folders/search/`
- **New Parameter**: `category` (optional) - Filter search results by category

## Business Logic Rules

1. **Category Inheritance**: Child folders must have the same category as their parent
2. **Category Validation**: Cannot move folders between different categories
3. **Category Updates**: Cannot change category if folder has children with different categories
4. **Default Category**: New folders default to `FILES` category unless specified otherwise
5. **Default Folders**: Each workspace automatically gets Documents, Meeting Notes, and Technical Notes folders
6. **Optional Default Folders**: Users can opt out of default folder creation during workspace creation
7. **Retroactive Default Folders**: Existing workspaces can have default folders added via API

## Database Schema Changes

```sql
-- New enum type
CREATE TYPE foldercategory AS ENUM ('FILES', 'NOTES');

-- New column in folders table
ALTER TABLE folders ADD COLUMN category foldercategory NOT NULL DEFAULT 'FILES';
```

## Migration Status
- ✅ Migration created: `872a740bc11d_add_category_to_folders.py`
- ✅ Migration applied to database
- ✅ All existing folders have `FILES` category by default
- ✅ Data migration created: `511c46b0ef5f_add_default_note_folders.py`
- ✅ Data migration applied to database
- ✅ All existing workspaces now have Meeting Notes and Technical Notes folders

## Testing Recommendations

1. Test workspace creation with `createDefaultFolders: true` (default)
2. Test workspace creation with `createDefaultFolders: false`
3. Test creating default folders for existing workspaces
4. Test folder creation with different categories
5. Test category validation when moving folders
6. Test category filtering in API endpoints
7. Test category updates with child folder validation
8. Test knowledge base specific endpoints
9. Verify existing workspaces have the new note folders
10. Test that old "Notes" folders were renamed to "General Notes"

## Frontend Integration

The frontend should now:
1. Use the new `/knowledge-base` endpoint for getting folders by category
2. Include category in folder creation requests
3. Handle category-specific folder trees
4. Validate category constraints in the UI
5. Display category information in folder listings
6. Show the new default note folders (Meeting Notes, Technical Notes) in the notes tab
7. Handle the transition from old "Notes" folder to new specific note folders
8. Display default folders information in workspace creation success messages
9. Provide option to skip default folder creation during workspace creation
10. Add UI for creating default folders for existing workspaces

## API Examples

### Create Workspace with Default Folders
```bash
POST /api/v1/workspaces/
{
  "name": "My Team Workspace",
  "description": "Workspace for team collaboration",
  "createDefaultFolders": true
}
```

### Create Workspace without Default Folders
```bash
POST /api/v1/workspaces/
{
  "name": "Empty Workspace",
  "description": "Workspace without default folders",
  "createDefaultFolders": false
}
```

### Add Default Folders to Existing Workspace
```bash
POST /api/v1/workspaces/workspace-123/default-folders
```

### Get Note Folders for Knowledge Base
```bash
GET /api/v1/folders/knowledge-base?workspaceId=123&category=notes
```

### Create a New Note Folder
```bash
POST /api/v1/folders/
{
  "name": "Project Notes",
  "category": "notes",
  "workspaceId": "123",
  "description": "Project-specific notes"
}
```

### Get All File Folders
```bash
GET /api/v1/folders/?workspaceId=123&category=files
```
