"""
Embedding API endpoints for managing embedding provider configurations
"""
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.embedding_service import EmbeddingProviderConfigService
from app.ai.embeddings import EmbeddingProviderFactory
from app.schemas.embedding_schemas import (
    EmbeddingProviderResponse,
    WorkspaceEmbeddingSettingsCreate,
    WorkspaceEmbeddingSettingsUpdate,
    WorkspaceEmbeddingSettingsResponse,
    EmbeddingProviderType
)
from app.schemas.embedding_request_schemas import (
    EmbeddingProviderCreateRequest,
    EmbeddingProviderUpdateRequest
)

router = APIRouter(tags=["embedding"])


@router.get("/providers")
def get_available_providers():
    """Get all available embedding providers"""
    try:
        providers = EmbeddingProviderFactory.get_available_providers()
        return {"success": True, "data": {"providers": providers}}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get providers: {str(e)}"
        )


@router.get("/provider/info/{provider_name}")
def get_provider_info(provider_name: str):
    """Get information about a specific provider"""
    try:
        if not EmbeddingProviderFactory.is_provider_available(provider_name):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Provider '{provider_name}' not found"
            )
        
        # Create provider instance to get info
        provider_instance = EmbeddingProviderFactory.create_provider(provider_name, {})
        
        # Get available models
        models = asyncio.run(provider_instance.get_models())
        
        return {
            "success": True,
            "data": {
                "name": provider_name,
                "models": models,
                "supports_batch": hasattr(provider_instance, 'generate_embeddings_batch'),
                "supports_health_check": hasattr(provider_instance, 'health_check')
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get provider info: {str(e)}"
        )


@router.get("/workspace/{workspace_id}/providers")
def get_workspace_providers(
    workspace_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all embedding providers for a specific workspace"""
    try:
        embedding_service = EmbeddingProviderConfigService()
        providers = embedding_service.get_workspace_providers(workspace_id)
        
        # Convert to dict format for response
        provider_data = []
        for provider in providers:
            # Get usage statistics from the new tracking system
            usage_stats = embedding_service.get_provider_usage(provider.id, period="month")
            
            # Extract usage data or use defaults
            usage_data = usage_stats.get("data", {}) if usage_stats.get("success") else {}
            
            provider_data.append({
                "id": provider.id,
                "name": provider.name,
                "providerType": provider.provider_type.value,
                "isActive": provider.is_active,
                "config": provider.get_sanitized_config(),
                "description": provider.description,
                "lastUsed": provider.last_used,
                "usageCount": usage_data.get("total_requests", 0),
                "averageLatency": usage_data.get("average_latency_ms", 0),
                "errorRate": usage_data.get("error_rate", 0),
                "totalTokensProcessed": usage_data.get("total_tokens", 0),
                "workspaceId": provider.workspace_id,
                "createdBy": provider.created_by,
                "createdAt": provider.created_at.isoformat() if provider.created_at is not None else None,
                "updatedAt": provider.updated_at.isoformat() if provider.updated_at is not None else None
            })
        
        return {"success": True, "data": {"providers": provider_data}}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workspace providers: {str(e)}"
        )


@router.post("/workspace/{workspace_id}/providers", response_model=EmbeddingProviderResponse)
def add_workspace_provider(
    workspace_id: str,
    provider_data: EmbeddingProviderCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Add or update an embedding provider to a workspace (provider type is unique per workspace)"""
    try:
        # Debug logging
        print(f"Adding provider for workspace {workspace_id}, user {current_user.id if current_user else 'None'}")
        print(f"Provider data: {provider_data}")
        print(f"Workspace ID type: {type(workspace_id)}")
        print(f"Workspace ID value: '{workspace_id}'")
        
        # Note: Workspace existence will be validated by foreign key constraint
        
        # Validate inputs
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated"
            )
        
        embedding_service = EmbeddingProviderConfigService()
        
        # Convert Pydantic model to dict for service
        provider_dict = provider_data.to_internal_format()
        
        new_provider = embedding_service.add_provider(
            workspace_id, 
            current_user.id, 
            provider_dict
        )
        
        if not new_provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add provider"
            )
        
        return {
            "success": True,
            "message": "Provider added/updated successfully",
            "data": {
                "id": new_provider.id,
                "name": new_provider.name,
                "description": new_provider.description,
                "providerType": new_provider.provider_type.value,
                "config": new_provider.get_sanitized_config(),
                "isActive": new_provider.is_active,
                "workspaceId": new_provider.workspace_id,
                "createdBy": new_provider.created_by,
                "createdAt": new_provider.created_at.isoformat() if new_provider.created_at is not None else None,
                "updatedAt": new_provider.updated_at.isoformat() if new_provider.updated_at is not None else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in add_workspace_provider: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add provider: {str(e)}"
        )


@router.put("/workspace/{workspace_id}/providers/{provider_id}", response_model=EmbeddingProviderResponse)
def update_workspace_provider(
    workspace_id: str,
    provider_id: str,
    provider_data: EmbeddingProviderUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update an existing embedding provider in a workspace"""
    try:
        embedding_service = EmbeddingProviderConfigService()
        updated_provider = embedding_service.update_provider(
            provider_id, 
            provider_data
        )
        
        if not updated_provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider not found"
            )
        
        return {
            "success": True,
            "message": "Provider updated successfully",
            "data": {
                "id": updated_provider.id,
                "name": updated_provider.name,
                "description": updated_provider.description,
                "providerType": updated_provider.provider_type.value,
                "config": updated_provider.get_sanitized_config(),
                "isActive": updated_provider.is_active,
                "workspaceId": updated_provider.workspace_id,
                "createdBy": updated_provider.created_by,
                "createdAt": updated_provider.created_at.isoformat() if updated_provider.created_at is not None else None,
                "updatedAt": updated_provider.updated_at.isoformat() if updated_provider.updated_at is not None else None
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update provider: {str(e)}"
        )


@router.delete("/workspace/{workspace_id}/providers/{provider_id}")
def delete_workspace_provider(
    workspace_id: str,
    provider_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an embedding provider from a workspace"""
    try:
        embedding_service = EmbeddingProviderConfigService()
        success = embedding_service.delete_provider(provider_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete provider"
            )
        
        return {
            "success": True,
            "message": "Provider deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete provider: {str(e)}"
        )


@router.post("/workspace/{workspace_id}/providers/{provider_id}/set-default")
def set_default_provider(
    workspace_id: str,
    provider_id: str,
    current_user: User = Depends(get_current_user)
):
    """Set a provider as the default for a workspace"""
    try:
        embedding_service = EmbeddingProviderConfigService()
        success = embedding_service.set_default_provider(provider_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to set default provider"
            )
        
        return {
            "success": True,
            "message": "Default provider updated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set default provider: {str(e)}"
        )


@router.post("/workspace/{workspace_id}/providers/{provider_id}/toggle-active")
def toggle_provider_active(
    workspace_id: str,
    provider_id: str,
    current_user: User = Depends(get_current_user)
):
    """Toggle the active status of a provider"""
    try:
        embedding_service = EmbeddingProviderConfigService()
        success = embedding_service.toggle_provider_active(provider_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to toggle provider active status"
            )
        
        return {
            "success": True,
            "message": "Provider active status updated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle provider active status: {str(e)}"
        )


@router.post("/workspace/{workspace_id}/providers/{provider_id}/test")
async def test_provider(
    workspace_id: str,
    provider_id: str,
    current_user: User = Depends(get_current_user)
):
    """Test a provider configuration"""
    try:
        embedding_service = EmbeddingProviderConfigService()
        test_result = await embedding_service.test_provider(provider_id)
        
        if test_result["success"]:
            return {
                "success": True,
                "message": test_result["message"],
                "data": {
                    "latencyMs": test_result.get("latency_ms"),
                    "dimension": test_result.get("dimension"),
                    "model": test_result.get("model")
                }
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=test_result["message"]
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test provider: {str(e)}"
        )


@router.get("/workspace/{workspace_id}/providers/{provider_id}/usage")
def get_provider_usage(
    workspace_id: str,
    provider_id: str,
    period: str = "month",
    current_user: User = Depends(get_current_user)
):
    """Get usage statistics for a provider"""
    try:
        embedding_service = EmbeddingProviderConfigService()
        usage_result = embedding_service.get_provider_usage(provider_id, period)
        
        if usage_result["success"]:
            return {
                "success": True,
                "data": usage_result["data"]
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=usage_result["message"]
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get provider usage: {str(e)}"
        )


@router.get("/workspace/{workspace_id}/settings")
def get_workspace_embedding_settings(
    workspace_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get embedding settings for a specific workspace"""
    try:
        embedding_service = EmbeddingProviderConfigService()
        settings = embedding_service.get_workspace_settings(workspace_id)
        
        if not settings:
            # Return default settings if none exist
            return {
                "success": True,
                "data": {
                    "id": None,
                    "workspaceId": workspace_id,
                    "autoRotate": False,
                    "fallbackProviderId": None,
                    "batchSize": 100,
                    "retryAttempts": 3,
                    "timeout": 30000,
                    "enableCaching": True,
                    "cacheTtl": 3600,
                    "enableMonitoring": True
                }
            }
        
        return {
            "success": True,
            "data": {
                "id": settings.id,
                "workspaceId": settings.workspace_id,
                "autoRotate": settings.auto_rotate,
                "fallbackProviderId": settings.fallback_provider_id,
                "batchSize": settings.batch_size,
                "retryAttempts": settings.retry_attempts,
                "timeout": settings.timeout,
                "enableCaching": settings.enable_caching,
                "cacheTtl": settings.cache_ttl,
                "enableMonitoring": settings.enable_monitoring
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workspace settings: {str(e)}"
        )


@router.put("/workspace/{workspace_id}/settings", response_model=WorkspaceEmbeddingSettingsResponse)
def update_workspace_embedding_settings(
    workspace_id: str,
    settings_data: WorkspaceEmbeddingSettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update embedding settings for a workspace"""
    try:
        embedding_service = EmbeddingProviderConfigService()
        updated_settings = embedding_service.update_workspace_settings(
            workspace_id, 
            settings_data
        )
        
        if not updated_settings:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update workspace settings"
            )
        
        return {
            "success": True,
            "message": "Workspace settings updated successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update workspace settings: {str(e)}"
        )


@router.post("/workspace/{workspace_id}/generate")
async def generate_embedding(
    workspace_id: str,
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Generate an embedding using the active provider for a workspace"""
    try:
        text = request_data.get("text")
        model = request_data.get("model")
        
        if not text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text is required"
            )
        
        embedding_service = EmbeddingProviderConfigService()
        embedding = await embedding_service.generate_embedding(
            text, 
            workspace_id, 
            model
        )
        
        if not embedding:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate embedding"
            )
        
        return {
            "success": True,
            "data": {
                "embedding": embedding,
                "dimension": len(embedding),
                "text": text
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate embedding: {str(e)}"
        )
