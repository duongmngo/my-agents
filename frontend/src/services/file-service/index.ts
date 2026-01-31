import { apiClient } from '../api-client';

export class FileService {
  private static instance: FileService;

  private constructor() {}

  public static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  /**
   * Get count of files in workspace
   */
  async countFiles(workspaceId: string, folderId?: string): Promise<number> {
    const params = new URLSearchParams({ workspace_id: workspaceId });
    if (folderId) {
      params.append('folder_id', folderId);
    }
    const response = await apiClient.get<{ count: number }>(`/api/v1/files/count?${params.toString()}`);
    return response.count;
  }
}

// Export a singleton instance
export const fileService = FileService.getInstance();
