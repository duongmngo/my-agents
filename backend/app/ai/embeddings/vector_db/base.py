"""
Abstract base class for vector databases
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel
import numpy as np


class VectorSearchRequest(BaseModel):
    """Request model for vector search"""
    query_vector: List[float]
    limit: int = 10
    threshold: float = 0.0
    filters: Optional[Dict[str, Any]] = None
    include_metadata: bool = True


class VectorSearchResult(BaseModel):
    """Result model for vector search"""
    id: str
    content: str
    similarity: float
    metadata: Optional[Dict[str, Any]] = None
    source_type: Optional[str] = None
    source_id: Optional[str] = None


class VectorDatabase(ABC):
    """Abstract base class for vector databases"""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the vector database with configuration"""
        self.config = config
        self.dimension = config.get("dimension", 1536)
        self.metric = config.get("metric", "cosine")  # cosine, euclidean, dot_product
    
    @abstractmethod
    async def connect(self) -> bool:
        """Connect to the vector database"""
        pass
    
    @abstractmethod
    async def disconnect(self) -> bool:
        """Disconnect from the vector database"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the database is healthy"""
        pass
    
    @abstractmethod
    async def create_collection(self, name: str, dimension: int, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Create a new collection/table"""
        pass
    
    @abstractmethod
    async def delete_collection(self, name: str) -> bool:
        """Delete a collection/table"""
        pass
    
    @abstractmethod
    async def list_collections(self) -> List[str]:
        """List all collections/tables"""
        pass
    
    @abstractmethod
    async def insert_vectors(self, collection: str, vectors: List[Dict[str, Any]]) -> List[str]:
        """Insert vectors into the database"""
        pass
    
    @abstractmethod
    async def update_vector(self, collection: str, id: str, vector: List[float], metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Update a vector in the database"""
        pass
    
    @abstractmethod
    async def delete_vector(self, collection: str, id: str) -> bool:
        """Delete a vector from the database"""
        pass
    
    @abstractmethod
    async def search_similar(self, collection: str, request: VectorSearchRequest) -> List[VectorSearchResult]:
        """Search for similar vectors"""
        pass
    
    @abstractmethod
    async def get_vector(self, collection: str, id: str) -> Optional[Dict[str, Any]]:
        """Get a vector by ID"""
        pass
    
    @abstractmethod
    async def get_collection_stats(self, collection: str) -> Dict[str, Any]:
        """Get statistics about a collection"""
        pass
    
    @abstractmethod
    async def create_index(self, collection: str, index_type: str = "default") -> bool:
        """Create an index for a collection"""
        pass
    
    def get_database_name(self) -> str:
        """Get the name of this database type"""
        return self.__class__.__name__.lower()
    
    def get_config(self) -> Dict[str, Any]:
        """Get the current configuration"""
        return self.config.copy()
    
    def update_config(self, new_config: Dict[str, Any]):
        """Update the configuration"""
        self.config.update(new_config)
        if "dimension" in new_config:
            self.dimension = new_config["dimension"]
        if "metric" in new_config:
            self.metric = new_config["metric"]


class VectorDatabaseFactory:
    """Factory for creating vector database instances"""
    
    _databases: Dict[str, type] = {}
    
    @classmethod
    def register_database(cls, name: str, database_class: type):
        """Register a new vector database"""
        if not issubclass(database_class, VectorDatabase):
            raise ValueError(f"Database class must inherit from VectorDatabase")
        cls._databases[name] = database_class
    
    @classmethod
    def create_database(cls, name: str, config: Dict[str, Any]) -> VectorDatabase:
        """Create a vector database instance"""
        if name not in cls._databases:
            raise ValueError(f"Unknown vector database: {name}")
        
        database_class = cls._databases[name]
        return database_class(config)
    
    @classmethod
    def get_available_databases(cls) -> List[str]:
        """Get list of available database names"""
        return list(cls._databases.keys())
    
    @classmethod
    def is_database_available(cls, name: str) -> bool:
        """Check if a database is available"""
        return name in cls._databases
