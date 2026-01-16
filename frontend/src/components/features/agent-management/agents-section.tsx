import React from 'react';
import { Sparkles, User } from 'lucide-react';
import { Agent, UserAgentCustomization } from '@/types/agent-types';
import { AgentCard } from './agent-card';

interface AgentsSectionProps {
  title: string;
  icon: 'sparkles' | 'user';
  agents: Agent[];
  isAdmin: boolean;
  openDropdown: string | null;
  getUserCustomization: (agentId: string) => UserAgentCustomization | undefined;
  getEffectiveAgentConfig: (agent: Agent) => {
    temperature: string;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    tools?: string[] | Record<string, any>;
    hasCustomization: boolean;
  };
  onToggleDropdown: (agentId: string) => void;
  onStartConversation: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onCustomize: (agent: Agent, customization: UserAgentCustomization | null) => void;
  onDuplicate: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
}

export const AgentsSection: React.FC<AgentsSectionProps> = ({
  title,
  icon,
  agents,
  isAdmin,
  openDropdown,
  getUserCustomization,
  getEffectiveAgentConfig,
  onToggleDropdown,
  onStartConversation,
  onEdit,
  onCustomize,
  onDuplicate,
  onDelete,
}) => {
  const Icon = icon === 'sparkles' ? Sparkles : User;
  const iconColor = icon === 'sparkles' ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400';

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">({agents.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isAdmin={isAdmin}
            openDropdown={openDropdown}
            effectiveConfig={getEffectiveAgentConfig(agent)}
            userCustomization={getUserCustomization(agent.id)}
            onToggleDropdown={onToggleDropdown}
            onStartConversation={onStartConversation}
            onEdit={onEdit}
            onCustomize={onCustomize}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
