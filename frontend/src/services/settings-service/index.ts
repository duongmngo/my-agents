import { 
  LLMProvider, 
  LLMModel, 
  EmbeddingModel, 
  ModelConfiguration, 
  SettingsFormData,
  ApiResponse 
} from '@/types/common-types';

// Mock delay to simulate API calls
const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface SettingsServiceInterface {
  getLLMProviders: () => Promise<ApiResponse<LLMProvider[]>>;
  getLLMModels: () => Promise<ApiResponse<LLMModel[]>>;
  getEmbeddingModels: () => Promise<ApiResponse<EmbeddingModel[]>>;
  getModelConfiguration: (tenantId: string, userId?: string, agentId?: string) => Promise<ApiResponse<ModelConfiguration>>;
  updateModelConfiguration: (config: Partial<ModelConfiguration>) => Promise<ApiResponse<ModelConfiguration>>;
  addLLMModel: (model: Omit<LLMModel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiResponse<LLMModel>>;
  updateLLMModel: (id: string, model: Partial<LLMModel>) => Promise<ApiResponse<LLMModel>>;
  deleteLLMModel: (id: string) => Promise<ApiResponse<void>>;
  setDefaultLLMModel: (id: string) => Promise<ApiResponse<void>>;
  addEmbeddingModel: (model: Omit<EmbeddingModel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiResponse<EmbeddingModel>>;
  updateEmbeddingModel: (id: string, model: Partial<EmbeddingModel>) => Promise<ApiResponse<EmbeddingModel>>;
  deleteEmbeddingModel: (id: string) => Promise<ApiResponse<void>>;
  setDefaultEmbeddingModel: (id: string) => Promise<ApiResponse<void>>;
  updateOpenAIApiKey: (apiKey: string) => Promise<ApiResponse<void>>;
}

// Mock data for LLM providers
const mockLLMProviders: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '/logos/openai.svg',
    description: 'Leading AI research company',
    website: 'https://openai.com',
    isActive: true,
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    logo: '/logos/azure.svg',
    description: 'Microsoft Azure OpenAI Service',
    website: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service',
    isActive: true,
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    logo: '/logos/huggingface.svg',
    description: 'Open source AI platform',
    website: 'https://huggingface.co',
    isActive: true,
  },
];

