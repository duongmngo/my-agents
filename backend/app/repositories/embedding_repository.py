"""
Repository for embedding provider configurations and workspace embedding settings
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from app.models.embedding import (
    EmbeddingProviderConfig, 
    WorkspaceEmbeddingSettings, 
    EmbeddingProviderType
)
from app.repositories.base_repository import BaseRepository

class EmbeddingProviderConfigRepository(BaseRepository[EmbeddingProviderConfig]):
    """Repository for embedding provider configurations and workspace settings"""
    
    def __init__(self, db: Session):
        super().__init__(db, EmbeddingProviderConfig)
    
    def get_workspace_providers(self, workspace_id: str) -> List[EmbeddingProviderConfig]:
        """Get all embedding providers for a workspace"""
        try:
            return self.filter_by(
                filters={"workspace_id": workspace_id}
            )
        except Exception as e:
            print(f"Error fetching workspace providers: {e}")
            return []
    
    def get_active_provider(self, workspace_id: str) -> Optional[EmbeddingProviderConfig]:
        """Get the currently active embedding provider for a workspace"""
        try:
            providers = self.filter_by(
                filters={
                    "workspace_id": workspace_id,
                    "is_active": True
                },
                limit=1
            )
            return providers[0] if providers else None
        except Exception as e:
            print(f"Error fetching active provider: {e}")
            return None
    
    def get_provider_by_id(self, provider_id: str) -> Optional[EmbeddingProviderConfig]:
        """Get a provider by its ID"""
        try:
            return self.get_by_id(provider_id)
        except Exception as e:
            print(f"Error fetching provider by ID: {e}")
            return None
    
    def create_provider(self, provider_data: Dict[str, Any]) -> Optional[EmbeddingProviderConfig]:
        """Create a new embedding provider"""
        try:
            # Convert provider type string to enum
            if "provider" in provider_data:
                provider_data["provider_type"] = EmbeddingProviderType(provider_data["provider"])
                del provider_data["provider"]
            
            return self.create(provider_data)
        except Exception as e:
            print(f"Error creating provider: {e}")
            return None
    
    def update_provider(self, provider_id: str, provider_data: Dict[str, Any]) -> Optional[EmbeddingProviderConfig]:
        """Update an existing embedding provider"""
        try:
            # Handle config updates specially - merge with existing config
            if "config" in provider_data:
                provider = self.get_by_id(provider_id)
                if provider and provider.config:
                    # Merge with existing config
                    existing_config = provider.config.copy()
                    existing_config.update(provider_data["config"])
                    provider_data["config"] = existing_config
            
            return self.update(provider_id, provider_data)
        except Exception as e:
            print(f"Error updating provider: {e}")
            return None
    
    def delete_provider(self, provider_id: str) -> bool:
        """Delete an embedding provider"""
        try:
            return self.delete(provider_id, soft_delete=True)
        except Exception as e:
            print(f"Error deleting provider: {e}")
            return False
    
    def toggle_provider_active(self, provider_id: str) -> bool:
        """Toggle the active status of a provider"""
        try:
            provider = self.get_by_id(provider_id)
            if not provider:
                return False
            
            if provider.is_active:
                # Deactivating - activate another provider if available
                self.update(provider_id, {"is_active": False})
                other_providers = self.get_workspace_providers(provider.workspace_id)
                active_providers = [p for p in other_providers if p.is_active and p.id != provider_id]
                
                if not active_providers:
                    # Activate the first available provider
                    all_providers = self.get_workspace_providers(provider.workspace_id)
                    default_provider = next((p for p in all_providers if p.id != provider_id), None)
                    if default_provider:
                        self.update(default_provider.id, {"is_active": True})
            else:
                # Activating - deactivate other active providers
                other_providers = self.get_workspace_providers(provider.workspace_id)
                for other_provider in other_providers:
                    if other_provider.is_active and other_provider.id != provider_id:
                        self.update(other_provider.id, {"is_active": False})
                
                self.update(provider_id, {"is_active": True})
            
            return True
        except Exception as e:
            print(f"Error toggling provider active status: {e}")
            return False
    
    def set_provider_active(self, provider_id: str, workspace_id: str) -> bool:
        """Set a provider as active and deactivate all other providers in the workspace"""
        try:
            print(f"Setting provider {provider_id} as active in workspace {workspace_id}")
            
            # First, deactivate all providers in the workspace
            workspace_providers = self.get_workspace_providers(workspace_id)
            for provider in workspace_providers:
                if provider.is_active:
                    self.update(provider.id, {"is_active": False})
            
            # Then activate the specified provider
            provider = self.get_by_id(provider_id)
            if not provider or provider.workspace_id != workspace_id:
                print(f"Provider {provider_id} not found in workspace {workspace_id}")
                return False
            
            self.update(provider_id, {"is_active": True})
            print(f"Successfully activated provider {provider_id}")
            return True
        except Exception as e:
            print(f"Error setting provider active: {e}")
            return False
    
    def get_workspace_settings(self, workspace_id: str) -> Optional[WorkspaceEmbeddingSettings]:
        """Get workspace embedding settings"""
        try:
            query = self.db.query(WorkspaceEmbeddingSettings).filter(
                WorkspaceEmbeddingSettings.workspace_id == workspace_id
            )
            return query.first()
        except Exception as e:
            print(f"Error fetching workspace settings: {e}")
            return None
    
    def create_or_update_workspace_settings(self, workspace_id: str, settings_data: Dict[str, Any]) -> Optional[WorkspaceEmbeddingSettings]:
        """Create or update workspace embedding settings"""
        try:
            # Get or create settings
            settings = self.get_workspace_settings(workspace_id)
            
            if not settings:
                # Create new settings
                settings_data["workspace_id"] = workspace_id
                settings = WorkspaceEmbeddingSettings(**settings_data)
                self.db.add(settings)
                self.db.commit()
                self.db.refresh(settings)
            else:
                # Update existing settings
                for key, value in settings_data.items():
                    if hasattr(settings, key):
                        setattr(settings, key, value)
                
                self.db.commit()
                self.db.refresh(settings)
            
            return settings
        except Exception as e:
            print(f"Error creating/updating workspace settings: {e}")
            return None
    
    def get_total_providers_count(self) -> int:
        """Get total count of providers in the database"""
        try:
            return self.count()
        except Exception as e:
            print(f"Error counting total providers: {e}")
            return 0
    
    def get_sample_providers(self, limit: int = 5) -> List[EmbeddingProviderConfig]:
        """Get sample providers from any workspace for debugging"""
        try:
            return self.get_all(limit=limit)
        except Exception as e:
            print(f"Error fetching sample providers: {e}")
            return []
    
    def get_providers_by_type(self, provider_type: EmbeddingProviderType, limit: int = 100) -> List[EmbeddingProviderConfig]:
        """Get providers by type"""
        try:
            return self.filter_by(
                filters={"provider_type": provider_type},
                limit=limit
            )
        except Exception as e:
            print(f"Error fetching providers by type: {e}")
            return []
    
    def get_active_providers(self, limit: int = 100) -> List[EmbeddingProviderConfig]:
        """Get all active providers"""
        try:
            return self.filter_by(
                filters={"is_active": True},
                limit=limit
            )
        except Exception as e:
            print(f"Error fetching active providers: {e}")
            return []
    
    def count_providers_by_workspace(self, workspace_id: str) -> int:
        """Count providers in a workspace"""
        try:
            return self.count(filters={"workspace_id": workspace_id})
        except Exception as e:
            print(f"Error counting providers by workspace: {e}")
            return 0
    
    def search_providers(self, search_term: str, workspace_id: Optional[str] = None, limit: int = 100) -> List[EmbeddingProviderConfig]:
        """Search providers by name or description"""
        try:
            search_fields = ["name", "description"]
            results = self.search(search_term, search_fields, limit=limit)
            
            # Filter by workspace if specified
            if workspace_id:
                results = [p for p in results if p.workspace_id == workspace_id]
            
            return results
        except Exception as e:
            print(f"Error searching providers: {e}")
            return []