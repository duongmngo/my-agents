'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Key, Globe, Building, Hash, Zap } from 'lucide-react';
import { AzureEmbeddingConfig } from '@/types/embedding-types';

interface AzureProviderConfigProps {
  config: Partial<AzureEmbeddingConfig['config']>;
  onChange: (config: Partial<AzureEmbeddingConfig['config']>) => void;
  disabled?: boolean;
}

export const AzureProviderConfig: React.FC<AzureProviderConfigProps> = ({
  config,
  onChange,
  disabled = false
}) => {
  const t = useTranslations();

  const handleChange = (field: keyof AzureEmbeddingConfig['config'], value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      {/* API Key */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Key className="h-4 w-4 inline mr-1" />
          API Key *
        </label>
        <input
          type="password"
          value={config.api_key || ''}
          onChange={(e) => handleChange('api_key', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Your Azure OpenAI API key"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Your Azure OpenAI API key from the Azure portal.
        </p>
      </div>

      {/* Base URL */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Globe className="h-4 w-4 inline mr-1" />
          Base URL *
        </label>
        <input
          type="url"
          value={config.base_url || ''}
          onChange={(e) => handleChange('base_url', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="https://your-resource.openai.azure.com/"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Your Azure OpenAI endpoint URL from the Azure portal.
        </p>
      </div>

      {/* API Version */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Hash className="h-4 w-4 inline mr-1" />
          API Version
        </label>
        <select
          value={config.api_version || '2024-02-15-preview'}
          onChange={(e) => handleChange('api_version', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={disabled}
        >
          <option value="2024-02-15-preview">2024-02-15-preview</option>
          <option value="2024-02-01">2024-02-01</option>
          <option value="2023-12-01-preview">2023-12-01-preview</option>
          <option value="2023-08-01-preview">2023-08-01-preview</option>
        </select>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Azure OpenAI API version. Use the latest stable version.
        </p>
      </div>

      {/* Deployment Name */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Building className="h-4 w-4 inline mr-1" />
          Deployment Name *
        </label>
        <input
          type="text"
          value={config.deployment_name || ''}
          onChange={(e) => handleChange('deployment_name', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="text-embedding-ada-002"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          The name of your Azure OpenAI deployment for embeddings.
        </p>
      </div>

      {/* Model (Optional) */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Zap className="h-4 w-4 inline mr-1" />
          Model
        </label>
        <input
          type="text"
          value={config.model || ''}
          onChange={(e) => handleChange('model', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="text-embedding-ada-002"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Optional. The underlying model name (usually same as deployment name).
        </p>
      </div>
    </div>
  );
};
