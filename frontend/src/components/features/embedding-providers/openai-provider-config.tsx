'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Key, Globe, Building, Hash, Zap } from 'lucide-react';
import { OpenAIEmbeddingConfig } from '@/types/embedding-types';

interface OpenAIProviderConfigProps {
  config: Partial<OpenAIEmbeddingConfig['config']>;
  onChange: (config: Partial<OpenAIEmbeddingConfig['config']>) => void;
  disabled?: boolean;
}

export const OpenAIProviderConfig: React.FC<OpenAIProviderConfigProps> = ({
  config,
  onChange,
  disabled = false
}) => {
  const t = useTranslations();

  const handleChange = (field: keyof OpenAIEmbeddingConfig['config'], value: any) => {
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
          placeholder="sk-..."
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Your OpenAI API key. Get it from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">OpenAI Platform</a>
        </p>
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Zap className="h-4 w-4 inline mr-1" />
          Model *
        </label>
        <select
          value={config.model || 'text-embedding-3-small'}
          onChange={(e) => handleChange('model', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={disabled}
        >
          <option value="text-embedding-3-small">text-embedding-3-small (1536 dims)</option>
          <option value="text-embedding-3-large">text-embedding-3-large (3072 dims)</option>
          <option value="text-embedding-ada-002">text-embedding-ada-002 (1536 dims)</option>
        </select>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Choose the embedding model. text-embedding-3-small is recommended for most use cases.
        </p>
      </div>

      {/* Base URL */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Globe className="h-4 w-4 inline mr-1" />
          Base URL
        </label>
        <input
          type="url"
          value={config.base_url || ''}
          onChange={(e) => handleChange('base_url', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="https://api.openai.com/v1"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Leave empty to use the default OpenAI endpoint. Use this for custom endpoints or proxies.
        </p>
      </div>

      {/* Organization ID */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Building className="h-4 w-4 inline mr-1" />
          Organization ID
        </label>
        <input
          type="text"
          value={config.organization_id || ''}
          onChange={(e) => handleChange('organization_id', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="org-..."
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Optional. Your OpenAI organization ID for billing and usage tracking.
        </p>
      </div>

      {/* Dimensions */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Hash className="h-4 w-4 inline mr-1" />
          Dimensions
        </label>
        <input
          type="number"
          min="1"
          max="3072"
          value={config.dimensions || 1536}
          onChange={(e) => handleChange('dimensions', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Number of dimensions for the embedding. Must match the model's capabilities.
        </p>
      </div>

      {/* Max Tokens */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Hash className="h-4 w-4 inline mr-1" />
          Max Tokens
        </label>
        <input
          type="number"
          min="1"
          max="8192"
          value={config.max_tokens || 8192}
          onChange={(e) => handleChange('max_tokens', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Maximum number of tokens to process in a single request.
        </p>
      </div>
    </div>
  );
};
