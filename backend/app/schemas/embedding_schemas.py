"""
Pydantic schemas for embedding provider configurations
"""
from typing import Optional, Dict, Any, Union, Literal
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from enum import Enum


class EmbeddingProviderType(str, Enum):
    OPENAI = "openai"
    AZURE = "azure"
    HUGGINGFACE = "huggingface"


# Base configuration schema
class BaseEmbeddingConfig(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Provider name")
    description: Optional[str] = Field(None, max_length=500, description="Provider description")
    is_active: bool = Field(False, description="Whether this provider is active")


# OpenAI Configuration Schema
class OpenAIConfig(BaseModel):
    api_key: str = Field(..., min_length=1, description="OpenAI API key")
    model: str = Field(..., description="OpenAI model name")
    base_url: Optional[str] = Field(None, description="Custom base URL")
    organization_id: Optional[str] = Field(None, description="OpenAI organization ID")
    dimensions: Optional[int] = Field(1536, ge=1, le=3072, description="Embedding dimensions")
    max_tokens: Optional[int] = Field(8192, ge=1, le=8192, description="Maximum tokens")

    @field_validator('base_url')
    @classmethod
    def validate_base_url(cls, v):
        if v and not v.startswith('http'):
            raise ValueError('Base URL must be a valid HTTP/HTTPS URL')
        return v

    @field_validator('model')
    @classmethod
    def validate_model(cls, v):
        valid_models = [
            'text-embedding-3-small',
            'text-embedding-3-large', 
            'text-embedding-ada-002'
        ]
        if v not in valid_models:
            raise ValueError(f'Invalid OpenAI model. Must be one of: {", ".join(valid_models)}')
        return v


# Azure Configuration Schema
class AzureConfig(BaseModel):
    api_key: str = Field(..., min_length=1, description="Azure OpenAI API key")
    base_url: str = Field(..., description="Azure OpenAI endpoint URL")
    api_version: Optional[str] = Field("2024-02-15-preview", description="Azure API version")
    deployment_name: str = Field(..., description="Azure deployment name")
    model: Optional[str] = Field(None, description="Underlying model name")

    @field_validator('base_url')
    @classmethod
    def validate_base_url(cls, v):
        if not v.startswith('https://'):
            raise ValueError('Azure base URL must be HTTPS')
        if 'openai.azure.com' not in v:
            raise ValueError('Azure base URL must be a valid Azure OpenAI endpoint')
        return v

    @field_validator('api_version')
    @classmethod
    def validate_api_version(cls, v):
        valid_versions = [
            '2024-02-15-preview',
            '2024-02-01',
            '2023-12-01-preview',
            '2023-08-01-preview'
        ]
        if v not in valid_versions:
            raise ValueError(f'Invalid Azure API version. Must be one of: {", ".join(valid_versions)}')
        return v


# HuggingFace Configuration Schema
class HuggingFaceConfig(BaseModel):
    api_key: Optional[str] = Field(None, description="HuggingFace API key")
    api_url: Optional[str] = Field("https://api-inference.huggingface.co", description="HuggingFace API URL")
    model: str = Field(..., description="HuggingFace model name")
    use_gpu: Optional[bool] = Field(False, description="Use GPU acceleration")
    batch_size: Optional[int] = Field(32, ge=1, le=100, description="Batch size for processing")

    @field_validator('api_key')
    @classmethod
    def validate_api_key(cls, v):
        if v and not v.startswith('hf_'):
            raise ValueError('HuggingFace API key must start with "hf_"')
        return v

    @field_validator('api_url')
    @classmethod
    def validate_api_url(cls, v):
        if v and not v.startswith('http'):
            raise ValueError('API URL must be a valid HTTP/HTTPS URL')
        return v

    @field_validator('model')
    @classmethod
    def validate_model(cls, v):
        valid_models = [
            'sentence-transformers/all-MiniLM-L6-v2',
            'sentence-transformers/all-mpnet-base-v2',
            'sentence-transformers/all-MiniLM-L12-v2',
            'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
            'sentence-transformers/distilbert-base-nli-mean-tokens'
        ]
        if v not in valid_models:
            raise ValueError(f'Invalid HuggingFace model. Must be one of: {", ".join(valid_models)}')
        return v




# Union type for all provider configurations
ProviderConfig = Union[OpenAIConfig, AzureConfig, HuggingFaceConfig]


# Main embedding provider schema
class EmbeddingProviderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    provider_type: EmbeddingProviderType
    config: Dict[str, Any] = Field(..., description="Provider-specific configuration")
    is_active: bool = Field(False)

    @model_validator(mode='after')
    def validate_config(self):
        provider_type = self.provider_type
        config = self.config
        
        if not provider_type:
            raise ValueError('Provider type is required')
        
        try:
            if provider_type == EmbeddingProviderType.OPENAI:
                OpenAIConfig(**config)
            elif provider_type == EmbeddingProviderType.AZURE:
                AzureConfig(**config)
            elif provider_type == EmbeddingProviderType.HUGGINGFACE:
                HuggingFaceConfig(**config)
            else:
                raise ValueError(f'Unsupported provider type: {provider_type}')
        except Exception as e:
            raise ValueError(f'Invalid configuration for {provider_type}: {str(e)}')
        
        return self


class EmbeddingProviderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    config: Optional[Dict[str, Any]] = Field(None, description="Provider-specific configuration")
    is_active: Optional[bool] = Field(None)

    @model_validator(mode='after')
    def validate_config(self):
        config = self.config
        if config is not None:
            # We need the provider type to validate, but it's not in the update schema
            # This validation will be done in the service layer where we have access to the existing provider
            pass
        return self


class EmbeddingProviderResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class EmbeddingProviderData(BaseModel):
    id: str
    name: str
    description: Optional[str]
    provider_type: EmbeddingProviderType
    config: Dict[str, Any]
    is_active: bool
    workspace_id: str
    created_by: str
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class WorkspaceEmbeddingSettingsCreate(BaseModel):
    default_model: Optional[str] = Field(None, max_length=255)
    chunk_size: Optional[int] = Field(1000, ge=100, le=4000)
    chunk_overlap: Optional[int] = Field(200, ge=0, le=1000)
    enable_auto_embedding: Optional[bool] = Field(True)


class WorkspaceEmbeddingSettingsUpdate(BaseModel):
    default_model: Optional[str] = Field(None, max_length=255)
    chunk_size: Optional[int] = Field(None, ge=100, le=4000)
    chunk_overlap: Optional[int] = Field(None, ge=0, le=1000)
    enable_auto_embedding: Optional[bool] = Field(None)


class WorkspaceEmbeddingSettingsResponse(BaseModel):
    workspace_id: str
    default_model: Optional[str]
    chunk_size: int
    chunk_overlap: int
    enable_auto_embedding: bool
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)
