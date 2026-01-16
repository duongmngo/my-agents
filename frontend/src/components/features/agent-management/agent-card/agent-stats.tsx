'use client';

import React from 'react';
import { Settings, Sparkles } from 'lucide-react';
import { Agent } from '@/types/agent-types';

interface AgentStatsProps {
  effectiveConfig: {
    temperature: string;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    tools?: string[] | Record<string, any>;
    hasCustomization: boolean;
  };
  agent: Agent;
}

export const AgentStats: React.FC<AgentStatsProps> = ({ effectiveConfig, agent }) => {
  return (
    <>
      {/* Configuration */}
      <div className="flex items-center space-x-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center space-x-1">
          <Settings className="h-3 w-3" />
          <span>Temp: {effectiveConfig.temperature}</span>
        </div>
        {effectiveConfig.maxTokens && (
          <span>Max: {effectiveConfig.maxTokens}</span>
        )}
        {effectiveConfig.hasCustomization && (
          <span className="flex items-center space-x-1 text-primary-600 dark:text-primary-400">
            <Sparkles className="h-3 w-3" />
            <span>Customized</span>
          </span>
        )}
      </div>

      {/* Capabilities */}
      {agent.capabilities && agent.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((capability) => (
            <span 
              key={capability} 
              className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded"
            >
              {capability}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="px-2 py-1 text-xs text-neutral-500 dark:text-neutral-400">
              +{agent.capabilities.length - 3} more
            </span>
          )}
        </div>
      )}
    </>
  );
};
