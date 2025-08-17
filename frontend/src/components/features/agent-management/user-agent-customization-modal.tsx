'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Settings, User, Sparkles, Info } from 'lucide-react';
import { Agent, UserAgentCustomization, UserAgentCustomizationFormData, AgentTool } from '@/types/agent-types';

interface UserAgentCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserAgentCustomizationFormData) => void;
  agent: Agent | null;
  existingCustomization?: UserAgentCustomization | null;
  isLoading?: boolean;
}

const availableTools: AgentTool[] = [
  { id: 'web_search', name: 'Web Search', description: 'Search the internet for current information', category: 'Research', isEnabled: true },
  { id: 'file_reader', name: 'File Reader', description: 'Read and analyze uploaded files', category: 'File Management', isEnabled: true },
  { id: 'code_interpreter', name: 'Code Interpreter', description: 'Execute and analyze code', category: 'Development', isEnabled: true },
  { id: 'image_generator', name: 'Image Generator', description: 'Generate images from text descriptions', category: 'Creative', isEnabled: true },
  { id: 'data_analyzer', name: 'Data Analyzer', description: 'Analyze and visualize data', category: 'Analytics', isEnabled: true },
];

export default function UserAgentCustomizationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  agent, 
  existingCustomization,
  isLoading = false 
}: UserAgentCustomizationModalProps) {
  const [formData, setFormData] = useState<UserAgentCustomizationFormData>({
    customInstructions: '',
    customTemperature: undefined,
    customMaxTokens: undefined,
    customTopP: undefined,
    customFrequencyPenalty: undefined,
    customPresencePenalty: undefined,
    customTools: [],
    isActive: true,
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  // Load existing customization data when modal opens
  useEffect(() => {
    if (existingCustomization && isOpen) {
      setFormData({
        customInstructions: existingCustomization.customInstructions || '',
        customTemperature: existingCustomization.customTemperature,
        customMaxTokens: existingCustomization.customMaxTokens,
        customTopP: existingCustomization.customTopP,
        customFrequencyPenalty: existingCustomization.customFrequencyPenalty,
        customPresencePenalty: existingCustomization.customPresencePenalty,
        customTools: existingCustomization.customTools || [],
        isActive: existingCustomization.isActive,
      });
    } else if (agent && isOpen) {
      // Initialize with agent's default values
      setFormData({
        customInstructions: '',
        customTemperature: agent.temperature,
        customMaxTokens: agent.maxTokens,
        customTopP: agent.topP,
        customFrequencyPenalty: agent.frequencyPenalty,
        customPresencePenalty: agent.presencePenalty,
        customTools: agent.tools,
        isActive: true,
      });
    }
  }, [agent, existingCustomization, isOpen]);

  const handleInputChange = (field: keyof UserAgentCustomizationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToolToggle = (toolId: string) => {
    setFormData(prev => ({
      ...prev,
      customTools: prev.customTools?.includes(toolId)
        ? prev.customTools.filter(id => id !== toolId)
        : [...(prev.customTools || []), toolId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const resetToDefaults = () => {
    if (agent) {
      setFormData({
        customInstructions: '',
        customTemperature: agent.temperature,
        customMaxTokens: agent.maxTokens,
        customTopP: agent.topP,
        customFrequencyPenalty: agent.frequencyPenalty,
        customPresencePenalty: agent.presencePenalty,
        customTools: agent.tools,
        isActive: true,
      });
    }
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Customize Agent</h2>
              <p className="text-sm text-gray-500">Personalize {agent.name} for your use</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Personal Customization</p>
              <p>These settings will only apply to your conversations with this agent. Other users will see the default configuration set by the admin.</p>
            </div>
          </div>
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

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-300px)]">
          <div className="p-6 space-y-6">
            {activeTab === 'basic' && (
              <>
                {/* Custom Instructions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Custom Instructions</h3>
                    <button
                      type="button"
                      onClick={resetToDefaults}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Reset to Defaults
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Instructions (Optional)
                    </label>
                    <textarea
                      value={formData.customInstructions}
                      onChange={(e) => handleInputChange('customInstructions', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Add your personal instructions that will be combined with the agent's base instructions..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      These instructions will be added to the agent's base instructions for your conversations.
                    </p>
                  </div>
                </div>

                {/* Model Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Model Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature: {formData.customTemperature ?? agent.temperature}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={formData.customTemperature ?? agent.temperature}
                        onChange={(e) => handleInputChange('customTemperature', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Focused</span>
                        <span>Balanced</span>
                        <span>Creative</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Default: {agent.temperature}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Tokens: {(formData.customMaxTokens ?? agent.maxTokens).toLocaleString()}
                      </label>
                      <input
                        type="range"
                        min="1000"
                        max="8000"
                        step="1000"
                        value={formData.customMaxTokens ?? agent.maxTokens}
                        onChange={(e) => handleInputChange('customMaxTokens', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1K</span>
                        <span>8K</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Default: {agent.maxTokens.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tools */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Tools & Capabilities</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableTools.map(tool => {
                      const isSelected = (formData.customTools || agent.tools).includes(tool.id);
                      const isDefault = agent.tools.includes(tool.id);
                      
                      return (
                        <label key={tool.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToolToggle(tool.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                              {isDefault && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{tool.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Activation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Activation</h3>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Use my custom settings for this agent</span>
                  </label>
                  
                  {!formData.isActive && (
                    <p className="text-sm text-gray-500 ml-6">
                      When disabled, you'll use the agent's default configuration.
                    </p>
                  )}
                </div>
              </>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Advanced Model Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Top P: {formData.customTopP ?? agent.topP}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.customTopP ?? agent.topP}
                      onChange={(e) => handleInputChange('customTopP', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Controls diversity via nucleus sampling</p>
                    <p className="text-xs text-gray-400">Default: {agent.topP}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency Penalty: {formData.customFrequencyPenalty ?? agent.frequencyPenalty}
                    </label>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={formData.customFrequencyPenalty ?? agent.frequencyPenalty}
                      onChange={(e) => handleInputChange('customFrequencyPenalty', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Reduces repetition of similar content</p>
                    <p className="text-xs text-gray-400">Default: {agent.frequencyPenalty}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Presence Penalty: {formData.customPresencePenalty ?? agent.presencePenalty}
                    </label>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={formData.customPresencePenalty ?? agent.presencePenalty}
                      onChange={(e) => handleInputChange('customPresencePenalty', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Encourages new topic exploration</p>
                    <p className="text-xs text-gray-400">Default: {agent.presencePenalty}</p>
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
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{existingCustomization ? 'Update' : 'Save'} Customization</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
