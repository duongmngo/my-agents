import { ApiResponse, Workspace, WorkspaceMember } from '@/types/common-types';
import { apiClient } from '@/services/api-client';

// Backend API response types (camelCase from API)
interface BackendWorkspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  color: string;
  icon?: string;
  avatarUrl?: string;
  isPrivate: boolean;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  userRole?: string;
}

interface BackendWorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
}

interface BackendWorkspaceResponse {
  workspaces: BackendWorkspace[];
}

interface BackendWorkspaceMemberResponse {
  members: BackendWorkspaceMember[];
}

// Convert backend workspace to frontend workspace
const convertBackendWorkspace = (backendWorkspace: BackendWorkspace): Workspace => {
  return {
    id: backendWorkspace.id,
    name: backendWorkspace.name,
    description: backendWorkspace.description,
    createdBy: backendWorkspace.createdBy,
    isDefault: false, // Backend doesn't have this concept, we'll handle it in the store
    settings: {
      theme: 'light',
      primaryColor: backendWorkspace.color,
      secondaryColor: backendWorkspace.color
    },
    createdAt: backendWorkspace.createdAt,
    updatedAt: backendWorkspace.updatedAt,
    // Additional fields from backend
    slug: backendWorkspace.slug,
    color: backendWorkspace.color,
    icon: backendWorkspace.icon,
    avatarUrl: backendWorkspace.avatarUrl,
    isPrivate: backendWorkspace.isPrivate,
    isActive: backendWorkspace.isActive,
    isArchived: backendWorkspace.isArchived,
    userRole: backendWorkspace.userRole
  };
};

// Convert backend workspace member to frontend workspace member
const convertBackendWorkspaceMember = (backendMember: BackendWorkspaceMember): WorkspaceMember => {
  return {
    id: backendMember.id,
    workspaceId: backendMember.workspaceId,
    userId: backendMember.userId,
    role: backendMember.role as 'admin' | 'member' | 'viewer',
    permissions: getDefaultPermissions(backendMember.role),
    joinedAt: backendMember.createdAt,
    updatedAt: backendMember.createdAt,
    // Additional fields from backend
    isActive: backendMember.isActive,
    user: backendMember.user ? {
      id: backendMember.user.id,
      email: backendMember.user.email,
      name: backendMember.user.fullName,
      avatar: backendMember.user.avatarUrl
    } : undefined
  };
};

// Get default permissions based on role
const getDefaultPermissions = (role: string) => {
  switch (role) {
    case 'owner':
    case 'admin':
      return {
        canManageAgents: true,
        canManageKnowledge: true,
        canManageFiles: true,
        canManageSettings: true,
        canInviteMembers: true,
        canViewAnalytics: true,
      };
    case 'member':
      return {
        canManageAgents: true,
        canManageKnowledge: true,
        canManageFiles: true,
        canManageSettings: false,
        canInviteMembers: false,
        canViewAnalytics: true,
      };
    case 'viewer':
      return {
        canManageAgents: false,
        canManageKnowledge: false,
        canManageFiles: false,
        canManageSettings: false,
        canInviteMembers: false,
        canViewAnalytics: true,
      };
    default:
      return {
        canManageAgents: false,
        canManageKnowledge: false,
        canManageFiles: false,
        canManageSettings: false,
        canInviteMembers: false,
        canViewAnalytics: false,
      };
  }
};

class WorkspaceService {
  // Get all workspaces for the current user
  async getUserWorkspaces(): Promise<ApiResponse<Workspace[]>> {
    try {
      const response = await apiClient.get<BackendWorkspaceResponse>('/api/v1/workspaces/');
      
      const workspaces = response.workspaces.map(convertBackendWorkspace);
      
      return {
        success: true,
        data: workspaces
      };
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      return {
        success: false,
        error: 'Failed to fetch workspaces'
      };
    }
  }

  // Get workspace by ID
  async getWorkspace(workspaceId: string): Promise<ApiResponse<Workspace>> {
    try {
      const response = await apiClient.get<BackendWorkspace>(`/api/v1/workspaces/${workspaceId}`);
      
      const workspace = convertBackendWorkspace(response);
      
      return {
        success: true,
        data: workspace
      };
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
      return {
        success: false,
        error: 'Workspace not found'
      };
    }
  }

  // Create new workspace
  async createWorkspace(data: {
    name: string;
    description?: string;
    slug?: string;
    isPrivate?: boolean;
    color?: string;
    icon?: string;
  }): Promise<ApiResponse<Workspace>> {
    try {
      const response = await apiClient.post<BackendWorkspace>('/api/v1/workspaces/', data);
      
      const workspace = convertBackendWorkspace(response);
      
      return {
        success: true,
        data: workspace
      };
    } catch (error) {
      console.error('Failed to create workspace:', error);
      return {
        success: false,
        error: 'Failed to create workspace'
      };
    }
  }

