/**
 * Hardcoded embedding provider configurations
 * This file contains the list of available embedding providers and their default configurations
 */

export interface EmbeddingProviderInfo {
  name: string;
  displayName: string;
  description: string;
  logo?: string;
  website?: string;
  supportedModels: string[];
  defaultConfig: {
    model: string;
    dimensions: number;
    maxTokens: number;
    temperature?: number;
    baseUrl?: string;
    organizationId?: string;
    [key: string]: any;
  };
  features: string[];
  pricing?: {
    costPerToken: number;
    freeTier?: number;
    billingModel: 'per-token' | 'per-request' | 'subscription';
  };
  requiredFields: string[];
  optionalFields: string[];
}

export const EMBEDDING_PROVIDERS: Record<string, EmbeddingProviderInfo> = {
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    description: 'OpenAI embedding models including text-embedding-ada-002 and text-embedding-3-small',
    logo: 'https://openai.com/favicon.ico',
    website: 'https://openai.com',
    supportedModels: [
      'text-embedding-ada-002',
      'text-embedding-3-small',
      'text-embedding-3-large'
    ],
    defaultConfig: {
      model: 'text-embedding-3-small',
      dimensions: 1536,
      maxTokens: 8192,
      temperature: 0,
      baseUrl: 'https://api.openai.com/v1',
      organizationId: ''
    },
    features: [
      'High-quality embeddings',
      'Multiple model sizes',
      'Fast processing',
      'Reliable API'
    ],
    pricing: {
      costPerToken: 0.00002, // $0.02 per 1M tokens
      freeTier: 0,
      billingModel: 'per-token'
    },
    requiredFields: ['apiKey'],
    optionalFields: ['baseUrl', 'organizationId']
  },

  cohere: {
    name: 'cohere',
    displayName: 'Cohere',
    description: 'Cohere embedding models for multilingual and domain-specific embeddings',
    logo: 'https://cohere.com/favicon.ico',
    website: 'https://cohere.com',
    supportedModels: [
      'embed-english-v3.0',
      'embed-multilingual-v3.0',
      'embed-english-light-v3.0',
      'embed-multilingual-light-v3.0'
    ],
    defaultConfig: {
      model: 'embed-english-v3.0',
      dimensions: 1024,
      maxTokens: 512,
      baseUrl: 'https://api.cohere.ai/v1'
    },
    features: [
      'Multilingual support',
      'Domain-specific models',
      'Lightweight options',
      'Good performance'
    ],
    pricing: {
      costPerToken: 0.0001, // $0.10 per 1M tokens
      freeTier: 1000000, // 1M tokens free
      billingModel: 'per-token'
    },
    requiredFields: ['apiKey'],
    optionalFields: ['baseUrl']
  },

  huggingface: {
    name: 'huggingface',
    displayName: 'Hugging Face',
    description: 'Open-source embedding models from Hugging Face Hub',
    logo: 'https://huggingface.co/favicon.ico',
    website: 'https://huggingface.co',
    supportedModels: [
      'sentence-transformers/all-MiniLM-L6-v2',
      'sentence-transformers/all-mpnet-base-v2',
      'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
      'intfloat/e5-large-v2'
    ],
    defaultConfig: {
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      dimensions: 384,
      maxTokens: 512,
      baseUrl: 'https://api-inference.huggingface.co'
    },
    features: [
      'Open-source models',
      'Free tier available',
      'Wide model selection',
      'Community support'
    ],
    pricing: {
      costPerToken: 0.00005, // $0.05 per 1M tokens
      freeTier: 10000000, // 10M tokens free
      billingModel: 'per-token'
    },
    requiredFields: ['apiKey'],
    optionalFields: ['baseUrl']
  },

  local: {
    name: 'local',
    displayName: 'Local Model',
    description: 'Run embedding models locally using Ollama or similar local inference servers',
    logo: 'https://ollama.ai/favicon.ico',
    website: 'https://ollama.ai',
    supportedModels: [
      'nomic-embed-text',
      'mxbai-embed-large',
      'all-minilm',
      'bge-large-en-v1.5'
    ],
    defaultConfig: {
      model: 'nomic-embed-text',
      dimensions: 768,
      maxTokens: 2048,
      baseUrl: 'http://localhost:11434',
      temperature: 0
    },
    features: [
      'No API costs',
      'Privacy-focused',
      'Offline capability',
      'Custom models'
    ],
    pricing: {
      costPerToken: 0,
      freeTier: 999999999, // Effectively unlimited
      billingModel: 'per-request'
    },
    requiredFields: ['baseUrl'],
    optionalFields: ['apiKey']
  },

  azure: {
    name: 'azure',
    displayName: 'Azure OpenAI',
    description: 'Azure-hosted OpenAI models with enterprise features',
    logo: 'https://azure.microsoft.com/favicon.ico',
    website: 'https://azure.microsoft.com',
    supportedModels: [
      'text-embedding-ada-002',
      'text-embedding-3-small',
      'text-embedding-3-large'
    ],
    defaultConfig: {
      model: 'text-embedding-3-small',
      dimensions: 1536,
      maxTokens: 8192,
      temperature: 0,
      baseUrl: 'https://your-resource.openai.azure.com',
      apiVersion: '2024-02-15-preview'
    },
    features: [
      'Enterprise security',
      'Azure integration',
      'Compliance features',
      'Managed service'
    ],
    pricing: {
      costPerToken: 0.00002, // $0.02 per 1M tokens
      freeTier: 0,
      billingModel: 'per-token'
    },
    requiredFields: ['apiKey', 'baseUrl'],
    optionalFields: ['apiVersion']
  },

};

export const getProviderInfo = (providerName: string): EmbeddingProviderInfo | null => {
  return EMBEDDING_PROVIDERS[providerName] || null;
};

export const getAvailableProviders = (): EmbeddingProviderInfo[] => {
  return Object.values(EMBEDDING_PROVIDERS);
};

export const getProviderNames = (): string[] => {
  return Object.keys(EMBEDDING_PROVIDERS);
};
