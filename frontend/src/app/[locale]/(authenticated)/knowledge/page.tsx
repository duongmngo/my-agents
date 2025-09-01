'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Upload, 
  FileText, 
  Globe, 
  Database, 
  MoreVertical, 
  Download, 
  Trash2, 
  Folder,
  FolderPlus,
  File,
  Image,
  Video,
  Archive,
  Brain,
  Edit3,
  Eye,
  ChevronRight,
  ChevronDown,
  StickyNote,
  Sparkles
} from 'lucide-react';

import { KnowledgeTab, Folder as FolderType, Note, WebSource, NoteFolder } from '@/types/knowledge-types';
import { FolderTree } from '@/components/features/knowledge-base/folder-tree';
import { NoteFolderTree } from '@/components/features/knowledge-base/note-folder-tree';
import { FileList } from '@/components/features/knowledge-base/file-list';
import { NotesList } from '@/components/features/knowledge-base/notes-list';
import { 
  getAllFiles, 
  getFilesInFolder, 
  filterFiles, 
  filterNotes,
  getNotesInFolder
} from '@/utils/knowledge-utils';
import { buildFolderHierarchy, buildNoteFolderHierarchy, findFolderById } from '@/utils/folder-utils';
import { folderService } from '@/services/folder-service';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { 
  fileStructure, 
  notes, 
  notesFolders, 
  webSources 
} from '@/data/knowledge-mock-data';

