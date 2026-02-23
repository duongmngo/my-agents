'use client';

import React from 'react';
import { Database, Globe, Link, Webhook, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { Tool } from '@/types/tool-types';

interface ToolCardProps {
  tool: Tool;
  onConfigure: (tool: Tool) => void;
  onToggleActive: (tool: Tool) => void;
}

// Map icon strings to Lucide components
const iconMap: Record<string, React.ElementType> = {
  'database-search': Database,
  'globe': Globe,
  'link': Link,
  'api': Webhook,
};

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onConfigure,
  onToggleActive,
}) => {
  const IconComponent = iconMap[tool.icon] || Webhook;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg ${
              tool.isActive 
                ? 'bg-primary-100 dark:bg-primary-900/30' 
                : 'bg-neutral-100 dark:bg-neutral-800'
            }`}>
              <IconComponent className={`h-5 w-5 ${
                tool.isActive 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-neutral-400 dark:text-neutral-500'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                {tool.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  tool.isBuiltIn
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                }`}>
                  {tool.isBuiltIn ? 'Built-in' : 'Custom'}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  tool.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                }`}>
                  {tool.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Toggle Active */}
          <button
            onClick={() => onToggleActive(tool)}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
            title={tool.isActive ? 'Disable tool' : 'Enable tool'}
          >
            {tool.isActive ? (
              <ToggleRight className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            ) : (
              <ToggleLeft className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
          {tool.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => onConfigure(tool)}
            className="flex items-center space-x-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Configure</span>
          </button>
          
          {tool.config && Object.keys(tool.config).length > 0 && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {Object.keys(tool.config).length} settings
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
