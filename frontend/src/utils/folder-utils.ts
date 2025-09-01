import { Folder } from '@/types/folder-types';
import { Folder as FolderType, FileItem, NoteFolder, Note } from '@/types/knowledge-types';

/**
 * Convert flat folder array to hierarchical structure
 */
export function buildFolderHierarchy(folders: Folder[]): FolderType[] {
  const folderMap = new Map<string, FolderType>();
  const rootFolders: FolderType[] = [];

  // First pass: create folder objects
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      type: 'folder',
      children: []
    });
  });

  // Second pass: build hierarchy
  folders.forEach(folder => {
    const folderNode = folderMap.get(folder.id)!;
    
    if (folder.parentId && folderMap.has(folder.parentId)) {
      // This is a child folder
      const parentFolder = folderMap.get(folder.parentId)!;
      parentFolder.children = parentFolder.children || [];
      parentFolder.children.push(folderNode);
    } else {
      // This is a root folder
      rootFolders.push(folderNode);
    }
  });

  return rootFolders;
}

/**
 * Convert flat folder array to hierarchical note folder structure
 */
export function buildNoteFolderHierarchy(folders: Folder[]): NoteFolder[] {
  const folderMap = new Map<string, NoteFolder>();
  const rootFolders: NoteFolder[] = [];

  // First pass: create folder objects
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      type: 'folder',
      children: []
    });
  });

  // Second pass: build hierarchy
  folders.forEach(folder => {
    const folderNode = folderMap.get(folder.id)!;
    
    if (folder.parentId && folderMap.has(folder.parentId)) {
      // This is a child folder
      const parentFolder = folderMap.get(folder.parentId)!;
      parentFolder.children = parentFolder.children || [];
      parentFolder.children.push(folderNode);
    } else {
      // This is a root folder
      rootFolders.push(folderNode);
    }
  });

  return rootFolders;
}

/**
 * Convert hierarchical folder structure to flat array
 */
export function flattenFolderHierarchy(folders: FolderType[]): FolderType[] {
  const result: FolderType[] = [];
  
  function traverse(folderList: FolderType[], parentId?: string) {
    folderList.forEach(folder => {
      const flatFolder: FolderType = {
        ...folder,
        parentId
      };
      result.push(flatFolder);
      
      if (folder.children && folder.children.length > 0) {
        traverse(folder.children, folder.id);
      }
    });
  }
  
  traverse(folders);
  return result;
}

/**
 * Find a folder by ID in hierarchical structure
 */
export function findFolderById(folders: FolderType[], folderId: string): FolderType | null {
  for (const folder of folders) {
    if (folder.id === folderId) {
      return folder;
    }
    
    if (folder.children && folder.children.length > 0) {
      const found = findFolderById(folder.children, folderId);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

/**
 * Find a note folder by ID in hierarchical structure
 */
export function findNoteFolderById(folders: NoteFolder[], folderId: string): NoteFolder | null {
  for (const folder of folders) {
    if (folder.id === folderId) {
      return folder;
    }
    
    if (folder.children && folder.children.length > 0) {
      const found = findNoteFolderById(folder.children, folderId);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

/**
 * Get all files from hierarchical folder structure
 */
export function getAllFilesFromHierarchy(folders: FolderType[]): FileItem[] {
  const files: FileItem[] = [];
  
  function traverse(folderList: FolderType[]) {
    folderList.forEach(folder => {
      if (folder.children) {
        folder.children.forEach(child => {
          if (child.type === 'file') {
            files.push(child as FileItem);
          } else if (child.type === 'folder') {
            traverse([child]);
          }
        });
      }
    });
  }
  
  traverse(folders);
  return files;
}

/**
 * Get files in a specific folder
 */
export function getFilesInFolderFromHierarchy(folders: FolderType[], folderId: string): FileItem[] {
  const folder = findFolderById(folders, folderId);
  if (!folder || !folder.children) {
    return [];
  }
  
  return folder.children.filter(child => child.type === 'file') as FileItem[];
}

/**
 * Sort folders alphabetically
 */
export function sortFolders(folders: FolderType[]): FolderType[] {
  return folders.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Sort note folders alphabetically
 */
export function sortNoteFolders(folders: NoteFolder[]): NoteFolder[] {
  return folders.sort((a, b) => a.name.localeCompare(b.name));
}
