import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/common-types';
import { authService, LoginCredentials, RegisterData } from '@/services/auth-service';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';

interface AuthState {
  // User data
  user: User | null;
  
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Tokens
  token: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  
  // Actions
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      refreshToken: null,
      expiresAt: null,

      // Login action
      login: async (identifier: string, password: string) => {
        set({ isLoading: true });

        try {
          const credentials: LoginCredentials = {
            identifier: identifier,
            password: password
          };

          console.log('Attempting login with:', { identifier }); // Debug log
          const result = await authService.login(credentials);
          console.log('Login API response:', result); // Debug log
          
          if (result.success && result.user && result.tokens) {
            // Convert API user to store user format
            const user: User = {
              id: result.user.id,
              email: result.user.email,
              name: result.user.fullName, // Changed from full_name to fullName
              role: result.user.role as 'user' | 'admin' | 'owner',
              avatar: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            console.log('Storing tokens:', {
              access_token: result.tokens.accessToken ? 'present' : 'missing', // Changed from access_token to accessToken
              refresh_token: result.tokens.refreshToken ? 'present' : 'missing' // Changed from refresh_token to refreshToken
            }); // Debug log

            // Store tokens in localStorage for persistence
            if (typeof window !== 'undefined') {
              localStorage.setItem('access_token', result.tokens.accessToken); // Changed from access_token to accessToken
              localStorage.setItem('refresh_token', result.tokens.refreshToken); // Changed from refresh_token to refreshToken
              localStorage.setItem('user', JSON.stringify(user));
              
              // Verify storage
              const storedToken = localStorage.getItem('access_token');
              console.log('Token storage verification:', {
                expected: result.tokens.accessToken ? 'should be stored' : 'missing', // Changed from access_token to accessToken
                actual: storedToken ? 'stored' : 'not stored'
              }); // Debug log
            }

            // Set authentication data
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              token: result.tokens.accessToken, // Changed from access_token to accessToken
              refreshToken: result.tokens.refreshToken, // Changed from refresh_token to refreshToken
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            });

            console.log('Auth store updated successfully'); // Debug log

            // Initialize workspace data and select last used workspace
            const workspaceStore = useWorkspaceStore.getState();
            console.log('await workspaceStore.loadUserWorkspaces() from login');
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
            console.log('Login failed:', result.error); // Debug log
            set({ isLoading: false });
            return { success: false, error: result.error || 'Login failed' };
          }
        } catch (error) {
          console.error('Login error:', error); // Debug log
          set({ isLoading: false });
          return { success: false, error: 'Login failed' };
        }
      },

      // Register action
      register: async (data: RegisterData) => {
        set({ isLoading: true });

        try {
          console.log('Attempting registration with:', { email: data.email, username: data.username });
          const result = await authService.register(data);
          console.log('Register API response:', result);
          
          if (result.success && result.user && result.tokens) {
            // Convert API user to store user format
            const user: User = {
              id: result.user.id,
              email: result.user.email,
              name: result.user.fullName,
              role: result.user.role as 'user' | 'admin' | 'owner',
              avatar: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Store tokens in localStorage for persistence
            if (typeof window !== 'undefined') {
              localStorage.setItem('access_token', result.tokens.accessToken);
              localStorage.setItem('refresh_token', result.tokens.refreshToken);
              localStorage.setItem('user', JSON.stringify(user));
            }

            // Set authentication data
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              token: result.tokens.accessToken,
              refreshToken: result.tokens.refreshToken,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });

            console.log('Auth store updated successfully after registration');

            // Initialize workspace data
            const workspaceStore = useWorkspaceStore.getState();
            await workspaceStore.loadUserWorkspaces();
            
            const { userWorkspaces } = useWorkspaceStore.getState();
            if (userWorkspaces.length > 0) {
              const workspaceToSelect = userWorkspaces.find((w: any) => w.isDefault) || userWorkspaces[0];
              if (workspaceToSelect) {
                await workspaceStore.switchWorkspace(workspaceToSelect.id);
                localStorage.setItem('last_used_workspace_id', workspaceToSelect.id);
              }
            }

            return { success: true };
          } else {
            console.log('Registration failed:', result.error);
            set({ isLoading: false });
            return { success: false, error: result.error || 'Registration failed' };
          }
        } catch (error: any) {
          console.error('Registration error:', error);
          set({ isLoading: false });
          // Extract error message from API response
          const errorMessage = error?.response?.data?.detail || error?.message || 'Registration failed';
          return { success: false, error: errorMessage };
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
        console.log('initializeAuth');        
        if (typeof window === 'undefined') return;        
        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const userStr = localStorage.getItem('user');
        
        if (token && refreshToken && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              token,
              refreshToken,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });
            
            // Load workspaces and select last used
            const workspaceStore = useWorkspaceStore.getState();
            console.log('await workspaceStore.loadUserWorkspaces() from initializeAuth');
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
        } else 
        {
          get().logout();
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
              token: result.tokens.accessToken, // Changed from access_token to accessToken
              refreshToken: result.tokens.refreshToken, // Changed from refresh_token to refreshToken
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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
    }
  )
); 