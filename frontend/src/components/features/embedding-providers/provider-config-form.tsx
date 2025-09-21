'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { 
  OpenAIProviderConfig, 
  AzureProviderConfig, 
  HuggingFaceProviderConfig
} from './index';
import { EmbeddingProviderType } from '@/types/embedding-types';

interface ProviderConfigFormProps {
  providerType: EmbeddingProviderType;
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  disabled?: boolean;
}

export const ProviderConfigForm: React.FC<ProviderConfigFormProps> = ({
  providerType,
  config,
  onChange,
  disabled = false
}) => {
  const t = useTranslations();

  const renderProviderConfig = () => {
    switch (providerType) {
      case 'OPENAI':
        return (
          <OpenAIProviderConfig
            config={config}
            onChange={onChange}
            disabled={disabled}
          />
        );
      
      case 'AZURE':
        return (
          <AzureProviderConfig
            config={config}
            onChange={onChange}
            disabled={disabled}
          />
        );
      
      case 'HUGGINGFACE':
        return (
          <HuggingFaceProviderConfig
            config={config}
            onChange={onChange}
            disabled={disabled}
          />
        );
      
      
      default:
        return (
          <div className="text-center py-8">
            <p className="text-neutral-500 dark:text-neutral-400">
              Unknown provider type: {providerType}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {providerType} Configuration
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Configure the settings for your {providerType} embedding provider.
        </p>
      </div>
      
      {renderProviderConfig()}
    </div>
  );
};
