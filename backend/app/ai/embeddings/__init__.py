"""
Embedding providers module
"""
from .base import EmbeddingProvider, EmbeddingProviderFactory, EmbeddingRequest, EmbeddingResponse
from .openai_provider import OpenAIEmbeddingProvider
from .azure_provider import AzureEmbeddingProvider
from .huggingface_provider import HuggingFaceEmbeddingProvider

# Register all providers with the factory
EmbeddingProviderFactory.register_provider("openai", OpenAIEmbeddingProvider)
EmbeddingProviderFactory.register_provider("azure", AzureEmbeddingProvider)
EmbeddingProviderFactory.register_provider("huggingface", HuggingFaceEmbeddingProvider)

__all__ = [
    "EmbeddingProvider",
    "EmbeddingProviderFactory", 
    "EmbeddingRequest",
    "EmbeddingResponse",
    "OpenAIEmbeddingProvider",
    "AzureEmbeddingProvider",
    "HuggingFaceEmbeddingProvider",
]
