import { useState, useEffect, useCallback } from 'react';
import { fileService } from '../../services/file-service';
import {
  KnowledgeFile,
  FileStatus,
  SupportedExtensionsResponse,
} from '../../types/knowledge-types';

interface UseKnowledgeFilesOptions {
  workspaceId: string;
  folderId?: string;
  autoLoad?: boolean;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  filename?: string;
  error?: string;
}

interface UseKnowledgeFilesReturn {
  // State
  files: KnowledgeFile[];
  loading: boolean;
  error: string | null;
  uploadState: UploadState;
  supportedExtensions: string[];
  maxFileSizeMb: number;
  hasMore: boolean;
  totalFiles: number;
  globalTotalFiles: number;  // Total files count across all folders (for statistics)
  processedFilesCount: number;  // Count of processed files (for statistics)

  // Actions
  loadFiles: (page?: number) => Promise<void>;
  uploadFile: (
    file: File,
    options?: { tags?: string; description?: string }
  ) => Promise<KnowledgeFile | null>;
  deleteFile: (fileId: string) => Promise<boolean>;
  reprocessFile: (fileId: string) => Promise<KnowledgeFile | null>;
  updateFile: (
    fileId: string,
    data: { tags?: string; description?: string; folder_id?: string }
  ) => Promise<KnowledgeFile | null>;
  loadMore: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  refreshCounts: () => Promise<void>;  // Refresh statistics counts
  clearError: () => void;
}

export function useKnowledgeFiles({
  workspaceId,
  folderId,
  autoLoad = true,
}: UseKnowledgeFilesOptions): UseKnowledgeFilesReturn {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
  });
  const [supportedExtensions, setSupportedExtensions] = useState<string[]>([]);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [globalTotalFiles, setGlobalTotalFiles] = useState(0);
  const [processedFilesCount, setProcessedFilesCount] = useState(0);
  const PAGE_SIZE = 20;

  // Load supported extensions on mount
  useEffect(() => {
    async function loadExtensions() {
      try {
        const response = await fileService.getSupportedExtensions();
        setSupportedExtensions(response.extensions);
        // maxFileSizeMb defaults to 50, not returned from API
      } catch (err) {
        console.error('Failed to load supported extensions:', err);
        // Default fallback
        setSupportedExtensions(['txt', 'md', 'pdf', 'docx']);
      }
    }
    loadExtensions();
  }, []);

  // Load files
  const loadFiles = useCallback(
    async (page: number = 1) => {
      if (!workspaceId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fileService.getFiles(workspaceId, {
          folderId,
          page,
          pageSize: PAGE_SIZE,
        });

        if (page === 1) {
          setFiles(response.files);
        } else {
          setFiles((prev) => [...prev, ...response.files]);
        }

        setCurrentPage(page);
        // Calculate hasMore from skip, limit, and total
        const loadedCount = response.skip + response.files.length;
        setHasMore(loadedCount < response.total);
        setTotalFiles(response.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load files');
        console.error('Error loading files:', err);
      } finally {
        setLoading(false);
      }
    },
    [workspaceId, folderId]
  );

  // Load global file counts (for statistics - independent of folder selection)
  const loadGlobalCounts = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const response = await fileService.getFilesCount(workspaceId);
      setGlobalTotalFiles(response.total);
      setProcessedFilesCount(response.processed);
    } catch (err) {
      console.error('Error loading file counts:', err);
    }
  }, [workspaceId]);

  // Auto-load files
  useEffect(() => {
    if (autoLoad && workspaceId) {
      loadFiles(1);
    }
  }, [autoLoad, workspaceId, folderId, loadFiles]);

  // Load global counts on workspace change
  useEffect(() => {
    if (workspaceId) {
      loadGlobalCounts();
    }
  }, [workspaceId, loadGlobalCounts]);

  // Upload file
  const uploadFile = useCallback(
    async (
      file: File,
      options?: { tags?: string; description?: string }
    ): Promise<KnowledgeFile | null> => {
      if (!workspaceId) return null;

      // Validate file extension
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (supportedExtensions.length > 0 && !supportedExtensions.includes(extension)) {
        setError(`File type .${extension} is not supported. Supported types: ${supportedExtensions.join(', ')}`);
        return null;
      }

      // Validate file size
      const fileSizeMb = file.size / (1024 * 1024);
      if (fileSizeMb > maxFileSizeMb) {
        setError(`File size (${fileSizeMb.toFixed(1)}MB) exceeds maximum allowed size (${maxFileSizeMb}MB)`);
        return null;
      }

      setUploadState({
        isUploading: true,
        progress: 0,
        filename: file.name,
      });
      setError(null);

      try {
        const uploadedFile = await fileService.uploadFile(
          workspaceId,
          file,
          folderId,
          options?.tags,
          options?.description,
          (progress) => {
            setUploadState((prev) => ({ ...prev, progress }));
          }
        );

        // Add to files list
        setFiles((prev) => [uploadedFile, ...prev]);
        setTotalFiles((prev) => prev + 1);
        setGlobalTotalFiles((prev) => prev + 1);

        setUploadState({ isUploading: false, progress: 100 });

        return uploadedFile;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
        setError(errorMessage);
        setUploadState({
          isUploading: false,
          progress: 0,
          error: errorMessage,
        });
        return null;
      }
    },
    [workspaceId, folderId, supportedExtensions, maxFileSizeMb]
  );

  // Delete file
  const deleteFile = useCallback(
    async (fileId: string): Promise<boolean> => {
      if (!workspaceId) return false;
      try {
        await fileService.deleteFile(fileId, workspaceId);
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        setTotalFiles((prev) => Math.max(0, prev - 1));
        setGlobalTotalFiles((prev) => Math.max(0, prev - 1));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete file');
        return false;
      }
    },
    [workspaceId]
  );

  // Reprocess file
  const reprocessFile = useCallback(
    async (fileId: string): Promise<KnowledgeFile | null> => {
      if (!workspaceId) return null;
      try {
        const updatedFile = await fileService.reprocessFile(fileId, workspaceId);
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? updatedFile : f))
        );
        return updatedFile;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reprocess file');
        return null;
      }
    },
    [workspaceId]
  );

  // Update file
  const updateFile = useCallback(
    async (
      fileId: string,
      data: { tags?: string; description?: string; folder_id?: string }
    ): Promise<KnowledgeFile | null> => {
      try {
        const updatedFile = await fileService.updateFile(fileId, data);
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? updatedFile : f))
        );
        return updatedFile;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update file');
        return null;
      }
    },
    []
  );

  // Load more
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await loadFiles(currentPage + 1);
    }
  }, [hasMore, loading, currentPage, loadFiles]);

  // Refresh files
  const refreshFiles = useCallback(async () => {
    await loadFiles(1);
  }, [loadFiles]);

  // Refresh counts (for statistics)
  const refreshCounts = useCallback(async () => {
    await loadGlobalCounts();
  }, [loadGlobalCounts]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    files,
    loading,
    error,
    uploadState,
    supportedExtensions,
    maxFileSizeMb,
    hasMore,
    totalFiles,
    globalTotalFiles,
    processedFilesCount,
    loadFiles,
    uploadFile,
    deleteFile,
    reprocessFile,
    updateFile,
    loadMore,
    refreshFiles,
    refreshCounts,
    clearError,
  };
}
