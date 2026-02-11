import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace, WorkspaceMember } from '@/types/common-types';
import { workspaceService } from '@/services/workspace-service';
import { useAuthStore } from '@/hooks/use-auth/auth-store';

interface WorkspaceState {
  // Current workspace
  currentWorkspace: Workspace | null;
  
  // User's workspaces
  userWorkspaces: Workspace[];
  
  // Current workspace members
  workspaceMembers: WorkspaceMember[];
  
  // Loading states
  isLoading: boolean;
  isSwitching: boolean;
  isLoadingWorkspaceData: boolean;
  
  // Actions
  loadUserWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshWorkspaceData: () => Promise<void>;
  createWorkspace: (data: { name: string; description?: string; slug?: string; isPrivate?: boolean; color?: string; icon?: string }) => Promise<{ success: boolean; error?: string }>;
  updateWorkspace: (workspaceId: string, data: { name?: string; description?: string; slug?: string; isPrivate?: boolean; color?: string; icon?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteWorkspace: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;
  loadWorkspaceMembers: (workspaceId: string) => Promise<void>;
  addMember: (userId: string, role: 'admin' | 'member' | 'viewer') => Promise<{ success: boolean; error?: string }>;
  updateMemberRole: (userId: string, role: 'admin' | 'member' | 'viewer') => Promise<{ success: boolean; error?: string }>;
  removeMember: (userId: string) => Promise<{ success: boolean; error?: string }>;
  archiveWorkspace: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;
  unarchiveWorkspace: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;
  searchWorkspaces: (query: string) => Promise<{ success: boolean; data?: Workspace[]; error?: string }>;
  
  // Helper methods
  getCurrentUserRole: () => 'admin' | 'member' | 'viewer' | null;
  hasPermission: (permission: keyof WorkspaceMember['permissions']) => boolean;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentWorkspace: null,
      userWorkspaces: [],
      workspaceMembers: [],
      isLoading: false,
      isSwitching: false,
      isLoadingWorkspaceData: false,

      // Load user's workspaces (only workspace list, not workspace-specific data)
      loadUserWorkspaces: async () => {
        const { isLoading } = get();
        
        if (isLoading) {
          return;
        }
        
        // Check for authentication token before making any API calls
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          if (!token) {
            console.log('No access token found, skipping workspace load');
            return;
          }
        }
        
        set({ isLoading: true });
        
        try {
          const response = await workspaceService.getUserWorkspaces();
          
          if (response.success && response.data) {
            set({ userWorkspaces: response.data });
            
            // Set default workspace if no current workspace is set
            const { currentWorkspace } = get();
            if (!currentWorkspace && response.data.length > 0) {
              // Use the first workspace as default since backend doesn't have isDefault concept
              const defaultWorkspace = response.data[0];
              set({ currentWorkspace: defaultWorkspace });
              
              // Store current workspace ID for API requests
              if (typeof window !== 'undefined') {
                localStorage.setItem('current_workspace_id', defaultWorkspace.id);
              }
              
              // Load workspace-specific data after setting current workspace
              await get().refreshWorkspaceData();
            }
          }
        } catch (error: any) {
          console.error('Failed to load workspaces:', error);
          
          // If it's an authentication error, don't retry
          if (error.isAuthError) {
            console.log('Authentication error, stopping workspace load attempts');
            return;
          }
        } finally {
          set({ isLoading: false });
        }
      },

      // Switch to a different workspace and load workspace-specific data
      switchWorkspace: async (workspaceId: string) => {
        const { isSwitching, currentWorkspace } = get();
        
        if (isSwitching || currentWorkspace?.id === workspaceId) {
          return;
        }
        
        set({ isSwitching: true });
        
        try {
          const response = await workspaceService.getWorkspace(workspaceId);
          
          if (response.success && response.data) {
            set({ currentWorkspace: response.data });
            
            // Store current workspace ID for API requests
            if (typeof window !== 'undefined') {
              localStorage.setItem('current_workspace_id', workspaceId);
              localStorage.setItem('last_used_workspace_id', workspaceId);
            }
            
            // Load workspace-specific data after switching
            await get().refreshWorkspaceData();
          }
        } catch (error) {
          console.error('Failed to switch workspace:', error);
        } finally {
          set({ isSwitching: false });
        }
      },

      // Refresh workspace-specific data (members, files, etc.)
      refreshWorkspaceData: async () => {
        const { currentWorkspace, isLoadingWorkspaceData } = get();
        
        if (!currentWorkspace || isLoadingWorkspaceData) {
          return;
        }
        
        // Check for authentication token before making any API calls
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          if (!token) {
            console.log('No access token found, skipping workspace data refresh');
            return;
          }
        }
        
        // Add a guard to prevent multiple simultaneous calls
        const state = get();
        if (state.isLoadingWorkspaceData) {
          console.log('Workspace data refresh already in progress, skipping');
          return;
        }
        
        set({ isLoadingWorkspaceData: true });
        
        try {
          // Load workspace members
          await get().loadWorkspaceMembers(currentWorkspace.id);
          
          // TODO: Load other workspace-specific data here
          // - Files
          // - Folders
          // - Messages
          // - Notes
          // - etc.
          
        } catch (error: any) {
          console.error('Failed to refresh workspace data:', error);
          
          // If it's an authentication error, don't retry
          if (error.isAuthError) {
            console.log('Authentication error, stopping workspace data refresh attempts');
            return;
          }
        } finally {
          set({ isLoadingWorkspaceData: false });
        }
      },

