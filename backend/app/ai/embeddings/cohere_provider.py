"""
Cohere embedding provider implementation
"""
import asyncio
from typing import List, Optional, Dict, Any
import cohere
from cohere import AsyncClient

from .base import EmbeddingProvider, EmbeddingRequest, EmbeddingResponse


class CohereEmbeddingProvider(EmbeddingProvider):
    """Cohere embedding provider implementation"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        if not self.api_key:
            raise ValueError("Cohere API key is required")
        
        self.client = AsyncClient(api_key=self.api_key)
        
        # Default model if not specified
        if not self.model or self.model == "default":
            self.model = "embed-english-v3.0"
    
    async def generate_embedding(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embedding for a single text"""
        try:
            model = request.model or self.model
            
            response = await self.client.embed(
                texts=[request.text],
                model=model,
                input_type="search_document",
                embedding_types=["float"]
            )
            
            embedding = response.embeddings.float[0]
            usage = {
                "billed_units": response.meta.billed_units,
                "total_tokens": response.meta.total_tokens
            }
            
            return EmbeddingResponse(
                embedding=embedding,
                model=model,
                usage=usage,
                metadata=request.metadata
            )
            
        except Exception as e:
            raise Exception(f"Failed to generate Cohere embedding: {str(e)}")
    
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
                response = await self.client.embed(
                    texts=texts,
                    model=model,
                    input_type="search_document",
                    embedding_types=["float"]
                )
                
                # Map responses back to requests
                for i, req in enumerate(requests):
                    if req.model == model or (not req.model and self.model == model):
                        embedding = response.embeddings.float[i]
                        usage = {
                            "billed_units": response.meta.billed_units,
                            "total_tokens": response.meta.total_tokens
                        }
                        
                        results.append(EmbeddingResponse(
                            embedding=embedding,
                            model=model,
                            usage=usage,
                            metadata=req.metadata
                        ))
            
            return results
            
        except Exception as e:
            raise Exception(f"Failed to generate Cohere embeddings batch: {str(e)}")
    
    async def get_models(self) -> List[str]:
        """Get available Cohere embedding models"""
        try:
            # Cohere has a fixed set of embedding models
            return [
                "embed-english-v3.0",
                "embed-english-light-v3.0",
                "embed-multilingual-v3.0",
                "embed-english-v2.0",
                "embed-english-light-v2.0",
                "embed-multilingual-v2.0"
            ]
        except Exception as e:
            # Return default models if API call fails
            return ["embed-english-v3.0", "embed-english-light-v3.0"]
    
    async def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get information about a specific model"""
        try:
            # Return known model information
            known_models = {
                "embed-english-v3.0": {
                    "id": "embed-english-v3.0",
                    "dimension": 1024,
                    "max_tokens": 512,
                    "language": "en"
                },
                "embed-english-light-v3.0": {
                    "id": "embed-english-light-v3.0",
                    "dimension": 384,
                    "max_tokens": 512,
                    "language": "en"
                },
                "embed-multilingual-v3.0": {
                    "id": "embed-multilingual-v3.0",
                    "dimension": 1024,
                    "max_tokens": 512,
                    "language": "multilingual"
                },
                "embed-english-v2.0": {
                    "id": "embed-english-v2.0",
                    "dimension": 4096,
                    "max_tokens": 2048,
                    "language": "en"
                },
                "embed-english-light-v2.0": {
                    "id": "embed-english-light-v2.0",
                    "dimension": 1024,
                    "max_tokens": 2048,
                    "language": "en"
                },
                "embed-multilingual-v2.0": {
                    "id": "embed-multilingual-v2.0",
                    "dimension": 4096,
                    "max_tokens": 2048,
                    "language": "multilingual"
                }
            }
            return known_models.get(model, {"id": model, "error": "Unknown model"})
        except Exception as e:
            return {"id": model, "error": str(e)}
    
    async def health_check(self) -> bool:
        """Check if Cohere API is accessible"""
        try:
            # Try to get models to check API connectivity
            await self.get_models()
            return True
        except Exception:
            return False
    
    def get_provider_name(self) -> str:
        """Get the name of this provider"""
        return "cohere"
