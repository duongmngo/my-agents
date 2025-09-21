"""
Qdrant configuration for vector database operations
"""
import os
from typing import Optional
from pydantic import BaseModel, ConfigDict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class QdrantConfig(BaseModel):
    """Qdrant configuration settings"""
    
    model_config = ConfigDict(extra='ignore', validate_assignment=True)  # Ignore extra fields
    
    # Qdrant connection settings
    url: str = "http://localhost:6333"
    api_key: Optional[str] = None
    
    # Collection settings
    default_collection_name: str = "documents"
    vector_size: int = 1536  # OpenAI embedding size
    distance_metric: str = "Cosine"  # Cosine, Dot, Euclid
    
    # Batch settings
    batch_size: int = 100
    parallel_requests: int = 10
    
    # Performance settings
    timeout: int = 60
    retry_attempts: int = 3
    
    @classmethod
    def from_env(cls) -> "QdrantConfig":
        """Create QdrantConfig from environment variables"""
        # Use URL-based configuration
        url = os.getenv("QDRANT_URL", "http://localhost:6333")
        api_key = os.getenv("QDRANT_API_KEY")
        default_collection_name = os.getenv("QDRANT_DEFAULT_COLLECTION", "documents")
        vector_size = int(os.getenv("QDRANT_VECTOR_SIZE", "1536"))
        distance_metric = os.getenv("QDRANT_DISTANCE_METRIC", "Cosine")
        batch_size = int(os.getenv("QDRANT_BATCH_SIZE", "100"))
        parallel_requests = int(os.getenv("QDRANT_PARALLEL_REQUESTS", "10"))
        timeout = int(os.getenv("QDRANT_TIMEOUT", "60"))
        retry_attempts = int(os.getenv("QDRANT_RETRY_ATTEMPTS", "3"))
        
        return cls(
            url=url,
            api_key=api_key,
            default_collection_name=default_collection_name,
            vector_size=vector_size,
            distance_metric=distance_metric,
            batch_size=batch_size,
            parallel_requests=parallel_requests,
            timeout=timeout,
            retry_attempts=retry_attempts
        )


# Global Qdrant configuration instance
qdrant_config = QdrantConfig.from_env()
