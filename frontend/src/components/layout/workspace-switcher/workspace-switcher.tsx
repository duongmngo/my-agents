'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Crown, User, LogOut } from 'lucide-react';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge/badge';

export const WorkspaceSwitcher: React.FC = () => {
  const { 
    currentWorkspace, 
    userWorkspaces, 
    workspaceMembers,
    isLoading, 
    isSwitching,
    loadUserWorkspaces, 
    switchWorkspace 
  } = useWorkspaceStore();
  
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (userWorkspaces.length === 0) {
      loadUserWorkspaces();
    }
  }, [loadUserWorkspaces, userWorkspaces.length]);

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    await switchWorkspace(workspaceId);
    setIsOpen(false);
  };

  const getCurrentUserRole = () => {
    if (!currentWorkspace) return null;
    // This would need to be updated to use actual user ID from auth store
    const currentUserId = 'user-1'; // Mock user ID
    const member = workspaceMembers.find(m => m.userId === currentUserId);
    return member?.role || null;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'member':
        return <User className="h-3 w-3 text-blue-500" />;
      case 'viewer':
        return <User className="h-3 w-3 text-gray-500" />;
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
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span>Loading workspaces...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

             {isOpen && (
         <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto w-96">
          <div className="p-2">
            {/* Current Workspace Info */}
            {currentWorkspace && (
              <div className="px-3 py-2 mb-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentWorkspace.settings.primaryColor }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {currentWorkspace.name}
                    </span>
                  </div>
                  {getRoleBadge(getCurrentUserRole() || '')}
                </div>
                {currentWorkspace.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {currentWorkspace.description}
                  </p>
                )}
              </div>
            )}

            {/* Workspace List */}
            <div className="space-y-1">
              {userWorkspaces.map((workspace) => {
                                 const isCurrent = workspace.id === currentWorkspace?.id;
                 const role = workspaceMembers.find(m => m.workspaceId === workspace.id && m.userId === 'user-1')?.role;
                
                return (
                  <button
                    key={workspace.id}
                    onClick={() => handleWorkspaceSwitch(workspace.id)}
                    disabled={isCurrent || isSwitching}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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
                            <Badge variant="success" size="xs">Default</Badge>
                          )}
                        </div>
                        {workspace.description && (
                          <p className="text-xs text-gray-500 truncate">
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
              })}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 mt-2 pt-2 space-y-1">
              <button
                onClick={() => {
                  // This would open a create workspace modal
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Workspace</span>
              </button>
              <hr className="my-2" />
              <button 
                onClick={logout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
