'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { 
  User, 
  Building2, 
  Brain, 
  Bot, 
  Server,
  Settings as SettingsIcon
} from 'lucide-react';

export type SettingsTab = 'profile' | 'workspace' | 'embedding' | 'llm' | 'mcp';

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  userRole: 'user' | 'admin' | 'owner' | 'super_admin';
  canManageSettings: boolean;
  canInviteMembers: boolean;
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  userRole,
  canManageSettings,
  canInviteMembers
}) => {
  const t = useTranslations();

  // Check permissions for each tab
  const canManageWorkspace = canManageSettings;
  const canManageEmbedding = canManageSettings || userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin';
  const canManageLLM = userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin'; // LLM settings are admin/owner/super_admin-only
  const canManageMCP = userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin'; // MCP settings are admin/owner/super_admin-only

  // Debug logging
  console.log('SettingsTabs Debug:', {
    userRole,
    canManageSettings,
    canInviteMembers,
    canManageWorkspace,
    canManageEmbedding,
    canManageLLM,
    canManageMCP
  });

  const tabs = [
    {
      id: 'profile' as SettingsTab,
      label: t('settings.tabs.profile'),
      icon: User,
      description: t('settings.tabs.profileDescription'),
      visible: true // Profile is always visible
    },
    {
      id: 'workspace' as SettingsTab,
      label: t('settings.tabs.workspace'),
      icon: Building2,
      description: t('settings.tabs.workspaceDescription'),
      visible: canManageWorkspace
    },
    {
      id: 'embedding' as SettingsTab,
      label: t('settings.tabs.embedding'),
      icon: Brain,
      description: t('settings.tabs.embeddingDescription'),
      visible: canManageEmbedding // Will be visible if user has permissions
    },
    {
      id: 'llm' as SettingsTab,
      label: t('settings.tabs.llm'),
      icon: Bot,
      description: t('settings.tabs.llmDescription'),
      visible: canManageLLM
    },
    {
      id: 'mcp' as SettingsTab,
      label: t('settings.tabs.mcp'),
      icon: Server,
      description: t('settings.tabs.mcpDescription'),
      visible: canManageMCP
    }
  ].filter(tab => tab.visible);

  // Debug logging for visible tabs
  console.log('Visible tabs:', tabs.map(tab => ({ id: tab.id, visible: tab.visible })));

  // If no tabs are visible, show a message
  if (tabs.length === 0) {
    return (
      <div className="text-center py-8">
        <SettingsIcon className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400">
          No settings tabs available for your current permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-700 mb-8">
      <nav className="flex space-x-8" aria-label="Settings tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${isActive
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* Tab description */}
      <div className="mt-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div>
    </div>
  );
};
