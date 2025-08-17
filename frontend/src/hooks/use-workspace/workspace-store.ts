import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace, WorkspaceMember } from '@/types/common-types';
import { workspaceService } from '@/services/workspace-service';
import { mockWorkspaces, mockWorkspaceMembers } from '@/utils/mock-data';

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
  
  // Actions
  loadUserWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (data: { name: string; description?: string }) => Promise<{ success: boolean; error?: string }>;
  updateWorkspace: (workspaceId: string, data: { name?: string; description?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteWorkspace: (workspaceId: string) => Promise<{ success: boolean; error?: string }>;
  loadWorkspaceMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (email: string, role: 'admin' | 'member' | 'viewer') => Promise<{ success: boolean; error?: string }>;
  updateMemberRole: (memberId: string, role: 'admin' | 'member' | 'viewer') => Promise<{ success: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  
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

      // Load user's workspaces
      loadUserWorkspaces: async () => {
        set({ isLoading: true });
        
        try {
          const response = await workspaceService.getUserWorkspaces();
          
          if (response.success && response.data) {
            set({ userWorkspaces: response.data });
            
            // Set default workspace if no current workspace is set
            const { currentWorkspace } = get();
            if (!currentWorkspace && response.data.length > 0) {
              const defaultWorkspace = response.data.find(w => w.isDefault) || response.data[0];
              set({ currentWorkspace: defaultWorkspace });
            }
          }
        } catch (error) {
          console.error('Failed to load workspaces:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Switch to a different workspace
      switchWorkspace: async (workspaceId: string) => {
        set({ isSwitching: true });
        
        try {
          const response = await workspaceService.getWorkspace(workspaceId);
          
          if (response.success && response.data) {
            set({ currentWorkspace: response.data });
            
            // Load workspace members
            await get().loadWorkspaceMembers(workspaceId);
          }
        } catch (error) {
          console.error('Failed to switch workspace:', error);
        } finally {
          set({ isSwitching: false });
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
            );
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
              const nextWorkspace = updatedWorkspaces.find(w => w.isDefault) || updatedWorkspaces[0];
              if (nextWorkspace) {
                await get().switchWorkspace(nextWorkspace.id);
              } else {
                set({ currentWorkspace: null, workspaceMembers: [] });
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

      // Invite member
      inviteMember: async (email, role) => {
        const { currentWorkspace } = get();
        
        if (!currentWorkspace) {
          return { success: false, error: 'No workspace selected' };
        }
        
        try {
          const response = await workspaceService.inviteMember(currentWorkspace.id, { email, role });
          
          if (response.success && response.data) {
            const { workspaceMembers } = get();
            set({ workspaceMembers: [...workspaceMembers, response.data] });
            return { success: true };
          } else {
            return { success: false, error: response.error || 'Failed to invite member' };
          }
        } catch (error) {
          return { success: false, error: 'Failed to invite member' };
        }
      },

      // Update member role
      updateMemberRole: async (memberId, role) => {
        try {
          const response = await workspaceService.updateMemberRole(memberId, role);
          
          if (response.success && response.data) {
            const { workspaceMembers } = get();
            const updatedMembers = workspaceMembers.map(m => 
              m.id === memberId ? response.data : m
            );
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
      removeMember: async (memberId) => {
        try {
          const response = await workspaceService.removeMember(memberId);
          
          if (response.success) {
            const { workspaceMembers } = get();
            const updatedMembers = workspaceMembers.filter(m => m.id !== memberId);
            set({ workspaceMembers: updatedMembers });
            return { success: true };
          } else {
            return { success: false, error: response.error || 'Failed to remove member' };
          }
        } catch (error) {
          return { success: false, error: 'Failed to remove member' };
        }
      },

      // Helper methods
      getCurrentUserRole: () => {
        const { currentWorkspace, workspaceMembers } = get();
        // This would need to be updated to use actual user ID from auth store
        const currentUserId = 'user-1'; // Mock user ID
        const member = workspaceMembers.find(m => m.userId === currentUserId);
        return member?.role || null;
      },

      hasPermission: (permission) => {
        const { currentWorkspace, workspaceMembers } = get();
        // This would need to be updated to use actual user ID from auth store
        const currentUserId = 'user-1'; // Mock user ID
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
