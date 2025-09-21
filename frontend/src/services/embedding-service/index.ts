import { apiClient } from '../api-client';
import { 
  WorkspaceEmbeddingSettings, 
  EmbeddingProviderConfig,
  ApiResponse 
} from '@/types/common-types';

export interface CreateProviderRequest {
  name: string;
  provider: 'openai' | 'azure' | 'cohere' | 'huggingface' | 'local';
  config: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    organizationId?: string;
    dimensions?: number;
    maxTokens?: number;
    temperature?: number;
    [key: string]: any;
  };
  metadata?: {
    description?: string;
    version?: string;
  };
}

export interface UpdateProviderRequest extends Partial<CreateProviderRequest> {
  id: string;
}

export interface WorkspaceEmbeddingSettingsRequest {
  autoRotate?: boolean;
  fallbackProviderId?: string;
  batchSize?: number;
  retryAttempts?: number;
  timeout?: number;
}

class EmbeddingService {
  private baseUrl = '/api/v1/embedding';

  /**
   * Get workspace embedding settings
   */
  async getWorkspaceSettings(workspaceId: string): Promise<ApiResponse<WorkspaceEmbeddingSettings>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/workspace/${workspaceId}/settings`) as any;
      return response.data;
    } catch (error) {
      console.error('Error fetching workspace embedding settings:', error);
      return {
        success: false,
        message: 'Failed to fetch workspace embedding settings'
      };
    }
  }

  /**
   * Get all embedding providers for a workspace
   */
  async getWorkspaceProviders(workspaceId: string): Promise<ApiResponse<EmbeddingProviderConfig[]>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/workspace/${workspaceId}/providers`) as any;
      
      // Debug logging
      console.log('Raw API response for workspace providers:', {
        workspaceId,
        response,
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : 'no response',
        hasSuccess: response?.success,
        hasData: !!response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : 'no data'
      });
      
      // The API client returns the JSON response directly
      // So response is the actual API response: { success: true, data: { providers: [...] } }
      if (response && typeof response === 'object') {
        return response;
      } else {
        return {
          success: false,
          message: 'Unexpected response format'
        };
      }
    } catch (error: any) {
      console.error('Error fetching workspace embedding providers:', error);
      
      // Check if it's a 404 (no providers found) vs actual error
      if (error.response?.status === 404) {
        return {
          success: true,
          data: [] as EmbeddingProviderConfig[]
        };
      }
      
      return {
        success: false,
        message: 'Failed to fetch workspace embedding providers'
      };
    }
  }

  /**
   * Add a new embedding provider to workspace
   */
  async addProvider(
    workspaceId: string, 
    providerData: CreateProviderRequest
  ): Promise<ApiResponse<EmbeddingProviderConfig>> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/workspace/${workspaceId}/providers`, 
        providerData
      ) as any;
      
      // Debug logging
      console.log('Add provider API response:', {
        workspaceId,
        response,
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : 'no response'
      });
      
      // The API client returns the JSON response directly
      return response;
    } catch (error) {
      console.error('Error adding embedding provider:', error);
      return {
        success: false,
        message: 'Failed to add embedding provider'
      };
    }
  }

  /**
   * Update an existing embedding provider
   */
  async updateProvider(
    workspaceId: string, 
    providerId: string, 
    providerData: UpdateProviderRequest
  ): Promise<ApiResponse<EmbeddingProviderConfig>> {
    try {
      const response = await apiClient.put(
        `${this.baseUrl}/workspace/${workspaceId}/providers/${providerId}`, 
        providerData
      ) as any;
      
      // The API client returns the JSON response directly
      return response;
    } catch (error) {
      console.error('Error updating embedding provider:', error);
      return {
        success: false,
        message: 'Failed to update embedding provider'
      };
    }
  }

  /**
   * Delete an embedding provider
   */
  async deleteProvider(
    workspaceId: string, 
    providerId: string
  ): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(
        `${this.baseUrl}/workspace/${workspaceId}/providers/${providerId}`
      ) as any;
      
      // The API client returns the JSON response directly
      return response;
    } catch (error) {
      console.error('Error deleting embedding provider:', error);
      return {
        success: false,
        message: 'Failed to delete embedding provider'
      };
    }
  }

  /**
   * Set a provider as default for a workspace
   */
  async setDefaultProvider(
    workspaceId: string, 
    providerId: string
  ): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/workspace/${workspaceId}/providers/${providerId}/set-default`
      ) as any;
      
      // The API client returns the JSON response directly
      return response;
    } catch (error) {
      console.error('Error setting default provider:', error);
      return {
        success: false,
        message: 'Failed to set default provider'
      };
    }
  }

  /**
   * Toggle provider active status
   */
  async toggleProviderActive(
    workspaceId: string, 
    providerId: string
  ): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/workspace/${workspaceId}/providers/${providerId}/toggle-active`
      ) as any;
      
      // The API client returns the JSON response directly
      return response;
    } catch (error) {
      console.error('Error toggling provider active status:', error);
      return {
        success: false,
        message: 'Failed to toggle provider active status'
      };
    }
  }

  /**
   * Update workspace embedding settings
   */
  async updateWorkspaceSettings(
    workspaceId: string, 
    settings: WorkspaceEmbeddingSettingsRequest
  ): Promise<ApiResponse<WorkspaceEmbeddingSettings>> {
    try {
      const response = await apiClient.put(
        `${this.baseUrl}/workspace/${workspaceId}/settings`, 
        settings
      ) as any;
      
      // The API client returns the JSON response directly
      return response;
    } catch (error) {
      console.error('Error updating workspace embedding settings:', error);
      return {
        success: false,
        message: 'Failed to update workspace embedding settings'
      };
    }
  }

  /**
   * Test provider connection
   */
  async testProvider(
    workspaceId: string, 
    providerId: string
  ): Promise<ApiResponse<{ status: string; message: string }>> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/workspace/${workspaceId}/providers/${providerId}/test`
      ) as any;
      return response.data;
    } catch (error) {
      console.error('Error testing provider:', error);
      return {
        success: false,
        message: 'Failed to test provider'
      };
    }
  }

  /**
   * Get provider usage statistics
   */
  async getProviderUsage(
    workspaceId: string, 
    providerId: string,
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<ApiResponse<{
    totalTokens: number;
    totalCost: number;
    requestCount: number;
    averageLatency: number;
    errorRate: number;
  }>> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/workspace/${workspaceId}/providers/${providerId}/usage?period=${period}`
      ) as any;
      return response.data;
    } catch (error) {
      console.error('Error fetching provider usage:', error);
      return {
        success: false,
        message: 'Failed to fetch provider usage'
      };
    }
  }

  /**
   * Get available embedding providers
   */
  async getAvailableProviders(): Promise<ApiResponse<string[]>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/providers`) as any;
      return response.data;
    } catch (error) {
      console.error('Error fetching available providers:', error);
      return {
        success: false,
        message: 'Failed to fetch available providers'
      };
    }
  }

  /**
   * Get provider model information
   */
  async getProviderModels(provider: string): Promise<ApiResponse<{
    models: string[];
    defaultModel: string;
    dimensions: number;
    maxTokens: number;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/providers/${provider}/models`) as any;
      return response.data;
    } catch (error) {
      console.error('Error fetching provider models:', error);
      return {
        success: false,
        message: 'Failed to fetch provider models'
      };
    }
  }
}

export const embeddingService = new EmbeddingService();
