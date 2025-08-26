"""
Workspace service for workspace management and collaboration
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import re

from app.repositories.workspace_repository import WorkspaceRepository
from app.models.workspace import Workspace, WorkspaceMember


class WorkspaceService:
    """Service for workspace operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.workspace_repo = WorkspaceRepository(db)
    
    def create_workspace(
        self,
        name: str,
        description: Optional[str],
        tenant_id: str,
        created_by: str,
        slug: Optional[str] = None,
        is_private: bool = False,
        color: Optional[str] = None,
        icon: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new workspace"""
        
        # Generate slug if not provided
        if not slug:
            slug = self._generate_slug(name)
        
        # Validate slug format
        if not self._validate_slug(slug):
            return {"success": False, "error": "Invalid slug format"}
        
        # Check if slug already exists
        if self.workspace_repo.slug_exists(slug, tenant_id):
            return {"success": False, "error": "Workspace slug already exists"}
        
        workspace_data = {
            "name": name,
            "description": description,
            "slug": slug,
            "tenant_id": tenant_id,
            "created_by": created_by,
            "is_private": is_private,
            "color": color or "#3B82F6",
            "icon": icon,
            "is_active": True
        }
        
        try:
            workspace = self.workspace_repo.create(workspace_data)
            
            # Add creator as owner
            self.workspace_repo.add_member(workspace.id, created_by, "owner")
            
            return {
                "success": True,
                "workspace": self._workspace_to_dict(workspace)
            }
        except Exception as e:
            return {"success": False, "error": f"Workspace creation failed: {str(e)}"}
    
    def get_workspace(self, workspace_id: str, tenant_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get workspace by ID with user access check"""
        workspace = self.workspace_repo.get_by_id(workspace_id, tenant_id)
        
        if not workspace:
            return None
        
        # Check user access
        if not self.workspace_repo.user_has_access(workspace_id, user_id):
            return None
        
        # Get user's role in workspace
        user_role = self.workspace_repo.get_user_role_in_workspace(workspace_id, user_id)
        
        workspace_dict = self._workspace_to_dict(workspace)
        workspace_dict["user_role"] = user_role
        
        return workspace_dict
    
    def get_user_workspaces(self, user_id: str, tenant_id: str, include_archived: bool = False) -> List[Dict[str, Any]]:
        """Get all workspaces for a user"""
        workspaces = self.workspace_repo.get_user_workspaces(user_id, tenant_id, include_archived)
        
        result = []
        for workspace in workspaces:
            workspace_dict = self._workspace_to_dict(workspace)
            workspace_dict["user_role"] = self.workspace_repo.get_user_role_in_workspace(workspace.id, user_id)
            result.append(workspace_dict)
        
        return result
    
    def update_workspace(
        self,
        workspace_id: str,
        update_data: Dict[str, Any],
        tenant_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Update workspace (requires admin or owner role)"""
        
        # Check user permissions
        user_role = self.workspace_repo.get_user_role_in_workspace(workspace_id, user_id)
        if user_role not in ["owner", "admin"]:
            return {"success": False, "error": "Insufficient permissions"}
        
        # Validate slug if provided
        if "slug" in update_data:
            slug = update_data["slug"]
            if not self._validate_slug(slug):
                return {"success": False, "error": "Invalid slug format"}
            
            if self.workspace_repo.slug_exists(slug, tenant_id, workspace_id):
                return {"success": False, "error": "Workspace slug already exists"}
        
        # Safe fields that can be updated
        safe_fields = {
            "name", "description", "slug", "color", "icon", 
            "is_private", "settings"
        }
        
        filtered_data = {k: v for k, v in update_data.items() if k in safe_fields}
        
        if not filtered_data:
            return {"success": False, "error": "No valid fields to update"}
        
        try:
            workspace = self.workspace_repo.update(workspace_id, filtered_data, tenant_id)
            if workspace:
                return {
                    "success": True,
                    "workspace": self._workspace_to_dict(workspace)
                }
            else:
                return {"success": False, "error": "Workspace not found"}
        except Exception as e:
            return {"success": False, "error": f"Update failed: {str(e)}"}
    
    def delete_workspace(self, workspace_id: str, tenant_id: str, user_id: str) -> Dict[str, Any]:
        """Delete workspace (requires owner role)"""
        
        # Check user permissions
        user_role = self.workspace_repo.get_user_role_in_workspace(workspace_id, user_id)
        if user_role != "owner":
            return {"success": False, "error": "Only workspace owner can delete workspace"}
        
        try:
            success = self.workspace_repo.delete(workspace_id, tenant_id)
            if success:
                return {"success": True, "message": "Workspace deleted successfully"}
            else:
                return {"success": False, "error": "Workspace not found"}
        except Exception as e:
            return {"success": False, "error": f"Deletion failed: {str(e)}"}
    
    def add_member(
        self,
        workspace_id: str,
        user_id: str,
        role: str,
        tenant_id: str,
        requester_id: str
    ) -> Dict[str, Any]:
        """Add member to workspace"""
        
        # Check requester permissions
        requester_role = self.workspace_repo.get_user_role_in_workspace(workspace_id, requester_id)
        if requester_role not in ["owner", "admin"]:
            return {"success": False, "error": "Insufficient permissions"}
        
        # Validate role
        valid_roles = ["owner", "admin", "member", "viewer"]
        if role not in valid_roles:
            return {"success": False, "error": "Invalid role"}
        
        # Prevent non-owners from adding owners
        if role == "owner" and requester_role != "owner":
            return {"success": False, "error": "Only owners can add other owners"}
        
        try:
            member = self.workspace_repo.add_member(workspace_id, user_id, role)
            if member:
                return {
                    "success": True,
                    "member": self._member_to_dict(member)
                }
            else:
                return {"success": False, "error": "Failed to add member"}
        except Exception as e:
            return {"success": False, "error": f"Adding member failed: {str(e)}"}
    
    def remove_member(
        self,
        workspace_id: str,
        user_id: str,
        tenant_id: str,
        requester_id: str
    ) -> Dict[str, Any]:
        """Remove member from workspace"""
        
        # Check requester permissions
        requester_role = self.workspace_repo.get_user_role_in_workspace(workspace_id, requester_id)
        member_role = self.workspace_repo.get_user_role_in_workspace(workspace_id, user_id)
        
        # Can't remove yourself if you're the only owner
        if requester_id == user_id and requester_role == "owner":
            owners = [m for m in self.workspace_repo.get_workspace_members(workspace_id) if m.role == "owner"]
            if len(owners) <= 1:
                return {"success": False, "error": "Cannot remove the last owner"}
        
        # Only owners and admins can remove members, and they can't remove owners unless they're owners themselves
        if requester_role not in ["owner", "admin"]:
            return {"success": False, "error": "Insufficient permissions"}
        
        if member_role == "owner" and requester_role != "owner":
            return {"success": False, "error": "Only owners can remove other owners"}
        
        try:
            success = self.workspace_repo.remove_member(workspace_id, user_id)
            if success:
                return {"success": True, "message": "Member removed successfully"}
            else:
                return {"success": False, "error": "Member not found"}
        except Exception as e:
            return {"success": False, "error": f"Removing member failed: {str(e)}"}
    
    def update_member_role(
        self,
        workspace_id: str,
        user_id: str,
        role: str,
        tenant_id: str,
        requester_id: str
    ) -> Dict[str, Any]:
        """Update member role in workspace"""
        
        # Check requester permissions
        requester_role = self.workspace_repo.get_user_role_in_workspace(workspace_id, requester_id)
        current_role = self.workspace_repo.get_user_role_in_workspace(workspace_id, user_id)
        
        if requester_role not in ["owner", "admin"]:
            return {"success": False, "error": "Insufficient permissions"}
        
        # Validate role
        valid_roles = ["owner", "admin", "member", "viewer"]
        if role not in valid_roles:
            return {"success": False, "error": "Invalid role"}
        
        # Only owners can change owner roles
        if (current_role == "owner" or role == "owner") and requester_role != "owner":
            return {"success": False, "error": "Only owners can change owner roles"}
        
        try:
            success = self.workspace_repo.update_member_role(workspace_id, user_id, role)
            if success:
                return {"success": True, "message": "Member role updated successfully"}
            else:
                return {"success": False, "error": "Member not found"}
        except Exception as e:
            return {"success": False, "error": f"Updating role failed: {str(e)}"}
    
    def get_workspace_members(self, workspace_id: str, tenant_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Get workspace members (requires workspace access)"""
        
        # Check user access
        if not self.workspace_repo.user_has_access(workspace_id, user_id):
            return []
        
        members = self.workspace_repo.get_workspace_members(workspace_id)
        return [self._member_to_dict(member) for member in members]
    
    def search_workspaces(
        self,
        search_term: str,
        tenant_id: str,
        user_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Search workspaces accessible to user"""
        workspaces = self.workspace_repo.search_workspaces(search_term, tenant_id, user_id, skip, limit)
        
        result = []
        for workspace in workspaces:
            workspace_dict = self._workspace_to_dict(workspace)
            workspace_dict["user_role"] = self.workspace_repo.get_user_role_in_workspace(workspace.id, user_id)
            result.append(workspace_dict)
        
        return result
    
    def archive_workspace(self, workspace_id: str, tenant_id: str, user_id: str) -> Dict[str, Any]:
        """Archive workspace (requires admin or owner role)"""
        user_role = self.workspace_repo.get_user_role_in_workspace(workspace_id, user_id)
        if user_role not in ["owner", "admin"]:
            return {"success": False, "error": "Insufficient permissions"}
        
        try:
            success = self.workspace_repo.archive_workspace(workspace_id, tenant_id)
            if success:
                return {"success": True, "message": "Workspace archived successfully"}
            else:
                return {"success": False, "error": "Workspace not found"}
        except Exception as e:
            return {"success": False, "error": f"Archiving failed: {str(e)}"}
    
    def unarchive_workspace(self, workspace_id: str, tenant_id: str, user_id: str) -> Dict[str, Any]:
        """Unarchive workspace (requires admin or owner role)"""
        user_role = self.workspace_repo.get_user_role_in_workspace(workspace_id, user_id)
        if user_role not in ["owner", "admin"]:
            return {"success": False, "error": "Insufficient permissions"}
        
        try:
            success = self.workspace_repo.unarchive_workspace(workspace_id, tenant_id)
            if success:
                return {"success": True, "message": "Workspace unarchived successfully"}
            else:
                return {"success": False, "error": "Workspace not found"}
        except Exception as e:
            return {"success": False, "error": f"Unarchiving failed: {str(e)}"}
    
    def _generate_slug(self, name: str) -> str:
        """Generate a URL-friendly slug from workspace name"""
        slug = name.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)  # Remove special characters
        slug = re.sub(r'\s+', '-', slug)  # Replace spaces with hyphens
        slug = re.sub(r'-+', '-', slug)  # Replace multiple hyphens with single
        slug = slug.strip('-')  # Remove leading/trailing hyphens
        return slug[:50]  # Limit length
    
    def _validate_slug(self, slug: str) -> bool:
        """Validate slug format"""
        if not slug or len(slug) < 2 or len(slug) > 50:
            return False
        
        # Must contain only lowercase letters, numbers, and hyphens
        pattern = r'^[a-z0-9-]+$'
        if not re.match(pattern, slug):
            return False
        
        # Can't start or end with hyphen
        if slug.startswith('-') or slug.endswith('-'):
            return False
        
        return True
    
    def _workspace_to_dict(self, workspace: Workspace) -> Dict[str, Any]:
        """Convert workspace model to dictionary"""
        return {
            "id": workspace.id,
            "name": workspace.name,
            "description": workspace.description,
            "slug": workspace.slug,
            "color": workspace.color,
            "icon": workspace.icon,
            "avatar_url": workspace.avatar_url,
            "is_private": workspace.is_private,
            "is_active": workspace.is_active,
            "is_archived": workspace.is_archived,
            "created_at": workspace.created_at,
            "updated_at": workspace.updated_at,
            "created_by": workspace.created_by
        }
    
    def _member_to_dict(self, member: WorkspaceMember) -> Dict[str, Any]:
        """Convert workspace member to dictionary"""
        return {
            "id": member.id,
            "workspace_id": member.workspace_id,
            "user_id": member.user_id,
            "role": member.role,
            "is_active": member.is_active,
            "created_at": member.created_at,
            "user": {
                "id": member.user.id,
                "email": member.user.email,
                "username": member.user.username,
                "full_name": member.user.full_name,
                "avatar_url": member.user.avatar_url
            } if member.user else None
        }
