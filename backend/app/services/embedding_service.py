"""
Embedding service for managing embedding provider configurations and operations
"""
import asyncio
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.embedding import (
    EmbeddingProviderConfig, 
    WorkspaceEmbeddingSettings, 
    EmbeddingProviderType
)
from app.repositories.embedding_repository import EmbeddingRepository

# Import embedding providers with error handling
try:
    from app.ai.embeddings import EmbeddingProvider, EmbeddingProviderFactory, EmbeddingRequest
    EMBEDDING_PROVIDERS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Embedding providers not available: {e}")
    EMBEDDING_PROVIDERS_AVAILABLE = False
    EmbeddingProvider = None
    EmbeddingProviderFactory = None
    EmbeddingRequest = None

from app.utils.text_processor import TextProcessor


class EmbeddingService:
    """Service for managing embedding provider configurations and operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = EmbeddingRepository(db)
        self.text_processor = TextProcessor()
        
        # Initialize embedding provider (will be set based on active provider)
        self.active_provider = None
        
        # Debug database session
        print(f"EmbeddingService initialized with db session: {db is not None}")
        if db:
            print(f"Database session type: {type(db)}")
            print(f"Database session is closed: {getattr(db, 'is_closed', 'unknown')}")
        
    async def get_workspace_providers(self, workspace_id: str) -> List[EmbeddingProviderConfig]:
        """Get all embedding providers for a workspace"""
        try:
            print(f"get_workspace_providers called with workspace_id: {workspace_id}")
            
            # Debug: Check total providers and sample data
            total_count = await self.repository.get_total_providers_count()
            print(f"Total providers in database: {total_count}")
            
            sample_providers = await self.repository.get_sample_providers(5)
            print(f"Sample providers in database: {len(sample_providers)}")
            for provider in sample_providers:
                print(f"  - Provider ID: {provider.id}, Workspace ID: {provider.workspace_id}, Name: {provider.name}")
            
            # Get providers for the specific workspace
            providers = await self.repository.get_workspace_providers(workspace_id)
            print(f"Found {len(providers)} providers for workspace {workspace_id}")
            
            for provider in providers:
                print(f"  - Provider: {provider.name} (ID: {provider.id})")
            
            return providers
        except Exception as e:
            print(f"Error fetching workspace providers: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def get_active_provider(self, workspace_id: str) -> Optional[EmbeddingProviderConfig]:
        """Get the currently active embedding provider for a workspace"""
        return await self.repository.get_active_provider(workspace_id)
    
    
    async def add_provider(
        self, 
        workspace_id: str, 
        user_id: str, 
        provider_data: Dict[str, Any]
    ) -> Optional[EmbeddingProviderConfig]:
        """Add or update an embedding provider to a workspace (provider type is unique per workspace)"""
        try:
            # Validate required fields
            if not provider_data.get("name"):
                print("Error: Provider name is required")
                return None
            if not provider_data.get("provider"):
                print("Error: Provider type is required")
                return None
            if not provider_data.get("config"):
                print("Error: Provider config is required")
                return None
            
            # Handle metadata field - extract description from metadata if present
            description = provider_data.get("description")
            if not description and provider_data.get("metadata"):
                description = provider_data["metadata"].get("description")
            
            provider_type = provider_data["provider"]
            print(f"Adding/updating provider: workspace_id={workspace_id}, user_id={user_id}, type={provider_type}")
            
            # Check if provider of this type already exists for the workspace
            existing_providers = await self.get_workspace_providers(workspace_id)
            existing_provider = next(
                (p for p in existing_providers if p.provider_type.value == provider_type), 
                None
            )
            
            if existing_provider:
                print(f"Provider of type '{provider_type}' already exists, updating it")
                # Update existing provider
                update_data = {
                    "name": provider_data["name"],
                    "config": provider_data["config"],
                    "description": description
                }
                updated_provider = await self.repository.update_provider(existing_provider.id, update_data)
                
                # Make this provider active (deactivate others)
                await self.repository.set_provider_active(updated_provider.id, workspace_id)
                
                return updated_provider
            else:
                print(f"Creating new provider of type '{provider_type}'")
                # Check if this is the first provider for the workspace
                is_first_provider = len(existing_providers) == 0
                if is_first_provider:
                    print("No existing providers, making this one default and active")
                
                # Prepare provider data for repository
                provider_create_data = {
                    "workspace_id": workspace_id,
                    "created_by": user_id,
                    "name": provider_data["name"],
                    "provider": provider_data["provider"],
                    "config": provider_data["config"],
                    "description": description,
                    "is_active": True,  # New provider is always active
                }
                
                # Create provider using repository
                new_provider = await self.repository.create_provider(provider_create_data)
                
                if new_provider:
                    print(f"Provider created successfully with ID: {new_provider.id}")
                    # Deactivate all other providers in the workspace
                    await self.repository.set_provider_active(new_provider.id, workspace_id)
                else:
                    print("Failed to create provider")
                
                return new_provider
            
        except Exception as e:
            print(f"Error adding/updating provider: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def update_provider(
        self, 
        provider_id: str, 
        provider_data: Dict[str, Any]
    ) -> Optional[EmbeddingProviderConfig]:
        """Update an existing embedding provider"""
        return await self.repository.update_provider(provider_id, provider_data)
    
    async def delete_provider(self, provider_id: str) -> bool:
        """Delete an embedding provider"""
        try:
            # Get the provider to check workspace and status
            provider = await self.repository.get_provider_by_id(provider_id)
            if not provider:
                return False
            
            # Don't allow deletion of the last provider
            workspace_providers = await self.get_workspace_providers(provider.workspace_id)
            if len(workspace_providers) <= 1:
                raise ValueError("Cannot delete the last provider in a workspace")
            
            # If deleting active provider, activate another one
            if provider.is_active:
                other_providers = [p for p in workspace_providers if p.id != provider_id]
                if other_providers:
                    # Activate the first available provider
                    active_provider = other_providers[0]
                    active_provider.activate()
            
            
            # Delete using repository
            return await self.repository.delete_provider(provider_id)
            
        except Exception as e:
            print(f"Error deleting provider: {e}")
            return False
    
    
    async def toggle_provider_active(self, provider_id: str) -> bool:
        """Toggle the active status of a provider"""
        return await self.repository.toggle_provider_active(provider_id)
    
    async def get_workspace_settings(self, workspace_id: str) -> Optional[WorkspaceEmbeddingSettings]:
        """Get workspace embedding settings"""
        return await self.repository.get_workspace_settings(workspace_id)
    
    async def update_workspace_settings(
        self, 
        workspace_id: str, 
        settings_data: Dict[str, Any]
    ) -> Optional[WorkspaceEmbeddingSettings]:
        """Update workspace embedding settings"""
        return await self.repository.create_or_update_workspace_settings(workspace_id, settings_data)
    
    async def test_provider(self, provider_id: str) -> Dict[str, Any]:
        """Test a provider configuration"""
        if not EMBEDDING_PROVIDERS_AVAILABLE or EmbeddingProviderFactory is None or EmbeddingRequest is None:
            return {
                "success": False, 
                "message": "Embedding providers not available - dependencies not installed"
            }
        
        try:
            provider = await self.repository.get_provider_by_id(provider_id)
            
            if not provider:
                return {"success": False, "message": "Provider not found"}
            
            # Create provider instance for testing
            provider_instance = EmbeddingProviderFactory.create_provider(
                provider.provider_type.value, 
                provider.config
            )
            
            # Test with a simple text
            test_request = EmbeddingRequest(text="Test embedding generation")
            
            try:
                start_time = asyncio.get_event_loop().time()
                response = await provider_instance.generate_embedding(test_request)
                end_time = asyncio.get_event_loop().time()
                
                latency_ms = int((end_time - start_time) * 1000)
                
                # Update provider stats
                provider.update_usage_stats(
                    tokens_processed=len(test_request.text.split()),
                    latency_ms=latency_ms,
                    success=True
                )
                # Provider is active (no status field needed)
                
                self.db.commit()
                
                return {
                    "success": True,
                    "message": "Provider test successful",
                    "latency_ms": latency_ms,
                    "dimension": len(response.embedding),
                    "model": response.model
                }
                
            except Exception as e:
                # Provider has error (no status field needed)
                provider.update_usage_stats(
                    tokens_processed=0,
                    success=False
                )
                self.db.commit()
                
                return {
                    "success": False,
                    "message": f"Provider test failed: {str(e)}"
                }
                
        except Exception as e:
            print(f"Error testing provider: {e}")
            return {"success": False, "message": f"Test error: {str(e)}"}
    
    async def get_provider_usage(
        self, 
        provider_id: str, 
        period: str = "month"
    ) -> Dict[str, Any]:
        """Get usage statistics for a provider"""
        try:
            provider = await self.repository.get_provider_by_id(provider_id)
            
            if not provider:
                return {"success": False, "message": "Provider not found"}
            
            return {
                "success": True,
                "data": {
                    "totalTokens": provider.total_tokens_processed,
                    "totalCost": 0,  # TODO: Implement cost calculation
                    "requestCount": provider.usage_count,
                    "averageLatency": provider.average_latency,
                    "errorRate": provider.error_rate
                }
            }
            
        except Exception as e:
            print(f"Error getting provider usage: {e}")
            return {"success": False, "message": f"Error: {str(e)}"}
    
    async def generate_embedding(
        self, 
        text: str, 
        workspace_id: str,
        model: Optional[str] = None
    ) -> Optional[List[float]]:
        """Generate embedding using the active provider for a workspace"""
        if not EMBEDDING_PROVIDERS_AVAILABLE or EmbeddingProviderFactory is None or EmbeddingRequest is None:
            print("Warning: Cannot generate embeddings - embedding providers not available")
            return None
            
        try:
            # Get active provider
            active_provider = await self.get_active_provider(workspace_id)
            if not active_provider:
                raise Exception("No active embedding provider available for this workspace")
            
            # Create provider instance
            provider_instance = EmbeddingProviderFactory.create_provider(
                active_provider.provider_type.value,
                active_provider.config
            )
            
            # Generate embedding
            request = EmbeddingRequest(text=text, model=model)
            start_time = asyncio.get_event_loop().time()
            
            response = await provider_instance.generate_embedding(request)
            
            end_time = asyncio.get_event_loop().time()
            latency_ms = int((end_time - start_time) * 1000)
            
            # Update provider stats
            active_provider.update_usage_stats(
                tokens_processed=len(text.split()),
                latency_ms=latency_ms,
                success=True
            )
            self.db.commit()
            
            return response.embedding
            
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None