      // Create new workspace
      createWorkspace: async (data) => {
        try {
          const response = await workspaceService.createWorkspace(data);
          
          if (response.success && response.data) {
            const { userWorkspaces } = get();
            set({ userWorkspaces: [...userWorkspaces, response.data] });
            return { success: true };
          } else {
            return { success: false, error: response.error || 'Failed to create workspace' };
          }
        } catch (error) {
          return { success: false, error: 'Failed to create workspace' };
        }
      },

      // Update workspace
      updateWorkspace: async (workspaceId, data) => {
        try {
          const response = await workspaceService.updateWorkspace(workspaceId, data);
          
          if (response.success && response.data) {
            const { userWorkspaces, currentWorkspace } = get();
            
            // Update in user workspaces
            const updatedWorkspaces = userWorkspaces.map(w => 
              w.id === workspaceId ? response.data : w
            ).filter((w): w is Workspace => w !== undefined);
            set({ userWorkspaces: updatedWorkspaces });
            
            // Update current workspace if it's the one being updated
            if (currentWorkspace?.id === workspaceId) {
              set({ currentWorkspace: response.data });
            }
            
            return { success: true };
          } else {
            return { success: false, error: response.error || 'Failed to update workspace' };
          }
        } catch (error) {
          return { success: false, error: 'Failed to update workspace' };
        }
      },

