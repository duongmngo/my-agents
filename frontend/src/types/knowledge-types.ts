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
