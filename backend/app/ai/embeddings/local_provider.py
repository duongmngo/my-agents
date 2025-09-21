"""
Local embedding provider using sentence-transformers
"""
import asyncio
from typing import List, Dict, Any, Optional
import numpy as np

from .base import EmbeddingProvider, EmbeddingRequest, EmbeddingResponse


class LocalEmbeddingProvider(EmbeddingProvider):
    """Local embedding provider using sentence-transformers"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.model_name = config.get("model", "all-MiniLM-L6-v2")
        self.device = config.get("device", "cpu")
        self.cache_folder = config.get("cache_folder", None)
        
        # Initialize the model (this will be done lazily)
        self._model = None
        self._model_loaded = False
        
    async def _ensure_model_loaded(self):
        """Ensure the sentence-transformers model is loaded"""
        if self._model_loaded:
            return
            
        try:
            # Import sentence-transformers (this might take time)
            from sentence_transformers import SentenceTransformer
            
            # Load the model
            self._model = SentenceTransformer(
                self.model_name, 
                device=self.device, 
                cache_folder=self.cache_folder
            )
            self._model_loaded = True
            
            # Update dimension based on actual model
            if hasattr(self._model, 'get_sentence_embedding_dimension'):
                self.dimension = self._model.get_sentence_embedding_dimension()
            
        except ImportError:
            raise ImportError(
                "sentence-transformers is not installed. "
                "Install it with: pip install sentence-transformers"
            )
        except Exception as e:
            raise RuntimeError(f"Failed to load local embedding model {self.model_name}: {e}")
    
    async def generate_embedding(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """Generate embedding for a single text"""
        await self._ensure_model_loaded()
        
        try:
            # Generate embedding
            embedding = self._model.encode(
                request.text, 
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            
            # Convert to list
            embedding_list = embedding.tolist()
            
            return EmbeddingResponse(
                embedding=embedding_list,
                model=self.model_name,
                usage={
                    "input_tokens": len(request.text.split()),
                    "model": self.model_name
                },
                metadata={
                    "provider": "local",
                    "device": self.device,
                    "dimension": len(embedding_list)
                }
            )
            
        except Exception as e:
            raise RuntimeError(f"Failed to generate embedding: {e}")
    
    async def generate_embeddings_batch(self, requests: List[EmbeddingRequest]) -> List[EmbeddingResponse]:
        """Generate embeddings for multiple texts in batch"""
        await self._ensure_model_loaded()
        
        try:
            # Extract texts
            texts = [req.text for req in requests]
            
            # Generate embeddings in batch
            embeddings = self._model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                batch_size=32  # Process in smaller batches
            )
            
            # Convert to responses
            responses = []
            for i, embedding in enumerate(embeddings):
                embedding_list = embedding.tolist()
                responses.append(EmbeddingResponse(
                    embedding=embedding_list,
                    model=self.model_name,
                    usage={
                        "input_tokens": len(requests[i].text.split()),
                        "model": self.model_name
                    },
                    metadata={
                        "provider": "local",
                        "device": self.device,
                        "dimension": len(embedding_list)
                    }
                ))
            
            return responses
            
        except Exception as e:
            raise RuntimeError(f"Failed to generate batch embeddings: {e}")
    
    async def get_models(self) -> List[str]:
        """Get available models for this provider"""
        return [
            "all-MiniLM-L6-v2",
            "all-mpnet-base-v2", 
            "paraphrase-multilingual-MiniLM-L12-v2",
            "all-MiniLM-L12-v2",
            "multi-qa-MiniLM-L6-cos-v1",
            "all-distilroberta-v1"
        ]
    
    async def get_model_info(self, model: str) -> Dict[str, Any]:
        """Get information about a specific model"""
        model_info = {
            "all-MiniLM-L6-v2": {
                "dimension": 384,
                "max_tokens": 256,
                "language": "en",
                "description": "Lightweight English model, good balance of speed and quality"
            },
            "all-mpnet-base-v2": {
                "dimension": 768,
                "max_tokens": 384,
                "language": "en", 
                "description": "High-quality English model, better than MiniLM but slower"
            },
            "paraphrase-multilingual-MiniLM-L12-v2": {
                "dimension": 384,
                "max_tokens": 128,
                "language": "multilingual",
                "description": "Multilingual model supporting 50+ languages"
            },
            "all-MiniLM-L12-v2": {
                "dimension": 384,
                "max_tokens": 256,
                "language": "en",
                "description": "Larger English model, better quality than L6"
            },
            "multi-qa-MiniLM-L6-cos-v1": {
                "dimension": 384,
                "max_tokens": 256,
                "language": "en",
                "description": "Optimized for question-answering tasks"
            },
            "all-distilroberta-v1": {
                "dimension": 768,
                "max_tokens": 512,
                "language": "en",
                "description": "Distilled RoBERTa model, good quality and reasonable speed"
            }
        }
        
        return model_info.get(model, {
            "dimension": 384,
            "max_tokens": 256,
            "language": "unknown",
            "description": "Unknown model"
        })
    
    async def health_check(self) -> bool:
        """Check if the provider is healthy"""
        try:
            await self._ensure_model_loaded()
            return self._model is not None and self._model_loaded
        except Exception:
            return False
    
    def get_model_dimension(self) -> int:
        """Get the actual dimension of the loaded model"""
        if self._model and hasattr(self._model, 'get_sentence_embedding_dimension'):
            return self._model.get_sentence_embedding_dimension()
        return self.dimension
    
    def get_provider_name(self) -> str:
        """Get the name of this provider"""
        return "local"
