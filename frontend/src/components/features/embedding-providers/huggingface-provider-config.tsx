'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Key, Globe, Zap, Cpu, Database } from 'lucide-react';
import { HuggingFaceEmbeddingConfig } from '@/types/embedding-types';

interface HuggingFaceProviderConfigProps {
  config: Partial<HuggingFaceEmbeddingConfig['config']>;
  onChange: (config: Partial<HuggingFaceEmbeddingConfig['config']>) => void;
  disabled?: boolean;
}

export const HuggingFaceProviderConfig: React.FC<HuggingFaceProviderConfigProps> = ({
  config,
  onChange,
  disabled = false
}) => {
  const t = useTranslations();

  const handleChange = (field: keyof HuggingFaceEmbeddingConfig['config'], value: any) => {
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
          API Key
        </label>
        <input
          type="password"
          value={config.api_key || ''}
          onChange={(e) => handleChange('api_key', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="hf_..."
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Optional. HuggingFace API key for higher rate limits. Get it from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">HuggingFace Settings</a>
        </p>
      </div>

      {/* API URL */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Globe className="h-4 w-4 inline mr-1" />
          API URL
        </label>
        <input
          type="url"
          value={config.api_url || 'https://api-inference.huggingface.co'}
          onChange={(e) => handleChange('api_url', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="https://api-inference.huggingface.co"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          HuggingFace Inference API endpoint. Use default unless you have a custom endpoint.
        </p>
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Zap className="h-4 w-4 inline mr-1" />
          Model *
        </label>
        <select
          value={config.model || 'sentence-transformers/all-MiniLM-L6-v2'}
          onChange={(e) => handleChange('model', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={disabled}
        >
          <option value="sentence-transformers/all-MiniLM-L6-v2">all-MiniLM-L6-v2 (384 dims)</option>
          <option value="sentence-transformers/all-mpnet-base-v2">all-mpnet-base-v2 (768 dims)</option>
          <option value="sentence-transformers/all-MiniLM-L12-v2">all-MiniLM-L12-v2 (384 dims)</option>
          <option value="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2">paraphrase-multilingual-MiniLM-L12-v2 (384 dims)</option>
          <option value="sentence-transformers/distilbert-base-nli-mean-tokens">distilbert-base-nli-mean-tokens (768 dims)</option>
        </select>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Choose a sentence-transformers model. all-MiniLM-L6-v2 is fast and efficient.
        </p>
      </div>

      {/* Use GPU */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.use_gpu || false}
            onChange={(e) => handleChange('use_gpu', e.target.checked)}
            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            disabled={disabled}
          />
          <Cpu className="h-4 w-4" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Use GPU
          </span>
        </label>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Enable GPU acceleration for faster inference (if available).
        </p>
      </div>

      {/* Batch Size */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          <Database className="h-4 w-4 inline mr-1" />
          Batch Size
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={config.batch_size || 32}
          onChange={(e) => handleChange('batch_size', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Number of texts to process in a single batch. Higher values are faster but use more memory.
        </p>
      </div>
    </div>
  );
};
