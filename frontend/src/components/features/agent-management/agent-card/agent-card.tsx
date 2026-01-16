'use client';

import React from 'react';
import { MoreVertical, MessageSquare, Edit, Sparkles } from 'lucide-react';
import { Agent } from '@/types/agent-types';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { AgentDropdownMenu } from './agent-dropdown-menu';
import { AgentStats } from './agent-stats';

interface AgentCardProps {
  agent: Agent;
  isAdmin: boolean;
  openDropdown: string | null;
  effectiveConfig: {
    temperature: string;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    tools?: string[] | Record<string, any>;
    hasCustomization: boolean;
  };
  userCustomization: any;
  onStartConversation: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onDuplicate: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onCustomize: (agent: Agent, customization: any) => void;
  onDropdownToggle: (agentId: string) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isAdmin,
  openDropdown,
  effectiveConfig,
  userCustomization,
  onStartConversation,
  onEdit,
  onDuplicate,
  onDelete,
  onCustomize,
  onDropdownToggle,
}) => {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
      {/* Agent Header */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {agent.avatarUrl ? (
                <img 
                  src={agent.avatarUrl} 
                  alt={agent.name}
                  className="h-12 w-12 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`h-12 w-12 ${agent.avatarUrl ? 'hidden' : ''}`}>
                <AgentAvatar size="md" color={agent.color} />
              </div>
              {agent.isBuiltIn && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{agent.name}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{agent.aiModel}</p>
            </div>
          </div>
          <div className="relative dropdown-container">
            <button 
              className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
              onClick={() => onDropdownToggle(agent.id)}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {openDropdown === agent.id && (
              <AgentDropdownMenu
                agent={agent}
                isAdmin={isAdmin}
                userCustomization={userCustomization}
                onStartConversation={() => onStartConversation(agent)}
                onEdit={() => onEdit(agent)}
                onDuplicate={() => onDuplicate(agent)}
                onDelete={() => onDelete(agent.id)}
                onCustomize={() => onCustomize(agent, userCustomization)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Agent Details */}
      <div className="p-6 space-y-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
          {agent.description || 'No description available'}
        </p>

        <AgentStats
          effectiveConfig={effectiveConfig}
          agent={agent}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span>{agent.conversationCount} chats</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onStartConversation(agent)}
              className="px-3 py-1.5 text-sm bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors flex items-center space-x-1"
              title="Start conversation"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </button>
            {isAdmin && !agent.isBuiltIn && (
              <button 
                onClick={() => onEdit(agent)}
                className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Edit agent"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