  // Update workspace
  async updateWorkspace(workspaceId: string, data: {
    name?: string;
    description?: string;
    slug?: string;
    isPrivate?: boolean;
    color?: string;
    icon?: string;
  }): Promise<ApiResponse<Workspace>> {
    try {
      const response = await apiClient.put<BackendWorkspace>(`/api/v1/workspaces/${workspaceId}`, data);
      
      const workspace = convertBackendWorkspace(response);
      
      return {
        success: true,
        data: workspace
      };
    } catch (error) {
      console.error('Failed to update workspace:', error);
      return {
        success: false,
        error: 'Failed to update workspace'
      };
    }
  }

  // Delete workspace
  async deleteWorkspace(workspaceId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(`/api/v1/workspaces/${workspaceId}`);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      return {
        success: false,
        error: 'Failed to delete workspace'
      };
    }
  }

  // Get workspace members
  async getWorkspaceMembers(workspaceId: string): Promise<ApiResponse<WorkspaceMember[]>> {
    try {
      const response = await apiClient.get<BackendWorkspaceMemberResponse>(`/api/v1/workspaces/${workspaceId}/members`);
      
      const members = response.members.map(convertBackendWorkspaceMember);
      
      return {
        success: true,
        data: members
      };
    } catch (error) {
      console.error('Failed to fetch workspace members:', error);
      return {
        success: false,
        error: 'Failed to fetch workspace members'
      };
    }
  }

  // Add member to workspace
  async addMember(workspaceId: string, data: {
    userId: string;
    role: 'admin' | 'member' | 'viewer';
  }): Promise<ApiResponse<WorkspaceMember>> {
    try {
      const response = await apiClient.post<BackendWorkspaceMember>(`/api/v1/workspaces/${workspaceId}/members`, data);
      
      const member = convertBackendWorkspaceMember(response);
      
      return {
        success: true,
        data: member
      };
    } catch (error) {
      console.error('Failed to add member:', error);
      return {
        success: false,
        error: 'Failed to add member'
      };
    }
  }

  // Update member role
  async updateMemberRole(workspaceId: string, userId: string, role: 'admin' | 'member' | 'viewer'): Promise<ApiResponse<WorkspaceMember>> {
    try {
      await apiClient.put(`/api/v1/workspaces/${workspaceId}/members/${userId}`, {
        role: role
      });
      
      // Fetch updated member data
      const membersResponse = await this.getWorkspaceMembers(workspaceId);
      if (membersResponse.success && membersResponse.data) {
        const updatedMember = membersResponse.data.find(m => m.userId === userId);
        if (updatedMember) {
          return {
            success: true,
            data: updatedMember
          };
        }
      }
      
      return {
        success: false,
        error: 'Member not found'
      };
    } catch (error) {
      console.error('Failed to update member role:', error);
      return {
        success: false,
        error: 'Failed to update member role'
      };
    }
  }

  // Remove member from workspace
  async removeMember(workspaceId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(`/api/v1/workspaces/${workspaceId}/members/${userId}`);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Failed to remove member:', error);
      return {
        success: false,
        error: 'Failed to remove member'
      };
    }
  }

  // Archive workspace
  async archiveWorkspace(workspaceId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.post(`/api/v1/workspaces/${workspaceId}/archive`);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Failed to archive workspace:', error);
      return {
        success: false,
        error: 'Failed to archive workspace'
      };
    }
  }

  // Unarchive workspace
  async unarchiveWorkspace(workspaceId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.post(`/api/v1/workspaces/${workspaceId}/unarchive`);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Failed to unarchive workspace:', error);
      return {
        success: false,
        error: 'Failed to unarchive workspace'
      };
    }
  }

  // Search workspaces
  async searchWorkspaces(query: string, skip: number = 0, limit: number = 20): Promise<ApiResponse<Workspace[]>> {
    try {
      const response = await apiClient.get<BackendWorkspaceResponse>(`/api/v1/workspaces/search?q=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`);
      
      const workspaces = response.workspaces.map(convertBackendWorkspace);
      
      return {
        success: true,
        data: workspaces
      };
    } catch (error) {
      console.error('Failed to search workspaces:', error);
      return {
        success: false,
        error: 'Failed to search workspaces'
      };
    }
  }
}

export const workspaceService = new WorkspaceService();
