import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Tenant } from '@/types/common-types';
import { authService, LoginCredentials } from '@/services/auth-service';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';

interface AuthState {
  // User data
  user: User | null;
  tenant: Tenant | null;
  
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Tokens
  token: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  updateUser: (user: User) => void;
  updateTenant: (tenant: Tenant) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      refreshToken: null,
      expiresAt: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          const credentials: LoginCredentials = {
            identifier: email,
            password: password
          };

          const result = await authService.login(credentials);
          
          if (result.success && result.user && result.tokens) {
            // Convert API user to store user format
            const user: User = {
              id: result.user.id,
              email: result.user.email,
              name: result.user.full_name,
              role: result.user.role as 'user' | 'admin' | 'owner',
              tenantId: result.user.id, // User is their own tenant
              avatar: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Store tokens in localStorage for persistence
            if (typeof window !== 'undefined') {
              localStorage.setItem('access_token', result.tokens.access_token);
              localStorage.setItem('refresh_token', result.tokens.refresh_token);
              localStorage.setItem('user', JSON.stringify(user));
            }

            // Set authentication data
            set({
              user,
              tenant: null, // No separate tenant needed
              isAuthenticated: true,
              isLoading: false,
              token: result.tokens.access_token,
              refreshToken: result.tokens.refresh_token,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            });

            // Initialize workspace data and select last used workspace
            const workspaceStore = useWorkspaceStore.getState();
            await workspaceStore.loadUserWorkspaces();
            
            // Select the last used workspace or default workspace
            const { userWorkspaces } = useWorkspaceStore.getState();
            if (userWorkspaces.length > 0) {
              const lastUsedWorkspaceId = localStorage.getItem('last_used_workspace_id');
              const workspaceToSelect = lastUsedWorkspaceId 
                ? userWorkspaces.find((w: any) => w.id === lastUsedWorkspaceId)
                : userWorkspaces.find((w: any) => w.isDefault) || userWorkspaces[0];
              
              if (workspaceToSelect) {
                await workspaceStore.switchWorkspace(workspaceToSelect.id);
                localStorage.setItem('last_used_workspace_id', workspaceToSelect.id);
              }
            }

            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, error: result.error || 'Login failed' };
          }
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Login failed' };
        }
      },

      // Logout action
      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            localStorage.removeItem('last_used_workspace_id');
          }
          
          set({
            user: null,
            tenant: null,
            isAuthenticated: false,
            isLoading: false,
            token: null,
            refreshToken: null,
            expiresAt: null,
          });
        }
      },

      // Initialize authentication from localStorage
      initializeAuth: async () => {
        if (typeof window === 'undefined') return;
        
        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const userStr = localStorage.getItem('user');
        
        if (token && refreshToken && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              tenant: null,
              isAuthenticated: true,
              isLoading: false,
              token,
              refreshToken,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });
            
            // Load workspaces and select last used
            const workspaceStore = useWorkspaceStore.getState();
            await workspaceStore.loadUserWorkspaces();
            
            const { userWorkspaces } = useWorkspaceStore.getState();
            if (userWorkspaces.length > 0) {
              const lastUsedWorkspaceId = localStorage.getItem('last_used_workspace_id');
              const workspaceToSelect = lastUsedWorkspaceId 
                ? userWorkspaces.find((w: any) => w.id === lastUsedWorkspaceId)
                : userWorkspaces.find((w: any) => w.isDefault) || userWorkspaces[0];
              
              if (workspaceToSelect) {
                await workspaceStore.switchWorkspace(workspaceToSelect.id);
              }
            }
          } catch (error) {
            console.error('Failed to initialize auth from localStorage:', error);
            get().logout();
          }
        }
      },

      // Refresh authentication
      refreshAuth: async () => {
        const { token, refreshToken } = get();
        
        if (!token || !refreshToken) {
          get().logout();
          return;
        }

        try {
          const result = await authService.refreshToken();
          
          if (result.success && result.tokens) {
            set({
              token: result.tokens.access_token,
              refreshToken: result.tokens.refresh_token,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });
          } else {
            get().logout();
          }
        } catch (error) {
          get().logout();
        }
      },

      // Update user
      updateUser: (user: User) => {
        set({ user });
      },

      // Update tenant
      updateTenant: (tenant: Tenant) => {
        set({ tenant });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
    }
  )
); 