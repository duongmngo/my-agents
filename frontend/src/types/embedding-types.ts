/**
 * Embedding provider configuration types
 */

// Base configuration interface
export interface BaseEmbeddingConfig {
  name: string;
  description?: string;
  is_active?: boolean;
}

// OpenAI Configuration
export interface OpenAIEmbeddingConfig extends BaseEmbeddingConfig {
  provider: 'OPENAI';
  config: {
    api_key: string;
    model: string;
    base_url?: string;
    organization_id?: string;
    dimensions?: number;
    max_tokens?: number;
  };
}

// Azure OpenAI Configuration
export interface AzureEmbeddingConfig extends BaseEmbeddingConfig {
  provider: 'AZURE';
  config: {
    api_key: string;
    base_url: string;
    api_version?: string;
    deployment_name: string;
    model?: string;
  };
}

// HuggingFace Configuration
export interface HuggingFaceEmbeddingConfig extends BaseEmbeddingConfig {
  provider: 'HUGGINGFACE';
  config: {
    api_key?: string;
    api_url?: string;
    model: string;
    use_gpu?: boolean;
    batch_size?: number;
  };
}

// Union type for all embedding configurations
export type EmbeddingProviderConfig = 
  | OpenAIEmbeddingConfig
  | AzureEmbeddingConfig
  | HuggingFaceEmbeddingConfig;

// Provider type enum
export type EmbeddingProviderType = 'OPENAI' | 'AZURE' | 'HUGGINGFACE';

// API Response types
export interface EmbeddingProviderResponse {
  success: boolean;
  data?: {
    providers: EmbeddingProviderConfig[];
  };
  error?: string;
}

export interface EmbeddingProviderInfo {
  name: string;
  description: string;
  models: string[];
  config_fields: ConfigField[];
}

export interface ConfigField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  description?: string;
}

// Workspace embedding settings
export interface WorkspaceEmbeddingSettings {
  workspace_id: string;
  default_model?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  enable_auto_embedding?: boolean;
}

// Embedding generation request
export interface EmbeddingGenerationRequest {
  text: string;
  model?: string;
  workspace_id: string;
}

// Embedding generation response
export interface EmbeddingGenerationResponse {
  success: boolean;
  data?: {
    embedding: number[];
    model: string;
    usage: {
      prompt_tokens: number;
      total_tokens: number;
    };
  };
  error?: string;
  error_code?: string;
}
