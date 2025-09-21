'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge/badge';
import { ProviderIcon } from '@/components/common/icon';
import { LoadingSpinner } from '@/components/common/loading';
import { embeddingService } from '@/services/embedding-service';
import { useEmbeddingProviders } from '@/hooks/use-embedding-providers';
import { EMBEDDING_PROVIDERS, getProviderInfo } from '@/constants/embedding-providers';
import { 
  EmbeddingProviderConfig, 
  WorkspaceEmbeddingSettings,
  EmbeddingProviderInfo 
} from '@/types/common-types';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Crown, 
  CheckCircle, 
  AlertCircle,
  Brain,
  Key,
  Globe,
  Zap,
  Shield,
  Info,
  Save,
  X
} from 'lucide-react';

interface EmbeddingModelsTabProps {
  workspaceId: string;
  userRole: 'user' | 'admin' | 'owner' | 'super_admin';
  canManageSettings: boolean;
}

export const EmbeddingModelsTab: React.FC<EmbeddingModelsTabProps> = ({
  workspaceId,
  userRole,
  canManageSettings
}) => {
  const t = useTranslations();
  
  // Use the embedding providers hook
  const {
    configuredProviders: workspaceProviders,
    availableProviders,
    activeProvider,
    isLoading,
    isAdding,
    error,
    loadProviders,
    addProvider,
    updateProvider,
    deleteProvider,
    setDefaultProvider,
    toggleProviderActive,
    testProvider,
    getLastUsedSettings,
    saveLastUsedSettings
  } = useEmbeddingProviders(workspaceId);

  // Debug logging
  console.log('EmbeddingModelsTab Debug:', {
    workspaceId,
    workspaceProviders,
    activeProvider,
    isLoading,
    error,
    providersLength: workspaceProviders?.length || 0
  });
  
  // State for UI
  const [isSaving, setIsSaving] = useState(false);
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<EmbeddingProviderConfig | null>(null);
  
  // Form state for new provider
  const [newProviderForm, setNewProviderForm] = useState({
    name: '',
    provider: 'openai' as keyof typeof EMBEDDING_PROVIDERS,
    apiKey: '',
    model: '',
    baseUrl: '',
    organizationId: '',
    dimensions: 1536,
    maxTokens: 8192,
    description: ''
  });

  // Check if user can manage embedding settings
  const canManageEmbedding = canManageSettings;

  const handleAddProvider = () => {
    setEditingProvider(null);
    // Use default configuration from hardcoded provider info
    const defaultProvider = EMBEDDING_PROVIDERS.openai;
    
    // Try to load last used settings for this provider type
    const lastUsedSettings = getLastUsedSettings('openai');
    
    setNewProviderForm({
      name: `${defaultProvider.displayName} Provider`,
      provider: 'openai',
      apiKey: lastUsedSettings?.config?.apiKey || '',
      model: lastUsedSettings?.config?.model || defaultProvider.defaultConfig.model,
      baseUrl: lastUsedSettings?.config?.baseUrl || defaultProvider.defaultConfig.baseUrl || '',
      organizationId: lastUsedSettings?.config?.organizationId || defaultProvider.defaultConfig.organizationId || '',
      dimensions: lastUsedSettings?.config?.dimensions || defaultProvider.defaultConfig.dimensions,
      maxTokens: lastUsedSettings?.config?.maxTokens || defaultProvider.defaultConfig.maxTokens,
      description: lastUsedSettings?.metadata?.description || defaultProvider.description
    });
    setShowAddProviderModal(true);
  };

  const handleEditProvider = (provider: EmbeddingProviderConfig) => {
    setEditingProvider(provider);
    setNewProviderForm({
      name: provider.name,
      provider: provider.provider,
      apiKey: provider.config.apiKey || '',
      model: provider.config.model || '',
      baseUrl: provider.config.baseUrl || '',
      organizationId: provider.config.organizationId || '',
      dimensions: provider.config.dimensions || 1536,
      maxTokens: provider.config.maxTokens || 8192,
      description: provider.metadata?.description || ''
    });
    setShowAddProviderModal(true);
  };

  const handleSaveProvider = async () => {
    try {
      setIsSaving(true);
      
      const providerData = {
        name: newProviderForm.name,
        provider: newProviderForm.provider,
        config: {
          apiKey: newProviderForm.apiKey,
          model: newProviderForm.model,
          baseUrl: newProviderForm.baseUrl,
          organizationId: newProviderForm.organizationId,
          dimensions: newProviderForm.dimensions,
          maxTokens: newProviderForm.maxTokens
        },
        metadata: {
          description: newProviderForm.description
        }
      };

      let success = false;
      if (editingProvider) {
        // Update existing provider
        success = await updateProvider(editingProvider.id, providerData);
      } else {
        // Add new provider
        success = await addProvider(providerData);
      }

      if (success) {
        // Small delay to ensure the UI updates properly
        setTimeout(() => {
          setShowAddProviderModal(false);
          setEditingProvider(null);
          // Save last used settings for this provider
          saveLastUsedSettings(newProviderForm.provider, providerData);
        }, 100);
      }
      
    } catch (err) {
      console.error('Error saving provider:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (providerId: string) => {
    await setDefaultProvider(providerId);
  };

  const handleToggleActive = async (providerId: string) => {
    await toggleProviderActive(providerId);
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider? This action cannot be undone.')) {
      return;
    }
    await deleteProvider(providerId);
  };

  const handleCloseModal = () => {
    setShowAddProviderModal(false);
    setEditingProvider(null);
    setNewProviderForm({
      name: '',
      provider: 'openai',
      apiKey: '',
      model: '',
      baseUrl: '',
      organizationId: '',
      dimensions: 1536,
      maxTokens: 8192,
      description: ''
    });
  };



  const handleTestProvider = async (providerId: string) => {
    try {
      setIsSaving(true);
      const result = await testProvider(providerId);
      if (result.success) {
        // Show success message or notification
        console.log('Provider test successful');
      } else {
        console.error('Provider test failed:', result.message);
      }
    } catch (err) {
      console.error('Failed to test provider:', err);
      console.error('Error testing provider:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWorkspaceSettingsChange = (key: string, value: any) => {
    if (!editingProvider) return;
    
    setNewProviderForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleProviderTypeChange = (providerType: string) => {
    const selectedProvider = EMBEDDING_PROVIDERS[providerType];
    if (selectedProvider) {
      // Try to load last used settings for this provider type
      const lastUsedSettings = getLastUsedSettings(providerType);
      
      setNewProviderForm(prev => ({
        ...prev,
        provider: providerType as any,
        name: `${selectedProvider.displayName} Provider`,
        apiKey: lastUsedSettings?.config?.apiKey || '',
        model: lastUsedSettings?.config?.model || selectedProvider.defaultConfig.model,
        baseUrl: lastUsedSettings?.config?.baseUrl || selectedProvider.defaultConfig.baseUrl || '',
        organizationId: lastUsedSettings?.config?.organizationId || selectedProvider.defaultConfig.organizationId || '',
        dimensions: lastUsedSettings?.config?.dimensions || selectedProvider.defaultConfig.dimensions,
        maxTokens: lastUsedSettings?.config?.maxTokens || selectedProvider.defaultConfig.maxTokens,
        description: lastUsedSettings?.metadata?.description || selectedProvider.description
      }));
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading embedding providers..." />
      </div>
    );
  }

 



  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-400 dark:text-neutral-500 mb-4">
          <AlertCircle className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          Error Loading Providers
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          {error}
        </p>
        <Button 
          onClick={() => loadProviders()} 
          variant="primary"
          size="sm"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Provider Status */}
      {activeProvider && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">
              {EMBEDDING_PROVIDERS[activeProvider.provider]?.logo ? (
                <img 
                  src={EMBEDDING_PROVIDERS[activeProvider.provider]?.logo} 
                  alt={EMBEDDING_PROVIDERS[activeProvider.provider]?.displayName || activeProvider.provider} 
                  className="h-10 w-10 object-contain" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <ProviderIcon 
                provider={activeProvider.provider} 
                size="lg" 
                className={EMBEDDING_PROVIDERS[activeProvider.provider]?.logo ? 'hidden' : ''}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100">
                  Active Embedding Provider
                </h3>
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <p className="text-primary-700 dark:text-primary-300 font-medium">
                {activeProvider.name} • {activeProvider.config?.model || 'No model specified'}
              </p>
              <p className="text-sm text-primary-600 dark:text-primary-400">
                {EMBEDDING_PROVIDERS[activeProvider.provider]?.displayName} • {activeProvider.provider}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Embedding Settings */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('settings.embedding.title')}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('settings.embedding.description')}
            </p>
          </div>
          {canManageEmbedding && (
            <Button onClick={handleAddProvider}>
              <Plus className="h-4 w-4 mr-2" />
              {t('settings.embedding.addProvider')}
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-error-500 dark:text-error-400" />
            <span className="text-error-700 dark:text-error-300">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" text={t('settings.embedding.loading')} />
          </div>
        )}

        {/* No Providers State */}
        {!isLoading && workspaceProviders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-neutral-400 dark:text-neutral-500 mb-4">
              <Brain className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              No Embedding Providers
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Get started by adding your first embedding provider to enable AI-powered features.
            </p>
            <Button onClick={handleAddProvider} variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>
        )}

        {/* Providers List */}
        {!isLoading && workspaceProviders.length > 0 && (
          <div className="space-y-4">
            {workspaceProviders.map((provider) => (
              <div 
                key={provider.id}
                className={`
                  p-4 rounded-lg border transition-colors
                  ${provider.isActive 
                    ? 'border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {EMBEDDING_PROVIDERS[provider.provider]?.logo ? (
                        <img 
                          src={EMBEDDING_PROVIDERS[provider.provider]?.logo} 
                          alt={EMBEDDING_PROVIDERS[provider.provider]?.displayName || provider.provider} 
                          className="h-8 w-8 object-contain" 
                          onError={(e) => {
                            // Fallback to ProviderIcon if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <ProviderIcon 
                        provider={provider.provider} 
                        size="md" 
                        className={EMBEDDING_PROVIDERS[provider.provider]?.logo ? 'hidden' : ''}
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                          {provider.name || 'Unnamed Provider'}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {provider.isActive && (
                            <Badge variant="success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t('settings.embedding.active')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {provider.config?.model || t('settings.embedding.noModel')} • {provider.provider}
                      </p>
                      {provider.metadata?.description && (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                          {provider.metadata.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {canManageEmbedding && (
                    <div className="flex items-center space-x-2">
                      {!provider.isActive && (
                        <Button
                          size="sm"
                          onClick={() => handleToggleActive(provider.id)}
                          loading={isSaving && provider.id === editingProvider?.id}
                        >
                          {t('settings.embedding.activate')}
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestProvider(provider.id)}
                        loading={isSaving && provider.id === editingProvider?.id}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        {t('settings.embedding.test')}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProvider(provider)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Provider Metadata */}
                {provider.metadata && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      {provider.metadata.usageCount && (
                        <div>
                          <div className="text-neutral-500 dark:text-neutral-400">Usage</div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {provider.metadata.usageCount.toLocaleString()}
                          </div>
                        </div>
                      )}
                      {provider.metadata.costPerToken && (
                        <div>
                          <div className="text-neutral-500 dark:text-neutral-400">Cost per Token</div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            ${provider.metadata.costPerToken.toFixed(6)}
                          </div>
                        </div>
                      )}
                      {provider.metadata.version && (
                        <div>
                          <div className="text-neutral-500 dark:text-neutral-400">Version</div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {provider.metadata.version}
                          </div>
                        </div>
                      )}
                      {provider.metadata.lastUsed && (
                        <div>
                          <div className="text-neutral-500 dark:text-neutral-400">Last Used</div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {new Date(provider.metadata.lastUsed).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workspace Settings */}
      {!isLoading && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('settings.embedding.workspaceSettings')}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('settings.embedding.batchSize')}
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={editingProvider?.config.batchSize || 100}
                onChange={(e) => handleWorkspaceSettingsChange('batchSize', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!canManageEmbedding}
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {t('settings.embedding.batchSizeHelp')}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('settings.embedding.retryAttempts')}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={editingProvider?.config.retryAttempts || 3}
                onChange={(e) => handleWorkspaceSettingsChange('retryAttempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!canManageEmbedding}
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {t('settings.embedding.retryAttemptsHelp')}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t('settings.embedding.timeout')}
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={editingProvider?.config.timeout || 30}
                onChange={(e) => handleWorkspaceSettingsChange('timeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!canManageEmbedding}
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {t('settings.embedding.timeoutHelp')}
              </p>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {t('settings.embedding.enableCaching')}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('settings.embedding.enableCachingHelp')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={editingProvider?.config.autoRotate || false}
                  onChange={(e) => handleWorkspaceSettingsChange('autoRotate', e.target.checked)}
                  className="sr-only peer"
                  disabled={!canManageEmbedding}
                />
                <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-neutral-300 after:border-neutral-300 dark:after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
          
          {canManageEmbedding && (
            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
              <Button
                onClick={handleSaveProvider}
                loading={isSaving || isAdding}
              >
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Provider Modal */}
      {showAddProviderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {editingProvider ? t('settings.embedding.editProvider') : t('settings.embedding.addProvider')}
              </h3>
              <button
                onClick={() => {
                  setShowAddProviderModal(false);
                  setEditingProvider(null);
                  setNewProviderForm({
                    name: '',
                    provider: 'openai',
                    apiKey: '',
                    model: '',
                    baseUrl: '',
                    organizationId: '',
                    dimensions: 1536,
                    maxTokens: 8192,
                    description: ''
                  });
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Provider Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t('settings.embedding.providerName')}
                </label>
                <input
                  type="text"
                  value={newProviderForm.name}
                  onChange={(e) => setNewProviderForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={t('settings.embedding.providerNamePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t('settings.embedding.providerType')}
                </label>
                <select
                  value={newProviderForm.provider}
                  onChange={(e) => handleProviderTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {Object.values(EMBEDDING_PROVIDERS).map((info) => (
                    <option key={info.name} value={info.name}>{info.displayName}</option>
                  ))}
                </select>
                
                {/* Provider Information */}
                {EMBEDDING_PROVIDERS[newProviderForm.provider] && (
                  <div className="mt-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="text-lg">
                        {EMBEDDING_PROVIDERS[newProviderForm.provider].logo ? (
                          <img src={EMBEDDING_PROVIDERS[newProviderForm.provider].logo} alt={EMBEDDING_PROVIDERS[newProviderForm.provider].displayName} className="h-6 w-6 object-contain" />
                        ) : (
                          <ProviderIcon provider={newProviderForm.provider} size="sm" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {EMBEDDING_PROVIDERS[newProviderForm.provider].displayName}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                      {EMBEDDING_PROVIDERS[newProviderForm.provider].description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {EMBEDDING_PROVIDERS[newProviderForm.provider].features.map((feature) => (
                        <span key={feature} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t('settings.embedding.apiKey')}
                </label>
                <input
                  type="password"
                  value={newProviderForm.apiKey}
                  onChange={(e) => setNewProviderForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="sk-..."
                />
              </div>
              
              {/* Base URL for custom endpoints */}
              {(newProviderForm.provider === 'openai' || newProviderForm.provider === 'huggingface') && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Base URL ({t('common.optional')})
                  </label>
                  <input
                    type="text"
                    value={newProviderForm.baseUrl}
                    onChange={(e) => setNewProviderForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://api.openai.com/v1"
                  />
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Leave empty to use default endpoint
                  </p>
                </div>
              )}
              
              {/* Organization ID for OpenAI */}
              {newProviderForm.provider === 'openai' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Organization ID ({t('common.optional')})
                  </label>
                  <input
                    type="text"
                    value={newProviderForm.organizationId}
                    onChange={(e) => setNewProviderForm(prev => ({ ...prev, organizationId: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="org-..."
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t('settings.embedding.model')}
                </label>
                <select
                  value={newProviderForm.model}
                  onChange={(e) => setNewProviderForm(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {EMBEDDING_PROVIDERS[newProviderForm.provider]?.supportedModels.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t('settings.embedding.description')} ({t('common.optional')})
                </label>
                <textarea
                  value={newProviderForm.description}
                  onChange={(e) => setNewProviderForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                  placeholder={t('settings.embedding.descriptionPlaceholder')}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleCloseModal}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSaveProvider}
                loading={isSaving || isAdding}
              >
                {editingProvider ? t('common.update') : t('common.add')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
