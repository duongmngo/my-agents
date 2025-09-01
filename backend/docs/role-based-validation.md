# Role-Based Validation for Workspace Member Management

## Overview

This document describes the comprehensive role-based validation system implemented for workspace member management, specifically focusing on the add-member API endpoint and related operations.

## Role Hierarchy

### System-Level Roles (User Model)
- **super_admin**: Highest system privilege level
- **admin**: System administrator privileges
- **user**: Standard user privileges

### Workspace-Level Roles (WorkspaceMember Model)
- **owner**: Full control over workspace
- **admin**: Administrative privileges within workspace
- **member**: Standard member with read/write access
- **viewer**: Read-only access to workspace

## Permission Matrix

| Requester Role | Can Add | Cannot Add | Notes |
|----------------|---------|------------|-------|
| **viewer** | ❌ None | All roles | Viewers have no management permissions |
| **member** | ❌ None | All roles | Members cannot manage other members |
| **admin** | ✅ member, viewer | ❌ owner, admin | Admins can add regular members only |
| **owner** | ✅ owner, admin, member, viewer | ❌ None | Full permissions with safety limits |

## Enhanced Validation Rules

### 1. Role-Based Access Control
- **Viewers**: Cannot add any members
- **Members**: Cannot add any members
- **Admins**: Can only add members and viewers
- **Owners**: Can add any role with restrictions

### 2. Security Restrictions
- **Owner Limit**: Maximum 3 owners per workspace
- **System Role Protection**: System admins must be added as owners
- **Role Escalation Prevention**: Admins cannot promote users to admin/owner roles

### 3. Business Logic Validation
- **Duplicate Prevention**: Cannot add users who are already active members
- **User Status Check**: Cannot add inactive users
- **Workspace Existence**: Validates workspace exists before operations

## API Endpoints with Role Validation

### Add Member
```python
POST /api/v1/workspaces/{workspace_id}/members
```

**Dependency**: `get_workspace_admin_or_owner`
- Requires admin or owner role in the workspace
- Returns tuple of (user, user_role_in_workspace)

### Update Member Role
```python
PUT /api/v1/workspaces/{workspace_id}/members/{user_id}
```

**Dependency**: `get_workspace_admin_or_owner`
- Requires admin or owner role in the workspace

### Remove Member
```python
DELETE /api/v1/workspaces/{workspace_id}/members/{user_id}
```

**Dependency**: `get_workspace_admin_or_owner`
- Requires admin or owner role in the workspace

### Delete Workspace
```python
DELETE /api/v1/workspaces/{workspace_id}
```

**Dependency**: `get_workspace_owner`
- Requires owner role only

## Dependencies

### New Role-Based Dependencies

#### `get_workspace_admin_or_owner`
```python
async def get_workspace_admin_or_owner(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> tuple[User, str]:
    """
    Get current user and verify they have admin or owner role in the workspace
    Returns tuple of (user, user_role_in_workspace)
    """
```

#### `get_workspace_owner`
```python
async def get_workspace_owner(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> tuple[User, str]:
    """
    Get current user and verify they have owner role in the workspace
    Returns tuple of (user, user_role_in_workspace)
    """
```

#### `get_workspace_member`
```python
async def get_workspace_member(
    workspace_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> tuple[User, str]:
    """
    Get current user and verify they are a member of the workspace
    Returns tuple of (user, user_role_in_workspace)
    """
```

## Error Handling

### HTTP Status Code Mapping
- **403 Forbidden**: Permission-related errors
  - "Insufficient permissions"
  - "Viewers cannot add members to workspace"
  - "Admins can only add members and viewers"
  - "Only owners can add other owners"

- **404 Not Found**: Resource not found errors
  - "Workspace not found"
  - "User not found"

- **400 Bad Request**: Validation errors
  - "User is already an active member"
  - "Maximum number of owners (3) reached"
  - "Invalid role"
  - "Cannot add inactive user"

## Implementation Details

### Workspace Service Enhancements
The `add_member` method in `WorkspaceService` now includes:

1. **Comprehensive Validation**
   - Workspace existence check
   - User existence and status check
   - Role-based permission validation
   - Business logic validation

2. **Security Checks**
   - System role protection
   - Owner limit enforcement
   - Role escalation prevention

3. **Error Handling**
   - Specific error messages for different failure scenarios
   - Proper HTTP status code mapping

### Repository Enhancements
New methods added to `WorkspaceRepository`:

- `get_workspace_member(workspace_id, user_id)`: Get specific member
- `count_workspace_owners(workspace_id)`: Count owners for limit enforcement

## Testing

### Test Script
A comprehensive test script (`test_role_validation.py`) is provided to verify:

1. **Permission Scenarios**
   - Viewer attempting to add members
   - Member attempting to add members
   - Admin attempting to add owners/admins
   - Owner adding various roles

2. **Validation Scenarios**
   - Duplicate member prevention
   - Role limit enforcement
   - System role protection

3. **Success Scenarios**
   - Valid admin operations
   - Valid owner operations

### Running Tests
```bash
cd backend
python test_role_validation.py
```

## Security Considerations

### 1. Role Escalation Prevention
- Admins cannot promote users to admin/owner roles
- Only owners can add other owners
- System role protection prevents privilege escalation

### 2. Resource Limits
- Maximum 3 owners per workspace prevents ownership dilution
- Prevents potential security issues from too many privileged users

### 3. Input Validation
- Role validation against whitelist
- User existence and status verification
- Workspace access verification

### 4. Audit Trail
- All operations are logged through the repository layer
- User actions are traceable through workspace membership records

## Best Practices

### 1. Use Appropriate Dependencies
- Use `get_workspace_admin_or_owner` for member management operations
- Use `get_workspace_owner` for destructive operations
- Use `get_workspace_member` for read operations

### 2. Error Handling
- Always check operation results
- Map errors to appropriate HTTP status codes
- Provide clear, actionable error messages

### 3. Role Assignment
- Start users with minimal required permissions
- Use principle of least privilege
- Regularly review and audit role assignments

### 4. Testing
- Test all permission combinations
- Verify error scenarios
- Test boundary conditions (e.g., owner limits)

## Future Enhancements

### 1. Permission Granularity
- Fine-grained permissions (read, write, delete, admin)
- Permission inheritance and delegation
- Time-based permissions

### 2. Audit and Monitoring
- Comprehensive audit logging
- Real-time permission monitoring
- Automated permission review workflows

### 3. Advanced Role Management
- Role templates and presets
- Conditional role assignment
- Role-based workflow automation

## Conclusion

The implemented role-based validation system provides:

- **Security**: Comprehensive permission checking and role validation
- **Flexibility**: Different permission levels for different user types
- **Maintainability**: Clear separation of concerns and reusable dependencies
- **Scalability**: Easy to extend with new roles and permissions
- **Compliance**: Audit trail and proper error handling

This system ensures that workspace member management operations are secure, controlled, and properly validated according to business rules and security requirements.
