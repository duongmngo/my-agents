import { apiClient } from '../api-client';
import {
  Folder,
  FolderCreateRequest,
  FolderUpdateRequest,
  FolderListResponse,
  FolderCreateResponse,
  FolderDeleteResponse,
  FolderBreadcrumb,
  FolderSearchResponse,
  FolderMoveRequest,
  FolderCategory,
  KnowledgeBaseFolderRequest,
  KnowledgeBaseFolderResponse,
} from '../../types/folder-types';

export class FolderService {
  private static instance: FolderService;

  private constructor() {}

  public static getInstance(): FolderService {
    if (!FolderService.instance) {
      FolderService.instance = new FolderService();
    }
    return FolderService.instance;
  }

  /**
   * Create a new folder
   */
  async createFolder(data: FolderCreateRequest): Promise<FolderCreateResponse> {
    return apiClient.post<FolderCreateResponse>('/api/v1/folders/', data);
  }

  /**
   * Get folders in a workspace
   */
  async getFolders(
    workspaceId: string,
    parentId?: string,
    includeChildren: boolean = false,
    category?: FolderCategory
  ): Promise<FolderListResponse> {
    const params = new URLSearchParams({
      workspaceId,
      includeChildren: includeChildren.toString(),
    });
    
    if (parentId) {
      params.append('parentId', parentId);
    }

    if (category) {
      params.append('category', category);
    }

    return apiClient.get<FolderListResponse>(`/api/v1/folders/?${params.toString()}`);
  }

  /**
   * Get knowledge base folders by category
   */
  async getKnowledgeBaseFolders(
    workspaceId: string,
    category: FolderCategory
  ): Promise<KnowledgeBaseFolderResponse> {
    const params = new URLSearchParams({
      workspaceId,
      category,
    });

    return apiClient.get<KnowledgeBaseFolderResponse>(`/api/v1/folders/knowledge-base?${params.toString()}`);
  }

  /**
   * Get a specific folder by ID
   */
  async getFolder(folderId: string, workspaceId: string): Promise<Folder> {
    return apiClient.get<Folder>(`/api/v1/folders/${folderId}?workspaceId=${workspaceId}`);
  }

  /**
   * Update a folder
   */
  async updateFolder(
    folderId: string,
    workspaceId: string,
    data: FolderUpdateRequest
  ): Promise<Folder> {
    return apiClient.put<Folder>(`/api/v1/folders/${folderId}?workspaceId=${workspaceId}`, data);
  }

  /**
   * Delete a folder
   */
  async deleteFolder(folderId: string, workspaceId: string): Promise<FolderDeleteResponse> {
    return apiClient.delete<FolderDeleteResponse>(`/api/v1/folders/${folderId}?workspaceId=${workspaceId}`);
  }

  /**
   * Move a folder to a new parent
   */
  async moveFolder(
    folderId: string,
    workspaceId: string,
    data: FolderMoveRequest
  ): Promise<Folder> {
    return apiClient.post<Folder>(`/api/v1/folders/${folderId}/move?workspaceId=${workspaceId}`, data);
  }

  /**
   * Get breadcrumb trail for a folder
   */
  async getFolderBreadcrumbs(folderId: string, workspaceId: string): Promise<{ breadcrumbs: FolderBreadcrumb[] }> {
    return apiClient.get<{ breadcrumbs: FolderBreadcrumb[] }>(`/api/v1/folders/${folderId}/breadcrumbs?workspaceId=${workspaceId}`);
  }

  /**
   * Search folders in a workspace
   */
  async searchFolders(
    workspaceId: string,
    searchTerm: string,
    skip: number = 0,
    limit: number = 100,
    category?: FolderCategory
  ): Promise<FolderSearchResponse> {
    const params = new URLSearchParams({
      workspaceId,
      searchTerm,
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (category) {
      params.append('category', category);
    }

    return apiClient.get<FolderSearchResponse>(`/api/v1/folders/search/?${params.toString()}`);
  }

  /**
   * Get complete folder tree for a workspace
   */
  async getFolderTree(workspaceId: string, category?: FolderCategory): Promise<Folder[]> {
    return this.getFolders(workspaceId, undefined, true, category).then(response => response.folders);
  }

  /**
   * Get root folders (folders without parent)
   */
  async getRootFolders(workspaceId: string, category?: FolderCategory): Promise<Folder[]> {
    return this.getFolders(workspaceId, undefined, false, category).then(response => response.folders);
  }

  /**
   * Get children of a specific folder
   */
  async getFolderChildren(workspaceId: string, parentId: string, category?: FolderCategory): Promise<Folder[]> {
    return this.getFolders(workspaceId, parentId, false, category).then(response => response.folders);
  }

  /**
   * Get file folders for knowledge base
   */
  async getFileFolders(workspaceId: string): Promise<Folder[]> {
    return this.getKnowledgeBaseFolders(workspaceId, 'FILES').then(response => response.folders);
  }

  /**
   * Get note folders for knowledge base
   */
  async getNoteFolders(workspaceId: string): Promise<Folder[]> {
    return this.getKnowledgeBaseFolders(workspaceId, 'NOTES').then(response => response.folders);
  }

  /**
   * Get count of folders in workspace
   */
  async countFolders(workspaceId: string, category?: FolderCategory): Promise<number> {
    const params = new URLSearchParams({ workspaceId });
    if (category) {
      params.append('category', category);
    }
    const response = await apiClient.get<{ count: number }>(`/api/v1/folders/count?${params.toString()}`);
    return response.count;
  }
}

// Export a singleton instance
export const folderService = FolderService.getInstance();
