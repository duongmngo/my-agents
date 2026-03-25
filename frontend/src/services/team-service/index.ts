/**
 * Team Management Service
 * Handles workspace member operations
 */

import { apiClient } from "../api-client";

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
}

export interface MemberAddByEmailRequest {
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
}

export interface MemberUpdateRoleRequest {
  role: "owner" | "admin" | "member" | "viewer";
}

export interface MembersListResponse {
  members: WorkspaceMember[];
}

class TeamService {
  /**
   * Get all members of a workspace
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await apiClient.get<MembersListResponse>(
      `/api/v1/workspaces/${workspaceId}/members`
    );
    return response.members;
  }

  /**
   * Add a member to workspace by email
   */
  async addMemberByEmail(
    workspaceId: string,
    data: MemberAddByEmailRequest
  ): Promise<WorkspaceMember> {
    return apiClient.post<WorkspaceMember>(
      `/api/v1/workspaces/${workspaceId}/members/invite`,
      data
    );
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: MemberUpdateRoleRequest["role"]
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.put<{ success: boolean; message: string }>(
      `/api/v1/workspaces/${workspaceId}/members/${userId}`,
      { role }
    );
  }

  /**
   * Remove a member from workspace
   */
  async removeMember(
    workspaceId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/api/v1/workspaces/${workspaceId}/members/${userId}`
    );
  }
}

export const teamService = new TeamService();
