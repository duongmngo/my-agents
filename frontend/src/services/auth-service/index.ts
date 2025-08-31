import { apiClient } from '../api-client';

export interface LoginCredentials {
  identifier: string; // email or username
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    fullName: string; // Changed from full_name to fullName
    role: string;
    isVerified: boolean; // Changed from is_verified to isVerified
  };
  tokens?: {
    accessToken: string; // Changed from access_token to accessToken
    refreshToken: string; // Changed from refresh_token to refreshToken
    tokenType: string; // Changed from token_type to tokenType
    expiresIn: number; // Added expiresIn field
  };
  error?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  timezone: string;
  language: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar_url?: string;
  timezone?: string;
  language?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

class AuthService {
  private readonly baseUrl = '/api/v1/auth';

  /**
   * Login user with email/username and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('AuthService: Making login request to:', `${this.baseUrl}/login`); // Debug log
      
      const authResponse = await apiClient.post<AuthResponse>(
        `${this.baseUrl}/login`,
        credentials,
        undefined,
        false // requireAuth = false for login
      );
      
      console.log('AuthService: Login response received:', authResponse); // Debug log
      
      if (authResponse.success && authResponse.tokens) {
        console.log('AuthService: Storing tokens in localStorage'); // Debug log
        
        // Store tokens in localStorage
        localStorage.setItem('access_token', authResponse.tokens.accessToken);
        localStorage.setItem('refresh_token', authResponse.tokens.refreshToken);
        
        // Store user info
        if (authResponse.user) {
          localStorage.setItem('user', JSON.stringify(authResponse.user));
        }
        
        // Verify storage
        const storedToken = localStorage.getItem('access_token');
        console.log('AuthService: Token storage verification:', {
          expected: authResponse.tokens.accessToken ? 'should be stored' : 'missing',
          actual: storedToken ? 'stored' : 'not stored'
        }); // Debug log
      } else {
        console.log('AuthService: Login failed or no tokens received'); // Debug log
      }
      
      return authResponse;
    } catch (error: any) {
      console.error('AuthService: Login error:', error); // Debug log
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const authResponse = await apiClient.post<AuthResponse>(
        `${this.baseUrl}/register`,
        data,
        undefined,
        false // requireAuth = false for register
      );
      
      if (authResponse.success && authResponse.tokens) {
        // Store tokens in localStorage
        localStorage.setItem('access_token', authResponse.tokens.accessToken);
        localStorage.setItem('refresh_token', authResponse.tokens.refreshToken);
        
        // Store user info
        if (authResponse.user) {
          localStorage.setItem('user', JSON.stringify(authResponse.user));
        }
      }
      
      return authResponse;
    } catch (error: any) {
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refresh_token = localStorage.getItem('refresh_token');
      if (!refresh_token) {
        throw new Error('No refresh token available');
      }

      const authResponse = await apiClient.post<AuthResponse>(
        `${this.baseUrl}/refresh`,
        { refresh_token },
        undefined,
        false // requireAuth = false for refresh token
      );
      
      if (authResponse.success && authResponse.tokens) {
        // Update stored tokens
        localStorage.setItem('access_token', authResponse.tokens.accessToken);
        localStorage.setItem('refresh_token', authResponse.tokens.refreshToken);
      }
      
      return authResponse;
    } catch (error: any) {
      // If refresh fails, clear stored tokens
      this.logout();
      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const userProfile = await apiClient.get<UserProfile>(`${this.baseUrl}/me`);
      return userProfile;
    } catch (error: any) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(updateData: ProfileUpdateData): Promise<UserProfile | null> {
    try {
      const userProfile = await apiClient.put<UserProfile>(
        `${this.baseUrl}/me`,
        updateData
      );
      return userProfile;
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordData): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        `${this.baseUrl}/change-password`,
        passwordData
      );
      return { success: true, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        error: 'Password change failed'
      };
    }
  }

  /**
   * Verify user email (admin only or self)
   */
  async verifyEmail(userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        `${this.baseUrl}/verify-email/${userId}`
      );
      return { success: true, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        error: 'Email verification failed'
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/logout`);
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear stored data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  /**
   * Get stored user data
   */
  getStoredUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Set access token (for testing or manual token management)
   */
  setAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
  }
}

export const authService = new AuthService();
