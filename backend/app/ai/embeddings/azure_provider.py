"""
Azure OpenAI embedding provider implementation
"""
import asyncio
import hashlib
from typing import List, Optional, Dict, Any
import openai
from openai import AsyncOpenAI

from .base import EmbeddingProvider, EmbeddingRequest, EmbeddingResponse


class AzureEmbeddingProvider(EmbeddingProvider):
    """Azure OpenAI embedding provider implementation"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        if not self.api_key:
            raise ValueError("Azure OpenAI API key is required")
        
        self.base_url = config.get("base_url")
        if not self.base_url:
            raise ValueError("Azure OpenAI base URL is required")
        
        # Azure OpenAI uses a different API structure
        self.api_version = config.get("api_version", "2024-02-15-preview")
        self.deployment_name = config.get("deployment_name") or config.get("model", "text-embedding-ada-002")
        
        # Initialize the client with Azure-specific configuration
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=f"{self.base_url}/openai/deployments/{self.deployment_name}",
            api_version=self.api_version
        )
        
        # Default model if not specified
        if not self.model or self.model == "default":
            self.model = "text-embedding-ada-002"
    
    async def generate_embedding(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embedding using Azure OpenAI"""
        try:
            # Prepare the request
            embedding_request = {
                "input": request.text,
                "model": self.deployment_name,  # Use deployment name for Azure
                "encoding_format": "float"
            }
            
            # Make the API call
            response = await self.client.embeddings.create(**embedding_request)
            
            # Extract the embedding
            embedding = response.data[0].embedding
            
            return EmbeddingResponse(
                embedding=embedding,
                model=self.deployment_name,
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                metadata={
                    "provider": "azure",
                    "deployment_name": self.deployment_name,
                    "api_version": self.api_version
                }
            )
            
        except Exception as e:
            raise Exception(f"Azure OpenAI embedding generation failed: {str(e)}")
    
    async def generate_batch_embeddings(self, requests: List[EmbeddingRequest]) -> List[EmbeddingResponse]:
        """Generate embeddings for multiple texts"""
        try:
            # Azure OpenAI supports batch processing
            texts = [req.text for req in requests]
            
            embedding_request = {
                "input": texts,
                "model": self.deployment_name,
                "encoding_format": "float"
            }
            
            response = await self.client.embeddings.create(**embedding_request)
            
            results = []
            for i, data in enumerate(response.data):
                results.append(EmbeddingResponse(
                    embedding=data.embedding,
                    model=self.deployment_name,
                    usage={
                        "prompt_tokens": response.usage.prompt_tokens,
                        "total_tokens": response.usage.total_tokens
                    },
                    metadata={
                        "provider": "azure",
                        "deployment_name": self.deployment_name,
                        "api_version": self.api_version,
                        "batch_index": i
                    }
                ))
            
            return results
            
        except Exception as e:
            raise Exception(f"Azure OpenAI batch embedding generation failed: {str(e)}")
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get provider information"""
        return {
            "name": "Azure OpenAI",
            "type": "azure",
            "base_url": self.base_url,
            "deployment_name": self.deployment_name,
            "api_version": self.api_version,
            "model": self.model
        }
    
    def validate_config(self) -> bool:
        """Validate the provider configuration"""
        required_fields = ["api_key", "base_url"]
        return all(self.config.get(field) for field in required_fields)
