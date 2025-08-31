'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { useTheme } from '@/providers/theme-provider';
import { settingsService } from '@/services/settings-service';
import { mcpService } from '@/services/mcp-service';
import { LoadingSpinner } from '@/components/common/loading';
import { ModelCard } from '@/components/features/settings';
import { WorkspaceSettings } from '@/components/features/workspace-management/workspace-settings';
import { MCPServerList, MCPServerForm } from '@/components/features/mcp-integration';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge/badge';
import { ProviderIcon } from '@/components/common/icon';
import { 
  LLMProvider, 
  LLMModel, 
  EmbeddingModel, 
  ModelConfiguration 
} from '@/types/common-types';
import { 
  MCPServer, 
  MCPServerConfiguration 
} from '@/types/mcp-types';
import { 
  Plus, 
  Key, 
  Brain, 
  Bot, 
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  Building2,
  Users,
  User,
  Server,
  Globe,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { currentWorkspace, hasPermission } = useWorkspaceStore();
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations();
  
  // State for data loading
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for models and configuration
  const [llmProviders, setLlmProviders] = useState<LLMProvider[]>([]);
  const [llmModels, setLlmModels] = useState<LLMModel[]>([]);
  const [embeddingModels, setEmbeddingModels] = useState<EmbeddingModel[]>([]);
  const [modelConfiguration, setModelConfiguration] = useState<ModelConfiguration | null>(null);
  
  // State for forms
  const [openAIApiKey, setOpenAIApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [defaultLLMModelId, setDefaultLLMModelId] = useState('');
  const [defaultEmbeddingModelId, setDefaultEmbeddingModelId] = useState('');
  
  // State for UI
  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'embedding' | 'llm' | 'mcp'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  // State for Add Model Modal
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [newModelConfig, setNewModelConfig] = useState({
    name: '',
    modelId: '',
    apiKey: '',
    baseUrl: '',
    maxTokens: 4096,
    temperature: 0.7
  });

  // State for MCP
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [mcpConfigurations, setMcpConfigurations] = useState<MCPServerConfiguration[]>([]);
  const [showMcpServerForm, setShowMcpServerForm] = useState(false);
  const [editingMcpServer, setEditingMcpServer] = useState<MCPServerConfiguration | null>(null);

  // Language and theme options
  const languages = [
    { code: 'en', name: t('language.english'), flag: '🇺🇸' },
    { code: 'vi', name: t('language.vietnamese'), flag: '🇻🇳' },
  ];

  const themeOptions = [
    { value: 'light', icon: Sun, label: t('theme.light') },
    { value: 'dark', icon: Moon, label: t('theme.dark') },
    { value: 'system', icon: Monitor, label: t('theme.system') },
  ] as const;

  // Handle language change
  const handleLanguageChange = (newLocale: string) => {
    // Get current pathname and remove locale prefix
    let pathWithoutLocale = window.location.pathname;
    if (pathWithoutLocale.startsWith(`/${locale}`)) {
      pathWithoutLocale = pathWithoutLocale.replace(`/${locale}`, '') || '/';
    }
    
    // Construct new path with new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Load all data in parallel
        const [
          providersResponse,
          llmModelsResponse,
          embeddingModelsResponse,
          configResponse,
          mcpServersResponse,
          mcpConfigurationsResponse
        ] = await Promise.all([
          settingsService.getLLMProviders(),
          settingsService.getLLMModels(),
          settingsService.getEmbeddingModels(),
          settingsService.getModelConfiguration(user.id),
          mcpService.getServers(user.id, currentWorkspace?.id || ''),
          mcpService.getServerConfigurations(user.id, currentWorkspace?.id || '')
        ]);
        
        if (providersResponse.success && providersResponse.data) {
          setLlmProviders(providersResponse.data);
        }
        
        if (llmModelsResponse.success && llmModelsResponse.data) {
          setLlmModels(llmModelsResponse.data);
        }
        
        if (embeddingModelsResponse.success && embeddingModelsResponse.data) {
          setEmbeddingModels(embeddingModelsResponse.data);
        }
        
        if (configResponse.success && configResponse.data) {
          setModelConfiguration(configResponse.data);
          setOpenAIApiKey(configResponse.data.openAIApiKey || '');
          setDefaultLLMModelId(configResponse.data.defaultLLMModelId || '');
          setDefaultEmbeddingModelId(configResponse.data.defaultEmbeddingModelId || '');
        }

        if (mcpServersResponse.success && mcpServersResponse.data) {
          setMcpServers(mcpServersResponse.data);
        }

        if (mcpConfigurationsResponse.success && mcpConfigurationsResponse.data) {
          setMcpConfigurations(mcpConfigurationsResponse.data);
        }
        
      } catch (err) {
        setError('Failed to load settings data');
        console.error('Error loading settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const handleSaveEmbeddingSettings = async () => {
    if (!modelConfiguration) return;
    
    try {
      setIsSaving(true);
      
      // Update OpenAI API key
      if (openAIApiKey !== modelConfiguration.openAIApiKey) {
        const apiKeyResponse = await settingsService.updateOpenAIApiKey(openAIApiKey);
        if (!apiKeyResponse.success) {
          setError(apiKeyResponse.message || 'Failed to update API key');
          return;
        }
      }
      
      // Update default embedding model
      if (defaultEmbeddingModelId !== modelConfiguration.defaultEmbeddingModelId) {
        const defaultResponse = await settingsService.setDefaultEmbeddingModel(defaultEmbeddingModelId);
        if (!defaultResponse.success) {
          setError(defaultResponse.message || 'Failed to set default embedding model');
          return;
        }
      }
      
      // Update configuration
      const configResponse = await settingsService.updateModelConfiguration({
        ...modelConfiguration,
        openAIApiKey,
        defaultEmbeddingModelId,
      });
      
      if (configResponse.success && configResponse.data) {
        setModelConfiguration(configResponse.data);
        setError(null);
      } else {
        setError(configResponse.message || 'Failed to update configuration');
      }
      
    } catch (err) {
      setError('Failed to save embedding settings');
      console.error('Error saving embedding settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLLMSettings = async () => {
    if (!modelConfiguration) return;
    
    try {
      setIsSaving(true);
      
      // Update default LLM model
      if (defaultLLMModelId !== modelConfiguration.defaultLLMModelId) {
        const defaultResponse = await settingsService.setDefaultLLMModel(defaultLLMModelId);
        if (!defaultResponse.success) {
          setError(defaultResponse.message || 'Failed to set default LLM model');
          return;
        }
      }
      
      // Update configuration
      const configResponse = await settingsService.updateModelConfiguration({
        ...modelConfiguration,
        defaultLLMModelId,
      });
      
      if (configResponse.success && configResponse.data) {
        setModelConfiguration(configResponse.data);
        setError(null);
      } else {
        setError(configResponse.message || 'Failed to update configuration');
      }
      
    } catch (err) {
      setError('Failed to save LLM settings');
      console.error('Error saving LLM settings:', err);
    } finally {
      setIsSaving(false);
    }
  };



  const handleSetDefaultLLMModel = async (modelId: string) => {
    try {
      const response = await settingsService.setDefaultLLMModel(modelId);
      if (response.success) {
        setLlmModels(prev => prev.map(model => ({
          ...model,
          isDefault: model.id === modelId
        })));
        setDefaultLLMModelId(modelId);
      } else {
        setError(response.message || 'Failed to set default LLM model');
      }
    } catch (err) {
      setError('Failed to set default LLM model');
    }
  };

  const handleSetDefaultEmbeddingModel = async (modelId: string) => {
    try {
      const response = await settingsService.setDefaultEmbeddingModel(modelId);
      if (response.success) {
        setEmbeddingModels(prev => prev.map(model => ({
          ...model,
          isDefault: model.id === modelId
        })));
        setDefaultEmbeddingModelId(modelId);
      } else {
        setError(response.message || 'Failed to set default embedding model');
      }
    } catch (err) {
      setError('Failed to set default embedding model');
    }
  };

  const handleAddModel = () => {
    setShowAddModelModal(true);
    setSelectedProvider('');
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    setShowModelConfig(true);
  };

  const handleSaveModel = async () => {
    try {
      setIsSaving(true);
      
      // Here you would call the service to add the new model
      console.log('Saving new model:', { providerId: selectedProvider, ...newModelConfig });
      
      // Reset form and close modal
      setNewModelConfig({
        name: '',
        modelId: '',
        apiKey: '',
        baseUrl: '',
        maxTokens: 4096,
        temperature: 0.7
      });
      setShowModelConfig(false);
      setShowAddModelModal(false);
      setSelectedProvider('');
      
    } catch (err) {
      setError('Failed to add new model');
      console.error('Error adding model:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToProviderSelect = () => {
    setShowModelConfig(false);
    setSelectedProvider('');
    setNewModelConfig({
      name: '',
      modelId: '',
      apiKey: '',
      baseUrl: '',
      maxTokens: 4096,
      temperature: 0.7
    });
  };

  const handleCloseAddModelModal = () => {
    setShowAddModelModal(false);
    setShowModelConfig(false);
    setSelectedProvider('');
    setNewModelConfig({
      name: '',
      modelId: '',
      apiKey: '',
      baseUrl: '',
      maxTokens: 4096,
      temperature: 0.7
    });
  };

  // MCP Server Management Functions
  const handleCreateMcpServer = async (config: Partial<MCPServerConfiguration>) => {
    if (!user || !currentWorkspace) return;
    
    try {
      setIsSaving(true);
      const response = await mcpService.createServerConfiguration(user.id, currentWorkspace.id, config);
      
      if (response.success && response.data) {
        setMcpConfigurations(prev => [...prev, response.data!]);
        setShowMcpServerForm(false);
        setEditingMcpServer(null);
        setError(null);
      } else {
        setError(response.message || 'Failed to create MCP server configuration');
      }
    } catch (err) {
      setError('Failed to create MCP server configuration');
      console.error('Error creating MCP server:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMcpServer = async (config: Partial<MCPServerConfiguration>) => {
    if (!user || !currentWorkspace || !editingMcpServer) return;
    
    try {
      setIsSaving(true);
      const response = await mcpService.updateServerConfiguration(user.id, currentWorkspace.id, editingMcpServer.id, config);
      
      if (response.success && response.data) {
        setMcpConfigurations(prev => prev.map(c => c.id === editingMcpServer.id ? response.data! : c));
        setShowMcpServerForm(false);
        setEditingMcpServer(null);
        setError(null);
      } else {
        setError(response.message || 'Failed to update MCP server configuration');
      }
    } catch (err) {
      setError('Failed to update MCP server configuration');
      console.error('Error updating MCP server:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMcpServer = async (serverId: string) => {
    if (!user || !currentWorkspace) return;
    
    if (!confirm('Are you sure you want to delete this MCP server configuration?')) return;
    
    try {
      setIsSaving(true);
      const response = await mcpService.deleteServerConfiguration(user.id, currentWorkspace.id, serverId);
      
      if (response.success) {
        setMcpConfigurations(prev => prev.filter(c => c.id !== serverId));
        setError(null);
      } else {
        setError(response.message || 'Failed to delete MCP server configuration');
      }
    } catch (err) {
      setError('Failed to delete MCP server configuration');
      console.error('Error deleting MCP server:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartMcpServer = async (serverId: string) => {
    if (!user || !currentWorkspace) return;
    
    try {
      const response = await mcpService.startServer(user.id, currentWorkspace.id, serverId);
      if (response.success) {
        // Refresh servers list
        const serversResponse = await mcpService.getServers(user.id, currentWorkspace.id);
        if (serversResponse.success && serversResponse.data) {
          setMcpServers(serversResponse.data);
        }
      } else {
        setError(response.message || 'Failed to start MCP server');
      }
    } catch (err) {
      setError('Failed to start MCP server');
      console.error('Error starting MCP server:', err);
    }
  };

  const handleStopMcpServer = async (serverId: string) => {
    if (!user || !currentWorkspace) return;
    
    try {
      const response = await mcpService.stopServer(user.id, currentWorkspace.id, serverId);
      if (response.success) {
        // Refresh servers list
        const serversResponse = await mcpService.getServers(user.id, currentWorkspace.id);
        if (serversResponse.success && serversResponse.data) {
          setMcpServers(serversResponse.data);
        }
      } else {
        setError(response.message || 'Failed to stop MCP server');
      }
    } catch (err) {
      setError('Failed to stop MCP server');
      console.error('Error stopping MCP server:', err);
    }
  };

  const handleRestartMcpServer = async (serverId: string) => {
    if (!user || !currentWorkspace) return;
    
    try {
      const response = await mcpService.restartServer(user.id, currentWorkspace.id, serverId);
      if (response.success) {
        // Refresh servers list
        const serversResponse = await mcpService.getServers(user.id, currentWorkspace.id);
        if (serversResponse.success && serversResponse.data) {
          setMcpServers(serversResponse.data);
        }
      } else {
        setError(response.message || 'Failed to restart MCP server');
      }
    } catch (err) {
      setError('Failed to restart MCP server');
      console.error('Error restarting MCP server:', err);
    }
  };

  const handleEditMcpServer = (serverId: string) => {
    const config = mcpConfigurations.find(c => c.id === serverId);
    if (config) {
      setEditingMcpServer(config);
      setShowMcpServerForm(true);
    }
  };

  const handleViewMcpTools = (serverId: string) => {
    // TODO: Implement tool viewing
    console.log('View tools for server:', serverId);
  };

  const handleViewMcpMetrics = (serverId: string) => {
    // TODO: Implement metrics viewing
    console.log('View metrics for server:', serverId);
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  const isAdmin = user.role === 'admin' || user.role === 'owner';
  const canManageWorkspace = hasPermission('canManageSettings');
  
  // Debug: Log user role to console
  console.log('Current user role:', user.role);
  console.log('Is admin:', isAdmin);
  console.log('Can manage workspace:', canManageWorkspace);

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Settings</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Manage your AI models and configurations</p>
        {/* Debug: Show current user role */}
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">
          Current user: {user.name} ({user.role}) - Admin: {isAdmin ? 'Yes' : 'No'}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-error-500 dark:text-error-400" />
          <span className="text-error-700 dark:text-error-300">{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'workspace'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <Building2 className="h-4 w-4 inline mr-2" />
            Workspace
          </button>
          <button
            onClick={() => setActiveTab('embedding')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'embedding'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <Brain className="h-4 w-4 inline mr-2" />
            Embedding Models
          </button>
          <button
            onClick={() => setActiveTab('llm')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'llm'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <Bot className="h-4 w-4 inline mr-2" />
            LLM Models
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mcp'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <Server className="h-4 w-4 inline mr-2" />
            MCP Servers
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Profile Information</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="h-16 w-16 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{user.name}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{user.email}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 capitalize">{user.role}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user.name}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                  />
                </div>
                
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <SettingsIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('settings.preferences')}</h2>
              </div>
              
              <div className="space-y-6">
                {/* Language Settings */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Globe className="h-4 w-4 text-neutral-500" />
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {t('settings.language')}
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                          locale === language.code
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                            : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <span className="text-xl">{language.flag}</span>
                        <span className="font-medium">{language.name}</span>
                        {locale === language.code && (
                          <span className="ml-auto text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 px-2 py-1 rounded">
                            {t('common.current')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    {t('language.switchLanguage')} - {t('settings.sessionBased')}
                  </p>
                </div>

                {/* Theme Settings */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Sun className="h-4 w-4 text-neutral-500" />
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {t('settings.theme')}
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {themeOptions.map((themeOption) => {
                      const Icon = themeOption.icon;
                      return (
                        <button
                          key={themeOption.value}
                          onClick={() => setTheme(themeOption.value)}
                          className={`flex flex-col items-center space-y-2 p-4 rounded-lg border transition-colors ${
                            theme === themeOption.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                              : 'border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-sm font-medium">{themeOption.label}</span>
                          {theme === themeOption.value && (
                            <span className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 px-2 py-1 rounded">
                              {t('common.current')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    {t('theme.switchTheme')} - {t('settings.sessionBased')}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Account Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                  />
                </div>
                
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Email Notifications</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive email notifications for important updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-neutral-300 after:border-neutral-300 dark:after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Workspace Updates</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Get notified when workspace settings change</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-neutral-300 after:border-neutral-300 dark:after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Security Alerts</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Receive alerts for security-related activities</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-neutral-300 after:border-neutral-300 dark:after:border-neutral-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Tab */}
        {activeTab === 'workspace' && currentWorkspace && (
          <WorkspaceSettings workspace={currentWorkspace} />
        )}

        {/* Embedding Models Tab */}
        {activeTab === 'embedding' && (
           <div className="space-y-6">
             {/* OpenAI API Key Section */}
             <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
               <div className="flex items-center space-x-2 mb-4">
                 <Key className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                 <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">OpenAI API Configuration</h2>
                 <ProviderIcon 
                   provider="openai" 
                   size="sm" 
                   className="text-neutral-600 dark:text-neutral-400"
                 />
               </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={openAIApiKey}
                      onChange={(e) => setOpenAIApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    This API key will be used for all embedding operations
                  </p>
                </div>
                
                <Button
                  onClick={handleSaveEmbeddingSettings}
                  loading={isSaving}
                  disabled={!openAIApiKey.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Embedding Settings
                </Button>
              </div>
            </div>

                         {/* Embedding Model Section */}
             <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
               <div className="flex items-center space-x-2 mb-4">
                 <Brain className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                 <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Embedding Model</h2>
               </div>
               <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                 Configure the text embedding model for knowledge base operations
               </p>
               
               {embeddingModels.length > 0 ? (
                 <div className="space-y-4">
                   {embeddingModels.map((model) => (
                     <ModelCard
                       key={model.id}
                       model={model}
                       isDefault={model.isDefault}
                       onSetDefault={isAdmin ? () => handleSetDefaultEmbeddingModel(model.id) : undefined}
                       onEdit={isAdmin ? () => {} : undefined}
                       onDelete={isAdmin ? () => {} : undefined}
                       showActions={isAdmin}
                     />
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                   <Brain className="h-12 w-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                   <p>No embedding models configured</p>
                   {isAdmin && (
                     <Button variant="outline" className="mt-4">
                       <Plus className="h-4 w-4 mr-2" />
                       Add Embedding Model
                     </Button>
                   )}
                 </div>
               )}
             </div>

             {/* Warning Section */}
             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
               <div className="flex items-center space-x-2">
                 <AlertCircle className="h-5 w-5 text-yellow-500" />
                 <span className="text-yellow-700 font-medium">Important Warning</span>
               </div>
               <p className="text-yellow-700 mt-2 text-sm">
                 Switching embedding models will impact all knowledge base operations. Existing embeddings may become incompatible, 
                 requiring re-indexing of your knowledge base data.
               </p>
             </div>
          </div>
        )}

                 {/* LLM Models Tab */}
         {activeTab === 'llm' && (
           <div className="space-y-6">
             {/* LLM Models Section */}
             <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">LLM Models</h2>
                   <p className="text-sm text-neutral-600 dark:text-neutral-400">
                     Manage language models that will be used by all agents
                   </p>
                 </div>
                                   {isAdmin && (
                    <Button variant="outline" onClick={handleAddModel}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Model
                    </Button>
                  )}
               </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {llmModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isDefault={model.isDefault}
                    onSetDefault={isAdmin ? () => handleSetDefaultLLMModel(model.id) : undefined}
                    onEdit={isAdmin ? () => {} : undefined}
                    onDelete={isAdmin ? () => {} : undefined}
                    showActions={isAdmin}
                  />
                ))}
              </div>
              
              {isAdmin && (
                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <Button
                    onClick={handleSaveLLMSettings}
                    loading={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save LLM Settings
                  </Button>
                </div>
              )}
            </div>
           </div>
         )}

        {/* MCP Servers Tab */}
        {activeTab === 'mcp' && (
          <div className="space-y-6">
            {/* MCP Server Management */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">MCP Server Management</h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Manage Model Context Protocol (MCP) servers for enhanced AI capabilities
                  </p>
                </div>
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingMcpServer(null);
                      setShowMcpServerForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add MCP Server
                  </Button>
                )}
              </div>

              {/* MCP Server Form Modal */}
              {showMcpServerForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
                    <MCPServerForm
                      config={editingMcpServer || undefined}
                      onSave={editingMcpServer ? handleUpdateMcpServer : handleCreateMcpServer}
                      onCancel={() => {
                        setShowMcpServerForm(false);
                        setEditingMcpServer(null);
                      }}
                      isEditing={!!editingMcpServer}
                    />
                  </div>
                </div>
              )}

              {/* MCP Servers List */}
              {mcpServers.length > 0 ? (
                <MCPServerList
                  servers={mcpServers}
                  onStart={isAdmin ? handleStartMcpServer : undefined}
                  onStop={isAdmin ? handleStopMcpServer : undefined}
                  onRestart={isAdmin ? handleRestartMcpServer : undefined}
                  onEdit={isAdmin ? handleEditMcpServer : undefined}
                  onDelete={isAdmin ? handleDeleteMcpServer : undefined}
                  onViewTools={handleViewMcpTools}
                  onViewMetrics={handleViewMcpMetrics}
                  showActions={isAdmin}
                />
              ) : (
                <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                  <Server className="h-16 w-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">No MCP Servers</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                    Get started by adding your first MCP server to enhance your AI capabilities.
                  </p>
                  {isAdmin && (
                    <Button
                      onClick={() => {
                        setEditingMcpServer(null);
                        setShowMcpServerForm(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First MCP Server
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* MCP Server Configurations */}
            {mcpConfigurations.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Server Configurations</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                  Manage server configurations and templates for quick deployment.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mcpConfigurations.map((config) => (
                    <div key={config.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">{config.name}</h4>
                        <Badge variant={config.enabled ? 'success' : 'secondary'}>
                          {config.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      {config.description && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{config.description}</p>
                      )}
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 space-y-1">
                        <p>Type: {config.serverType}</p>
                        <p>Image: {config.image}</p>
                        <p>Created: {new Date(config.createdAt).toLocaleDateString()}</p>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMcpServer(config.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteMcpServer(config.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MCP Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Server className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900">About MCP Servers</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Model Context Protocol (MCP) servers provide additional tools and capabilities to your AI agents. 
                    They can include file system access, database connections, API integrations, and more.
                  </p>
                  <div className="mt-3 text-xs text-blue-600">
                    <p><strong>Security:</strong> All MCP servers run in isolated containers with network restrictions.</p>
                    <p><strong>Monitoring:</strong> Real-time health checks and performance metrics are available.</p>
                    <p><strong>Scalability:</strong> Servers can be automatically scaled based on demand.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

               {/* Add Model Modal */}
        {showAddModelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              {!showModelConfig ? (
                // Provider Selection View
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Select AI Provider</h3>
                    <button
                      onClick={handleCloseAddModelModal}
                      className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {llmProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => handleProviderSelect(provider.id)}
                        className="w-full flex items-center space-x-3 p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <ProviderIcon 
                          provider={provider.name} 
                          size="sm" 
                          className="text-neutral-600 dark:text-neutral-400"
                        />
                        <div className="text-left">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{provider.name}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{provider.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleCloseAddModelModal}
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                // Model Configuration View
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleBackToProviderSelect}
                        className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:text-neutral-400"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Configure Model</h3>
                    </div>
                    <button
                      onClick={handleCloseAddModelModal}
                      className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:text-neutral-400"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Provider Info */}
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <ProviderIcon 
                        provider={llmProviders.find(p => p.id === selectedProvider)?.name || ''} 
                        size="sm" 
                        className="text-neutral-600 dark:text-neutral-400"
                      />
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {llmProviders.find(p => p.id === selectedProvider)?.name}
                      </span>
                    </div>
                  </div>

                  {/* Model Configuration Form */}
                  <div className="space-y-4">
                    {/* Model Name */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={newModelConfig.name}
                        onChange={(e) => setNewModelConfig(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., GPT-4 Assistant"
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    {/* Model ID */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Model ID
                      </label>
                      <input
                        type="text"
                        value={newModelConfig.modelId}
                        onChange={(e) => setNewModelConfig(prev => ({ ...prev, modelId: e.target.value }))}
                        placeholder={selectedProvider === 'openai' ? 'gpt-4' : selectedProvider === 'anthropic' ? 'claude-3-sonnet' : 'model-id'}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {selectedProvider === 'openai' && 'Examples: gpt-4, gpt-3.5-turbo, gpt-4-turbo'}
                        {selectedProvider === 'anthropic' && 'Examples: claude-3-sonnet, claude-3-haiku, claude-3-opus'}
                        {selectedProvider === 'google' && 'Examples: gemini-pro, gemini-pro-vision'}
                        {selectedProvider === 'meta' && 'Examples: llama-2-7b, llama-2-13b, llama-2-70b'}
                      </p>
                    </div>

                    {/* API Key */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={newModelConfig.apiKey}
                        onChange={(e) => setNewModelConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    {/* Base URL (for custom endpoints) */}
                    {selectedProvider !== 'openai' && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Base URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={newModelConfig.baseUrl}
                          onChange={(e) => setNewModelConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                          placeholder="https://api.custom-endpoint.com/v1"
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          Leave empty to use default provider endpoint
                        </p>
                      </div>
                    )}

                    {/* Model Parameters */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          value={newModelConfig.maxTokens}
                          onChange={(e) => setNewModelConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 4096 }))}
                          min="1"
                          max="32768"
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Temperature
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={newModelConfig.temperature}
                          onChange={(e) => setNewModelConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleBackToProviderSelect}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSaveModel}
                      loading={isSaving}
                      disabled={!newModelConfig.name.trim() || !newModelConfig.modelId.trim() || !newModelConfig.apiKey.trim()}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Add Model
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
       </div>
     </div>
   );
 } 