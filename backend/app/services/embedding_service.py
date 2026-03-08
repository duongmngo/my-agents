"""
Embedding service for managing embedding provider configurations and operations
"""
import asyncio
from typing import List, Optional, Dict, Any, Union
from venv import logger
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.embedding import (
    EmbeddingProviderConfig, 
    WorkspaceEmbeddingSettings, 
    EmbeddingProviderType
)
from app.repositories.embedding_repository import EmbeddingProviderConfigRepository
from app.repositories.embedding_usage_repository import EmbeddingUsageRepository
from app.schemas.embedding_schemas import (
    EmbeddingProviderType
)
from app.schemas.embedding_request_schemas import (
    OpenAIConfigRequest, AzureConfigRequest, HuggingFaceConfigRequest
)

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


class EmbeddingProviderConfigService:
    """Service for managing embedding provider configurations and operations"""
    
    def __init__(self):
        # Repositories manage their own database sessions
        self.repository = EmbeddingProviderConfigRepository()
        self.usage_repository = EmbeddingUsageRepository()
        self.text_processor = TextProcessor()
        
        # Initialize embedding provider (will be set based on active provider)
        self.active_provider = None
    
    def _validate_provider_config(self, provider_type: str, config: Dict[str, Any]) -> bool:
        """Validate provider configuration using Pydantic schemas"""
        try:
            if provider_type.lower() == "openai":
                OpenAIConfigRequest(**config)
            elif provider_type.lower() == "azure":
                AzureConfigRequest(**config)
            elif provider_type.lower() == "huggingface":
                HuggingFaceConfigRequest(**config)
            else:
                raise ValueError(f"Unsupported provider type: {provider_type}")
            return True
        except Exception as e:
            print(f"Configuration validation failed for {provider_type}: {str(e)}")
            return False
        
    def get_workspace_providers(self, workspace_id: str) -> List[EmbeddingProviderConfig]:
        """Get all embedding providers for a workspace"""
            
        try:
            print(f"get_workspace_providers called with workspace_id: {workspace_id}")
            
            # Debug: Check total providers and sample data
            total_count = self.repository.get_total_providers_count()
            print(f"Total providers in database: {total_count}")
            
            sample_providers = self.repository.get_sample_providers(5)
            print(f"Sample providers in database: {len(sample_providers)}")
            for provider in sample_providers:
                print(f"  - Provider ID: {provider.id}, Workspace ID: {provider.workspace_id}, Name: {provider.name}")
            
            # Get providers for the specific workspace
            providers = self.repository.get_workspace_providers(workspace_id)
            print(f"Found {len(providers)} providers for workspace {workspace_id}")
            
            for provider in providers:
                print(f"  - Provider: {provider.name} (ID: {provider.id})")
            
            return providers
        except Exception as e:
            print(f"Error fetching workspace providers: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def get_active_provider(self, workspace_id: str) -> Optional[EmbeddingProviderConfig]:
        """Get the currently active embedding provider for a workspace"""
        return self.repository.get_active_provider(workspace_id)
    
    
    def add_provider(
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
            
            # Validate provider configuration
            if not self._validate_provider_config(provider_data["provider"], provider_data["config"]):
                print("Error: Invalid provider configuration")
                return None
            
            # Handle metadata field - extract description from metadata if present
            description = provider_data.get("description")
            if not description and provider_data.get("metadata"):
                description = provider_data["metadata"].get("description")
            
            provider_type = provider_data["provider"]
            print(f"Adding/updating provider: workspace_id={workspace_id}, user_id={user_id}, type={provider_type}")
            
            # Check if provider of this type already exists for the workspace
            existing_providers = self.get_workspace_providers(workspace_id)
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
                updated_provider = self.repository.update_provider(existing_provider.id, update_data)
                
                # Make this provider active (deactivate others)
                self.repository.set_provider_active(updated_provider.id, workspace_id)
                
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
                new_provider = self.repository.create_provider(provider_create_data)
                
                if new_provider:
                    print(f"Provider created successfully with ID: {new_provider.id}")
                    # Deactivate all other providers in the workspace
                    self.repository.set_provider_active(new_provider.id, workspace_id)
                else:
                    print("Failed to create provider")
                
                return new_provider
            
        except Exception as e:
            print(f"Error adding/updating provider: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def update_provider(
        self, 
        provider_id: str, 
        provider_data: Dict[str, Any]
    ) -> Optional[EmbeddingProviderConfig]:
        """Update an existing embedding provider"""
        return self.repository.update_provider(provider_id, provider_data)
    
    def delete_provider(self, provider_id: str) -> bool:
        """Delete an embedding provider"""
        try:
            # Get the provider to check workspace and status
            provider = self.repository.get_provider_by_id(provider_id)
            if not provider:
                return False
            
            # Don't allow deletion of the last provider
            workspace_providers = self.get_workspace_providers(provider.workspace_id)
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
            return self.repository.delete_provider(provider_id)
            
        except Exception as e:
            print(f"Error deleting provider: {e}")
            return False
    
    
    def toggle_provider_active(self, provider_id: str) -> bool:
        """Toggle the active status of a provider"""
        return self.repository.toggle_provider_active(provider_id)
    
    def get_workspace_settings(self, workspace_id: str) -> Optional[WorkspaceEmbeddingSettings]:
        """Get workspace embedding settings"""
        return self.repository.get_workspace_settings(workspace_id)
    
    def update_workspace_settings(
        self, 
        workspace_id: str, 
        settings_data: Dict[str, Any]
    ) -> Optional[WorkspaceEmbeddingSettings]:
        """Update workspace embedding settings"""
        return self.repository.create_or_update_workspace_settings(workspace_id, settings_data)
    
    async def test_provider(self, provider_id: str) -> Dict[str, Any]:
        """Test a provider configuration"""
        if not EMBEDDING_PROVIDERS_AVAILABLE or EmbeddingProviderFactory is None or EmbeddingRequest is None:
            return {
                "success": False, 
                "message": "Embedding providers not available - dependencies not installed"
            }
        
        try:
            provider = self.repository.get_provider_by_id(provider_id)
            
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
                import time
                start_time = time.time()
                response = await provider_instance.generate_embedding(test_request)
                end_time = time.time()
                
                latency_ms = int((end_time - start_time) * 1000)
                
                # Create usage tracking record
                self.usage_repository.create_usage_record(
                    provider_id=provider.id,
                    workspace_id=provider.workspace_id,
                    created_by=provider.created_by,
                    model_used=response.model or provider.get_config_value("model", "unknown"),
                    tokens_processed=len(test_request.text.split()),
                    latency_ms=latency_ms,
                    success=True,
                    request_type="test",
                    embedding_dimension=len(response.embedding)
                )
                
                return {
                    "success": True,
                    "message": "Provider test successful",
                    "latency_ms": latency_ms,
                    "dimension": len(response.embedding),
                    "model": response.model
                }
                
            except Exception as e:
                # Create usage tracking record for failed test
                self.usage_repository.create_usage_record(
                    provider_id=provider.id,
                    workspace_id=provider.workspace_id,
                    created_by=provider.created_by,
                    model_used=provider.get_config_value("model", "unknown"),
                    tokens_processed=0,
                    success=False,
                    request_type="test",
                    error_message=str(e)
                )
                
                return {
                    "success": False,
                    "message": f"Provider test failed: {str(e)}"
                }
                
        except Exception as e:
            print(f"Error testing provider: {e}")
            return {"success": False, "message": f"Test error: {str(e)}"}
    
    def get_provider_usage(
        self, 
        provider_id: str, 
        period: str = "month"
    ) -> Dict[str, Any]:
        """Get usage statistics for a provider"""
        try:
            provider = self.repository.get_provider_by_id(provider_id)
            
            if not provider:
                return {"success": False, "message": "Provider not found"}
            
            # Convert period to days
            period_days = 30 if period == "month" else 7 if period == "week" else 1
            
            # Get usage statistics from the new tracking system
            usage_stats = self.usage_repository.get_provider_usage_stats(provider_id, period_days)
            
            return {
                "success": True,
                "data": usage_stats
            }
            
        except Exception as e:
            print(f"Error getting provider usage: {e}")
            return {"success": False, "message": f"Error: {str(e)}"}
    
    async def generate_embedding(
        self, 
        text: str, 
        workspace_id: str,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate embedding using the active provider for a workspace"""
        if not EMBEDDING_PROVIDERS_AVAILABLE or EmbeddingProviderFactory is None or EmbeddingRequest is None:
            return {
                "success": False,
                "error": "Embedding providers not available"
            }
            
        try:
            # Get active provider
            active_provider = self.get_active_provider(workspace_id)
            if not active_provider:
                return {
                    "success": False,
                    "error": "No active embedding provider configured for this workspace"
                }
            
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
            tokens_processed = len(text.split())
            
            if not response or not response.embedding:
                return {
                    "success": False,
                    "error": "Failed to generate embedding"
                }
            
            # Create usage tracking record
            self.usage_repository.create_usage_record(
                provider_id=active_provider.id,
                workspace_id=workspace_id,
                created_by=active_provider.created_by,
                model_used=response.model or active_provider.get_config_value("model", "unknown"),
                tokens_processed=tokens_processed,
                latency_ms=latency_ms,
                success=True,
                request_type="embedding",
                embedding_dimension=len(response.embedding)
            )
            
            return {
                "success": True,
                "data": {
                    "embedding": response.embedding,
                    "model": response.model or active_provider.get_config_value("model", "unknown"),
                    "provider": active_provider.provider_type.value,
                    "latency_ms": latency_ms,
                    "tokens_processed": tokens_processed
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate embedding: {str(e)}"
            }

    async def generate_and_store_vector(
        self,
        content: str,
        workspace_id: str,
        created_by: str,
        source_type: str,
        source_id: str,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generic method to generate embedding and store in vector database for any content type"""
        try:
                       
            # Get the active embedding provider for the workspace
            active_provider = self.get_active_provider(workspace_id)
            if not active_provider:
                return {
                    "success": False,
                    "error": "No active embedding provider configured for this workspace. Please configure an embedding provider in workspace settings.",
                    "error_code": "NO_ACTIVE_EMBEDDING_PROVIDER"
                }
            
            # Create provider instance using the active provider configuration
            provider_instance = EmbeddingProviderFactory.create_provider(
                active_provider.provider_type.value,
                active_provider.config
            )
            
            # Generate embedding
            request = EmbeddingRequest(text=content)
            start_time = asyncio.get_event_loop().time()
            
            response = await provider_instance.generate_embedding(request)
            
            end_time = asyncio.get_event_loop().time()
            latency_ms = int((end_time - start_time) * 1000)
            tokens_processed = len(content.split())
            
            if not response or not response.embedding:
                return {
                    "success": False,
                    "error": "Failed to generate embedding",
                    "error_code": "EMBEDDING_GENERATION_FAILED"
                }
            
            # Log embedding details before storing
            logger.info(
                f"Generated embedding for {source_type}/{source_id}: "
                f"dimension={len(response.embedding)}, "
                f"model={response.model}, "
                f"latency={latency_ms}ms, "
                f"sample=[{response.embedding[0]:.6f}, {response.embedding[1]:.6f}, ..., {response.embedding[-1]:.6f}]"
            )
            
            # Store in vector database using VectorDatabaseService
            from app.ai.embeddings.vector_db.vector_db_service import VectorDatabaseService
            
            vector_db_service = VectorDatabaseService()
            stored_id = await vector_db_service.store_note_embedding(
                note_id=source_id,
                content=content,
                embedding=response.embedding,
                workspace_id=workspace_id,
                created_by=created_by,
                note_metadata=metadata or {}
            )
            
            # Create usage tracking record
            self.usage_repository.create_usage_record(
                provider_id=active_provider.id,
                workspace_id=workspace_id,
                created_by=created_by,
                model_used=response.model or active_provider.get_config_value("model", "unknown"),
                tokens_processed=tokens_processed,
                latency_ms=latency_ms,
                success=True,
                request_type="vector_generation",
                source_type=source_type,
                source_id=source_id,
                embedding_dimension=len(response.embedding),
                request_metadata=metadata
            )
            
            # If this is a note embedding, update the note's embedding statistics
            if source_type == "note":
                try:
                    from app.models.note import Note
                    from app.repositories.note_repository import NoteRepository
                    note_repo = NoteRepository()
                    note = note_repo.get_note_by_id(source_id)
                    if note:
                        # Update embedding stats on the note model
                        note.update_embedding_stats(
                            dimension=len(response.embedding),
                            model=response.model or active_provider.get_config_value("model", "unknown"),
                            provider=active_provider.provider_type.value,
                            latency_ms=latency_ms,
                            tokens_processed=tokens_processed
                        )
                        # Persist the update through repository
                        update_data = {"embedding_stats": note.embedding_stats}
                        note_repo.update_note(source_id, update_data)
                        print(f"Updated embedding stats for note {source_id}")
                except Exception as e:
                    print(f"Warning: Failed to update note embedding stats: {e}")
                    # Don't fail the entire operation if note stats update fails
            
            return {
                "success": True,
                "data": {
                    "embedding": response.embedding,
                    "model": response.model or active_provider.get_config_value("model", "unknown"),
                    "provider": active_provider.provider_type.value,
                    "latency_ms": latency_ms,
                    "tokens_processed": tokens_processed,
                    "dimension": len(response.embedding),
                    "stored_id": stored_id
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate and store vector: {str(e)}",
                "error_code": "EMBEDDING_OPERATION_FAILED"
            }
    
    def get_workspace_usage_stats(
        self, 
        workspace_id: str, 
        period: str = "month"
    ) -> Dict[str, Any]:
        """Get usage statistics for a workspace"""
        try:
            # Convert period to days
            period_days = 30 if period == "month" else 7 if period == "week" else 1
            
            # Get usage statistics from the new tracking system
            usage_stats = self.usage_repository.get_workspace_usage_stats(workspace_id, period_days)
            
            return {
                "success": True,
                "data": usage_stats
            }
            
        except Exception as e:
            print(f"Error getting workspace usage: {e}")
            return {"success": False, "message": f"Error: {str(e)}"}
    
    def get_recent_usage(
        self,
        workspace_id: str,
        provider_id: Optional[str] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Get recent usage records for a workspace"""
        try:
            usage_records = self.usage_repository.get_recent_usage(
                provider_id=provider_id,
                workspace_id=workspace_id,
                limit=limit
            )
            
            return {
                "success": True,
                "data": [record.to_dict() for record in usage_records]
            }
            
        except Exception as e:
            print(f"Error getting recent usage: {e}")
            return {"success": False, "message": f"Error: {str(e)}"}
    
    def get_daily_usage_summary(
        self,
        workspace_id: str,
        provider_id: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get daily usage summary for a workspace"""
        try:
            daily_summary = self.usage_repository.get_daily_usage_summary(
                provider_id=provider_id,
                workspace_id=workspace_id,
                days=days
            )
            
            return {
                "success": True,
                "data": daily_summary
            }
            
        except Exception as e:
            print(f"Error getting daily usage summary: {e}")
            return {"success": False, "message": f"Error: {str(e)}"}
