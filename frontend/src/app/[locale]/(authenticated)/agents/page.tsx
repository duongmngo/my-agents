'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, MoreVertical, Settings, Copy, Trash2, MessageSquare, Edit, User, Sparkles } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { useRouter } from 'next/navigation';
import { Agent, UserAgentCustomization, UserAgentCustomizationFormData } from '@/types/agent-types';
import { UserAgentCustomizationModal } from '@/components/features/agent-management';
import { useAgents } from '@/hooks/use-agents';

export default function AgentsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
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
    router.push(`/${locale}/chat?agentId=${agent.id}&agentName=${encodeURIComponent(agent.name)}`);
    setOpenDropdown(null);
  };

  const handleCreateAgent = () => {
    router.push(`/${locale}/agents/create`);
  };

  const handleEditAgent = (agent: Agent) => {
    router.push(`/${locale}/agents/${agent.id}/edit`);
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

  // Filter agents based on user permissions
  const filteredAgents = agents.filter(agent => {
    // Only show public agents to non-admins, or agents created by the user
    const hasAccess = isAdmin || agent.isPublic || agent.createdBy === user.id;
    
    return hasAccess;
  });

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
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-16 w-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">Loading agents...</h3>
            <p className="text-neutral-500 dark:text-neutral-400">Please wait while we fetch your AI assistants.</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-16 w-16 mx-auto mb-4 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-error-600 dark:text-error-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">Error loading agents</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <span>Try Again</span>
            </button>
          </div>
        </div>
      )}

      {/* Agents Grid - Only show when not loading and no error */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.length > 0 ? (
            filteredAgents.map((agent) => {
              const effectiveConfig = getEffectiveAgentConfig(agent);
              const userCustomization = getUserCustomization(agent.id);
              
              return (
                <div key={agent.id} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
                  {/* Agent Header */}
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {agent.avatar ? (
                            <img 
                              src={agent.avatar} 
                              alt={agent.name}
                              className="h-12 w-12 rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`h-12 w-12 ${agent.avatar ? 'hidden' : ''}`}>
                            <AgentAvatar size="md" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{agent.name}</h3>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">{agent.model}</p>
                        </div>
                      </div>
                      <div className="relative dropdown-container">
                        <button 
                          className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
                          onClick={() => setOpenDropdown(openDropdown === agent.id ? null : agent.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openDropdown === agent.id && (
                          <div className="absolute right-0 top-8 w-48 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleStartConversation(agent)}
                                className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Start Conversation
                              </button>
                              
                              {!isAdmin && (
                                <button
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    setSelectedCustomization(userCustomization || null);
                                    setShowCustomizationModal(true);
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  Customize
                                </button>
                              )}
                              
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleEditAgent(agent)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateAgent(agent)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </button>
                                  <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                                  <button
                                    onClick={() => handleDeleteAgent(agent.id)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </button>
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
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        agent.isEnabled 
                          ? 'bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-400' 
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-300'
                      }`}>
                        {agent.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-400">
                        {effectiveConfig.tools.length} tools
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 dark:bg-warning-900/20 text-warning-800 dark:text-warning-400">
                        Temp: {effectiveConfig.temperature}
                      </span>
                      {effectiveConfig.hasCustomization && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-400">
                          Custom
                        </span>
                      )}
                    </div>

                    {/* Tools */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">Tools</p>
                      <div className="flex flex-wrap gap-1">
                        {effectiveConfig.tools.map((tool, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
                        <span>Created {new Date(agent.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isAdmin && (
                          <button 
                            onClick={() => {
                              setSelectedAgent(agent);
                              setSelectedCustomization(userCustomization || null);
                              setShowCustomizationModal(true);
                            }}
                            className="p-2 text-primary-400 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                            title="Customize for your use"
                          >
                            <User className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleStartConversation(agent)}
                          className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          title="Start conversation"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleEditAgent(agent)}
                              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              title="Edit agent"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDuplicateAgent(agent)}
                              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              title="Duplicate agent"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="p-2 text-error-400 dark:text-error-400 hover:text-error-600 dark:hover:text-error-300 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20"
                              title="Delete agent"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="h-16 w-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  No agents available
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                  {isAdmin 
                    ? 'Create your first AI agent to get started'
                    : 'No agents have been configured for this workspace yet'
                  }
                </p>
                {isAdmin && (
                  <button 
                    onClick={handleCreateAgent}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Agent</span>
                  </button>
                )}
              </div>
            </div>
          )}
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