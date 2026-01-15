'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, Sparkles, Settings, Database, Plus, Trash2, MessageSquare } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Agent, AgentFormData, AgentModel, AgentTool, ConversationStarter } from '@/types/agent-types';
import { useAgents } from '@/hooks/use-agents';
import { useToast } from '@/components/common/toast';

const availableModels: AgentModel[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', maxTokens: 8192, isAvailable: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', maxTokens: 128000, isAvailable: true },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', maxTokens: 4096, isAvailable: true },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', maxTokens: 200000, isAvailable: true },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', maxTokens: 200000, isAvailable: true },
];

const availableTools: AgentTool[] = [
  { id: 'web_search', name: 'Web Search', description: 'Search the internet for current information', category: 'Research', isEnabled: true },
  { id: 'file_reader', name: 'File Reader', description: 'Read and analyze uploaded files', category: 'File Management', isEnabled: true },
  { id: 'code_interpreter', name: 'Code Interpreter', description: 'Execute and analyze code', category: 'Development', isEnabled: true },
  { id: 'image_generator', name: 'Image Generator', description: 'Generate images from text descriptions', category: 'Creative', isEnabled: true },
  { id: 'data_analyzer', name: 'Data Analyzer', description: 'Analyze and visualize data', category: 'Analytics', isEnabled: true },
];

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const agentId = params?.id as string;
  
  const { agents, updateAgent, isLoading } = useAgents();
  const toast = useToast();
    // Store initial form data for dirty check
    const [initialFormData, setInitialFormData] = useState<AgentFormData | null>(null);
  
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    description: '',
    instructions: '',
    avatar: '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    isPublic: true,
    isEnabled: true,
    tools: [],
    knowledgeBaseIds: [],
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversationStarters, setConversationStarters] = useState<ConversationStarter[]>([]);

  // Load agent data when component mounts
  useEffect(() => {
    const foundAgent = agents.find(a => a.id === agentId);
    if (foundAgent) {
      setAgent(foundAgent);
      const agentForm: AgentFormData = {
        name: foundAgent.name,
        description: foundAgent.description,
        instructions: foundAgent.instructions,
        avatar: foundAgent.avatar || '',
        model: foundAgent.model,
        temperature: foundAgent.temperature,
        maxTokens: foundAgent.maxTokens,
        topP: foundAgent.topP,
        frequencyPenalty: foundAgent.frequencyPenalty,
        presencePenalty: foundAgent.presencePenalty,
        isPublic: foundAgent.isPublic,
        isEnabled: foundAgent.isEnabled,
        tools: foundAgent.tools,
        knowledgeBaseIds: foundAgent.knowledgeBaseIds,
      };
      setFormData(agentForm);
      setInitialFormData(agentForm);
      setConversationStarters(foundAgent.conversationStarters || []);
    }
  }, [agents, agentId]);

  const handleInputChange = (field: keyof AgentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToolToggle = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(id => id !== toolId)
        : [...prev.tools, toolId]
    }));
  };

  const addConversationStarter = () => {
    const newStarter: ConversationStarter = {
      id: `starter-${Date.now()}`,
      prompt: '',
    };
    setConversationStarters(prev => [...prev, newStarter]);
  };

  const updateConversationStarter = (index: number, field: keyof ConversationStarter, value: any) => {
    setConversationStarters(prev => 
      prev.map((starter, i) => 
        i === index ? { ...starter, [field]: value } : starter
      )
    );
  };

  const removeConversationStarter = (index: number) => {
    setConversationStarters(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;
    try {
      // Filter out empty starters
      const validStarters = conversationStarters.filter(starter => starter.prompt.trim());
      const updatedFormData = {
        ...formData,
        conversationStarters: validStarters,
      };
      await updateAgent(agent.id, updatedFormData);
      toast.addToast({
        type: 'success',
        title: 'Agent Updated',
        message: 'The agent was updated successfully.',
      });
      router.push(`/${locale}/agents`);
    } catch (error: any) {
      toast.addToast({
        type: 'error',
        title: 'Update Failed',
        message: error?.message || 'Failed to update agent.',
      });
      console.error('Error updating agent:', error);
    }
  };

  const selectedModel = availableModels.find(m => m.id === formData.model);

  if (!agent) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">Loading agent...</h3>
          <p className="text-neutral-500 dark:text-neutral-400">Please wait while we load the agent data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Edit Agent</h1>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Modify agent configuration</p>
                </div>
              </div>
            </div>
            <button
              type="submit"
              form="agent-form"
              disabled={
                isLoading ||
                !formData.name ||
                !formData.instructions ||
                !initialFormData ||
                (JSON.stringify({ ...formData, conversationStarters }) === JSON.stringify({ ...initialFormData, conversationStarters }))
              }
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'basic'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              Basic Settings
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'advanced'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              Advanced Settings
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="agent-form" onSubmit={handleSubmit} className="space-y-8">
          {activeTab === 'basic' && (
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Agent Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter agent name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Model *
                    </label>
                    <select
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {availableModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name} ({model.provider})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="textarea-description"
                    placeholder="Describe what this agent does and what users can expect from it..."
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Instructions *
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    rows={8}
                    className="textarea-instructions"
                    placeholder="Define the agent's behavior, personality, and response style. Be specific about how it should interact with users and handle different types of requests..."
                    required
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    These instructions will guide the agent's behavior and responses.
                  </p>
                </div>
              </div>

              {/* Model Configuration */}
              <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">Model Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Temperature: {formData.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      <span>Focused</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Max Tokens: {formData.maxTokens.toLocaleString()}
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max={selectedModel?.maxTokens || 8000}
                      step="1000"
                      value={formData.maxTokens}
                      onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      <span>1K</span>
                      <span>{Math.floor((selectedModel?.maxTokens || 8000) / 2000)}K</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tools */}
              <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">Tools & Capabilities</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableTools.map(tool => (
                    <label key={tool.id} className="flex items-center p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tools.includes(tool.id)}
                        onChange={() => handleToolToggle(tool.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-600 rounded"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{tool.name}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">{tool.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Visibility Settings */}
              <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">Visibility & Access</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">Make agent available to all workspace members</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isEnabled}
                      onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">Enable agent for use</span>
                  </label>
                </div>
              </div>

              {/* Conversation Starters */}
              <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">Conversation Starters</h3>
                  <button
                    type="button"
                    onClick={addConversationStarter}
                    className="flex items-center space-x-2 px-3 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Starter</span>
                  </button>
                </div>
                
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                  Configure conversation starters that users can select when starting a conversation with this agent.
                </p>

                {conversationStarters.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg">
                    <MessageSquare className="h-12 w-12 text-neutral-400 dark:text-neutral-500 mx-auto mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400 mb-2">No conversation starters configured</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Add conversation starters to help users get started quickly.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationStarters.map((starter, index) => (
                      <div key={starter.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100">Starter {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeConversationStarter(index)}
                            className="p-1 text-error-400 dark:text-error-400 hover:text-error-600 dark:hover:text-error-300 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Prompt *
                          </label>
                          <textarea
                            value={starter.prompt}
                            onChange={(e) => updateConversationStarter(index, 'prompt', e.target.value)}
                            rows={3}
                            className="textarea-prompt"
                            placeholder="Enter a conversation starter that users can select to begin chatting with this agent..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">Advanced Model Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Top P: {formData.topP}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.topP}
                    onChange={(e) => handleInputChange('topP', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Controls diversity via nucleus sampling</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Frequency Penalty: {formData.frequencyPenalty}
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={formData.frequencyPenalty}
                    onChange={(e) => handleInputChange('frequencyPenalty', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Reduces repetition of similar content</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Presence Penalty: {formData.presencePenalty}
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={formData.presencePenalty}
                    onChange={(e) => handleInputChange('presencePenalty', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Encourages new topic exploration</p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
