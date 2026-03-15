export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  type: 'folder';
  children?: (Folder | FileItem)[];
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file';
  fileType: 'document' | 'image' | 'video' | 'archive' | 'note';
  size: string;
  uploadedAt: string;
  folderId?: string;
  status: 'uploaded' | 'processing' | 'embedded' | 'failed';
  tags: string[];
  content?: string;
}

// KnowledgeFile types from backend API
export type FileStatus = 'pending' | 'processing' | 'processed' | 'failed';

export interface EmbeddingStats {
  chunkCount: number;
  model?: string;
  tokensProcessed?: number;
  latencyMs?: number;
  indexedAt?: string;
}

export interface KnowledgeFile {
  id: string;
  filename: string;
  originalFilename: string;
  fileType: string;
  mimeType?: string;
  fileSize: number;
  sizeDisplay: string;
  status: FileStatus;
  errorMessage?: string;
  characterCount: number;
  wordCount: number;
  pageCount?: number;
  isEmbedded: boolean;
  embeddingStats?: EmbeddingStats;
  folderId?: string;
  tags?: string;
  description?: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface KnowledgeFileUploadRequest {
  folderId?: string;
  tags?: string;
  description?: string;
}

export interface KnowledgeFileUpdateRequest {
  tags?: string;
  description?: string;
  folderId?: string;
}

export interface KnowledgeFileListResponse {
  files: KnowledgeFile[];
  total: number;
  skip: number;
  limit: number;
}

export interface SupportedExtensionsResponse {
  extensions: string[];
}

export interface KnowledgeFileUploadResponse {
  success: boolean;
  file: KnowledgeFile;
  message: string;
}

export interface KnowledgeFileCountResponse {
  total: number;
  processed: number;
  pending: number;
  failed: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'embedded';
  tags: string[];
  folderId?: string;
}

export interface WebSource {
  id: string;
  url: string;
  title: string;
  lastSync: string;
  status: 'active' | 'inactive';
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId?: string;
  type: 'folder';
  children?: (NoteFolder | Note)[];
}

export type KnowledgeTab = 'files' | 'notes';
