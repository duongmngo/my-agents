"""
OpenAI embedding provider implementation
"""
import asyncio
import hashlib
from typing import List, Optional, Dict, Any
import openai
from openai import AsyncOpenAI

from .base import EmbeddingProvider, EmbeddingRequest, EmbeddingResponse


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI embedding provider implementation"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("apiKey")
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.base_url = config.get("base_url", "https://api.openai.com/v1")
        self.client.base_url = self.base_url
        
        # Default model if not specified
        if not self.model or self.model == "default":
            self.model = "text-embedding-ada-002"
    
    async def generate_embedding(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embedding for a single text"""
        try:
            model = request.model or self.model
            
            response = await self.client.embeddings.create(
                model=model,
                input=request.text,
                encoding_format="float"
            )
            
            embedding = response.data[0].embedding
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "total_tokens": response.usage.total_tokens
            }
            
            return EmbeddingResponse(
                embedding=embedding,
                model=model,
                usage=usage,
                metadata=request.metadata
            )
            
        except Exception as e:
            raise Exception(f"Failed to generate OpenAI embedding: {str(e)}")
    
    async def generate_embeddings_batch(self, requests: List[EmbeddingRequest]) -> List[EmbeddingResponse]:
        """Generate embeddings for multiple texts in batch"""
        try:
            # Group requests by model for batch processing
            model_groups: Dict[str, List[str]] = {}
            for req in requests:
                model = req.model or self.model
                if model not in model_groups:
                    model_groups[model] = []
                model_groups[model].append(req.text)
            
            results = []
            
            # Process each model group
            for model, texts in model_groups.items():
                response = await self.client.embeddings.create(
                    model=model,
                    input=texts,
                    encoding_format="float"
                )
                
                # Map responses back to requests
                for i, req in enumerate(requests):
                    if req.model == model or (not req.model and self.model == model):
                        embedding = response.data[i].embedding
                        usage = {
                            "prompt_tokens": response.usage.prompt_tokens,
                            "total_tokens": response.usage.total_tokens
                        }
                        
                        results.append(EmbeddingResponse(
                            embedding=embedding,
                            model=model,
                            usage=usage,
                            metadata=req.metadata
                        ))
            
            return results
            
        except Exception as e:
            raise Exception(f"Failed to generate OpenAI embeddings batch: {str(e)}")
    
    async def get_models(self) -> List[str]:
        """Get available OpenAI embedding models"""
        try:
            models = await self.client.models.list()
            embedding_models = [
                model.id for model in models.data 
                if "embedding" in model.id.lower()
            ]
            return embedding_models
        except Exception as e:
            # Return default models if API call fails
            return ["text-embedding-ada-002", "text-embedding-3-small", "text-embedding-3-large"]
    
    async def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get information about a specific model"""
        try:
            model_info = await self.client.models.retrieve(model)
            return {
                "id": model_info.id,
                "object": model_info.object,
                "created": model_info.created,
                "owned_by": model_info.owned_by,
                "permission": model_info.permission,
                "root": model_info.root,
                "parent": model_info.parent
            }
        except Exception as e:
            # Return basic info for known models
            known_models = {
                "text-embedding-ada-002": {
                    "id": "text-embedding-ada-002",
                    "dimension": 1536,
                    "max_tokens": 8191
                },
                "text-embedding-3-small": {
                    "id": "text-embedding-3-small",
                    "dimension": 1536,
                    "max_tokens": 8191
                },
                "text-embedding-3-large": {
                    "id": "text-embedding-3-large",
                    "dimension": 3072,
                    "max_tokens": 8191
                }
            }
            return known_models.get(model, {"id": model, "error": str(e)})
    
    async def health_check(self) -> bool:
        """Check if OpenAI API is accessible"""
        try:
            await self.client.models.list(limit=1)
            return True
        except Exception:
            return False
    
    def get_provider_name(self) -> str:
        """Get the name of this provider"""
        return "openai"
