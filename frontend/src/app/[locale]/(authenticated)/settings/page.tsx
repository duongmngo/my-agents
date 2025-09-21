'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { useTheme } from '@/providers/theme-provider';
import { 
  SettingsTabs, 
  ProfileSettings, 
  LLMSettings,
  EmbeddingModelsTab,
  MCPSettingsTab,
  type SettingsTab
} from '@/components/features/settings';
import { WorkspaceSettings } from '@/components/features/workspace-management/workspace-settings';
import { 
  AlertCircle,
  Brain,
  Building2
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { currentWorkspace, hasPermission, loadUserWorkspaces } = useWorkspaceStore();
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  
  // State for UI
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);

  // Initialize active tab from URL query parameter
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab') as SettingsTab;
    if (tabFromUrl && ['profile', 'workspace', 'embedding', 'llm', 'mcp'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Load workspace data when component mounts
  useEffect(() => {
    const initializeWorkspace = async () => {
      if (!currentWorkspace) {
        try {
          setIsLoadingWorkspace(true);
          setError(null); // Clear any previous errors
          await loadUserWorkspaces();
        } catch (err) {
          console.error('Failed to load workspaces:', err);
          setError('Failed to load workspace data. Please try refreshing the page.');
        } finally {
          setIsLoadingWorkspace(false);
        }
      }
    };

    // Add a small delay to ensure the auth store is fully initialized
    const timer = setTimeout(() => {
      initializeWorkspace();
    }, 100);

    return () => clearTimeout(timer);
  }, [currentWorkspace, loadUserWorkspaces]);

  // Handle tab change and update URL
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    // Update URL with the new tab parameter
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle language change
  const handleLanguageChange = (newLocale: string) => {
    let pathWithoutLocale = window.location.pathname;
    if (pathWithoutLocale.startsWith(`/${locale}`)) {
      pathWithoutLocale = pathWithoutLocale.replace(`/${locale}`, '') || '/';
    }
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
  };

  if (!user) return null;

  // Get user permissions and role
  const userRole = user.role as 'user' | 'admin' | 'owner' | 'super_admin';
  
  // Try to get workspace permissions, but fall back to role-based permissions if workspace data isn't loaded
  const canManageSettings = hasPermission('canManageSettings') || 
    userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin';
  const canInviteMembers = hasPermission('canInviteMembers') || 
    userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin';

  // Debug logging
  console.log('Settings Page Debug:', {
    userRole,
    canManageSettings,
    canInviteMembers,
    currentWorkspace: currentWorkspace?.id,
    activeTab,
    workspacePermissions: {
      canManageSettings: hasPermission('canManageSettings'),
      canInviteMembers: hasPermission('canInviteMembers')
    },
    fallbackPermissions: {
      roleBased: userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin'
    }
  });

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {t('settings.title')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t('settings.description')}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-error-500 dark:text-error-400" />
          <span className="text-error-700 dark:text-error-300">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoadingWorkspace && (
        <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-4 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-info-500"></div>
          <span className="text-info-700 dark:text-info-300">Loading workspace data...</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <SettingsTabs 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        userRole={userRole}
        canManageSettings={canManageSettings}
        canInviteMembers={canInviteMembers}
      />

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ProfileSettings 
            user={user} 
            onLanguageChange={handleLanguageChange} 
            currentLocale={locale} 
          />
        )}

        {/* Workspace Tab */}
        {activeTab === 'workspace' && (
          currentWorkspace ? (
            <WorkspaceSettings workspaceId={currentWorkspace.id} />
          ) : (
            <div className="text-center py-12">
              <div className="text-neutral-400 dark:text-neutral-500 mb-4">
                <Building2 className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                No Workspace Selected
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Please select a workspace to configure workspace settings.
              </p>
            </div>
          )
        )}

        {/* Embedding Models Tab */}
        {activeTab === 'embedding' && (
          currentWorkspace ? (
            <EmbeddingModelsTab 
              workspaceId={currentWorkspace.id} 
              userRole={userRole}
              canManageSettings={canManageSettings}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-neutral-400 dark:text-neutral-500 mb-4">
                <Brain className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                No Workspace Selected
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Please select a workspace to configure embedding models.
              </p>
            </div>
          )
        )}

        {/* LLM Models Tab */}
        {activeTab === 'llm' && (
          <LLMSettings 
            userRole={userRole}
            canManageSettings={canManageSettings}
          />
        )}

        {/* MCP Servers Tab */}
        {activeTab === 'mcp' && (
          <MCPSettingsTab 
            userRole={userRole}
            canManageSettings={canManageSettings}
          />
        )}
      </div>
    </div>
  );
} 