      // Delete workspace
      deleteWorkspace: async (workspaceId) => {
        try {
          const response = await workspaceService.deleteWorkspace(workspaceId);
          
          if (response.success) {
            const { userWorkspaces, currentWorkspace } = get();
            
            // Remove from user workspaces
            const updatedWorkspaces = userWorkspaces.filter(w => w.id !== workspaceId);
            set({ userWorkspaces: updatedWorkspaces });
            
            // Switch to another workspace if current one was deleted
            if (currentWorkspace?.id === workspaceId) {
              const nextWorkspace = updatedWorkspaces[0];
              if (nextWorkspace) {
                await get().switchWorkspace(nextWorkspace.id);
              } else {
                set({ currentWorkspace: null, workspaceMembers: [] });
                // Clear workspace ID from localStorage
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('current_workspace_id');
                }
              }
            }
            
            return { success: true };
          } else {
            return { success: false, error: response.error || 'Failed to delete workspace' };
          }
        } catch (error) {
          return { success: false, error: 'Failed to delete workspace' };
        }
      },

      // Load workspace members
      loadWorkspaceMembers: async (workspaceId: string) => {
        try {
          const response = await workspaceService.getWorkspaceMembers(workspaceId);
          
          if (response.success && response.data) {
            set({ workspaceMembers: response.data });
          }
        } catch (error) {
          console.error('Failed to load workspace members:', error);
        }
      },

      // Add member
      addMember: async (userId, role) => {
        const { currentWorkspace } = get();
        
        if (!currentWorkspace) {
          return { success: false, error: 'No workspace selected' };
        }
        
        try {
          const response = await workspaceService.addMember(currentWorkspace.id, { userId, role });
          
          if (response.success && response.data) {
            const { workspaceMembers } = get();
            set({ workspaceMembers: [...workspaceMembers, response.data] });
            return { success: true };
          } else {
            return { success: false, error: response.error || 'Failed to add member' };
          }
        } catch (error) {
          return { success: false, error: 'Failed to add member' };
        }
      },

      // Update member role
      updateMemberRole: async (userId, role) => {
        const { currentWorkspace } = get();
        
        if (!currentWorkspace) {
          return { success: false, error: 'No workspace selected' };
        }
        
        try {
          const response = await workspaceService.updateMemberRole(currentWorkspace.id, userId, role);
          
          if (response.success && response.data) {
            const { workspaceMembers } = get();
            const updatedMembers = workspaceMembers.map(m => 
              m.userId === userId ? response.data : m
            ).filter((m): m is WorkspaceMember => m !== undefined);
            set({ workspaceMembers: updatedMembers });
            return { success: true };
          } else {
            return { success: false, error: response.error || 'Failed to update member role' };
          }
        } catch (error) {
          return { success: false, error: 'Failed to update member role' };
        }
      },

      // Remove member
      removeMember: async (userId) => {
        const { currentWorkspace } = get();
        
        if (!currentWorkspace) {
          return { success: false, error: 'No workspace selected' };
        }
        
        try {
          const response = await workspaceService.removeMember(currentWorkspace.id, userId);
          
          if (response.success) {
            const { workspaceMembers } = get();
            const updatedMembers = workspaceMembers.filter(m => m.userId !== userId);
            set({ workspaceMembers: updatedMembers });
            return { success: true };
          } else {
            return { success: false, error: response.error || 'Failed to remove member' };
          }
        } catch (error) {
          return { success: false, error: 'Failed to remove member' };
        }
      },

      // Archive workspace
      archiveWorkspace: async (workspaceId) => {
        try {
          const response = await workspaceService.archiveWorkspace(workspaceId);
          
          if (response.success) {
            const { userWorkspaces, currentWorkspace } = get();
            
            // Update workspace in list
            const updatedWorkspaces = userWorkspaces.map(w => 
              w.id === workspaceId ? { ...w, isArchived: true } : w
            );
            set({ userWorkspaces: updatedWorkspaces });
            
            // Update current workspace if it's the one being archived
            if (currentWorkspace?.id === workspaceId) {
              set({ currentWorkspace: { ...currentWorkspace, isArchived: true } });
            }
            
            return { success: true };
          } else {
            return { success: false, error: response.error || 'Failed to archive workspace' };
          }
        } catch (error) {
          return { success: false, error: 'Failed to archive workspace' };
        }
      },

      // Unarchive workspace
      unarchiveWorkspace: async (workspaceId) => {
        try {
          const response = await workspaceService.unarchiveWorkspace(workspaceId);
          
          if (response.success) {
            const { userWorkspaces, currentWorkspace } = get();
            
            // Update workspace in list
            const updatedWorkspaces = userWorkspaces.map(w => 
              w.id === workspaceId ? { ...w, isArchived: false } : w
            );
            set({ userWorkspaces: updatedWorkspaces });
            
            // Update current workspace if it's the one being unarchived
            if (currentWorkspace?.id === workspaceId) {
              set({ currentWorkspace: { ...currentWorkspace, isArchived: false } });
            }
            
            return { success: true };
          } else {
            return { success: false, error: response.error || 'Failed to unarchive workspace' };
          }
        } catch (error) {
          return { success: false, error: 'Failed to unarchive workspace' };
        }
      },

      // Search workspaces
      searchWorkspaces: async (query: string) => {
        try {
          const response = await workspaceService.searchWorkspaces(query);
          
          if (response.success && response.data) {
            return { success: true, data: response.data };
          } else {
            return { success: false, error: response.error || 'Failed to search workspaces' };
          }
        } catch (error) {
          return { success: false, error: 'Failed to search workspaces' };
        }
      },

      // Helper methods
      getCurrentUserRole: () => {
        const { currentWorkspace, workspaceMembers } = get();
        // Get actual user ID from auth store
        const authStore = useAuthStore.getState();
        const currentUserId = authStore.user?.id;
        if (!currentUserId) return null;
        
        const member = workspaceMembers.find(m => m.userId === currentUserId);
        return member?.role || null;
      },

      hasPermission: (permission) => {
        const { currentWorkspace, workspaceMembers } = get();
        // Get actual user ID from auth store
        const authStore = useAuthStore.getState();
        const currentUserId = authStore.user?.id;
        if (!currentUserId) return false;
        
        const member = workspaceMembers.find(m => m.userId === currentUserId);
        return member?.permissions[permission] || false;
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
        userWorkspaces: state.userWorkspaces,
      }),
    }
  )
);
