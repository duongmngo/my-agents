import { useState, useEffect, useCallback } from 'react';
import { embeddingService } from '@/services/embedding-service';
import { EmbeddingProviderConfig } from '@/types/common-types';
import { EMBEDDING_PROVIDERS, getProviderInfo } from '@/constants/embedding-providers';

interface UseEmbeddingProvidersReturn {
  // Data
  configuredProviders: EmbeddingProviderConfig[];
  availableProviders: typeof EMBEDDING_PROVIDERS;
  activeProvider: EmbeddingProviderConfig | null;
  
  // Loading states
  isLoading: boolean;
  isAdding: boolean;
  error: string | null;
  
  // Actions
  loadProviders: () => Promise<void>;
  addProvider: (providerData: any) => Promise<boolean>;
  updateProvider: (providerId: string, providerData: any) => Promise<boolean>;
  deleteProvider: (providerId: string) => Promise<boolean>;
  setDefaultProvider: (providerId: string) => Promise<boolean>;
  toggleProviderActive: (providerId: string) => Promise<boolean>;
  testProvider: (providerId: string) => Promise<{ success: boolean; message: string }>;
  
  // Helper functions
  getProviderByName: (providerName: string) => EmbeddingProviderConfig | null;
  getLastUsedSettings: (providerName: string) => any;
  saveLastUsedSettings: (providerName: string, settings: any) => void;
}