export default function KnowledgePage() {
  const { currentWorkspace } = useWorkspaceStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNotesFolder, setSelectedNotesFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedNotesFolders, setExpandedNotesFolders] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<KnowledgeTab>('files');
  
  // API data states
  const [fileFolders, setFileFolders] = useState<FolderType[]>([]);
  const [noteFolders, setNoteFolders] = useState<NoteFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  
  // UI states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', folderId: '' });

  // Load folders based on active tab
  const loadFolders = useCallback(async () => {
    if (!currentWorkspace) return;    
    setIsLoadingFolders(true);
    try {
      if (activeTab === 'files') {
        const folders = await folderService.getFileFolders(currentWorkspace.id);
        const hierarchicalFolders = buildFolderHierarchy(folders);
        setFileFolders(hierarchicalFolders);
      } else if (activeTab === 'notes') {
        const folders = await folderService.getNoteFolders(currentWorkspace.id);
        const hierarchicalFolders = buildNoteFolderHierarchy(folders);
        setNoteFolders(hierarchicalFolders);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
      // Fallback to mock data
      if (activeTab === 'files') {
        setFileFolders(fileStructure);
      } else if (activeTab === 'notes') {
        setNoteFolders(notesFolders);
      }
    } finally {
      setIsLoadingFolders(false);
    }
  }, [currentWorkspace, activeTab]);

  // Load folders when tab changes or workspace changes
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // Get filtered data - only show files/notes from selected folders
  const allFiles = getAllFiles(fileFolders);
  const filesInSelectedFolder = selectedFolder ? getFilesInFolder(selectedFolder, fileFolders) : [];
  const filteredFiles = filterFiles(filesInSelectedFolder, searchTerm);
  
  // Use hierarchical structure for notes
  const notesInSelectedFolder = selectedNotesFolder ? getNotesInFolder(selectedNotesFolder, noteFolders) : [];
  const filteredNotes = filterNotes(notesInSelectedFolder, searchTerm, selectedNotesFolder);

  // Event handlers
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const toggleNotesFolder = (folderId: string) => {
    const newExpanded = new Set(expandedNotesFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedNotesFolders(newExpanded);
  };

  const handleFolderSelect = useCallback(async (folderId: string | null) => {
    if (activeTab === 'files') {
      setSelectedFolder(folderId);
      // Reload folders when selecting a folder
      if (folderId) {
        await loadFolders();
      }
    } else if (activeTab === 'notes') {
      setSelectedNotesFolder(folderId);
      // Reload folders when selecting a folder
      if (folderId) {
        await loadFolders();
      }
    }
  }, [activeTab, loadFolders]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      console.log('Creating folder:', newFolderName);
      setNewFolderName('');
      setShowCreateFolder(false);
    }
  };

  const handleCreateNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      console.log('Creating note:', newNote);
      setNewNote({ title: '', content: '', folderId: '' });
      setShowCreateNote(false);
    }
  };

  const handleEmbedFile = (fileId: string) => {
    console.log('Triggering embedding for file:', fileId);
  };

  const handleEmbedNote = (noteId: string) => {
    console.log('Triggering embedding for note:', noteId);
  };

  const handleViewFile = (fileId: string) => {
    console.log('Viewing file:', fileId);
  };

  const handleDownloadFile = (fileId: string) => {
    console.log('Downloading file:', fileId);
  };

  const handleDeleteFile = (fileId: string) => {
    console.log('Deleting file:', fileId);
  };

  const handleViewNote = (noteId: string) => {
    console.log('Viewing note:', noteId);
  };

  const handleEditNote = (noteId: string) => {
    console.log('Editing note:', noteId);
  };

  const handleDeleteNote = (noteId: string) => {
    console.log('Deleting note:', noteId);
  };

  // Handle tab change
  const handleTabChange = (tab: KnowledgeTab) => {
    setActiveTab(tab);
    // Clear selections when switching tabs
    setSelectedFolder(null);
    setSelectedNotesFolder(null);
    setExpandedFolders(new Set());
    setExpandedNotesFolders(new Set());
  };

  if (!currentWorkspace) {
    return (
      <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
        <div className="text-center py-12">
          <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Folder className="h-10 w-10 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            No workspace selected
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
            Please select a workspace to view the knowledge base
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Knowledge Base</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage your documents, notes, and knowledge sources</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowCreateNote(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300"
          >
            <StickyNote className="h-4 w-4" />
            <span>Create Note</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300">
            <Globe className="h-4 w-4" />
            <span>Add Web Source</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors">
            <Upload className="h-4 w-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Files</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{allFiles.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Brain className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Embedded</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {allFiles.filter(f => f.status === 'embedded').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <StickyNote className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Notes</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{notes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Globe className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Web Sources</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{webSources.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('files')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'files'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Files
          </button>
          <button
            onClick={() => handleTabChange('notes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notes'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <StickyNote className="h-4 w-4 inline mr-2" />
            Notes
          </button>
          <button
            onClick={() => handleTabChange('web-sources')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'web-sources'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <Globe className="h-4 w-4 inline mr-2" />
            Web Sources
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'files' && (
        <div className="flex space-x-6">
          {/* Folders Sidebar */}
          <div className="w-64 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Folders</h2>
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
                >
                  <FolderPlus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-2">
              {isLoadingFolders ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <FolderTree
                  folders={fileFolders}
                  selectedFolder={selectedFolder}
                  expandedFolders={expandedFolders}
                  onFolderSelect={handleFolderSelect}
                  onFolderToggle={toggleFolder}
                />
              )}
            </div>
          </div>

          {/* Files Area */}
          <div className="flex-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Files List */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedFolder ? 'Files in selected folder' : 'Select a folder to view files'}
                </h2>
              </div>
              <div className="p-6">
                {selectedFolder ? (
                  <FileList
                    files={filteredFiles}
                    onEmbedFile={handleEmbedFile}
                    onViewFile={handleViewFile}
                    onDownloadFile={handleDownloadFile}
                    onDeleteFile={handleDeleteFile}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <Folder className="h-10 w-10 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      Select a folder
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                      Choose a folder from the sidebar to view its files
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="flex space-x-6">
          {/* Notes Folders Sidebar */}
          <div className="w-64 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Note Folders</h2>
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
                >
                  <FolderPlus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-2">
              {isLoadingFolders ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <NoteFolderTree
                  folders={noteFolders}
                  selectedFolder={selectedNotesFolder}
                  expandedFolders={expandedNotesFolders}
                  onFolderSelect={handleFolderSelect}
                  onFolderToggle={toggleNotesFolder}
                />
              )}
            </div>
          </div>

          {/* Notes Area */}
          <div className="flex-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Notes List */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedNotesFolder ? noteFolders.find(f => f.id === selectedNotesFolder)?.name : 'Select a folder to view notes'}
                </h2>
              </div>
              <div className="p-6">
                {selectedNotesFolder ? (
                  <NotesList
                    notes={filteredNotes}
                    onEmbedNote={handleEmbedNote}
                    onViewNote={handleViewNote}
                    onEditNote={handleEditNote}
                    onDeleteNote={handleDeleteNote}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-primary-100 dark:bg-primary-900/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <StickyNote className="h-10 w-10 text-primary-500 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      Select a folder
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                      Choose a folder from the sidebar to view its notes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'web-sources' && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Web Sources</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">External websites and APIs for knowledge import</p>
          </div>
          <div className="p-6">
            {webSources.length > 0 ? (
              <div className="space-y-4">
                {webSources.map((source) => (
                  <div key={source.id} className="group flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 hover:shadow-sm">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-lg group-hover:bg-warning-200 dark:group-hover:bg-warning-900/30 transition-colors">
                        <Globe className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-50">{source.title}</h3>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 truncate">{source.url}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          Last synced: {new Date(source.lastSync).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        source.status === 'active' 
                          ? 'bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-400' 
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300'
                      }`}>
                        {source.status}
                      </span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 text-error-400 dark:text-error-400 hover:text-error-600 dark:hover:text-error-300 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                          title="Delete source"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-warning-100 dark:bg-warning-900/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Globe className="h-10 w-10 text-warning-500 dark:text-warning-400" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">No web sources yet</h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">Add web sources to automatically import and sync external knowledge</p>
                <button className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md">
                  <Globe className="h-4 w-4" />
                  <span>Add Web Source</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-md mx-4 border border-neutral-200 dark:border-neutral-700 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Create New Folder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      {showCreateNote && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-700 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Create New Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Content
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter note content..."
                  rows={8}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Folder
                </label>
                <select
                  value={newNote.folderId}
                  onChange={(e) => setNewNote(prev => ({ ...prev, folderId: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a folder (optional)</option>
                  {noteFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateNote(false)}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNote.title.trim() || !newNote.content.trim()}
                className="px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 