'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { useRouter } from '@/i18n/navigation';
import { Agent, UserAgentCustomization, UserAgentCustomizationFormData } from '@/types/agent-types';
import { 
  UserAgentCustomizationModal,
  AgentsSection,
  EmptyAgentsState,
  AgentsLoadingState,
  AgentsErrorState
} from '@/components/features/agent-management';
import { useAgents } from '@/hooks/use-agents';

export default function AgentsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const t = useTranslations();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Modal states
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedCustomization, setSelectedCustomization] = useState<UserAgentCustomization | null>(null);

  // Use the custom hook for agent management
  const {
    agents,
    userCustomizations,
    isLoading,
    error,
    deleteAgent,
    duplicateAgent,
    saveCustomization,
  } = useAgents();

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  // Get user's customization for an agent
  const getUserCustomization = (agentId: string) => {
    return userCustomizations.find(custom => custom.agentId === agentId && custom.userId === user?.id);
  };

  // Get effective agent configuration for the current user
  const getEffectiveAgentConfig = (agent: Agent) => {
    const customization = getUserCustomization(agent.id);
    if (customization && customization.isActive) {
      return {
        temperature: customization.customTemperature ?? agent.temperature,
        maxTokens: customization.customMaxTokens ?? agent.maxTokens,
        topP: customization.customTopP ?? agent.topP,
        frequencyPenalty: customization.customFrequencyPenalty ?? agent.frequencyPenalty,
        presencePenalty: customization.customPresencePenalty ?? agent.presencePenalty,
        tools: customization.customTools ?? agent.tools,
        hasCustomization: true,
      };
    }
    return {
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      topP: agent.topP,
      frequencyPenalty: agent.frequencyPenalty,
      presencePenalty: agent.presencePenalty,
      tools: agent.tools,
      hasCustomization: false,
    };
  };

  const handleStartConversation = (agent: Agent) => {
    const agentType = agent.isBuiltIn ? 'built_in' : 'custom';
    router.push(`/chat?agentId=${agent.id}&agentName=${encodeURIComponent(agent.name)}&agentType=${agentType}`);
    setOpenDropdown(null);
  };

  const handleCreateAgent = () => {
    router.push('/agents/create');
  };

  const handleEditAgent = (agent: Agent) => {
    router.push(`/agents/${agent.id}/edit`);
    setOpenDropdown(null);
  };

  const handleCustomize = (agent: Agent, customization: UserAgentCustomization | null) => {
    setSelectedAgent(agent);
    setSelectedCustomization(customization);
    setShowCustomizationModal(true);
    setOpenDropdown(null);
  };

  const handleSaveCustomization = async (data: UserAgentCustomizationFormData) => {
    if (!selectedAgent) return;
    
    try {
      await saveCustomization(selectedAgent.id, data);
      setShowCustomizationModal(false);
      setSelectedAgent(null);
      setSelectedCustomization(null);
    } catch (error) {
      console.error('Error saving customization:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      await deleteAgent(agentId);
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const handleDuplicateAgent = async (agent: Agent) => {
    try {
      await duplicateAgent(agent.id);
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error duplicating agent:', error);
    }
  };

  const handleToggleDropdown = (agentId: string) => {
    setOpenDropdown(openDropdown === agentId ? null : agentId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  if (!user) return null;

  // Separate agents by type (safe for undefined/null)
  const builtInAgents = Array.isArray(agents)
    ? agents.filter(agent => agent.agentType === 'default-agent' && agent.isBuiltIn)
    : [];
  const userAgents = Array.isArray(agents)
    ? agents.filter(agent => agent.agentType === 'user-agent')
    : [];

  // Filter agents based on user permissions
  const filterAgentsByPermissions = (agentList: Agent[]) => {
    return agentList.filter(agent => {
      const hasAccess = isAdmin || agent.isPublic || agent.createdBy === user.id;
      return hasAccess;
    });
  };

  const filteredBuiltInAgents = filterAgentsByPermissions(builtInAgents);
  const filteredUserAgents = filterAgentsByPermissions(userAgents);

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Agents</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage your AI assistants</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleCreateAgent}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Agent</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && <AgentsLoadingState />}

      {/* Error State */}
      {error && !isLoading && <AgentsErrorState error={error} />}

      {/* Agents Grid - Only show when not loading and no error */}
      {!isLoading && !error && (
        <div className="space-y-8">
          {/* Built-in Agents Section */}
          {filteredBuiltInAgents.length > 0 && (
            <AgentsSection
              title="Built-in Agents"
              icon="sparkles"
              agents={filteredBuiltInAgents}
              isAdmin={isAdmin}
              openDropdown={openDropdown}
              getUserCustomization={getUserCustomization}
              getEffectiveAgentConfig={getEffectiveAgentConfig}
              onToggleDropdown={handleToggleDropdown}
              onStartConversation={handleStartConversation}
              onEdit={handleEditAgent}
              onCustomize={handleCustomize}
              onDuplicate={handleDuplicateAgent}
              onDelete={handleDeleteAgent}
            />
          )}

          {/* User Agents Section */}
          <div>
            {filteredUserAgents.length > 0 ? (
              <AgentsSection
                title="Custom Agents"
                icon="user"
                agents={filteredUserAgents}
                isAdmin={isAdmin}
                openDropdown={openDropdown}
                getUserCustomization={getUserCustomization}
                getEffectiveAgentConfig={getEffectiveAgentConfig}
                onToggleDropdown={handleToggleDropdown}
                onStartConversation={handleStartConversation}
                onEdit={handleEditAgent}
                onCustomize={handleCustomize}
                onDuplicate={handleDuplicateAgent}
                onDelete={handleDeleteAgent}
              />
            ) : (
              <EmptyAgentsState isAdmin={isAdmin} />
            )}
          </div>
        </div>
      )}

      {/* Customization Modal */}
      <UserAgentCustomizationModal
        isOpen={showCustomizationModal}
        onClose={() => {
          setShowCustomizationModal(false);
          setSelectedAgent(null);
          setSelectedCustomization(null);
        }}
        onSubmit={handleSaveCustomization}
        agent={selectedAgent}
        existingCustomization={selectedCustomization}
        isLoading={isLoading}
      />
    </div>
  );
} 