export const useEmbeddingProviders = (workspaceId: string): UseEmbeddingProvidersReturn => {
  const [configuredProviders, setConfiguredProviders] = useState<EmbeddingProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get active provider (the one with isActive: true)
  const activeProvider = configuredProviders.find(p => p.isActive) || null;

  // Load configured providers from API
  const loadProviders = useCallback(async () => {
    if (!workspaceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await embeddingService.getWorkspaceProviders(workspaceId);
      
      // Debug logging
      console.log('Embedding providers API response:', {
        workspaceId,
        response,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        responseKeys: response.data ? Object.keys(response.data) : 'no data'
      });
      
      if (response.success) {
        // Handle the API response format: { success: true, data: { providers: [...] } }
        const providers = (response.data as any)?.providers || [];
        const providersArray = Array.isArray(providers) ? providers : [];
        
        console.log('Processed providers:', {
          providers,
          providersArray,
          length: providersArray.length,
          firstProvider: providersArray[0]
        });
        setConfiguredProviders(providersArray);
        
        // Clear any previous errors since we got a successful response
        setError(null);
      } else {
        // Only set error if it's actually an error, not just empty data
        if (response.message && !response.message.includes('empty') && !response.message.includes('not found')) {
          setError(response.message || 'Failed to load embedding providers');
        } else {
          // If it's just "not found" or "empty", treat as success with empty array
          setConfiguredProviders([]);
          setError(null);
        }
      }
    } catch (err) {
      setError('Failed to load embedding providers');
      setConfiguredProviders([]); // Set empty array on error
      console.error('Error loading providers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  // Add a new provider
  const addProvider = useCallback(async (providerData: any): Promise<boolean> => {
    if (!workspaceId) return false;
    
    setIsAdding(true);
    setError(null);
    
    try {
      console.log('Adding provider with data:', providerData);
      const response = await embeddingService.addProvider(workspaceId, providerData);
      
      console.log('Add provider response:', {
        response,
        success: response?.success,
        message: response?.message
      });
      
      if (response.success) {
        console.log('Provider added successfully, reloading providers...');
        try {
          await loadProviders(); // Reload providers
          console.log('Providers reloaded after adding');
          return true;
        } catch (reloadError) {
          console.error('Error reloading providers after adding:', reloadError);
          // Still return true since the provider was added successfully
          return true;
        }
      } else {
        console.log('Failed to add provider:', response.message);
        setError(response.message || 'Failed to add provider');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add provider';
      console.error('Error adding provider:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsAdding(false);
    }
  }, [workspaceId, loadProviders]);

  // Update an existing provider
  const updateProvider = useCallback(async (providerId: string, providerData: any): Promise<boolean> => {
    if (!workspaceId) return false;
    
    try {
      const response = await embeddingService.updateProvider(workspaceId, providerId, providerData);
      
      if (response.success) {
        await loadProviders(); // Reload providers
        return true;
      } else {
        setError(response.message || 'Failed to update provider');
        return false;
      }
    } catch (err) {
      setError('Failed to update provider');
      console.error('Error updating provider:', err);
      return false;
    }
  }, [workspaceId, loadProviders]);

  // Delete a provider
  const deleteProvider = useCallback(async (providerId: string): Promise<boolean> => {
    if (!workspaceId) return false;
    
    try {
      const response = await embeddingService.deleteProvider(workspaceId, providerId);
      
      if (response.success) {
        await loadProviders(); // Reload providers
        return true;
      } else {
        setError(response.message || 'Failed to delete provider');
        return false;
      }
    } catch (err) {
      setError('Failed to delete provider');
      console.error('Error deleting provider:', err);
      return false;
    }
  }, [workspaceId, loadProviders]);

  // Set default provider
  const setDefaultProvider = useCallback(async (providerId: string): Promise<boolean> => {
    if (!workspaceId) return false;
    
    try {
      const response = await embeddingService.setDefaultProvider(workspaceId, providerId);
      
      if (response.success) {
        await loadProviders(); // Reload providers
        return true;
      } else {
        setError(response.message || 'Failed to set default provider');
        return false;
      }
    } catch (err) {
      setError('Failed to set default provider');
      console.error('Error setting default provider:', err);
      return false;
    }
  }, [workspaceId, loadProviders]);

  // Toggle provider active status
  const toggleProviderActive = useCallback(async (providerId: string): Promise<boolean> => {
    if (!workspaceId) return false;
    
    try {
      const response = await embeddingService.toggleProviderActive(workspaceId, providerId);
      
      if (response.success) {
        await loadProviders(); // Reload providers
        return true;
      } else {
        setError(response.message || 'Failed to toggle provider active status');
        return false;
      }
    } catch (err) {
      setError('Failed to toggle provider active status');
      console.error('Error toggling provider active status:', err);
      return false;
    }
  }, [workspaceId, loadProviders]);

  // Test provider connection
  const testProvider = useCallback(async (providerId: string): Promise<{ success: boolean; message: string }> => {
    if (!workspaceId) return { success: false, message: 'No workspace ID' };
    
    try {
      const response = await embeddingService.testProvider(workspaceId, providerId);
      
      if (response.success) {
        return { success: true, message: response.message || 'Provider test successful' };
      } else {
        return { success: false, message: response.message || 'Provider test failed' };
      }
    } catch (err) {
      return { success: false, message: 'Failed to test provider' };
    }
  }, [workspaceId]);

  // Helper function to get provider by name
  const getProviderByName = useCallback((providerName: string): EmbeddingProviderConfig | null => {
    return configuredProviders.find(p => p.provider === providerName) || null;
  }, [configuredProviders]);

  // Helper functions for managing last used settings per provider
  const getLastUsedSettings = useCallback((providerName: string): any => {
    const key = `embedding_provider_settings_${workspaceId}_${providerName}`;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [workspaceId]);

  const saveLastUsedSettings = useCallback((providerName: string, settings: any): void => {
    const key = `embedding_provider_settings_${workspaceId}_${providerName}`;
    try {
      localStorage.setItem(key, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save last used settings:', error);
    }
  }, [workspaceId]);

  // Load providers when workspace changes
  useEffect(() => {
    if (workspaceId) {
      loadProviders();
    }
  }, [workspaceId, loadProviders]);

  return {
    // Data
    configuredProviders,
    availableProviders: EMBEDDING_PROVIDERS,
    activeProvider,
    
    // Loading states
    isLoading,
    isAdding,
    error,
    
    // Actions
    loadProviders,
    addProvider,
    updateProvider,
    deleteProvider,
    setDefaultProvider,
    toggleProviderActive,
    testProvider,
    
    // Helper functions
    getProviderByName,
    getLastUsedSettings,
    saveLastUsedSettings
  };
};
