import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Tenant } from '@/types/common-types';
import { mockUsers, mockTenants, mockAuthData } from '@/utils/mock-data';
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
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Mock authentication logic
          const user = mockUsers.find(u => u.email === email);
          
          if (!user) {
            set({ isLoading: false });
            return { success: false, error: 'Invalid email or password' };
          }

          // In a real app, you'd verify the password here
          // For demo purposes, we'll accept any password
          
          const tenant = mockTenants.find(t => t.id === user.tenantId);
          
          if (!tenant) {
            set({ isLoading: false });
            return { success: false, error: 'Tenant not found' };
          }

          // Set authentication data
          set({
            user,
            tenant,
            isAuthenticated: true,
            isLoading: false,
            token: mockAuthData.token,
            refreshToken: mockAuthData.refreshToken,
            expiresAt: mockAuthData.expiresAt,
          });

          // Initialize workspace data
          const workspaceStore = useWorkspaceStore.getState();
          await workspaceStore.loadUserWorkspaces();

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Login failed' };
        }
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          tenant: null,
          isAuthenticated: false,
          isLoading: false,
          token: null,
          refreshToken: null,
          expiresAt: null,
        });
      },

      // Refresh authentication
      refreshAuth: async () => {
        const { token, refreshToken } = get();
        
        if (!token || !refreshToken) {
          get().logout();
          return;
        }

        try {
          // Simulate token refresh
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // In a real app, you'd call the refresh endpoint
          // For demo purposes, we'll just update the expiration
          const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          
          set({
            expiresAt: newExpiresAt,
          });
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