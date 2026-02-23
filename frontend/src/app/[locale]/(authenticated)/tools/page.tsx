'use client';

import React, { useState } from 'react';
import { Wrench, Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tool } from '@/types/tool-types';
import { ToolList, ToolConfigModal } from '@/components/features/tool-management';
import { MOCK_BUILT_IN_TOOLS, MOCK_CUSTOM_TOOLS } from '@/data/mock-tools';
import { useToast } from '@/components/common/toast';

type TabType = 'all' | 'built-in' | 'custom';

export default function ToolsPage() {
  const t = useTranslations();
  const { addToast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tools, setTools] = useState<Tool[]>([...MOCK_BUILT_IN_TOOLS, ...MOCK_CUSTOM_TOOLS]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Filter tools based on tab and search
  const filteredTools = tools.filter((tool) => {
    // Tab filter
    if (activeTab === 'built-in' && !tool.isBuiltIn) return false;
    if (activeTab === 'custom' && tool.isBuiltIn) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Counts for tabs
  const builtInCount = tools.filter((t) => t.isBuiltIn).length;
  const customCount = tools.filter((t) => !t.isBuiltIn).length;

  const handleConfigure = (tool: Tool) => {
    setSelectedTool(tool);
    setIsConfigModalOpen(true);
  };

  const handleToggleActive = (tool: Tool) => {
    setTools((prev) =>
      prev.map((t) =>
        t.id === tool.id ? { ...t, isActive: !t.isActive } : t
      )
    );
    addToast({
      type: 'success',
      message: `${tool.name} ${tool.isActive ? 'disabled' : 'enabled'}`,
    });
  };

  const handleSaveConfig = (toolId: string, config: Record<string, any>) => {
    setTools((prev) =>
      prev.map((t) =>
        t.id === toolId ? { ...t, config } : t
      )
    );
    addToast({
      type: 'success',
      message: 'Tool configuration saved',
    });
  };

  const handleCreateCustomTool = () => {
    // TODO: Open create custom tool modal
    addToast({
      type: 'info',
      message: 'Custom tool creation coming soon',
    });
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: 'All Tools', count: tools.length },
    { key: 'built-in', label: 'Built-in', count: builtInCount },
    { key: 'custom', label: 'Custom', count: customCount },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Wrench className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Tools
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Manage and configure tools for your AI agents
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateCustomTool}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Tool</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs and Search */}
        <div className="flex items-center justify-between mb-6">
          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                  activeTab === tab.key
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Tool List */}
        <ToolList
          tools={filteredTools}
          emptyMessage={
            searchQuery
              ? 'No tools match your search'
              : activeTab === 'custom'
              ? 'No custom tools yet. Create one to get started.'
              : 'No tools available'
          }
          onConfigure={handleConfigure}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Config Modal */}
      <ToolConfigModal
        tool={selectedTool}
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setSelectedTool(null);
        }}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
