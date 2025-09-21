"""
Repository for embedding provider configurations and workspace embedding settings
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.embedding import (
    EmbeddingProviderConfig, 
    WorkspaceEmbeddingSettings, 
    EmbeddingProviderType
)
class EmbeddingRepository:
    """Repository for embedding provider configurations and workspace settings"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    def _check_db_session(self) -> bool:
        """Check if database session is valid"""
        if self.db is None:
            print("Error: Database session is None")
            return False
        return True
    
    async def get_workspace_providers(self, workspace_id: str) -> List[EmbeddingProviderConfig]:
        """Get all embedding providers for a workspace"""
        try:
            query = select(EmbeddingProviderConfig).where(
                EmbeddingProviderConfig.workspace_id == workspace_id
            )
            print(f"RAW SQL QUERY: {query}")
            print(f"QUERY PARAMETERS: workspace_id='{workspace_id}'")
            result = self.db.execute(query)
            return [row for row in result.scalars()]
        except Exception as e:
            print(f"Error fetching workspace providers: {e}")
            return []
    
    async def get_active_provider(self, workspace_id: str) -> Optional[EmbeddingProviderConfig]:
        """Get the currently active embedding provider for a workspace"""
        try:
            query = select(EmbeddingProviderConfig).where(
                and_(
                    EmbeddingProviderConfig.workspace_id == workspace_id,
                    EmbeddingProviderConfig.is_active == True
                )
            )
            result = self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            print(f"Error fetching active provider: {e}")
            return None
    
    
    async def get_provider_by_id(self, provider_id: str) -> Optional[EmbeddingProviderConfig]:
        """Get a provider by its ID"""
        try:
            query = select(EmbeddingProviderConfig).where(
                EmbeddingProviderConfig.id == provider_id
            )
            result = self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            print(f"Error fetching provider by ID: {e}")
            return None
    
    async def create_provider(self, provider_data: Dict[str, Any]) -> Optional[EmbeddingProviderConfig]:
        """Create a new embedding provider"""
        if not self._check_db_session():
            return None
        
        try:
            new_provider = EmbeddingProviderConfig(
                workspace_id=provider_data["workspace_id"],
                created_by=provider_data["created_by"],
                name=provider_data["name"],
                provider_type=EmbeddingProviderType(provider_data["provider"]),
                config=provider_data["config"],
                description=provider_data.get("description"),
                is_active=provider_data.get("is_active", False),
            )
            
            self.db.add(new_provider)
            self.db.commit()
            self.db.refresh(new_provider)
            
            return new_provider
        except Exception as e:
            if self.db is not None:
                self.db.rollback()
            print(f"Error creating provider: {e}")
            return None
    
    async def update_provider(self, provider_id: str, provider_data: Dict[str, Any]) -> Optional[EmbeddingProviderConfig]:
        """Update an existing embedding provider"""
        try:
            provider = await self.get_provider_by_id(provider_id)
            if not provider:
                return None
            
            # Update fields
            if "name" in provider_data:
                provider.name = provider_data["name"]
            if "config" in provider_data:
                provider.config.update(provider_data["config"])
            if "description" in provider_data:
                provider.description = provider_data["description"]
            if "is_active" in provider_data:
                provider.is_active = provider_data["is_active"]
            
            self.db.commit()
            self.db.refresh(provider)
            
            return provider
        except Exception as e:
            if self.db is not None:
                self.db.rollback()
            print(f"Error updating provider: {e}")
            return None
    
    async def delete_provider(self, provider_id: str) -> bool:
        """Delete an embedding provider"""
        try:
            provider = await self.get_provider_by_id(provider_id)
            if not provider:
                return False
            
            self.db.delete(provider)
            self.db.commit()
            
            return True
        except Exception as e:
            if self.db is not None:
                self.db.rollback()
            print(f"Error deleting provider: {e}")
            return False
    
    
    async def toggle_provider_active(self, provider_id: str) -> bool:
        """Toggle the active status of a provider"""
        try:
            provider = await self.get_provider_by_id(provider_id)
            if not provider:
                return False
            
            if provider.is_active:
                # Deactivating - activate another provider if available
                provider.deactivate()
                other_providers = await self.get_workspace_providers(provider.workspace_id)
                active_providers = [p for p in other_providers if p.is_active and p.id != provider_id]
                
                if not active_providers:
                    # Activate the default provider
                    default_provider = await self.get_default_provider(provider.workspace_id)
                    if default_provider and default_provider.id != provider_id:
                        default_provider.activate()
            else:
                # Activating - deactivate other active providers
                other_providers = await self.get_workspace_providers(provider.workspace_id)
                for other_provider in other_providers:
                    if other_provider.is_active and other_provider.id != provider_id:
                        other_provider.deactivate()
                
                provider.activate()
            
            self.db.commit()
            return True
        except Exception as e:
            if self.db is not None:
                self.db.rollback()
            print(f"Error toggling provider active status: {e}")
            return False
    
    async def set_provider_active(self, provider_id: str, workspace_id: str) -> bool:
        """Set a provider as active and deactivate all other providers in the workspace"""
        try:
            print(f"Setting provider {provider_id} as active in workspace {workspace_id}")
            
            # First, deactivate all providers in the workspace
            deactivate_query = select(EmbeddingProviderConfig).where(
                EmbeddingProviderConfig.workspace_id == workspace_id
            )
            result = self.db.execute(deactivate_query)
            all_providers = [row for row in result.scalars()]
            
            print(f"Found {len(all_providers)} providers in workspace")
            for provider in all_providers:
                print(f"  - Deactivating provider {provider.id} ({provider.name})")
                provider.deactivate()  # This sets both is_active=False and status=INACTIVE
            
            # Then activate the specified provider
            target_provider = await self.get_provider_by_id(provider_id)
            if target_provider:
                print(f"Activating provider {target_provider.id} ({target_provider.name})")
                target_provider.activate()  # This sets both is_active=True and status=ACTIVE
                self.db.commit()
                print(f"Successfully set provider {provider_id} as active")
                return True
            else:
                print(f"ERROR: Could not find provider {provider_id}")
                self.db.rollback()
                return False
                
        except Exception as e:
            if self.db is not None:
                self.db.rollback()
            print(f"Error setting provider active: {e}")
            return False
    
    async def get_workspace_settings(self, workspace_id: str) -> Optional[WorkspaceEmbeddingSettings]:
        """Get workspace embedding settings"""
        try:
            query = select(WorkspaceEmbeddingSettings).where(
                WorkspaceEmbeddingSettings.workspace_id == workspace_id
            )
            result = self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            print(f"Error fetching workspace settings: {e}")
            return None
    
    async def create_or_update_workspace_settings(self, workspace_id: str, settings_data: Dict[str, Any]) -> Optional[WorkspaceEmbeddingSettings]:
        """Create or update workspace embedding settings"""
        try:
            # Get or create settings
            settings = await self.get_workspace_settings(workspace_id)
            if not settings:
                settings = WorkspaceEmbeddingSettings(workspace_id=workspace_id)
                self.db.add(settings)
            
            # Update fields
            for key, value in settings_data.items():
                if hasattr(settings, key):
                    setattr(settings, key, value)
            
            self.db.commit()
            await self.db.refresh(settings)
            
            return settings
        except Exception as e:
            if self.db is not None:
                self.db.rollback()
            print(f"Error creating/updating workspace settings: {e}")
            return None
    
    async def get_total_providers_count(self) -> int:
        """Get total count of providers in the database"""
        try:
            count_query = select(func.count(EmbeddingProviderConfig.id))
            count_result = self.db.execute(count_query)
            return count_result.scalar() or 0
        except Exception as e:
            print(f"Error counting total providers: {e}")
            return 0
    
    async def get_sample_providers(self, limit: int = 5) -> List[EmbeddingProviderConfig]:
        """Get sample providers from any workspace for debugging"""
        try:
            query = select(EmbeddingProviderConfig).limit(limit)
            result = self.db.execute(query)
            return [row for row in result.scalars()]
        except Exception as e:
            print(f"Error fetching sample providers: {e}")
            return []
