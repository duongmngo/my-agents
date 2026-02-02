'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { Agent, AgentFormData, ConversationStarter } from '@/types/agent-types';
import { agentService } from '@/services/agent-service';
import { useToast } from '@/components/common/toast';
import AgentForm from '@/components/agents/AgentForm';

// Model options
const availableModels = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', maxTokens: 8000 },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', maxTokens: 4000 },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', maxTokens: 4000 },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', maxTokens: 4000 },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', maxTokens: 32000 },
];

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params?.id as string;
  
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [initialFormData, setInitialFormData] = useState<AgentFormData | null>(null);
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    description: '',
    instructions: '',
    avatarUrl: '',
    aiModel: 'gpt-4',
    temperature: '0.7',
    maxTokens: 4000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    isPublic: true,
    isActive: true,
    tools: [],
    conversationStarters: [],
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversationStarters, setConversationStarters] = useState<ConversationStarter[]>([]);

  // Load agent data when component mounts
  useEffect(() => {
    async function fetchAgent() {
      setIsLoading(true);
      try {
        const foundAgent = await agentService.getAgent(agentId);
        setAgent(foundAgent);
        const agentForm: AgentFormData = {
          name: foundAgent.name,
          description: foundAgent.description,
          instructions: foundAgent.instructions,
          agentType: foundAgent.agentType,
          aiModel: foundAgent.aiModel,
          temperature: foundAgent.temperature,
          maxTokens: foundAgent.maxTokens,
          systemPrompt: foundAgent.systemPrompt,
          avatarUrl: foundAgent.avatarUrl,
          color: foundAgent.color,
          isPublic: foundAgent.isPublic,
          isActive: foundAgent.isActive,
          capabilities: foundAgent.capabilities,
          tools: foundAgent.tools,
          conversationStarters: foundAgent.conversationStarters || [],
        };
        setFormData(agentForm);
        setInitialFormData(agentForm);
        setConversationStarters(foundAgent.conversationStarters || []);
      } catch (error) {
        // Optionally handle error
      } finally {
        setIsLoading(false);
      }
    }
    if (agentId) fetchAgent();
  }, [agentId]);

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
    if (!agent) return;
    try {
      // Filter out empty starters
      const validStarters = conversationStarters.filter(starter => starter.prompt.trim());
      const updatedFormData = {
        ...formData,
        conversationStarters: validStarters,
      };
      await agentService.updateAgent(agent.id, updatedFormData);
      toast.addToast({
        type: 'success',
        title: 'Agent Updated',
        message: 'The agent was updated successfully.',
      });
      setInitialFormData(updatedFormData);
    } catch (error: any) {
      toast.addToast({
        type: 'error',
        title: 'Update Failed',
        message: error?.message || 'Failed to update agent.',
      });
      console.error('Error updating agent:', error);
    }
  };

  const selectedModel = availableModels.find(m => m.id === formData.aiModel);

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
                (JSON.stringify(formData) === JSON.stringify(initialFormData))
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
              type="button"
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
              type="button"
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

      <AgentForm
        formData={formData}
        conversationStarters={conversationStarters}
        activeTab={activeTab}
        isLoading={isLoading}
        isSubmitDisabled={
          isLoading ||
          !formData.name ||
          !formData.instructions ||
          !initialFormData ||
          (JSON.stringify(formData) === JSON.stringify(initialFormData))
        }
        onInputChange={handleInputChange}
        onToolToggle={handleToolToggle}
        onAddConversationStarter={addConversationStarter}
        onUpdateConversationStarter={updateConversationStarter}
        onRemoveConversationStarter={removeConversationStarter}
        onSubmit={handleSubmit}
        submitButtonText="Save Changes"
      />
    </div>
  );
}
