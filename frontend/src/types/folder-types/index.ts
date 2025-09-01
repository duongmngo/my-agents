export type FolderCategory = 'FILES' | 'NOTES';

export interface Folder {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  parentId?: string;
  path?: string;
  level?: number;
  color?: string;
  icon?: string;
  isPrivate?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  category: FolderCategory;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderCreateRequest {
  name: string;
  description?: string;
  parentId?: string;
  workspaceId: string;
  color?: string;
  icon?: string;
  category?: FolderCategory;
}

export interface FolderUpdateRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  category?: FolderCategory;
}

export interface FolderListResponse {
  folders: Folder[];
  total: number;
}

export interface FolderCreateResponse {
  success: boolean;
  folder: Folder;
  message: string;
}

export interface FolderDeleteResponse {
  success: boolean;
  message: string;
}

export interface FolderBreadcrumb {
  name: string;
  path: string;
}

export interface FolderSearchResponse {
  folders: Folder[];
  total: number;
}

export interface FolderMoveRequest {
  newParentId?: string;
}

export interface FolderTreeNode extends Folder {
  children?: FolderTreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

// Knowledge Base specific types
export interface KnowledgeBaseFolderRequest {
  workspaceId: string;
  category: FolderCategory;
}

export interface KnowledgeBaseFolderResponse {
  folders: Folder[];
  total: number;
}
