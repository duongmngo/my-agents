import { useState, useEffect, useCallback, useRef } from 'react';
import { folderService } from '../../services/folder-service';
import { Folder, FolderCreateRequest, FolderUpdateRequest, FolderTreeNode } from '../../types/folder-types';

interface UseFoldersOptions {
  workspaceId: string;
  autoLoad?: boolean;
}

interface UseFoldersReturn {
  // State
  folders: Folder[];
  folderTree: FolderTreeNode[];
  selectedFolder: Folder | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadFolders: (parentId?: string) => Promise<void>;
  loadFolderTree: () => Promise<void>;
  createFolder: (data: FolderCreateRequest) => Promise<Folder>;
  updateFolder: (folderId: string, data: FolderUpdateRequest) => Promise<Folder>;
  deleteFolder: (folderId: string) => Promise<void>;
  moveFolder: (folderId: string, newParentId?: string) => Promise<Folder>;
  searchFolders: (searchTerm: string) => Promise<Folder[]>;
  selectFolder: (folder: Folder | null) => void;
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  refreshFolders: () => Promise<void>;
}

export function useFolders({ workspaceId, autoLoad = true }: UseFoldersOptions): UseFoldersReturn {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const expandedFoldersRef = useRef<Set<string>>(new Set());

  // Keep the ref in sync with the state
  useEffect(() => {
    expandedFoldersRef.current = expandedFolders;
  }, [expandedFolders]);

  // Load folders for a specific parent
  const loadFolders = useCallback(async (parentId?: string) => {
    if (!workspaceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await folderService.getFolders(workspaceId, parentId, false);
      setFolders(response.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
      console.error('Error loading folders:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Load complete folder tree
  const loadFolderTree = useCallback(async () => {
    if (!workspaceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const allFolders = await folderService.getFolderTree(workspaceId);
      
      // Convert flat list to tree structure
      const buildTree = (folders: Folder[], parentId?: string): FolderTreeNode[] => {
        const filtered = folders.filter(folder => folder.parentId === parentId);
        
        const treeNodes = filtered.map(folder => {
          const children = buildTree(folders, folder.id);
          return {
            ...folder,
            children,
            isExpanded: expandedFoldersRef.current.has(folder.id) || (parentId === undefined && children.length > 0),
            isLoading: false,
          };
        });
        return treeNodes;
      };
      
      const tree = buildTree(allFolders);
      setFolderTree(tree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder tree');
      console.error('Error loading folder tree:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Create a new folder
  const createFolder = useCallback(async (data: FolderCreateRequest): Promise<Folder> => {
    if (!workspaceId) throw new Error('Workspace ID is required');
    
    setError(null);
    
    try {
      const response = await folderService.createFolder({
        ...data,
        workspaceId,
      });
      
      // Refresh the folder list
      await refreshFolders();
      
      return response.folder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workspaceId]);

  // Update a folder
  const updateFolder = useCallback(async (folderId: string, data: FolderUpdateRequest): Promise<Folder> => {
    if (!workspaceId) throw new Error('Workspace ID is required');
    
    setError(null);
    
    try {
      const updatedFolder = await folderService.updateFolder(folderId, workspaceId, data);
      
      // Update the folder in the list
      setFolders(prev => prev.map(folder => 
        folder.id === folderId ? updatedFolder : folder
      ));
      
      // Update the folder tree
      const updateFolderInTree = (tree: FolderTreeNode[]): FolderTreeNode[] => {
        return tree.map(node => {
          if (node.id === folderId) {
            return { ...node, ...updatedFolder };
          }
          if (node.children) {
            return { ...node, children: updateFolderInTree(node.children) };
          }
          return node;
        });
      };
      
      setFolderTree(prev => updateFolderInTree(prev));
      
      return updatedFolder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workspaceId]);

  // Delete a folder
  const deleteFolder = useCallback(async (folderId: string): Promise<void> => {
    if (!workspaceId) throw new Error('Workspace ID is required');
    
    setError(null);
    
    try {
      await folderService.deleteFolder(folderId, workspaceId);
      
      // Remove the folder from the list
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      
      // Remove from folder tree
      const removeFromTree = (tree: FolderTreeNode[]): FolderTreeNode[] => {
        return tree.filter(node => {
          if (node.id === folderId) return false;
          if (node.children) {
            node.children = removeFromTree(node.children);
          }
          return true;
        });
      };
      
      setFolderTree(prev => removeFromTree(prev));
      
      // Clear selection if the deleted folder was selected
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workspaceId, selectedFolder]);

  // Move a folder
  const moveFolder = useCallback(async (folderId: string, newParentId?: string): Promise<Folder> => {
    if (!workspaceId) throw new Error('Workspace ID is required');
    
    setError(null);
    
    try {
      const movedFolder = await folderService.moveFolder(folderId, workspaceId, { newParentId });
      
      // Refresh the folder tree to reflect the new structure
      await loadFolderTree();
      
      return movedFolder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [workspaceId, loadFolderTree]);

  // Search folders
  const searchFolders = useCallback(async (searchTerm: string): Promise<Folder[]> => {
    if (!workspaceId) return [];
    
    setError(null);
    
    try {
      const response = await folderService.searchFolders(workspaceId, searchTerm);
      return response.folders;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search folders';
      setError(errorMessage);
      return [];
    }
  }, [workspaceId]);

  // Select a folder
  const selectFolder = useCallback((folder: Folder | null) => {
    setSelectedFolder(folder);
  }, []);

  // Expand a folder in the tree
  const expandFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => new Set(Array.from(prev).concat([folderId])));
    
    // Update the tree to mark the folder as expanded
    const updateExpandedState = (tree: FolderTreeNode[]): FolderTreeNode[] => {
      return tree.map(node => {
        if (node.id === folderId) {
          return { ...node, isExpanded: true };
        }
        if (node.children) {
          return { ...node, children: updateExpandedState(node.children) };
        }
        return node;
      });
    };
    
    setFolderTree(prev => updateExpandedState(prev));
  }, []);

  // Collapse a folder in the tree
  const collapseFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.delete(folderId);
      return newSet;
    });
    
    // Update the tree to mark the folder as collapsed
    const updateExpandedState = (tree: FolderTreeNode[]): FolderTreeNode[] => {
      return tree.map(node => {
        if (node.id === folderId) {
          return { ...node, isExpanded: false };
        }
        if (node.children) {
          return { ...node, children: updateExpandedState(node.children) };
        }
        return node;
      });
    };
    
    setFolderTree(prev => updateExpandedState(prev));
  }, []);

  // Refresh all folders
  const refreshFolders = useCallback(async () => {
    try {
      await Promise.all([
        loadFolders(),
        loadFolderTree(),
      ]);
    } catch (error) {
      console.error('refreshFolders error:', error);
    }
  }, [loadFolders, loadFolderTree]);

  // Auto-load folders on mount
  useEffect(() => {
    if (autoLoad && workspaceId) {
      refreshFolders();
    }
  }, [workspaceId, autoLoad, refreshFolders]);

  return {
    // State
    folders,
    folderTree,
    selectedFolder,
    loading,
    error,
    
    // Actions
    loadFolders,
    loadFolderTree,
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
    searchFolders,
    selectFolder,
    expandFolder,
    collapseFolder,
    refreshFolders,
  };
}
