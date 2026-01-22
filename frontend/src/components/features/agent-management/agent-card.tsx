import React from 'react';
import { MoreVertical, MessageSquare, Edit, User, Copy, Trash2, Sparkles } from 'lucide-react';
import { Agent, UserAgentCustomization } from '@/types/agent-types';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';

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
  userCustomization?: UserAgentCustomization | null;
  onToggleDropdown: (agentId: string) => void;
  onStartConversation: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onCustomize: (agent: Agent, customization: UserAgentCustomization | null) => void;
  onDuplicate: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isAdmin,
  openDropdown,
  effectiveConfig,
  userCustomization,
  onToggleDropdown,
  onStartConversation,
  onEdit,
  onCustomize,
  onDuplicate,
  onDelete,
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
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{agent.name}</h3>

              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{agent.aiModel}</p>
            </div>
          </div>
          <div className="relative dropdown-container">
            <button 
              className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
              onClick={() => onToggleDropdown(agent.id)}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {/* Dropdown Menu */}
            {openDropdown === agent.id && (
              <div className="absolute right-0 top-8 w-48 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-10">
                <div className="py-1">
                  <button
                    onClick={() => onStartConversation(agent)}
                    className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Conversation
                  </button>
                  
                  {!agent.isBuiltIn && (
                    <>
                      {!isAdmin && (
                        <button
                          onClick={() => onCustomize(agent, userCustomization || null)}
                          className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Customize
                        </button>
                      )}
                      
                      {isAdmin && (
                        <button
                          onClick={() => onEdit(agent)}
                          className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                      )}
                    </>
                  )}
                  
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => onDuplicate(agent)}
                        className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </button>
                      {!agent.isBuiltIn && (
                        <>
                          <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                          <button
                            onClick={() => onDelete(agent.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Content */}
      <div className="p-6">
        <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4 line-clamp-3">
          {agent.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {agent.isBuiltIn && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-400">
              <Sparkles className="h-3 w-3 mr-1" />
              Built-in
            </span>
          )}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            agent.isActive 
              ? 'bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-400' 
              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-300'
          }`}>
            {agent.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 dark:bg-warning-900/20 text-warning-800 dark:text-warning-400">
            Temp: {effectiveConfig.temperature}
          </span>
          {effectiveConfig.hasCustomization && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-900/20 text-secondary-800 dark:text-secondary-400">
              Customized
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">          <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
            {/* Chat count removed */}
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