// Mock data for LLM models
const mockLLMModels: LLMModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    providerId: 'openai',
    provider: mockLLMProviders[0],
    modelType: 'chat',
    maxTokens: 8192,
    contextWindow: 8192,
    pricing: {
      input: 0.03,
      output: 0.06,
    },
    capabilities: ['chat', 'function-calling', 'vision'],
    isActive: true,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    providerId: 'openai',
    provider: mockLLMProviders[0],
    modelType: 'chat',
    maxTokens: 4096,
    contextWindow: 4096,
    pricing: {
      input: 0.0015,
      output: 0.002,
    },
    capabilities: ['chat', 'function-calling'],
    isActive: true,
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    providerId: 'anthropic',
    provider: mockLLMProviders[1],
    modelType: 'chat',
    maxTokens: 4096,
    contextWindow: 200000,
    pricing: {
      input: 0.015,
      output: 0.075,
    },
    capabilities: ['chat', 'function-calling', 'vision'],
    isActive: true,
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    providerId: 'anthropic',
    provider: mockLLMProviders[1],
    modelType: 'chat',
    maxTokens: 4096,
    contextWindow: 200000,
    pricing: {
      input: 0.003,
      output: 0.015,
    },
    capabilities: ['chat', 'function-calling', 'vision'],
    isActive: true,
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock data for embedding models
const mockEmbeddingModels: EmbeddingModel[] = [
  {
    id: 'text-embedding-ada-002',
    name: 'text-embedding-ada-002',
    providerId: 'openai',
    provider: mockLLMProviders[0],
    dimensions: 1536,
    maxTokens: 8191,
    pricing: {
      perToken: 0.0001,
    },
    isActive: true,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'text-embedding-3-small',
    name: 'text-embedding-3-small',
    providerId: 'openai',
    provider: mockLLMProviders[0],
    dimensions: 1536,
    maxTokens: 8191,
    pricing: {
      perToken: 0.00002,
    },
    isActive: true,
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'text-embedding-3-large',
    name: 'text-embedding-3-large',
    providerId: 'openai',
    provider: mockLLMProviders[0],
    dimensions: 3072,
    maxTokens: 8191,
    pricing: {
      perToken: 0.00013,
    },
    isActive: true,
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock model configuration
const mockModelConfiguration: ModelConfiguration = {
  id: 'config-1',
  tenantId: 'tenant-1',
  level: 'tenant',
  defaultLLMModelId: 'gpt-4',
  defaultEmbeddingModelId: 'text-embedding-ada-002',
  openAIApiKey: 'sk-...', // This would be encrypted in real implementation
  customModels: {
    llmModels: [],
    embeddingModels: [],
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

class SettingsService implements SettingsServiceInterface {
  async getLLMProviders(): Promise<ApiResponse<LLMProvider[]>> {
    try {
      await mockDelay(300);
      return {
        success: true,
        data: mockLLMProviders,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch LLM providers',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getLLMModels(): Promise<ApiResponse<LLMModel[]>> {
    try {
      await mockDelay(400);
      return {
        success: true,
        data: mockLLMModels,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch LLM models',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getEmbeddingModels(): Promise<ApiResponse<EmbeddingModel[]>> {
    try {
      await mockDelay(400);
      return {
        success: true,
        data: mockEmbeddingModels,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch embedding models',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getModelConfiguration(
    tenantId: string, 
    userId?: string, 
    agentId?: string
  ): Promise<ApiResponse<ModelConfiguration>> {
    try {
      await mockDelay(500);
      
      // In a real implementation, you'd fetch the configuration based on the hierarchy
      // For now, we'll return the mock configuration
      return {
        success: true,
        data: mockModelConfiguration,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch model configuration',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateModelConfiguration(
    config: Partial<ModelConfiguration>
  ): Promise<ApiResponse<ModelConfiguration>> {
    try {
      await mockDelay(600);
      
      // In a real implementation, you'd update the configuration
      const updatedConfig = { ...mockModelConfiguration, ...config };
      
      return {
        success: true,
        data: updatedConfig,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update model configuration',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async addLLMModel(
    model: Omit<LLMModel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<LLMModel>> {
    try {
      await mockDelay(700);
      
      const newModel: LLMModel = {
        ...model,
        id: `model-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        success: true,
        data: newModel,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to add LLM model',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateLLMModel(
    id: string, 
    model: Partial<LLMModel>
  ): Promise<ApiResponse<LLMModel>> {
    try {
      await mockDelay(600);
      
      const existingModel = mockLLMModels.find(m => m.id === id);
      if (!existingModel) {
        return {
          success: false,
          error: 'LLM model not found',
          message: `LLM model with ID ${id} was not found`,
        };
      }
      
      const updatedModel = { ...existingModel, ...model, updatedAt: new Date().toISOString() };
      
      return {
        success: true,
        data: updatedModel,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update LLM model',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteLLMModel(id: string): Promise<ApiResponse<void>> {
    try {
      await mockDelay(500);
      
      const existingModel = mockLLMModels.find(m => m.id === id);
      if (!existingModel) {
        return {
          success: false,
          error: 'LLM model not found',
          message: `LLM model with ID ${id} was not found`,
        };
      }
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete LLM model',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async setDefaultLLMModel(id: string): Promise<ApiResponse<void>> {
    try {
      await mockDelay(400);
      
      const existingModel = mockLLMModels.find(m => m.id === id);
      if (!existingModel) {
        return {
          success: false,
          error: 'LLM model not found',
          message: `LLM model with ID ${id} was not found`,
        };
      }
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to set default LLM model',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async addEmbeddingModel(
    model: Omit<EmbeddingModel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<EmbeddingModel>> {
    try {
      await mockDelay(700);
      
      const newModel: EmbeddingModel = {
        ...model,
        id: `embedding-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        success: true,
        data: newModel,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to add embedding model',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateEmbeddingModel(
    id: string, 
    model: Partial<EmbeddingModel>
  ): Promise<ApiResponse<EmbeddingModel>> {
    try {
      await mockDelay(600);
      
      const existingModel = mockEmbeddingModels.find(m => m.id === id);
      if (!existingModel) {
        return {
          success: false,
          error: 'Embedding model not found',
          message: `Embedding model with ID ${id} was not found`,
        };
      }
      
      const updatedModel = { ...existingModel, ...model, updatedAt: new Date().toISOString() };
      
      return {
        success: true,
        data: updatedModel,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update embedding model',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteEmbeddingModel(id: string): Promise<ApiResponse<void>> {
    try {
      await mockDelay(500);
      
      const existingModel = mockEmbeddingModels.find(m => m.id === id);
      if (!existingModel) {
        return {
          success: false,
          error: 'Embedding model not found',
          message: `Embedding model with ID ${id} was not found`,
        };
      }
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete embedding model',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async setDefaultEmbeddingModel(id: string): Promise<ApiResponse<void>> {
    try {
      await mockDelay(400);
      
      const existingModel = mockEmbeddingModels.find(m => m.id === id);
      if (!existingModel) {
        return {
          success: false,
          error: 'Embedding model not found',
          message: `Embedding model with ID ${id} was not found`,
        };
      }
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to set default embedding model',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updateOpenAIApiKey(apiKey: string): Promise<ApiResponse<void>> {
    try {
      await mockDelay(500);
      
      // In a real implementation, you'd encrypt and store the API key
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update OpenAI API key',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
export default settingsService;
