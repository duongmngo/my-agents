"""
Application configuration settings
"""
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Application
    ENVIRONMENT: str = Field(default="development", description="Environment: development, staging, production")
    DEBUG: bool = Field(default=True, description="Debug mode")
    
    # Database
    DATABASE_URL: str = Field(..., description="PostgreSQL database URL")
    POSTGRES_DB: str = Field(..., description="PostgreSQL database name")
    POSTGRES_USER: str = Field(..., description="PostgreSQL username")
    POSTGRES_PASSWORD: str = Field(..., description="PostgreSQL password")
    POSTGRES_HOST: str = Field(default="localhost", description="PostgreSQL host")
    POSTGRES_PORT: int = Field(default=5432, description="PostgreSQL port")
    
    # Security
    SECRET_KEY: str = Field(..., description="Secret key for JWT encoding")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="JWT access token expiration")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="JWT refresh token expiration")
    
    # CORS and Security
    ALLOWED_ORIGINS: List[str] = Field(default=["http://localhost:3000"], description="Allowed CORS origins")
    ALLOWED_HOSTS: List[str] = Field(default=["*"], description="Allowed hosts")
    
    # Redis (for caching and sessions)
    REDIS_URL: str = Field(default="redis://localhost:6379", description="Redis URL")
    
    # File Storage (MinIO/S3)
    MINIO_ENDPOINT: str = Field(default="localhost:9000", description="MinIO endpoint")
    MINIO_ACCESS_KEY: str = Field(..., description="MinIO access key")
    MINIO_SECRET_KEY: str = Field(..., description="MinIO secret key")
    MINIO_BUCKET_NAME: str = Field(default="chat-files", description="Default bucket name")
    MINIO_SECURE: bool = Field(default=False, description="Use HTTPS for MinIO")
    
    # API Settings
    API_V1_STR: str = Field(default="/api/v1", description="API version 1 prefix")
    PROJECT_NAME: str = Field(default="Multi-Tenant Chat API", description="Project name")
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = Field(default=20, description="Default pagination size")
    MAX_PAGE_SIZE: int = Field(default=100, description="Maximum pagination size")
    
    # File Upload Limits
    MAX_FILE_SIZE: int = Field(default=10 * 1024 * 1024, description="Max file size in bytes (10MB)")
    ALLOWED_FILE_TYPES: List[str] = Field(
        default=[".pdf", ".txt", ".md", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".gif"],
        description="Allowed file extensions"
    )
    
    # Email (optional, for notifications)
    SMTP_HOST: Optional[str] = Field(default=None, description="SMTP host")
    SMTP_PORT: Optional[int] = Field(default=587, description="SMTP port")
    SMTP_USER: Optional[str] = Field(default=None, description="SMTP username")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="SMTP password")
    SMTP_FROM_EMAIL: Optional[str] = Field(default=None, description="From email address")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields that are not defined in the model


# Global settings instance
settings = Settings()
