'use client';

import React, { createContext, useContext } from 'react';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { Workspace } from '@/types/common-types';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  isLoadingWorkspaceData: boolean;
  refreshWorkspaceData: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { 
    currentWorkspace, 
    isLoading, 
    isLoadingWorkspaceData,
    refreshWorkspaceData 
  } = useWorkspaceStore();

  const value: WorkspaceContextType = {
    currentWorkspace,
    isLoading: isLoading || isLoadingWorkspaceData,
    isLoadingWorkspaceData,
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
