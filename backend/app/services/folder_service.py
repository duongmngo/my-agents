"""
Folder service for folder management and operations
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.repositories.folder_repository import FolderRepository
from app.models.folder import Folder, FolderCategory


class FolderService:
    """Service for folder operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.folder_repo = FolderRepository(db)
    
    def create_default_knowledge_folders(self, workspace_id: str, created_by: str) -> Dict[str, Any]:
        """Create default knowledge base folders for a new workspace"""
        try:
            default_folders = [
                {
                    "name": "Documents",
                    "description": "Store and organize your documents",
                    "category": FolderCategory.FILES,
                    "color": "#3B82F6",
                    "icon": "file-text"
                },
                {
                    "name": "Meeting Notes",
                    "description": "Store meeting notes and discussions",
                    "category": FolderCategory.NOTES,
                    "color": "#10B981",
                    "icon": "sticky-note"
                },
                {
                    "name": "Technical Notes",
                    "description": "Store technical documentation and notes",
                    "category": FolderCategory.NOTES,
                    "color": "#F59E0B",
                    "icon": "code"
                }
            ]
            
            created_folders = []
            for folder_data in default_folders:
                folder = self.folder_repo.create_folder_with_path(
                    workspace_id=workspace_id,
                    name=folder_data["name"],
                    category=folder_data["category"],
                    parent_id=None,  # Root level folders
                    created_by=created_by
                )
                
                # Update with additional metadata
                self.folder_repo.update(folder.id, {
                    "description": folder_data["description"],
                    "color": folder_data["color"],
                    "icon": folder_data["icon"]
                })
                
                created_folders.append(self._folder_to_dict(folder))
            
            return {
                "success": True,
                "folders": created_folders
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to create default folders: {str(e)}"}
    
    def create_folder(
        self,
        name: str,
        workspace_id: str,
        created_by: str,
        category: FolderCategory = FolderCategory.FILES,
        parent_id: Optional[str] = None,
        description: Optional[str] = None,
        color: Optional[str] = None,
        icon: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new folder"""
        try:
            # Validate parent folder if provided
            if parent_id:
                parent = self.folder_repo.get_by_id(parent_id)
                if not parent or parent.workspace_id != workspace_id:
                    return {"success": False, "error": "Invalid parent folder"}
                # Ensure parent folder has the same category
                if parent.category.value != category.value:
                    return {"success": False, "error": "Parent folder must have the same category"}
            
            folder = self.folder_repo.create_folder_with_path(
                workspace_id=workspace_id,
                name=name,
                category=category,
                parent_id=parent_id,
                created_by=created_by
            )
            
            # Update with additional metadata
            update_data = {}
            if description:
                update_data["description"] = description
            if color:
                update_data["color"] = color
            if icon:
                update_data["icon"] = icon
            
            if update_data:
                self.folder_repo.update(folder.id, update_data)
                folder = self.folder_repo.get_by_id(folder.id)
            
            return {
                "success": True,
                "folder": self._folder_to_dict(folder)
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to create folder: {str(e)}"}
    
    def get_workspace_folders(
        self,
        workspace_id: str,
        category: Optional[FolderCategory] = None,
        parent_id: Optional[str] = None,
        include_children: bool = False
    ) -> List[Dict[str, Any]]:
        """Get folders in a workspace"""
        try:
            if include_children:
                folders = self.folder_repo.get_folder_tree(workspace_id, category=category)
            else:
                folders = self.folder_repo.get_workspace_folders(workspace_id, category=category, parent_id=parent_id)
            
            return [self._folder_to_dict(folder) for folder in folders]
        except Exception as e:
            return []
    
    def get_folder(self, folder_id: str, workspace_id: str) -> Optional[Dict[str, Any]]:
        """Get folder by ID with workspace access check"""
        try:
            folder = self.folder_repo.get_by_id(folder_id)
            if folder and folder.workspace_id == workspace_id:
                return self._folder_to_dict(folder)
            return None
        except Exception:
            return None
    
    def update_folder(
        self,
        folder_id: str,
        workspace_id: str,
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update folder"""
        try:
            folder = self.folder_repo.get_by_id(folder_id)
            if not folder or folder.workspace_id != workspace_id:
                return {"success": False, "error": "Folder not found"}
            
            # Safe fields that can be updated
            safe_fields = {
                "name", "description", "category", "color", "icon", "is_pinned", "is_archived"
            }
            
            filtered_data = {k: v for k, v in update_data.items() if k in safe_fields}
            
            if not filtered_data:
                return {"success": False, "error": "No valid fields to update"}
            
            # If category is being updated, validate that all children have the same category
            if "category" in filtered_data:
                children = self.folder_repo.get_folder_children(folder_id)
                for child in children:
                    if child.category != filtered_data["category"]:
                        return {"success": False, "error": "Cannot change category: folder has children with different category"}
            
            updated_folder = self.folder_repo.update(folder_id, filtered_data)
            if updated_folder:
                return {
                    "success": True,
                    "folder": self._folder_to_dict(updated_folder)
                }
            else:
                return {"success": False, "error": "Failed to update folder"}
        except Exception as e:
            return {"success": False, "error": f"Failed to update folder: {str(e)}"}
    
    def delete_folder(self, folder_id: str, workspace_id: str) -> Dict[str, Any]:
        """Delete folder and all its contents"""
        try:
            folder = self.folder_repo.get_by_id(folder_id)
            if not folder or folder.workspace_id != workspace_id:
                return {"success": False, "error": "Folder not found"}
            
            # Check if folder has children
            children = self.folder_repo.get_folder_children(folder_id)
            if children:
                return {"success": False, "error": "Cannot delete folder with subfolders"}
            
            # TODO: Check if folder has files or notes
            # For now, we'll allow deletion and handle file/note cleanup separately
            
            success = self.folder_repo.delete(folder_id)
            if success:
                return {"success": True, "message": "Folder deleted successfully"}
            else:
                return {"success": False, "error": "Failed to delete folder"}
        except Exception as e:
            return {"success": False, "error": f"Failed to delete folder: {str(e)}"}
    
    def move_folder(
        self,
        folder_id: str,
        new_parent_id: Optional[str],
        workspace_id: str
    ) -> Dict[str, Any]:
        """Move folder to a new parent"""
        try:
            folder = self.folder_repo.get_by_id(folder_id)
            if not folder or folder.workspace_id != workspace_id:
                return {"success": False, "error": "Folder not found"}
            
            # Validate new parent if provided
            if new_parent_id:
                new_parent = self.folder_repo.get_by_id(new_parent_id)
                if not new_parent or new_parent.workspace_id != workspace_id:
                    return {"success": False, "error": "Invalid parent folder"}
                # Ensure parent folder has the same category
                if new_parent.category != folder.category:
                    return {"success": False, "error": "Parent folder must have the same category"}
            
            success = self.folder_repo.move_folder(folder_id, new_parent_id)
            if success:
                updated_folder = self.folder_repo.get_by_id(folder_id)
                return {
                    "success": True,
                    "folder": self._folder_to_dict(updated_folder)
                }
            else:
                return {"success": False, "error": "Failed to move folder"}
        except Exception as e:
            return {"success": False, "error": f"Failed to move folder: {str(e)}"}
    
    def search_folders(
        self,
        search_term: str,
        workspace_id: str,
        category: Optional[FolderCategory] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Search folders in workspace"""
        try:
            folders = self.folder_repo.search_folders(search_term, workspace_id, category=category, skip=skip, limit=limit)
            return [self._folder_to_dict(folder) for folder in folders]
        except Exception:
            return []
    
    def get_folder_breadcrumbs(self, folder_id: str, workspace_id: str) -> List[Dict[str, Any]]:
        """Get breadcrumb trail for a folder"""
        try:
            folder = self.folder_repo.get_by_id(folder_id)
            if not folder or folder.workspace_id != workspace_id:
                return []
            
            return folder.get_breadcrumbs()
        except Exception:
            return []
    
    def _folder_to_dict(self, folder: Folder) -> Dict[str, Any]:
        """Convert folder model to dictionary"""
        return {
            "id": folder.id,
            "name": folder.name,
            "description": folder.description,
            "category": folder.category,
            "workspace_id": folder.workspace_id,
            "parent_id": folder.parent_id,
            "path": folder.path,
            "level": folder.level,
            "color": folder.color,
            "icon": folder.icon,
            "is_private": folder.is_private,
            "is_pinned": folder.is_pinned,
            "is_archived": folder.is_archived,
            "created_by": folder.created_by,
            "created_at": folder.created_at,
            "updated_at": folder.updated_at
        }
