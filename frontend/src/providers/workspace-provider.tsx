'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { Workspace } from '@/types/common-types';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  refreshWorkspaceData: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { currentWorkspace, isLoading } = useWorkspaceStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshWorkspaceData = async () => {
    if (!currentWorkspace) return;
    
    setIsRefreshing(true);
    try {
      // Load workspace-specific data here
      // This could include:
      // - Workspace members
      // - Workspace settings
      // - Workspace analytics
      // - Workspace files
      // - etc.
      
      // For now, we'll just reload workspace members
      const workspaceStore = useWorkspaceStore.getState();
      await workspaceStore.loadWorkspaceMembers(currentWorkspace.id);
    } catch (error) {
      console.error('Failed to refresh workspace data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentWorkspace) {
      refreshWorkspaceData();
    }
  }, [currentWorkspace?.id]);

  const value: WorkspaceContextType = {
    currentWorkspace,
    isLoading: isLoading || isRefreshing,
    refreshWorkspaceData,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
