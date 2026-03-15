import { apiClient } from '../api-client';
import {
  KnowledgeFile,
  KnowledgeFileListResponse,
  KnowledgeFileUploadResponse,
  KnowledgeFileUpdateRequest,
  SupportedExtensionsResponse,
  KnowledgeFileCountResponse,
} from '../../types/knowledge-types';

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
   * Get file counts for workspace statistics (uses dedicated count API)
   */
  async getFilesCount(workspaceId: string): Promise<KnowledgeFileCountResponse> {
    const params = new URLSearchParams({ workspaceId });
    return apiClient.get<KnowledgeFileCountResponse>(`/api/v1/knowledge-files/count?${params.toString()}`);
  }

  /**
   * Get total count of files in workspace (for dashboard stats)
   */
  async countFiles(workspaceId: string): Promise<number> {
    const response = await this.getFilesCount(workspaceId);
    return response.total;
  }

  /**
   * Upload a file to the knowledge base
   */
  async uploadFile(
    workspaceId: string,
    file: File,
    folderId?: string,
    tags?: string,
    description?: string,
    onProgress?: (progress: number) => void
  ): Promise<KnowledgeFile> {
    const additionalData: Record<string, string> = {
      workspaceId: workspaceId,
    };
    
    if (folderId) {
      additionalData.folderId = folderId;
    }
    if (tags) {
      additionalData.tags = tags;
    }
    if (description) {
      additionalData.description = description;
    }

    const response = await apiClient.uploadFile<KnowledgeFileUploadResponse>(
      '/api/v1/knowledge-files/upload',
      file,
      additionalData,
      onProgress
    );
    return response.file;
  }

  /**
   * Get list of knowledge files
   */
  async getFiles(
    workspaceId: string,
    options?: {
      folderId?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<KnowledgeFileListResponse> {
    const params = new URLSearchParams({ workspaceId });
    
    if (options?.folderId) {
      params.append('folderId', options.folderId);
    }
    if (options?.status) {
      params.append('status', options.status);
    }
    // Convert page/pageSize to skip/limit for API
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const skip = (page - 1) * pageSize;
    params.append('skip', skip.toString());
    params.append('limit', pageSize.toString());

    return apiClient.get<KnowledgeFileListResponse>(
      `/api/v1/knowledge-files/?${params.toString()}`
    );
  }

  /**
   * Get a single knowledge file by ID
   */
  async getFile(fileId: string): Promise<KnowledgeFile> {
    return apiClient.get<KnowledgeFile>(`/api/v1/knowledge-files/${fileId}`);
  }

  /**
   * Update a knowledge file
   */
  async updateFile(fileId: string, data: KnowledgeFileUpdateRequest): Promise<KnowledgeFile> {
    return apiClient.patch<KnowledgeFile>(`/api/v1/knowledge-files/${fileId}`, data);
  }

  /**
   * Delete a knowledge file
   */
  async deleteFile(fileId: string, workspaceId: string): Promise<void> {
    await apiClient.delete<void>(`/api/v1/knowledge-files/${fileId}?workspaceId=${workspaceId}`);
  }

  /**
   * Reprocess a file (re-extract text and regenerate embeddings)
   */
  async reprocessFile(fileId: string, workspaceId: string): Promise<KnowledgeFile> {
    return apiClient.post<KnowledgeFile>(`/api/v1/knowledge-files/${fileId}/reprocess?workspaceId=${workspaceId}`);
  }

  /**
   * Get supported file extensions
   */
  async getSupportedExtensions(): Promise<SupportedExtensionsResponse> {
    return apiClient.get<SupportedExtensionsResponse>('/api/v1/knowledge-files/supported-extensions');
  }
}

// Export a singleton instance
export const fileService = FileService.getInstance();
