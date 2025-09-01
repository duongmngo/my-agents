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
import { buildFolderHierarchy, buildNoteFolderHierarchy, findFolderById, findNoteFolderById } from '@/utils/folder-utils';
import { folderService } from '@/services/folder-service';
import { noteService, NoteResponse } from '@/services/note-service';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { NoteDetailModal } from '@/components/features/knowledge-base/note-detail-modal';
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
  
  // UI states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteModalMode, setNoteModalMode] = useState<'view' | 'edit' | 'create'>('create');
  const [selectedNote, setSelectedNote] = useState<NoteResponse | undefined>();
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

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

  // Load notes when tab changes or workspace changes
  const loadNotes = useCallback(async () => {
    if (!currentWorkspace || activeTab !== 'notes') return;
    
    // Only load notes if a specific folder is selected
    if (!selectedNotesFolder) {
      setNotes([]);
      return;
    }
    
    setIsLoadingNotes(true);
    try {
      // Load notes from the selected folder
      const response = await noteService.getNotes(
        currentWorkspace.id,
        selectedNotesFolder
      );
      setNotes(response.notes);
    } catch (error) {
      console.error('Failed to load notes:', error);
      // Fallback to empty array
      setNotes([]);
    } finally {
      setIsLoadingNotes(false);
    }
  }, [currentWorkspace, activeTab, selectedNotesFolder]);

  // Load folders when tab changes or workspace changes
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // Load notes when notes tab is active or selected folder changes
  useEffect(() => {
    if (activeTab === 'notes') {
      loadNotes();
    }
  }, [loadNotes, activeTab]);

  // Get filtered data - only show files/notes from selected folders
  const allFiles = getAllFiles(fileFolders);
  const filesInSelectedFolder = selectedFolder ? getFilesInFolder(selectedFolder, fileFolders) : [];
  const filteredFiles = filterFiles(filesInSelectedFolder, searchTerm);
  
  // Filter notes by search term and folder (only show notes when folder is selected)
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Notes must be from the selected folder
    const matchesFolder = selectedNotesFolder ? note.folderId === selectedNotesFolder : false;
    
    return matchesSearch && matchesFolder;
  });

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

  const handleFolderSelect = useCallback((folderId: string | null) => {
    if (activeTab === 'files') {
      setSelectedFolder(folderId);
    } else if (activeTab === 'notes') {
      setSelectedNotesFolder(folderId);
    }
  }, [activeTab]);

  // Handle clicking outside folders to unselect
  const handleClickOutside = useCallback((event: React.MouseEvent) => {
    // Check if click is on folder tree or modal
    const target = event.target as HTMLElement;
    const isClickOnFolderTree = target.closest('.folder-tree-container');
    const isClickOnNoteFolderTree = target.closest('.note-folder-tree-container');
    const isClickOnModal = target.closest('.modal-overlay');
    
    // Only unselect if not clicking on folder tree or modal
    if (!isClickOnFolderTree && !isClickOnNoteFolderTree && !isClickOnModal) {
      if (activeTab === 'files') {
        setSelectedFolder(null);
      } else if (activeTab === 'notes') {
        setSelectedNotesFolder(null);
      }
    }
  }, [activeTab]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentWorkspace) return;
    
    // Debug: Log the current state before determining category
    console.log('=== CREATE FOLDER DEBUG ===');
    console.log('Current activeTab:', activeTab);
    console.log('selectedFolder:', selectedFolder);
    console.log('selectedNotesFolder:', selectedNotesFolder);
    console.log('newFolderName:', newFolderName);
    console.log('==========================');
    
    try {
      // Determine category and parent based on active tab
      let category: 'FILES' | 'NOTES';
      let parentId: string | null;
      
      if (activeTab === 'files') {
        category = 'FILES';
        parentId = selectedFolder;
        console.log('✅ Tab is FILES, category set to FILES');
      } else if (activeTab === 'notes') {
        category = 'NOTES';
        parentId = selectedNotesFolder;
        console.log('✅ Tab is NOTES, category set to NOTES');
      } else {
        // web-sources tab - folders cannot be created here
        console.error('❌ Cannot create folders in web-sources tab');
        alert('Folders can only be created in the Files or Notes tabs.');
        return;
      }
      
      // Validate that parent folder exists and has compatible category (if parent exists)
      if (parentId) {
        const parentFolder = category === 'FILES' 
          ? findFolderById(fileFolders, parentId)
          : findNoteFolderById(noteFolders, parentId);
        
        if (!parentFolder) {
          console.error('Parent folder not found. This may indicate a state synchronization issue.');
          console.log('Current state:', {
            activeTab,
            category,
            selectedFolder,
            selectedNotesFolder,
            parentId,
            fileFoldersCount: fileFolders.length,
            noteFoldersCount: noteFolders.length
          });
          alert('Error: Parent folder not found. Please refresh the page and try again.');
          return;
        }
        
        console.log(`Creating ${category} folder under parent folder:`, parentFolder.name);
      } else {
        console.log(`Creating root-level ${category} folder`);
      }
      
      const folderData = {
        name: newFolderName.trim(),
        workspaceId: currentWorkspace.id,
        category: category as 'FILES' | 'NOTES',
        parentId: parentId || undefined,
      };
      
      console.log('📤 FINAL PAYLOAD TO API:');
      console.log('folderData:', folderData);
      console.log('category type:', typeof category);
      console.log('category value:', category);
      console.log('==========================');
      
      await folderService.createFolder(folderData);
      
      // Reload folders to show the new folder
      await loadFolders();
      
      // Clear form and close modal
      setNewFolderName('');
      setShowCreateFolder(false);
      
      console.log('Folder created successfully');
    } catch (error) {
      console.error('Failed to create folder:', error);
      // TODO: Show error notification to user
    }
  };

  const handleCreateNote = () => {
    setNoteModalMode('create');
    setSelectedNote(undefined);
    setShowNoteModal(true);
  };

  const handleEmbedFile = (fileId: string) => {
    console.log('Triggering embedding for file:', fileId);
  };

  const handleEmbedNote = async (noteId: string) => {
    console.log('Triggering embedding for note:', noteId);
    
    // Find the note and update its embedding status
    const noteIndex = notes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return;
    
    // Update the note's embedding status to 'processing'
    setNotes(prev => prev.map((note, index) => 
      index === noteIndex 
        ? { ...note, embeddingStatus: 'processing' as const }
        : note
    ));
    
    try {
      // Call the actual embedding API
      const response = await noteService.triggerEmbedding(noteId);
      
      if (response.success) {
        // Update the note with successful embedding
        setNotes(prev => prev.map((note) => 
          note.id === noteId 
            ? { 
                ...note, 
                isEmbedded: true, 
                embeddingStatus: 'completed' as const,
                lastEmbeddedAt: new Date().toISOString()
              }
            : note
        ));
        
        console.log('Note embedding completed successfully');
      } else {
        throw new Error(response.message || 'Embedding failed');
      }
    } catch (error) {
      console.error('Failed to embed note:', error);
      
      // Update the note with failed embedding status
      setNotes(prev => prev.map((note, index) => 
        index === noteIndex 
          ? { ...note, embeddingStatus: 'failed' as const }
          : note
      ));
      
      // TODO: Show error notification to user
    }
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
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNote(note);
      setNoteModalMode('view');
      setShowNoteModal(true);
    }
  };

  const handleEditNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNote(note);
      setNoteModalMode('edit');
      setShowNoteModal(true);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    console.log('Deleting note:', noteId);
  };

  const handleNoteSave = (note: NoteResponse) => {
    if (noteModalMode === 'create') {
      setNotes(prev => [note, ...prev]);
    } else {
      setNotes(prev => prev.map(n => n.id === note.id ? note : n));
    }
  };

  const handleNoteDelete = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
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
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen" onClick={handleClickOutside}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Knowledge Base</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage your documents, notes, and knowledge sources</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Embedding Status Indicator */}
          {activeTab === 'notes' && selectedNotesFolder && notes.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <Sparkles className="h-4 w-4 text-primary-500 dark:text-primary-400" />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {notes.filter(n => n.isEmbedded).length}/{notes.length} notes embedded
              </span>
              {notes.some(n => n.embeddingStatus === 'processing') && (
                <div className="animate-pulse text-xs text-blue-500 dark:text-blue-400">
                  Processing...
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={handleCreateNote}
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
           <div className="w-64 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 folder-tree-container">
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
                  {selectedFolder 
                    ? fileFolders.find(f => f.id === selectedFolder)?.name 
                    : 'Select a folder to view files'
                  }
                </h2>
                {selectedFolder && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Showing files from selected folder
                  </p>
                )}
                {!selectedFolder && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Please select a folder to view its files
                  </p>
                )}
              </div>
              <div className="p-6">
                {selectedFolder && filteredFiles.length > 0 ? (
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
                      {!selectedFolder ? 'Select a folder' : (searchTerm ? 'No files found' : 'No files available')}
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                      {!selectedFolder 
                        ? 'Choose a folder from the sidebar to view its files'
                        : searchTerm 
                          ? 'Try adjusting your search terms'
                          : 'This folder is empty. Upload files to get started.'
                      }
                    </p>
                    {!searchTerm && selectedFolder && (
                      <button
                        onClick={() => {/* TODO: Implement file upload */}}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload File</span>
                      </button>
                    )}
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
           <div className="w-64 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 note-folder-tree-container">
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
             <div className="flex items-center space-x-3">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                 <input
                   type="text"
                   placeholder="Search notes..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                 />
               </div>
               
               {/* Bulk Embedding Button */}
               {selectedNotesFolder && filteredNotes.some(note => !note.isEmbedded || (note.updatedAt && note.lastEmbeddedAt && new Date(note.updatedAt) > new Date(note.lastEmbeddedAt))) && (
                 <button
                   onClick={() => {
                     const notesToEmbed = filteredNotes.filter(note => 
                       !note.isEmbedded || 
                       (note.updatedAt && note.lastEmbeddedAt && new Date(note.updatedAt) > new Date(note.lastEmbeddedAt))
                     );
                     notesToEmbed.forEach(note => handleEmbedNote(note.id));
                   }}
                   className="flex items-center space-x-2 px-4 py-2 bg-orange-600 dark:bg-orange-600 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-700 transition-colors"
                   title="Embed all notes that need embedding"
                 >
                   <Sparkles className="h-4 w-4" />
                   <span>Embed All</span>
                 </button>
               )}
             </div>

            {/* Notes List */}
            <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedNotesFolder 
                    ? noteFolders.find(f => f.id === selectedNotesFolder)?.name 
                    : 'Select a folder to view notes'
                  }
                </h2>
                {selectedNotesFolder && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Showing notes from selected folder
                  </p>
                )}
                {!selectedNotesFolder && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Please select a folder to view its notes
                  </p>
                )}
              </div>
              <div className="p-6">
                {filteredNotes.length > 0 ? (
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
                      {!selectedNotesFolder ? 'Select a folder' : (searchTerm ? 'No notes found' : 'No notes available')}
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                      {!selectedNotesFolder 
                        ? 'Choose a folder from the sidebar to view its notes'
                        : searchTerm 
                          ? 'Try adjusting your search terms or create a new note'
                          : 'This folder is empty. Create a new note to get started.'
                      }
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={handleCreateNote}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Note</span>
                      </button>
                    )}
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
         <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm modal-overlay">
           <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 w-full max-w-md mx-4 border border-neutral-200 dark:border-neutral-700 shadow-xl">
             <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Create New Folder</h3>
             <div className="space-y-4">
               {/* Parent Folder Info */}
               {(() => {
                 const selectedFolderId = activeTab === 'files' ? selectedFolder : selectedNotesFolder;
                 const selectedFolderName = selectedFolderId 
                   ? (activeTab === 'files' 
                       ? findFolderById(fileFolders, selectedFolderId)?.name
                       : findNoteFolderById(noteFolders, selectedFolderId)?.name)
                   : null;
                 
                 return selectedFolderName ? (
                   <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                     <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Parent Folder:</p>
                     <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
                       <Folder className="h-4 w-4 mr-2" />
                       {selectedFolderName}
                     </p>
                   </div>
                 ) : (
                   <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                     <p className="text-sm text-neutral-600 dark:text-neutral-400">This will be a root-level folder</p>
                   </div>
                 );
               })()}
               
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

      {/* Note Detail Modal */}
      <NoteDetailModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        note={selectedNote}
        mode={noteModalMode}
        workspaceId={currentWorkspace?.id || ''}
        folderId={selectedNotesFolder || undefined}
        onSave={handleNoteSave}
        onDelete={handleNoteDelete}
      />
    </div>
  );
} 