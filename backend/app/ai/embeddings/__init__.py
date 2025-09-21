"""
Embedding providers module
"""
from .base import EmbeddingProvider, EmbeddingProviderFactory, EmbeddingRequest, EmbeddingResponse
from .openai_provider import OpenAIEmbeddingProvider
from .azure_provider import AzureEmbeddingProvider
from .cohere_provider import CohereEmbeddingProvider
from .huggingface_provider import HuggingFaceEmbeddingProvider
from .local_provider import LocalEmbeddingProvider

# Register all providers with the factory
EmbeddingProviderFactory.register_provider("openai", OpenAIEmbeddingProvider)
EmbeddingProviderFactory.register_provider("azure", AzureEmbeddingProvider)
EmbeddingProviderFactory.register_provider("cohere", CohereEmbeddingProvider)
EmbeddingProviderFactory.register_provider("huggingface", HuggingFaceEmbeddingProvider)
EmbeddingProviderFactory.register_provider("local", LocalEmbeddingProvider)

__all__ = [
    "EmbeddingProvider",
    "EmbeddingProviderFactory", 
    "EmbeddingRequest",
    "EmbeddingResponse",
    "OpenAIEmbeddingProvider",
    "AzureEmbeddingProvider",
    "CohereEmbeddingProvider",
    "HuggingFaceEmbeddingProvider",
    "LocalEmbeddingProvider",
]
