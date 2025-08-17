'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, Settings, Tool, Database } from 'lucide-react';
import { Agent, AgentFormData, AgentModel, AgentTool } from '@/types/agent-types';

interface AgentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AgentFormData) => void;
  agent: Agent | null;
  isLoading?: boolean;
}

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

export default function AgentEditModal({ isOpen, onClose, onSubmit, agent, isLoading = false }: AgentEditModalProps) {
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

  // Load agent data when modal opens
  useEffect(() => {
    if (agent && isOpen) {
      setFormData({
        name: agent.name,
        description: agent.description,
        instructions: agent.instructions,
        avatar: agent.avatar || '',
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        topP: agent.topP,
        frequencyPenalty: agent.frequencyPenalty,
        presencePenalty: agent.presencePenalty,
        isPublic: agent.isPublic,
        isEnabled: agent.isEnabled,
        tools: agent.tools,
        knowledgeBaseIds: agent.knowledgeBaseIds,
      });
    }
  }, [agent, isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectedModel = availableModels.find(m => m.id === formData.model);

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Agent</h2>
              <p className="text-sm text-gray-500">Modify agent configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Basic Settings
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'advanced'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Advanced Settings
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {activeTab === 'basic' && (
              <>
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agent Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter agent name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model *
                      </label>
                      <select
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {availableModels.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name} ({model.provider})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Describe what this agent does..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions *
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => handleInputChange('instructions', e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Define the agent's behavior, capabilities, and how it should respond..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      These instructions will guide the agent's behavior and responses.
                    </p>
                  </div>
                </div>

                {/* Model Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Model Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Focused</span>
                        <span>Balanced</span>
                        <span>Creative</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1K</span>
                        <span>{Math.floor((selectedModel?.maxTokens || 8000) / 2000)}K</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tools */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Tools & Capabilities</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableTools.map(tool => (
                      <label key={tool.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.tools.includes(tool.id)}
                          onChange={() => handleToolToggle(tool.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                          <div className="text-xs text-gray-500">{tool.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Visibility Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Visibility & Access</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isPublic}
                        onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Make agent available to all workspace members</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isEnabled}
                        onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable agent for use</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Advanced Model Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <p className="text-xs text-gray-500 mt-1">Controls diversity via nucleus sampling</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <p className="text-xs text-gray-500 mt-1">Reduces repetition of similar content</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <p className="text-xs text-gray-500 mt-1">Encourages new topic exploration</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name || !formData.instructions}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
