"""
Embedding API endpoints for managing embedding provider configurations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.embedding_service import EmbeddingService
from app.ai.embeddings import EmbeddingProviderFactory

router = APIRouter(tags=["embedding"])


@router.get("/providers")
async def get_available_providers():
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
async def get_provider_info(provider_name: str):
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
        models = await provider_instance.get_models()
        
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
async def get_workspace_providers(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all embedding providers for a specific workspace"""
    try:
        embedding_service = EmbeddingService(db)
        providers = await embedding_service.get_workspace_providers(workspace_id)
        
        # Convert to dict format for response
        provider_data = []
        for provider in providers:
            provider_data.append({
                "id": provider.id,
                "name": provider.name,
                "provider": provider.provider_type.value,
                "isActive": provider.is_active,
                "config": provider.get_sanitized_config(),
                "description": provider.description,
                "lastUsed": provider.last_used,
                "usageCount": provider.usage_count,
                "averageLatency": provider.average_latency,
                "errorRate": provider.error_rate,
                "totalTokensProcessed": provider.total_tokens_processed,
                "createdAt": provider.created_at,
                "updatedAt": provider.updated_at
            })
        
        return {"success": True, "data": {"providers": provider_data}}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get workspace providers: {str(e)}"
        )


@router.post("/workspace/{workspace_id}/providers")
async def add_workspace_provider(
    workspace_id: str,
    provider_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add or update an embedding provider to a workspace (provider type is unique per workspace)"""
    try:
        # Debug logging
        print(f"Adding provider for workspace {workspace_id}, user {current_user.id if current_user else 'None'}")
        print(f"Provider data: {provider_data}")
        print(f"Database session: {db is not None}")
        print(f"Workspace ID type: {type(workspace_id)}")
        print(f"Workspace ID value: '{workspace_id}'")
        
        # Note: Workspace existence will be validated by foreign key constraint
        
        # Validate inputs
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated"
            )
        
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database session not available"
            )
        
        print(f"Creating EmbeddingService with db session: {db is not None}")
        if db:
            print(f"Database session type: {type(db)}")
            print(f"Database session has add method: {hasattr(db, 'add')}")
            print(f"Database session has commit method: {hasattr(db, 'commit')}")
        
        embedding_service = EmbeddingService(db)
        new_provider = await embedding_service.add_provider(
            workspace_id, 
            current_user.id, 
            provider_data
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
                "provider": new_provider.provider_type.value,
                "config": new_provider.get_sanitized_config(),
                "isActive": new_provider.is_active
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


@router.put("/workspace/{workspace_id}/providers/{provider_id}")
async def update_workspace_provider(
    workspace_id: str,
    provider_id: str,
    provider_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing embedding provider in a workspace"""
    try:
        embedding_service = EmbeddingService(db)
        updated_provider = await embedding_service.update_provider(
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
                "provider": updated_provider.provider_type.value,
                "config": updated_provider.get_sanitized_config(),
                "isActive": updated_provider.is_active
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update provider: {str(e)}"
        )


@router.delete("/workspace/{workspace_id}/providers/{provider_id}")
async def delete_workspace_provider(
    workspace_id: str,
    provider_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an embedding provider from a workspace"""
    try:
        embedding_service = EmbeddingService(db)
        success = await embedding_service.delete_provider(provider_id)
        
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
async def set_default_provider(
    workspace_id: str,
    provider_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Set a provider as the default for a workspace"""
    try:
        embedding_service = EmbeddingService(db)
        success = await embedding_service.set_default_provider(provider_id)
        
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
async def toggle_provider_active(
    workspace_id: str,
    provider_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle the active status of a provider"""
    try:
        embedding_service = EmbeddingService(db)
        success = await embedding_service.toggle_provider_active(provider_id)
        
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test a provider configuration"""
    try:
        embedding_service = EmbeddingService(db)
        test_result = await embedding_service.test_provider(provider_id)
        
        if test_result["success"]:
            return {
                "success": True,
                "message": test_result["message"],
                "data": {
                    "latency_ms": test_result.get("latency_ms"),
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
async def get_provider_usage(
    workspace_id: str,
    provider_id: str,
    period: str = "month",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get usage statistics for a provider"""
    try:
        embedding_service = EmbeddingService(db)
        usage_result = await embedding_service.get_provider_usage(provider_id, period)
        
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
async def get_workspace_embedding_settings(
    workspace_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get embedding settings for a specific workspace"""
    try:
        embedding_service = EmbeddingService(db)
        settings = await embedding_service.get_workspace_settings(workspace_id)
        
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


@router.put("/workspace/{workspace_id}/settings")
async def update_workspace_embedding_settings(
    workspace_id: str,
    settings_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update embedding settings for a workspace"""
    try:
        embedding_service = EmbeddingService(db)
        updated_settings = await embedding_service.update_workspace_settings(
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
    db: AsyncSession = Depends(get_db),
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
        
        embedding_service = EmbeddingService(db)
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
