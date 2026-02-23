'use client';

import React, { useState, useEffect } from 'react';
import { X, Database, Globe, Link, Webhook, RotateCcw } from 'lucide-react';
import { Tool, ToolConfigProperty } from '@/types/tool-types';

interface ToolConfigModalProps {
  tool: Tool | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (toolId: string, config: Record<string, any>) => void;
}

// Map icon strings to Lucide components
const iconMap: Record<string, React.ElementType> = {
  'database-search': Database,
  'globe': Globe,
  'link': Link,
  'api': Webhook,
};

export const ToolConfigModal: React.FC<ToolConfigModalProps> = ({
  tool,
  isOpen,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tool) {
      setConfig(tool.config || tool.defaultConfig || {});
    }
  }, [tool]);

  if (!isOpen || !tool) return null;

  const IconComponent = iconMap[tool.icon] || Webhook;

  const handleReset = () => {
    setConfig(tool.defaultConfig || {});
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(tool.id, config);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const renderConfigField = (key: string, schema: ToolConfigProperty) => {
    const value = config[key] ?? schema.default;

    // Enum/Select field
    if (schema.enum) {
      return (
        <div key={key} className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {schema.title || key}
          </label>
          {schema.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{schema.description}</p>
          )}
          <select
            value={value || ''}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {schema.enum.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Number/Integer field
    if (schema.type === 'integer' || schema.type === 'number') {
      return (
        <div key={key} className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {schema.title || key}
          </label>
          {schema.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{schema.description}</p>
          )}
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => handleConfigChange(key, schema.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value))}
            min={schema.minimum}
            max={schema.maximum}
            step={schema.type === 'number' ? 0.1 : 1}
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {(schema.minimum !== undefined || schema.maximum !== undefined) && (
            <p className="text-xs text-neutral-400">
              Range: {schema.minimum ?? '∞'} - {schema.maximum ?? '∞'}
            </p>
          )}
        </div>
      );
    }

    // Boolean field
    if (schema.type === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between py-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {schema.title || key}
            </label>
            {schema.description && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{schema.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleConfigChange(key, !value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      );
    }

    // Array field (simplified - just comma-separated)
    if (schema.type === 'array') {
      const arrayValue = Array.isArray(value) ? value.join(', ') : '';
      return (
        <div key={key} className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {schema.title || key}
          </label>
          {schema.description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{schema.description}</p>
          )}
          <input
            type="text"
            value={arrayValue}
            onChange={(e) => {
              const newValue = e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s);
              handleConfigChange(key, newValue);
            }}
            placeholder="Enter comma-separated values"
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      );
    }

    // Default: String field
    return (
      <div key={key} className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {schema.title || key}
        </label>
        {schema.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{schema.description}</p>
        )}
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleConfigChange(key, e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <IconComponent className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {tool.name}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Configure tool settings
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5">
              {tool.description}
            </p>

            <div className="space-y-4">
              {tool.configSchema?.properties &&
                Object.entries(tool.configSchema.properties).map(([key, schema]) =>
                  renderConfigField(key, schema as ToolConfigProperty)
                )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-5 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to defaults</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolConfigModal;
