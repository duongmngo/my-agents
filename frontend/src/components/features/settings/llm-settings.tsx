'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { settingsService } from '@/services/settings-service';
import { Button } from '@/components/common/button';
import { LoadingSpinner } from '@/components/common/loading';
import { ModelCard } from './model-card';
import { Plus, Bot, AlertCircle } from 'lucide-react';
import { LLMModel } from '@/types/common-types';

interface LLMSettingsProps {
  userRole: 'user' | 'admin' | 'owner' | 'super_admin';
  canManageSettings: boolean;
}

export const LLMSettings: React.FC<LLMSettingsProps> = ({ userRole, canManageSettings }) => {
  const t = useTranslations();
  const { user } = useAuthStore();
  
  // State for data loading
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for models
  const [llmModels, setLlmModels] = useState<LLMModel[]>([]);
  const [showAddModelModal, setShowAddModelModal] = useState(false);

  // Check if user can manage LLM settings
  const canManageLLM = userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin';

  // Load LLM data
  useEffect(() => {
    const loadLlmData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const llmModelsResponse = await settingsService.getLLMModels();
        
        if (llmModelsResponse.success && llmModelsResponse.data) {
          setLlmModels(llmModelsResponse.data);
        }
        
      } catch (err) {
        setError('Failed to load LLM models');
        console.error('Error loading LLM models:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLlmData();
  }, [user]);

  const handleAddModel = () => {
    setShowAddModelModal(true);
  };

  // LLM Model handlers
  const handleSetDefaultLLMModel = async (modelId: string) => {
    try {
      setIsSaving(true);
      const response = await settingsService.setDefaultLLMModel(modelId);
      if (response.success) {
        // Update local state
        setLlmModels(prev => prev.map(model => ({
          ...model,
          isDefault: model.id === modelId
        })));
      } else {
        setError(response.message || 'Failed to set default LLM model');
      }
    } catch (err) {
      setError('Failed to set default LLM model');
      console.error('Error setting default LLM model:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading LLM settings..." />
      </div>
    );
  }

  if (!canManageLLM) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-400 dark:text-neutral-500 mb-4">
          <Bot className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          Access Restricted
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
          You need admin, owner, or super admin privileges to access LLM model settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* LLM Models Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('settings.llm.title')}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('settings.llm.description')}
            </p>
          </div>
          <Button variant="outline" onClick={handleAddModel}>
            <Plus className="h-4 w-4 mr-2" />
            {t('settings.llm.addModel')}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 flex items-center space-x-2 mb-6">
            <AlertCircle className="h-5 w-5 text-error-500 dark:text-error-400" />
            <span className="text-error-700 dark:text-error-300">{error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {llmModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isDefault={model.isDefault}
              onSetDefault={canManageLLM ? () => handleSetDefaultLLMModel(model.id) : undefined}
              onEdit={canManageLLM ? () => console.log('Edit model:', model) : undefined}
              onDelete={canManageLLM ? () => console.log('Delete model:', model.id) : undefined}
              showActions={canManageLLM}
            />
          ))}
        </div>
        
        {llmModels.length === 0 && (
          <div className="text-center py-8">
            <div className="text-neutral-400 dark:text-neutral-500 mb-2">
              <Bot className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {t('settings.llm.noModels')}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              {t('settings.llm.noModelsDescription')}
            </p>
            {canManageLLM && (
              <Button onClick={handleAddModel}>
                <Plus className="h-4 w-4 mr-2" />
                {t('settings.llm.addFirstModel')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* TODO: Add Model Modal */}
      {showAddModelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {t('settings.llm.addModel')}
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              {t('settings.llm.addModelDescription')}
            </p>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAddModelModal(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button className="flex-1">
                {t('common.add')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
