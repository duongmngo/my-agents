'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useToast } from '@/components/common/toast';
import { AgentFormData, ConversationStarter } from '@/types/agent-types';
import { useAgents } from '@/hooks/use-agents';
import AgentForm from '@/components/agents/AgentForm';

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

// Model options
const availableModels = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', maxTokens: 8000 },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', maxTokens: 4000 },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', maxTokens: 4000 },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', maxTokens: 4000 },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', maxTokens: 32000 },
];

export default function CreateAgentPage() {
  const router = useRouter();
  const locale = useLocale();
  const { createAgent, isLoading } = useAgents();
  const toast = useToast();
  
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    description: '',
    instructions: '',
    aiModel: 'gpt-4',
    temperature: '0.7',
    maxTokens: 4000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    isPublic: true,
    isActive: true,
    tools: [],
    color: '',
    avatarUrl: '',
    capabilities: [],
    conversationStarters: [],
    systemPrompt: '',
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'templates'>('basic');
  const [conversationStarters, setConversationStarters] = useState<ConversationStarter[]>([]);

  const handleInputChange = (field: keyof AgentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToolToggle = (toolId: string) => {
    setFormData(prev => {
      const currentTools = Array.isArray(prev.tools) ? prev.tools : [];
      return {
        ...prev,
        tools: currentTools.includes(toolId)
          ? currentTools.filter((id: string) => id !== toolId)
          : [...currentTools, toolId]
      };
    });
  };

  const handleTemplateSelect = (template: typeof agentTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      instructions: template.instructions,
      aiModel: template.model,
      temperature: template.temperature.toString(),
      maxTokens: template.maxTokens,
      tools: template.tools,
    }));
    setActiveTab('basic');
  };

  const addConversationStarter = () => {
    const newStarter: ConversationStarter = {
      id: `starter-${Date.now()}`,
      title: '',
      prompt: '',
    };
    const updatedStarters = [...conversationStarters, newStarter];
    setConversationStarters(updatedStarters);
    setFormData(prev => ({ ...prev, conversationStarters: updatedStarters }));
  };

  const updateConversationStarter = (index: number, field: keyof ConversationStarter, value: any) => {
    const updatedStarters = conversationStarters.map((starter, i) => 
      i === index ? { ...starter, [field]: value } : starter
    );
    setConversationStarters(updatedStarters);
    setFormData(prev => ({ ...prev, conversationStarters: updatedStarters }));
  };

  const removeConversationStarter = (index: number) => {
    const updatedStarters = conversationStarters.filter((_, i) => i !== index);
    setConversationStarters(updatedStarters);
    setFormData(prev => ({ ...prev, conversationStarters: updatedStarters }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty starters
      const validStarters = conversationStarters.filter(starter => starter.prompt.trim());
      const submitData = {
        ...formData,
        conversationStarters: validStarters,
      };
      await createAgent(submitData);
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

  const selectedModel = availableModels.find(m => m.id === formData.aiModel);

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

      {activeTab === 'templates' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </div>
      ) : (
        <AgentForm
          formData={formData}
          conversationStarters={conversationStarters}
          activeTab={activeTab as 'basic' | 'advanced'}
          isLoading={isLoading}
          isSubmitDisabled={isLoading || !formData.name || !formData.instructions}
          onInputChange={handleInputChange}
          onToolToggle={handleToolToggle}
          onAddConversationStarter={addConversationStarter}
          onUpdateConversationStarter={updateConversationStarter}
          onRemoveConversationStarter={removeConversationStarter}
          onSubmit={handleSubmit}
          submitButtonText="Create Agent"
        />
      )}
    </div>
  );
}
