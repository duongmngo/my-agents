"""
Configuration settings for the application
"""
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional, List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = ConfigDict(extra='ignore', env_file='.env', env_file_encoding='utf-8')  # Ignore extra fields
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
    # Database settings
    database_url: str = "postgresql://user:password@localhost/myagents"
    postgres_db: str = "my_agents_db"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres123"
    postgres_host: str = "localhost"
    postgres_port: str = "5432"
    
    # JWT settings
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # API settings
    api_v1_prefix: str = "/api/v1"
    project_name: str = "My Agents API"
    version: str = "1.0.0"
    
    # CORS settings
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    allowed_hosts: str = '["*"]'
    
    # Redis settings
    redis_url: str = "redis://localhost:6379"
    
    # MinIO settings
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin123"
    minio_bucket_name: str = "chat-files"
    minio_secure: str = "false"
    
    # File upload settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: List[str] = ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"]
    
    # Vector Database settings
    vector_db_provider: str = "qdrant"  # Using Qdrant as the vector database
    
    # Qdrant Vector Database settings (for storing pre-built vectors)
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    
    # Pagination settings
    default_page_size: str = "20"
    max_page_size: str = "100"
    
    # SMTP settings
    smtp_host: str = ""
    smtp_port: str = "587"
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    
    # Frontend settings
    next_public_api_url: str = "http://localhost:8000"
    next_public_ws_url: str = "ws://localhost:8000"
    
    # Case conversion settings
    response_format: str = "camelCase"  # "camelCase", "snake_case", "auto"
    auto_convert_responses: bool = True
    auto_convert_requests: bool = False
    camel_case_endpoints: List[str] = []  # Specific endpoints to convert
    exclude_from_conversion: List[str] = []  # Endpoints to exclude
    
    # Logging
    log_level: str = "INFO"
    
    def get_embedding_config(self) -> dict:
        """Get default configuration for embedding providers"""
        # This method now only provides default values
        # Specific configuration is managed at the workspace level
        return {
            "model": "text-embedding-ada-002",  # Default model
            "dimension": 1536,  # Default dimension
            "batch_size": 100,  # Default batch size
            "max_retries": 3,   # Default retry attempts
            "chunk_size": 1000, # Default chunk size
            "chunk_overlap": 200 # Default chunk overlap
        }
    
    def get_qdrant_config(self) -> dict:
        """Get configuration for Qdrant vector database"""
        return {
            "url": self.qdrant_url,
            "api_key": self.qdrant_api_key
        }


# Create settings instance
settings = Settings()


# Case conversion configuration
class CaseConversionConfig:
    """Configuration for case conversion behavior"""
    
    def __init__(self):
        self.response_format = settings.response_format
        self.auto_convert_responses = settings.auto_convert_responses
        self.auto_convert_requests = settings.auto_convert_requests
        self.camel_case_endpoints = set(settings.camel_case_endpoints)
        self.exclude_from_conversion = set(settings.exclude_from_conversion)
    
    def should_convert_response(self, endpoint: str) -> bool:
        """Determine if response should be converted to camelCase"""
        if endpoint in self.exclude_from_conversion:
            return False
        
        if self.camel_case_endpoints:
            return endpoint in self.camel_case_endpoints
        
        return self.auto_convert_responses
    
    def should_convert_request(self, endpoint: str) -> bool:
        """Determine if request should be converted from camelCase"""
        if endpoint in self.exclude_from_conversion:
            return False
        
        return self.auto_convert_requests
    
    def get_response_format(self, endpoint: str) -> str:
        """Get the response format for a specific endpoint"""
        if self.should_convert_response(endpoint):
            return "camelCase"
        return "snake_case"


# Create case conversion config instance
case_config = CaseConversionConfig()
