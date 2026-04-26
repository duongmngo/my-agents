# Profile & Team Management

**Status:** ✅ Completed  
**Completed:** March 2026

## Overview

User profile settings and workspace team management with role-based permissions.

---

## Phase 1: Profile Settings

### Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/v1/users/me` | Update user profile |
| PUT | `/api/v1/users/me/password` | Change password |
| POST | `/api/v1/users/me/avatar` | Upload avatar (MinIO) |
| GET | `/api/v1/users/me` | Get current user profile |

### Backend Implementation

- [x] Create `app/api/v1/users.py` router
- [x] Add profile update endpoint
  - Fields: first_name, last_name, bio, timezone, language
  - Validation for each field
- [x] Add password change endpoint
  - Require current password verification
  - Password strength validation
  - Update password_changed_at timestamp
- [x] Add avatar upload endpoint
  - Accept multipart/form-data
  - Validate file type (JPEG, PNG, WebP)
  - Resize to max 256x256
  - Upload to MinIO (users/{user_id}/avatar.{ext})
  - Return avatar_url
- [x] Create DTOs in `app/api/v1/dtos/user_dtos.py`
  - ProfileUpdateRequest
  - PasswordChangeRequest
  - ProfileResponse

### Frontend Implementation

- [x] Update ProfileSettings component
  - Add editable form fields
  - Add save button with loading state
  - Toast notifications
- [x] Create AvatarUpload component
  - Drag-and-drop or click to upload
  - Image preview before upload
- [x] Create PasswordChangeModal
  - Current password field
  - New password + confirm fields
  - Strength indicator
- [x] Create profile service
  - updateProfile(data)
  - changePassword(oldPassword, newPassword)
  - uploadAvatar(file)

---

## Phase 2: Workspace Team Management

### Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/workspaces/{id}/members` | List all members |
| POST | `/api/v1/workspaces/{id}/members` | Add member by email |
| PUT | `/api/v1/workspaces/{id}/members/{userId}` | Update member role |
| DELETE | `/api/v1/workspaces/{id}/members/{userId}` | Remove member |

### Role Permissions Matrix

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| View workspace content | ✅ | ✅ | ✅ | ✅ |
| Create/edit own content | ✅ | ✅ | ✅ | ❌ |
| Delete any content | ✅ | ✅ | ❌ | ❌ |
| Manage agents | ✅ | ✅ | ❌ | ❌ |
| Manage settings | ✅ | ✅ | ❌ | ❌ |
| Add members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅* | ❌ | ❌ |
| Change roles | ✅ | ✅** | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |

*Admin cannot remove owner or other admins  
**Admin can only set member/viewer roles, not admin/owner

### Backend Implementation

- [x] Extend `app/api/v1/workspaces.py` with member endpoints
- [x] Add permission check dependency
- [x] Implement member management in WorkspaceService
  - get_workspace_members(workspace_id)
  - add_member(workspace_id, email, role)
  - update_member_role(workspace_id, user_id, new_role)
  - remove_member(workspace_id, user_id)
- [x] Add validation
  - Cannot remove last owner
  - Cannot demote yourself if you're the only owner
  - Admin cannot change owner's role
- [x] Update DTOs
  - WorkspaceMemberResponse (include user details)
  - WorkspaceMemberAddRequest (email, role)
  - WorkspaceMemberUpdateRequest (role)

### Frontend Implementation

- [x] Create WorkspaceTeamSettings component
  - Members list with search/filter
  - Role badges (owner: gold, admin: blue, member: green, viewer: gray)
- [x] Create MemberCard component
  - Avatar, name, email
  - Role dropdown (for users who can change)
  - Remove button (with confirmation)
- [x] Create AddMemberModal
  - Email input
  - Role selector (dropdown)
  - Add button
- [x] Create team management service
  - getMembers(workspaceId)
  - addMember(workspaceId, email, role)
  - updateMemberRole(workspaceId, userId, role)
  - removeMember(workspaceId, userId)
- [x] Integrate into SettingsTabs
  - Add "Team" tab after "Workspace"
  - Permission-based visibility

---

## File Structure

```
backend/
├── app/api/v1/
│   ├── users.py              # Profile endpoints
│   └── workspaces.py         # Member endpoints
├── app/api/v1/dtos/
│   └── user_dtos.py          # Profile DTOs
└── app/services/
    └── user_service.py       # User service

frontend/
└── src/
    ├── components/features/settings/
    │   ├── profile-settings.tsx
    │   ├── avatar-upload.tsx
    │   ├── password-change-modal.tsx
    │   ├── team-settings.tsx
    │   ├── member-card.tsx
    │   └── add-member-modal.tsx
    └── services/
        ├── user-service/
        │   └── index.ts
        └── team-service/
            └── index.ts
```

---

## Related Documentation

- [Authentication Feature](../01-authentication/)
- [Workspace Management Feature](../04-workspace-management/)
