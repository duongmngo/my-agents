import { apiClient } from '../api-client';

// ==================== Types ====================

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  timezone: string;
  language: string;
  lastLogin?: string;
  passwordChangedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface AvatarUploadResponse {
  success: boolean;
  avatarUrl: string;
  message: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
}

export interface UserSearchResult {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
  total: number;
  skip: number;
  limit: number;
}

// ==================== Service ====================

class UserService {
  private readonly baseUrl = '/api/v1/users';

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>(`${this.baseUrl}/me`);
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: ProfileUpdateData): Promise<UserProfile> {
    return apiClient.put<UserProfile>(`${this.baseUrl}/me`, data);
  }

  /**
   * Change current user's password
   */
  async changePassword(data: PasswordChangeData): Promise<PasswordChangeResponse> {
    return apiClient.put<PasswordChangeResponse>(`${this.baseUrl}/me/password`, data);
  }

  /**
   * Upload avatar image
   * @param file - Image file to upload (JPEG, PNG, or WebP)
   */
  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.upload<AvatarUploadResponse>(`${this.baseUrl}/me/avatar`, formData);
  }

  /**
   * Search users by email, username, or name (for adding workspace members)
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserSearchResponse> {
    return apiClient.get<UserSearchResponse>(
      `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserProfile> {
    return apiClient.get<UserProfile>(`${this.baseUrl}/${userId}`);
  }
}

export const userService = new UserService();
export default userService;
