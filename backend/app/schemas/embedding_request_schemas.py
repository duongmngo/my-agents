"""
Request schemas for embedding provider configurations that handle frontend field naming
"""
from typing import Optional, Dict, Any, Union, Literal
from pydantic import BaseModel, Field, field_validator, model_validator, AliasChoices, ConfigDict
from enum import Enum


class EmbeddingProviderType(str, Enum):
    OPENAI = "openai"
    AZURE = "azure"
    HUGGINGFACE = "huggingface"
    
    @classmethod
    def _missing_(cls, value):
        """Handle case-insensitive provider type matching"""
        if isinstance(value, str):
            lower_value = value.lower()
            for member in cls:
                if member.value == lower_value:
                    return member
        return None


# Frontend-compatible OpenAI Configuration Schema
class OpenAIConfigRequest(BaseModel):
    api_key: str = Field(..., validation_alias=AliasChoices('api_key', 'apiKey'), description="OpenAI API key")
    model: str = Field(..., description="OpenAI model name")
    base_url: Optional[str] = Field(None, validation_alias=AliasChoices('base_url', 'baseUrl'), description="Custom base URL")
    organization_id: Optional[str] = Field(None, validation_alias=AliasChoices('organization_id', 'organizationId'), description="OpenAI organization ID")
    dimensions: Optional[int] = Field(1536, ge=1, le=3072, description="Embedding dimensions")
    max_tokens: Optional[int] = Field(8192, ge=1, le=8192, validation_alias=AliasChoices('max_tokens', 'maxTokens'), description="Maximum tokens")

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


# Frontend-compatible Azure Configuration Schema
class AzureConfigRequest(BaseModel):
    api_key: str = Field(..., validation_alias=AliasChoices('api_key', 'apiKey'), description="Azure OpenAI API key")
    base_url: str = Field(..., validation_alias=AliasChoices('base_url', 'baseUrl'), description="Azure OpenAI endpoint URL")
    api_version: Optional[str] = Field("2024-02-15-preview", validation_alias=AliasChoices('api_version', 'apiVersion'), description="Azure API version")
    deployment_name: str = Field(..., validation_alias=AliasChoices('deployment_name', 'deploymentName'), description="Azure deployment name")
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


# Frontend-compatible HuggingFace Configuration Schema
class HuggingFaceConfigRequest(BaseModel):
    api_key: Optional[str] = Field(None, validation_alias=AliasChoices('api_key', 'apiKey'), description="HuggingFace API key")
    api_url: Optional[str] = Field("https://api-inference.huggingface.co", validation_alias=AliasChoices('api_url', 'apiUrl'), description="HuggingFace API URL")
    model: str = Field(..., description="HuggingFace model name")
    use_gpu: Optional[bool] = Field(False, validation_alias=AliasChoices('use_gpu', 'useGpu'), description="Use GPU acceleration")
    batch_size: Optional[int] = Field(32, ge=1, le=100, validation_alias=AliasChoices('batch_size', 'batchSize'), description="Batch size for processing")

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




# Main embedding provider request schema that handles frontend format
class EmbeddingProviderCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    provider_type: EmbeddingProviderType = Field(..., validation_alias=AliasChoices('provider_type', 'provider'))
    config: Dict[str, Any] = Field(..., description="Provider-specific configuration")
    is_active: bool = Field(False)
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    @field_validator('provider_type', mode='before')
    @classmethod
    def normalize_provider_type(cls, v):
        """Convert provider types to lowercase"""
        if isinstance(v, str):
            return v.lower()
        return v

    @model_validator(mode='after')
    def validate_config(self):
        provider_type = self.provider_type
        config = self.config
        
        if not provider_type:
            raise ValueError('Provider type is required')
        
        try:
            if provider_type == EmbeddingProviderType.OPENAI:
                OpenAIConfigRequest(**config)
            elif provider_type == EmbeddingProviderType.AZURE:
                AzureConfigRequest(**config)
            elif provider_type == EmbeddingProviderType.HUGGINGFACE:
                HuggingFaceConfigRequest(**config)
            else:
                raise ValueError(f'Unsupported provider type: {provider_type}')
        except Exception as e:
            raise ValueError(f'Invalid configuration for {provider_type}: {str(e)}')
        
        return self

    def to_internal_format(self):
        """Convert to internal format for service layer"""
        return {
            "name": self.name,
            "provider": self.provider_type.value,
            "config": self.config,
            "description": self.description,
            "is_active": self.is_active,
            "metadata": self.metadata or {}
        }


class EmbeddingProviderUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    config: Optional[Dict[str, Any]] = Field(None, description="Provider-specific configuration")
    is_active: Optional[bool] = Field(None)
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    def to_internal_format(self):
        """Convert to internal format for service layer"""
        result = {}
        if self.name is not None:
            result["name"] = self.name
        if self.description is not None:
            result["description"] = self.description
        if self.config is not None:
            result["config"] = self.config
        if self.is_active is not None:
            result["is_active"] = self.is_active
        if self.metadata is not None:
            result["metadata"] = self.metadata
        return result
