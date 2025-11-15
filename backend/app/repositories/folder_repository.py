"""
Folder repository for folder-specific database operations
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.folder import Folder, FolderCategory
from app.repositories.base_repository import BaseRepository


class FolderRepository(BaseRepository[Folder]):
    """Repository for Folder model operations"""
    
    def __init__(self):
        super().__init__(Folder)
    
    def get_workspace_folders(self, workspace_id: str, category: Optional[FolderCategory] = None, parent_id: Optional[str] = None) -> List[Folder]:
        """Get folders in a workspace, optionally filtered by parent and category"""
        with self._get_db() as db:
            query = db.query(Folder).filter(
                Folder.workspace_id == workspace_id,
                Folder.is_deleted == False
            )
            
            if category:
                query = query.filter(Folder.category == category)
            
            if parent_id:
                query = query.filter(Folder.parent_id == parent_id)
            else:
                query = query.filter(Folder.parent_id.is_(None))
            
            return query.order_by(Folder.name).all()
    
    def get_folder_tree(self, workspace_id: str, category: Optional[FolderCategory] = None, max_depth: int = 10) -> List[Folder]:
        """Get complete folder tree for a workspace, optionally filtered by category"""
        with self._get_db() as db:
            query = db.query(Folder).filter(
                Folder.workspace_id == workspace_id,
                Folder.level <= max_depth,
                Folder.is_deleted == False
            )
            
            if category:
                query = query.filter(Folder.category == category)
            
            return query.order_by(Folder.path, Folder.name).all()
    
    def get_folder_by_path(self, workspace_id: str, path: str) -> Optional[Folder]:
        """Get folder by its full path"""
        with self._get_db() as db:
            return db.query(Folder).filter(
                Folder.workspace_id == workspace_id,
                Folder.path == path,
                Folder.is_deleted == False
            ).first()
    
    def get_folder_children(self, folder_id: str, include_files: bool = False) -> List[Folder]:
        """Get direct children of a folder"""
        with self._get_db() as db:
            folders = db.query(Folder).filter(
                Folder.parent_id == folder_id,
                Folder.is_deleted == False
            ).order_by(Folder.name).all()
            
            if include_files:
                # This would need to be handled differently as files are in a different table
                # You might want to return a combined result or handle this in the service layer
                pass
            
            return folders
    
    def get_folder_ancestors(self, folder_id: str) -> List[Folder]:
        """Get all ancestor folders (parent hierarchy)"""
        with self._get_db() as db:
            folder = db.query(Folder).filter(
                Folder.id == folder_id,
                Folder.is_deleted == False
            ).first()
            if not folder or not folder.path:
                return []
            
            # Split path and get all ancestor paths
            path_parts = folder.path.strip('/').split('/')
            ancestor_paths = []
            current_path = ""
            
            for part in path_parts[:-1]:  # Exclude the current folder
                current_path += f"/{part}"
                ancestor_paths.append(current_path)
            
            if not ancestor_paths:
                return []
            
            return db.query(Folder).filter(
                Folder.workspace_id == folder.workspace_id,
                Folder.path.in_(ancestor_paths),
                Folder.is_deleted == False
            ).order_by(Folder.level).all()
    
    def create_folder_with_path(self, workspace_id: str, name: str, category: FolderCategory, parent_id: Optional[str], created_by: str) -> Folder:
        """Create folder and automatically set path and level"""
        # Calculate path and level
        if parent_id:
            parent = self.get_by_id(parent_id)
            if not parent:
                raise ValueError("Parent folder not found")
            
            path = f"{parent.path}/{name}"
            level = parent.level + 1
        else:
            path = f"/{name}"
            level = 0
        
        folder_data = {
            "name": name,
            "category": category,
            "parent_id": parent_id,
            "path": path,
            "level": level,
            "workspace_id": workspace_id,
            "created_by": created_by
        }
        
        return self.create(folder_data)
    
    def move_folder(self, folder_id: str, new_parent_id: Optional[str]) -> bool:
        """Move folder to a new parent (updates path for folder and all descendants)"""
        with self._get_db() as db:
            folder = db.query(Folder).filter(
                Folder.id == folder_id,
                Folder.is_deleted == False
            ).first()
            if not folder:
                return False
            
            # Prevent moving folder into its own subtree
            if new_parent_id:
                new_parent = db.query(Folder).filter(
                    Folder.id == new_parent_id,
                    Folder.is_deleted == False
                ).first()
                if not new_parent or new_parent.path.startswith(folder.path):
                    return False
            
            old_path = folder.path
            
            # Calculate new path
            if new_parent_id:
                new_parent = db.query(Folder).filter(
                    Folder.id == new_parent_id,
                    Folder.is_deleted == False
                ).first()
                if not new_parent:
                    return False
                new_path = f"{new_parent.path}/{folder.name}"
                new_level = new_parent.level + 1
            else:
                new_path = f"/{folder.name}"
                new_level = 0
            
            # Update folder
            folder.parent_id = new_parent_id
            folder.path = new_path
            folder.level = new_level
            
            # Update all descendant folders
            descendants = db.query(Folder).filter(
                Folder.path.like(f"{old_path}/%"),
                Folder.is_deleted == False
            ).all()
            
            for descendant in descendants:
                # Replace the old path prefix with new path
                descendant.path = descendant.path.replace(old_path, new_path, 1)
                descendant.level = descendant.level - folder.level + new_level
            
            db.commit()
            return True
    
    def search_folders(self, search_term: str, workspace_id: str, category: Optional[FolderCategory] = None, skip: int = 0, limit: int = 100) -> List[Folder]:
        """Search folders by name or description, optionally filtered by category"""
        with self._get_db() as db:
            query = db.query(Folder).filter(
                Folder.workspace_id == workspace_id,
                (Folder.name.ilike(f"%{search_term}%") | 
                 Folder.description.ilike(f"%{search_term}%")),
                Folder.is_deleted == False
            )
            
            if category:
                query = query.filter(Folder.category == category)
            
            return query.offset(skip).limit(limit).all()
    
    def get_pinned_folders(self, workspace_id: str, category: Optional[FolderCategory] = None) -> List[Folder]:
        """Get pinned folders in a workspace, optionally filtered by category"""
        with self._get_db() as db:
            query = db.query(Folder).filter(
                Folder.workspace_id == workspace_id,
                Folder.is_pinned == True,
                Folder.is_deleted == False
            )
            
            if category:
                query = query.filter(Folder.category == category)
            
            return query.order_by(Folder.name).all()
    
    def toggle_pin(self, folder_id: str) -> bool:
        """Toggle pin status of a folder"""
        with self._get_db() as db:
            folder = db.query(Folder).filter(
                Folder.id == folder_id,
                Folder.is_deleted == False
            ).first()
            if folder:
                folder.is_pinned = not folder.is_pinned
                db.commit()
                return True
            return False
