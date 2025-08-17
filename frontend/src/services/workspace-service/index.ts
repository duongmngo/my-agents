import { ApiResponse, Workspace, WorkspaceMember } from '@/types/common-types';
import { mockWorkspaces, mockWorkspaceMembers } from '@/utils/mock-data';

class WorkspaceService {
  // Get all workspaces for the current user
  async getUserWorkspaces(): Promise<ApiResponse<Workspace[]>> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        data: mockWorkspaces
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch workspaces'
      };
    }
  }

  // Get workspace by ID
  async getWorkspace(workspaceId: string): Promise<ApiResponse<Workspace>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const workspace = mockWorkspaces.find(w => w.id === workspaceId);
      
      if (!workspace) {
        return {
          success: false,
          error: 'Workspace not found'
        };
      }
      
      return {
        success: true,
        data: workspace
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch workspace'
      };
    }
  }

  // Create new workspace
  async createWorkspace(data: {
    name: string;
    description?: string;
  }): Promise<ApiResponse<Workspace>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newWorkspace: Workspace = {
        id: `workspace-${Date.now()}`,
        name: data.name,
        description: data.description,
        tenantId: 'tenant-1', // This would come from auth context
        createdBy: 'user-1', // This would come from auth context
        isDefault: false,
        settings: {
          theme: 'light',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: newWorkspace
      };
    } catch (error) {
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
    settings?: Partial<Workspace['settings']>;
  }): Promise<ApiResponse<Workspace>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const workspace = mockWorkspaces.find(w => w.id === workspaceId);
      
      if (!workspace) {
        return {
          success: false,
          error: 'Workspace not found'
        };
      }
      
      const updatedWorkspace: Workspace = {
        ...workspace,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: updatedWorkspace
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update workspace'
      };
    }
  }

  // Delete workspace
  async deleteWorkspace(workspaceId: string): Promise<ApiResponse<void>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const workspace = mockWorkspaces.find(w => w.id === workspaceId);
      
      if (!workspace) {
        return {
          success: false,
          error: 'Workspace not found'
        };
      }
      
      if (workspace.isDefault) {
        return {
          success: false,
          error: 'Cannot delete default workspace'
        };
      }
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete workspace'
      };
    }
  }

  // Get workspace members
  async getWorkspaceMembers(workspaceId: string): Promise<ApiResponse<WorkspaceMember[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const members = mockWorkspaceMembers.filter(m => m.workspaceId === workspaceId);
      
      return {
        success: true,
        data: members
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch workspace members'
      };
    }
  }

  // Invite member to workspace
  async inviteMember(workspaceId: string, data: {
    email: string;
    role: 'admin' | 'member' | 'viewer';
  }): Promise<ApiResponse<WorkspaceMember>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const newMember: WorkspaceMember = {
        id: `member-${Date.now()}`,
        workspaceId,
        userId: `user-${Date.now()}`,
        role: data.role,
        permissions: this.getDefaultPermissions(data.role),
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: newMember
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to invite member'
      };
    }
  }

  // Update member role
  async updateMemberRole(memberId: string, role: 'admin' | 'member' | 'viewer'): Promise<ApiResponse<WorkspaceMember>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const member = mockWorkspaceMembers.find(m => m.id === memberId);
      
      if (!member) {
        return {
          success: false,
          error: 'Member not found'
        };
      }
      
      const updatedMember: WorkspaceMember = {
        ...member,
        role,
        permissions: this.getDefaultPermissions(role),
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: updatedMember
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update member role'
      };
    }
  }

  // Remove member from workspace
  async removeMember(memberId: string): Promise<ApiResponse<void>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const member = mockWorkspaceMembers.find(m => m.id === memberId);
      
      if (!member) {
        return {
          success: false,
          error: 'Member not found'
        };
      }
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to remove member'
      };
    }
  }

  private getDefaultPermissions(role: 'admin' | 'member' | 'viewer') {
    switch (role) {
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
    }
  }
}

export const workspaceService = new WorkspaceService();
