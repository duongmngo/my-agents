# Profile & Team Management

**Priority:** High  
**Status:** Ready  
**Estimated Effort:** 3-4 days

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

### Backend Tasks

- [ ] Create `app/api/v1/users.py` router
- [ ] Add profile update endpoint
  - Fields: first_name, last_name, bio, timezone, language
  - Validation for each field
- [ ] Add password change endpoint
  - Require current password verification
  - Password strength validation
  - Update password_changed_at timestamp
- [ ] Add avatar upload endpoint
  - Accept multipart/form-data
  - Validate file type (JPEG, PNG, WebP)
  - Resize to max 256x256
  - Upload to MinIO (users/{user_id}/avatar.{ext})
  - Return avatar_url
- [ ] Create DTOs in `app/api/v1/dtos/user_dtos.py`
  - ProfileUpdateRequest
  - PasswordChangeRequest
  - ProfileResponse

### Frontend Tasks

- [ ] Update ProfileSettings component
  - Add editable form fields
  - Add save button with loading state
  - Toast notifications
- [ ] Create AvatarUpload component
  - Drag-and-drop or click to upload
  - Image preview before upload
  - Crop/resize (optional)
- [ ] Create PasswordChangeModal
  - Current password field
  - New password + confirm fields
  - Strength indicator
- [ ] Create profile service
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

### Backend Tasks

- [ ] Extend `app/api/v1/workspaces.py` with member endpoints
- [ ] Add permission check dependency
  ```python
  def get_workspace_permission(
      workspace_id: str,
      required_role: List[str],
      current_user: User
  )
  ```
- [ ] Implement member management in WorkspaceService
  - get_workspace_members(workspace_id)
  - add_member(workspace_id, email, role)
  - update_member_role(workspace_id, user_id, new_role)
  - remove_member(workspace_id, user_id)
- [ ] Add validation
  - Cannot remove last owner
  - Cannot demote yourself if you're the only owner
  - Admin cannot change owner's role
- [ ] Update DTOs
  - WorkspaceMemberResponse (include user details)
  - WorkspaceMemberAddRequest (email, role)
  - WorkspaceMemberUpdateRequest (role)

### Frontend Tasks

- [ ] Create WorkspaceTeamSettings component
  - Members list with search/filter
  - Role badges (owner: gold, admin: blue, member: green, viewer: gray)
- [ ] Create MemberCard component
  - Avatar, name, email
  - Role dropdown (for users who can change)
  - Remove button (with confirmation)
- [ ] Create AddMemberModal
  - Email input
  - Role selector (dropdown)
  - Add button
- [ ] Create team management service
  - getMembers(workspaceId)
  - addMember(workspaceId, email, role)
  - updateMemberRole(workspaceId, userId, role)
  - removeMember(workspaceId, userId)
- [ ] Integrate into SettingsTabs
  - Add "Team" tab after "Workspace"
  - Permission-based visibility

---

## Technical Notes

### Existing Infrastructure

Already implemented:
- User model with profile fields
- WorkspaceMember model with roles
- WorkspaceMemberRepository
- MinIO storage service
- AuthService.update_user_profile() (basic)

### File Structure

```
backend/
├── app/api/v1/
│   ├── users.py              # New - profile endpoints
│   └── workspaces.py         # Extend - member endpoints
├── app/api/v1/dtos/
│   └── user_dtos.py          # New - profile DTOs
└── app/services/
    └── user_service.py       # New or extend auth_service

frontend/
└── src/
    ├── components/features/settings/
    │   ├── profile-settings.tsx      # Extend
    │   ├── avatar-upload.tsx         # New
    │   ├── password-change-modal.tsx # New
    │   └── team-settings.tsx         # New
    └── services/
        └── user-service/             # New
            └── index.ts
```

---

## Dependencies

- MinIO storage (already configured)
- WorkspaceMember model (already exists)
- Settings page structure (already exists)

## Related Documentation

- [Authentication Feature](../features/01-authentication/)
- [Workspace Management Feature](../features/04-workspace-management/)
