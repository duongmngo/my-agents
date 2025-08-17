'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, MoreVertical, Settings, Copy, Trash2, MessageSquare, Edit, User, Sparkles, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { useRouter } from 'next/navigation';
import { Agent, UserAgentCustomization, UserAgentCustomizationFormData } from '@/types/agent-types';
import { UserAgentCustomizationModal, AgentDiagramViewer } from '@/components/features/agent-management';
import { useAgents } from '@/hooks/use-agents';

export default function AgentsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Modal states
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [showDiagramModal, setShowDiagramModal] = useState(false);
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
    router.push(`/chat?agentId=${agent.id}&agentName=${encodeURIComponent(agent.name)}`);
    setOpenDropdown(null);
  };

  const handleCreateAgent = () => {
    router.push('/agents/create');
  };

  const handleEditAgent = (agent: Agent) => {
    router.push(`/agents/${agent.id}/edit`);
    setOpenDropdown(null);
  };

  const handleViewDiagram = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowDiagramModal(true);
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

  // Filter agents based on search and user permissions
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Only show public agents to non-admins, or agents created by the user
    const hasAccess = isAdmin || agent.isPublic || agent.createdBy === user.id;
    
    return matchesSearch && hasAccess;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-600">Manage your AI assistants</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleCreateAgent}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Agent</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-16 w-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading agents...</h3>
            <p className="text-gray-500">Please wait while we fetch your AI assistants.</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-16 w-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading agents</h3>
            <p className="text-gray-500 mb-4">{error}</p>
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
                <div key={agent.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  {/* Agent Header */}
                  <div className="p-6 border-b border-gray-200">
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
                          <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                          <p className="text-sm text-gray-500">{agent.model}</p>
                        </div>
                      </div>
                      <div className="relative dropdown-container">
                        <button 
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          onClick={() => setOpenDropdown(openDropdown === agent.id ? null : agent.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openDropdown === agent.id && (
                          <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleStartConversation(agent)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Start Conversation
                              </button>
                              
                              {agent.diagram && (
                                <button
                                  onClick={() => handleViewDiagram(agent)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  View Diagram
                                </button>
                              )}
                              
                              {!isAdmin && (
                                <button
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    setSelectedCustomization(userCustomization || null);
                                    setShowCustomizationModal(true);
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  Customize
                                </button>
                              )}
                              
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleEditAgent(agent)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateAgent(agent)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </button>
                                  <hr className="my-1" />
                                  <button
                                    onClick={() => handleDeleteAgent(agent.id)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {agent.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        agent.isEnabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {effectiveConfig.tools.length} tools
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Temp: {effectiveConfig.temperature}
                      </span>
                      {effectiveConfig.hasCustomization && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Custom
                        </span>
                      )}
                      {agent.diagram && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Diagram
                        </span>
                      )}
                    </div>

                    {/* Tools */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Tools</p>
                      <div className="flex flex-wrap gap-1">
                        {effectiveConfig.tools.map((tool, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
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
                            className="p-2 text-blue-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                            title="Customize for your use"
                          >
                            <User className="h-4 w-4" />
                          </button>
                        )}
                        {agent.diagram && (
                          <button 
                            onClick={() => handleViewDiagram(agent)}
                            className="p-2 text-indigo-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                            title="View workflow diagram"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleStartConversation(agent)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          title="Start conversation"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => handleEditAgent(agent)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                              title="Edit agent"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDuplicateAgent(agent)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                              title="Duplicate agent"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
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
                <div className="h-16 w-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No agents found' : 'No agents available'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : isAdmin 
                      ? 'Create your first AI agent to get started'
                      : 'No agents have been configured for this workspace yet'
                  }
                </p>
                {!searchTerm && isAdmin && (
                  <button 
                    onClick={handleCreateAgent}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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

      {/* Diagram Viewer Modal */}
      {selectedAgent?.diagram && (
        <AgentDiagramViewer
          diagram={selectedAgent.diagram}
          isOpen={showDiagramModal}
          onClose={() => {
            setShowDiagramModal(false);
            setSelectedAgent(null);
          }}
        />
      )}
    </div>
  );
} 