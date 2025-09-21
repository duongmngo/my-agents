'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, Eye, EyeOff, Trash2, Pin } from 'lucide-react';
import { MarkdownEditor } from './markdown-editor';
import { MarkdownMessage } from '../chat-system/markdown-message';
import { NoteResponse } from '@/services/note-service';
import { noteService } from '@/services/note-service';
import { folderService } from '@/services/folder-service';
import { buildNoteFolderHierarchy } from '@/utils/folder-utils';
import { EmbeddingStatsComponent } from './embedding-stats';

interface NoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  note?: NoteResponse;
  mode: 'view' | 'edit' | 'create';
  workspaceId: string;
  folderId?: string;
  initialContent?: string;
  initialTitle?: string;
  onSave?: (note: NoteResponse) => void;
  onDelete?: (noteId: string) => void;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  isOpen,
  onClose,
  note,
  mode,
  workspaceId,
  folderId,
  initialContent,
  initialTitle,
  onSave,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<Array<{ id: string; name: string; path: string }>>([]);
  
  const [formData, setFormData] = useState({
    title: note?.title || initialTitle || '',
    content: note?.content || initialContent || '',
    folderId: note?.folderId || folderId || '',
    isPinned: note?.isPinned || false
  });

  // Load folders when modal opens
  useEffect(() => {
    if (isOpen && workspaceId) {
      loadFolders();
    }
  }, [isOpen, workspaceId]);

  // Load available note folders
  const loadFolders = async () => {
    if (!workspaceId) return;
    
    setIsLoadingFolders(true);
    try {
      const folders = await folderService.getNoteFolders(workspaceId);
      const hierarchicalFolders = buildNoteFolderHierarchy(folders);
      
      // Convert to flat array for dropdown
      const flatFolders = flattenFolderHierarchy(hierarchicalFolders);
      setAvailableFolders(flatFolders);
    } catch (error) {
      console.error('Failed to load folders:', error);
      // Fallback to empty array
      setAvailableFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  // Helper function to flatten hierarchical folders
  const flattenFolderHierarchy = (folders: any[]): Array<{ id: string; name: string; path: string }> => {
    const result: Array<{ id: string; name: string; path: string }> = [];
    
    const flatten = (folderList: any[], parentPath: string = '') => {
      folderList.forEach(folder => {
        const currentPath = parentPath ? `${parentPath} / ${folder.name}` : folder.name;
        result.push({
          id: folder.id,
          name: folder.name,
          path: currentPath
        });
        
        if (folder.children && folder.children.length > 0) {
          flatten(folder.children, currentPath);
        }
      });
    };
    
    flatten(folders);
    return result;
  };

  // Reset form when note changes
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content || '',
        folderId: note.folderId || '',
        isPinned: note.isPinned
      });
    } else if (mode === 'create') {
      setFormData({
        title: initialTitle || '',
        content: initialContent || '',
        folderId: folderId || '',
        isPinned: false
      });
    }
  }, [note, mode, folderId, initialTitle, initialContent]);

  // Reset editing state when mode changes
  useEffect(() => {
    setIsEditing(mode === 'edit' || mode === 'create');
  }, [mode]);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.folderId) {
      alert('Please fill in title, content, and select a folder');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'create') {
        const response = await noteService.createNote({
          title: formData.title.trim(),
          content: formData.content.trim(),
          workspaceId,
          folderId: formData.folderId // Now guaranteed to be a string
        });
        
        if (onSave) {
          onSave(response.note);
        }
        onClose();
      } else if (note && isEditing) {
        const response = await noteService.updateNote(note.id, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          folderId: formData.folderId || undefined,
          isPinned: formData.isPinned
        });
        
        if (onSave) {
          onSave(response);
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await noteService.deleteNote(note.id);
      if (onDelete) {
        onDelete(note.id);
      }
      onClose();
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePin = async () => {
    if (!note) return;
    
    setIsLoading(true);
    try {
      const response = await noteService.updateNote(note.id, {
        isPinned: !formData.isPinned
      });
      
      setFormData(prev => ({ ...prev, isPinned: !prev.isPinned }));
      
      if (onSave) {
        onSave(response);
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      alert('Failed to update note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = mode === 'create' ? 'Create New Note' : 
                    isEditing ? 'Edit Note' : 'View Note';

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {modalTitle}
            </h3>
            {note && (
              <button
                onClick={handleTogglePin}
                disabled={isLoading}
                className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
                title={formData.isPinned ? 'Unpin note' : 'Pin note'}
              >
                {formData.isPinned ? <Pin className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {note && mode !== 'create' && (
              <>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading}
                    className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    title="Edit note"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                    className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    title="View note"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="p-2 text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isEditing ? (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Folder Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Folder
                  </label>
                  <button
                    type="button"
                    onClick={loadFolders}
                    disabled={isLoadingFolders}
                    className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors disabled:opacity-50"
                    title="Refresh folders"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <select
                  value={formData.folderId}
                  onChange={(e) => setFormData(prev => ({ ...prev, folderId: e.target.value }))}
                  disabled={isLoadingFolders}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {isLoadingFolders ? 'Loading folders...' : 'Select a folder'}
                  </option>
                  {availableFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.path}
                    </option>
                  ))}
                </select>
                {isLoadingFolders && (
                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Loading available folders...
                  </div>
                )}
                {!isLoadingFolders && availableFolders.length === 0 && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No folders available. Please create a folder first.
                  </div>
                )}
                {!isLoadingFolders && (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {availableFolders.length} folder{availableFolders.length !== 1 ? 's' : ''} available
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // TODO: Implement folder creation modal or redirect to folder creation
                        alert('Please create a folder first from the knowledge base page');
                      }}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                    >
                      Create Folder
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Content
                </label>
                <MarkdownEditor
                  value={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  placeholder="Write your note content in markdown..."
                  rows={12}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading || !formData.title.trim() || !formData.content.trim() || !formData.folderId}
                  className="px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{mode === 'create' ? 'Create' : 'Save'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  {note?.title}
                </h2>
                {note && (
                  <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                    <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                    {note.updatedAt && note.updatedAt !== note.createdAt && (
                      <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                    )}
                    {note.isPinned && (
                      <span className="inline-flex items-center space-x-1 text-primary-600 dark:text-primary-400">
                        <Pin className="h-3 w-3" />
                        <span>Pinned</span>
                      </span>
                    )}
                  </div>
                )}
                
                {/* Note Metadata */}
                {note && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg mb-6">
                    {note.wordCount && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          {note.wordCount}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Words</div>
                      </div>
                    )}
                    {note.characterCount && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          {note.characterCount}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Characters</div>
                      </div>
                    )}
                    {note.format && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
                          {note.format}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Format</div>
                      </div>
                    )}
                    {note.category && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          {note.category}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Category</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Embedding Statistics */}
                {note && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                      Embedding Statistics
                    </h3>
                    <EmbeddingStatsComponent 
                      stats={note.embeddingStats}
                      status={note.embeddingStatus}
                      compact={false}
                      showDetails={true}
                    />
                  </div>
                )}
                
                {/* Excerpt */}
                {note?.excerpt && note.excerpt !== note.content && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      Summary
                    </h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {note.excerpt}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="prose prose-lg max-w-none">
                {note?.content ? (
                  <MarkdownMessage content={note.content} />
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400 italic">No content</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
