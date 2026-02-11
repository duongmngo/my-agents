'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Crown, User, LogOut, RefreshCw } from 'lucide-react';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { useToast } from '@/components/common/toast';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge/badge';
import WorkspaceCreationModal, { WorkspaceFormData } from '@/components/features/workspace-management/workspace-creation-modal';

export const WorkspaceSwitcher: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { 
    currentWorkspace, 
    userWorkspaces, 
    workspaceMembers,
    isLoading, 
    isSwitching,
    isLoadingWorkspaceData,
    switchWorkspace,
    refreshWorkspaceData,
    createWorkspace
  } = useWorkspaceStore();
  
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    try {
      await switchWorkspace(workspaceId);
      setIsOpen(false);
      setError(null);
      
      // Redirect to dashboard after switching workspace
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to switch workspace:', err);
      setError('Failed to switch workspace');
    }
  };

  const handleRefreshWorkspaceData = async () => {
    try {
      setError(null);
      await refreshWorkspaceData();
    } catch (err) {
      console.error('Failed to refresh workspace data:', err);
      setError('Failed to refresh workspace data');
    }
  };

  const handleCreateWorkspace = async (data: WorkspaceFormData) => {
    try {
      setIsCreating(true);
      setError(null);
      const result = await createWorkspace(data);
      
      if (result.success) {
        setShowCreateModal(false);
        setIsOpen(false);
        // Show success toast
        toast.addToast({
          type: 'success',
          title: 'Workspace created',
          message: `Workspace "${data.name}" has been created successfully.`,
        });
        // Refresh the workspace list
        await refreshWorkspaceData();
      } else {
        setError(result.error || 'Failed to create workspace');
        toast.addToast({
          type: 'error',
          title: 'Failed to create workspace',
          message: result.error || 'An error occurred while creating the workspace.',
        });
      }
    } catch (err) {
      console.error('Failed to create workspace:', err);
      setError('Failed to create workspace');
      toast.addToast({
        type: 'error',
        title: 'Failed to create workspace',
        message: 'An unexpected error occurred.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getCurrentUserRole = () => {
    if (!currentWorkspace) return null;
    // This would need to be updated to use actual user ID from auth store
    const currentUserId = user?.id || 'user-1'; // Use actual user ID if available
    const member = workspaceMembers.find(m => m.userId === currentUserId);
    return member?.role || currentWorkspace.userRole || null;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'member':
        return <User className="h-3 w-3 text-blue-500" />;
      case 'viewer':
        return <User className="h-3 w-3 text-neutral-500 dark:text-neutral-400" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="warning" size="sm">Admin</Badge>;
      case 'member':
        return <Badge variant="primary" size="sm">Member</Badge>;
      case 'viewer':
        return <Badge variant="secondary" size="sm">Viewer</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-400 dark:border-neutral-500"></div>
        <span>Loading workspaces...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ 
              backgroundColor: currentWorkspace?.settings?.primaryColor || '#3B82F6' 
            }}
          />
          <span className="truncate">
            {currentWorkspace?.name || 'Select Workspace'}
          </span>
          {currentWorkspace?.isDefault && (
            <Badge variant="success" size="sm">Default</Badge>
          )}
          {isLoadingWorkspaceData && (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-500"></div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-neutral-400 dark:text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto w-96">
          <div className="p-2">
            {/* Error Message */}
            {error && (
              <div className="px-3 py-2 mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={handleRefreshWorkspaceData}
                      className="text-red-600 hover:text-red-700"
                      title="Refresh workspace data"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Current Workspace Info */}
            {currentWorkspace && (
              <div className="px-3 py-2 mb-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentWorkspace.settings.primaryColor }}
                    />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {currentWorkspace.name}
                    </span>
                    {isLoadingWorkspaceData && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-500"></div>
                    )}
                  </div>
                  {getRoleBadge(getCurrentUserRole() || '')}
                </div>
                {currentWorkspace.description && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {currentWorkspace.description}
                  </p>
                )}
              </div>
            )}

            {/* Workspace List */}
            <div className="space-y-1">
              {userWorkspaces.length > 0 ? (
                userWorkspaces.map((workspace) => {
                  const isCurrent = workspace.id === currentWorkspace?.id;
                  const role = workspaceMembers.find(m => m.workspaceId === workspace.id && m.userId === (user?.id || 'user-1'))?.role || workspace.userRole;
                  
                  return (
                    <button
                      key={workspace.id}
                      onClick={() => handleWorkspaceSwitch(workspace.id)}
                      disabled={isCurrent || isSwitching}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                        isCurrent
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: workspace.settings.primaryColor }}
                        />
                        <div className="text-left">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{workspace.name}</span>
                            {workspace.isDefault && (
                              <Badge variant="success" size="sm">Default</Badge>
                            )}
                          </div>
                          {workspace.description && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {workspace.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(role || '')}
                        {getRoleBadge(role || '')}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  <p>No workspaces found</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2 space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Workspace</span>
              </button>
              <hr className="my-2 border-neutral-200 dark:border-neutral-700" />
              <button 
                onClick={logout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      <WorkspaceCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateWorkspace}
        isLoading={isCreating}
      />
    </div>
  );
};
