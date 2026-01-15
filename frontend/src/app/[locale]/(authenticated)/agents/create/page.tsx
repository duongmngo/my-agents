'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save, Sparkles, Settings, Tool, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useToast } from '@/components/common/toast';
import { AgentFormData, AgentModel, AgentTool } from '@/types/agent-types';
import { useAgents } from '@/hooks/use-agents';

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

const agentTemplates = [
  {
    id: 'project-manager',
    name: 'Project Manager',
    description: 'Specialized in project management and team coordination',
    instructions: 'You are a project management assistant with expertise in agile methodologies, task tracking, and team collaboration. Help with project planning, progress tracking, and team coordination.',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4000,
    tools: ['web_search', 'file_reader'],
  },
  {
    id: 'business-analyst',
    name: 'Business Analyst',
    description: 'Specialized in business analysis and requirements gathering',
    instructions: 'You are a business analyst assistant with expertise in requirements analysis, process modeling, and stakeholder management. Help with business requirements, user stories, and process optimization.',
    model: 'gpt-4',
    temperature: 0.5,
    maxTokens: 4000,
    tools: ['web_search', 'file_reader', 'data_analyzer'],
  },
  {
    id: 'system-architect',
    name: 'System Architect',
    description: 'Specialized in system architecture and technical design',
    instructions: 'You are a system architect assistant with expertise in software architecture, system design, and technical planning. Help with architectural decisions, system design patterns, and technical specifications.',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 4000,
    tools: ['web_search', 'file_reader', 'code_interpreter'],
  },
];

  const router = useRouter();
  const locale = useLocale();
  const { createAgent, isLoading } = useAgents();
  const toast = useToast();
  
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

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'templates'>('basic');

  const handleInputChange = (field: keyof AgentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToolToggle = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools?.includes(toolId)
        ? prev.tools?.filter(id => id !== toolId)
        : [...prev.tools, toolId]
    }));
  };

  const handleTemplateSelect = (template: typeof agentTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      instructions: template.instructions,
      model: template.model,
      temperature: template.temperature,
      maxTokens: template.maxTokens,
      tools: template.tools,
    }));
    setActiveTab('basic');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAgent(formData);
      toast.addToast({
        type: 'success',
        title: 'Agent Created',
        message: 'The agent was created successfully.',
      });
      router.push(`/${locale}/agents`);
    } catch (error: any) {
      toast.addToast({
        type: 'error',
        title: 'Create Failed',
        message: error?.message || 'Failed to create agent.',
      });
      console.error('Error creating agent:', error);
    }
  };

  const selectedModel = availableModels.find(m => m.id === formData.model);

  // ...existing code...
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
                  <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Create New Agent</h1>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Configure your AI assistant</p>
                </div>
              </div>
            </div>
            <button
              type="submit"
              form="agent-form"
              disabled={isLoading || !formData.name || !formData.instructions}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Create Agent</span>
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
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'templates'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              Templates
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
                    <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">Enable agent immediately after creation</span>
                  </label>
                </div>
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

          {activeTab === 'templates' && (
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">Agent Templates</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">Choose a template to get started quickly</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agentTemplates.map(template => (
                  <div
                    key={template.id}
                    className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md cursor-pointer transition-all"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">{template.name}</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                      <span>{template.model}</span>
                      <span>Temp: {template.temperature}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
