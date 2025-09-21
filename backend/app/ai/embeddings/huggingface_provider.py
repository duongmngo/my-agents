"""
HuggingFace embedding provider implementation
"""
import asyncio
from typing import List, Optional, Dict, Any
import requests
import numpy as np

from .base import EmbeddingProvider, EmbeddingRequest, EmbeddingResponse


class HuggingFaceEmbeddingProvider(EmbeddingProvider):
    """HuggingFace embedding provider implementation"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get("api_key")
        self.api_url = config.get("api_url", "https://api-inference.huggingface.co")
        
        # Default model if not specified
        if not self.model or self.model == "default":
            self.model = "sentence-transformers/all-MiniLM-L6-v2"
    
    async def generate_embedding(self, request: EmbeddingRequest) -> EmbeddingRequest:
        """Generate embedding for a single text"""
        try:
            model = request.model or self.model
            
            # Prepare headers
            headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
            
            # Prepare payload
            payload = {
                "inputs": request.text,
                "model": model
            }
            
            # Make API request
            response = requests.post(
                f"{self.api_url}/models/{model}",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"API request failed with status {response.status_code}: {response.text}")
            
            # Parse response
            result = response.json()
            
            # Handle different response formats
            if isinstance(result, list) and len(result) > 0:
                embedding = result[0]
            elif isinstance(result, dict) and "embeddings" in result:
                embedding = result["embeddings"]
            else:
                raise Exception(f"Unexpected response format: {result}")
            
            # Ensure embedding is a list of floats
            if isinstance(embedding, list):
                embedding = [float(x) for x in embedding]
            else:
                raise Exception(f"Invalid embedding format: {type(embedding)}")
            
            usage = {
                "model": model,
                "input_length": len(request.text)
            }
            
            return EmbeddingResponse(
                embedding=embedding,
                model=model,
                usage=usage,
                metadata=request.metadata
            )
            
        except Exception as e:
            raise Exception(f"Failed to generate HuggingFace embedding: {str(e)}")
    
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
                # Prepare headers
                headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
                
                # Prepare payload for batch
                payload = {
                    "inputs": texts,
                    "model": model
                }
                
                # Make API request
                response = requests.post(
                    f"{self.api_url}/models/{model}",
                    headers=headers,
                    json=payload,
                    timeout=60
                )
                
                if response.status_code != 200:
                    raise Exception(f"API request failed with status {response.status_code}: {response.text}")
                
                # Parse response
                result = response.json()
                
                # Handle different response formats
                if isinstance(result, list):
                    embeddings = result
                elif isinstance(result, dict) and "embeddings" in result:
                    embeddings = result["embeddings"]
                else:
                    raise Exception(f"Unexpected response format: {result}")
                
                # Map responses back to requests
                for i, req in enumerate(requests):
                    if req.model == model or (not req.model and self.model == model):
                        if i < len(embeddings):
                            embedding = embeddings[i]
                            # Ensure embedding is a list of floats
                            if isinstance(embedding, list):
                                embedding = [float(x) for x in embedding]
                            else:
                                continue
                            
                            usage = {
                                "model": model,
                                "input_length": len(req.text)
                            }
                            
                            results.append(EmbeddingResponse(
                                embedding=embedding,
                                model=model,
                                usage=usage,
                                metadata=req.metadata
                            ))
            
            return results
            
        except Exception as e:
            raise Exception(f"Failed to generate HuggingFace embeddings batch: {str(e)}")
    
    async def get_models(self) -> List[str]:
        """Get available HuggingFace embedding models"""
        try:
            # Return popular sentence transformer models
            return [
                "sentence-transformers/all-MiniLM-L6-v2",
                "sentence-transformers/all-mpnet-base-v2",
                "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                "sentence-transformers/all-MiniLM-L12-v2",
                "sentence-transformers/multi-qa-MiniLM-L6-cos-v1",
                "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
            ]
        except Exception as e:
            # Return default models if API call fails
            return ["sentence-transformers/all-MiniLM-L6-v2"]
    
    async def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get information about a specific model"""
        try:
            # Return known model information
            known_models = {
                "sentence-transformers/all-MiniLM-L6-v2": {
                    "id": "sentence-transformers/all-MiniLM-L6-v2",
                    "dimension": 384,
                    "max_tokens": 256,
                    "language": "en"
                },
                "sentence-transformers/all-mpnet-base-v2": {
                    "id": "sentence-transformers/all-mpnet-base-v2",
                    "dimension": 768,
                    "max_tokens": 384,
                    "language": "en"
                },
                "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2": {
                    "id": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                    "dimension": 384,
                    "max_tokens": 128,
                    "language": "multilingual"
                },
                "sentence-transformers/all-MiniLM-L12-v2": {
                    "id": "sentence-transformers/all-MiniLM-L12-v2",
                    "dimension": 384,
                    "max_tokens": 256,
                    "language": "en"
                },
                "sentence-transformers/multi-qa-MiniLM-L6-cos-v1": {
                    "id": "sentence-transformers/multi-qa-MiniLM-L6-cos-v1",
                    "dimension": 384,
                    "max_tokens": 256,
                    "language": "en"
                },
                "sentence-transformers/paraphrase-multilingual-mpnet-base-v2": {
                    "id": "sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
                    "dimension": 768,
                    "max_tokens": 384,
                    "language": "multilingual"
                }
            }
            return known_models.get(model, {"id": model, "error": "Unknown model"})
        except Exception as e:
            return {"id": model, "error": str(e)}
    
    async def health_check(self) -> bool:
        """Check if HuggingFace API is accessible"""
        try:
            # Try to get models to check API connectivity
            await self.get_models()
            return True
        except Exception:
            return False
    
    def get_provider_name(self) -> str:
        """Get the name of this provider"""
        return "huggingface"
