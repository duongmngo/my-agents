'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Upload, 
  FileText, 
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
  Sparkles,
  X
} from 'lucide-react';

import { KnowledgeTab, Folder as FolderType, Note, NoteFolder, KnowledgeFile } from '@/types/knowledge-types';
import { FolderTree } from '@/components/features/knowledge-base/folder-tree';
import { NoteFolderTree } from '@/components/features/knowledge-base/note-folder-tree';
import { FileList } from '@/components/features/knowledge-base/file-list';
import { KnowledgeFileList } from '@/components/features/knowledge-base/knowledge-file-list';
import { FileUpload } from '@/components/features/knowledge-base/file-upload';
import { NotesList } from '@/components/features/knowledge-base/notes-list';
import { useKnowledgeFiles } from '@/hooks/use-knowledge-files';
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
import { useToast } from '@/components/common/toast';
import { showErrorToast, showSuccessToast } from '@/utils/error-handler';
import { useTranslations } from 'next-intl';
import { NoteDetailModal } from '@/components/features/knowledge-base/note-detail-modal';
import { 
  fileStructure, 
  notes, 
  notesFolders 
} from '@/data/knowledge-mock-data';

export default function KnowledgePage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { addToast } = useToast();
  const t = useTranslations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNotesFolder, setSelectedNotesFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [expandedNotesFolders, setExpandedNotesFolders] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<KnowledgeTab>('files');
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  // Knowledge files hook
  const {
    files: knowledgeFiles,
    loading: filesLoading,
    error: filesError,
    uploadState,
    supportedExtensions,
    maxFileSizeMb,
    hasMore: hasMoreFiles,
    totalFiles,
    globalTotalFiles,
    processedFilesCount,
    uploadFile: uploadKnowledgeFile,
    deleteFile: deleteKnowledgeFile,
    reprocessFile,
    loadMore: loadMoreFiles,
    refreshFiles,
    clearError: clearFilesError,
  } = useKnowledgeFiles({
    workspaceId: currentWorkspace?.id || '',
    folderId: selectedFolder || undefined,
    autoLoad: !!currentWorkspace && activeTab === 'files',
  });
  
  // API data states
  const [fileFolders, setFileFolders] = useState<FolderType[]>([]);
  const [noteFolders, setNoteFolders] = useState<NoteFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  
  // UI states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createAsRoot, setCreateAsRoot] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteModalMode, setNoteModalMode] = useState<'view' | 'edit' | 'create'>('create');
  const [selectedNote, setSelectedNote] = useState<NoteResponse | undefined>();
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [totalNotesCount, setTotalNotesCount] = useState<number>(0);
  const [embeddedNotesCount, setEmbeddedNotesCount] = useState<number>(0);

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

  // Load total notes count for statistics (all folders)
  const loadTotalNotesCount = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      // Use dedicated count API
      const response = await noteService.getNotesCount(currentWorkspace.id);
      setTotalNotesCount(response.total);
      setEmbeddedNotesCount(response.embedded);
    } catch (error) {
      console.error('Failed to load total notes count:', error);
      setTotalNotesCount(0);
      setEmbeddedNotesCount(0);
    }
  }, [currentWorkspace]);

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

  // Load total notes count when workspace changes (for statistics)
  useEffect(() => {
    loadTotalNotesCount();
  }, [loadTotalNotesCount]);

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
        console.error('❌ Unknown tab');
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
      setCreateAsRoot(false);
      
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
        // Fetch the updated note data to get complete embedding stats
        try {
          const updatedNote = await noteService.getNote(noteId);
          
          // Update the note with the complete data from backend
          setNotes(prev => prev.map((note) => 
            note.id === noteId ? updatedNote : note
          ));
          
          console.log('Note embedding completed successfully with updated stats');
          showSuccessToast(
            'EMBEDDING_COMPLETE',
            {
              noteTitle: notes[noteIndex]?.title || 'Unknown',
              provider: response.provider || 'the active provider'
            },
            addToast,
            t
          );
        } catch (refreshError) {
          console.error('Failed to refresh note data:', refreshError);
          // Fallback to basic update if refresh fails
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
          
          showSuccessToast(
            'EMBEDDING_COMPLETE',
            {
              noteTitle: notes[noteIndex]?.title || 'Unknown',
              provider: response.provider || 'the active provider'
            },
            addToast,
            t
          );
        }
      } else {
        // Handle error with error code
        showErrorToast(
          {
            message: response.message || 'Embedding failed',
            error_code: response.error_code
          },
          addToast,
          t
        );
        
        // Update the note with failed embedding status
        setNotes(prev => prev.map((note, index) => 
          index === noteIndex 
            ? { ...note, embeddingStatus: 'failed' as const }
            : note
        ));
      }
    } catch (error: any) {
      console.error('Failed to embed note:', error);
      
      // Update the note with failed embedding status
      setNotes(prev => prev.map((note, index) => 
        index === noteIndex 
          ? { ...note, embeddingStatus: 'failed' as const }
          : note
      ));
      
      // Show error toast for network or other errors
      showErrorToast(
        {
          message: error.message || 'Failed to embed note',
          error_code: 'NETWORK_ERROR'
        },
        addToast,
        t
      );
    }
  };

  const handleViewFile = (fileId: string) => {
    console.log('Viewing file:', fileId);
  };

  const handleDownloadFile = (fileId: string) => {
    console.log('Downloading file:', fileId);
  };

  const handleDeleteFile = async (fileId: string) => {
    const success = await deleteKnowledgeFile(fileId);
    if (success) {
      addToast({
        type: 'success',
        title: t('common.success'),
        message: t('knowledge.fileDeletedSuccess'),
      });
    } else {
      addToast({
        type: 'error',
        title: t('common.error'),
        message: t('knowledge.fileDeletedError'),
      });
    }
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

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note? This will also remove any embeddings.')) {
      return;
    }
    
    try {
      await noteService.deleteNote(noteId);
      // Update local state
      setNotes(prev => prev.filter(n => n.id !== noteId));
      setTotalNotesCount(prev => Math.max(0, prev - 1));
      // Update embedded count if the deleted note had embeddings
      const deletedNote = notes.find(n => n.id === noteId);
      if (deletedNote?.embeddingStats?.generated) {
        setEmbeddedNotesCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const handleNoteSave = (note: NoteResponse) => {
    if (noteModalMode === 'create') {
      setNotes(prev => [note, ...prev]);
      setTotalNotesCount(prev => prev + 1);
    } else {
      setNotes(prev => prev.map(n => n.id === note.id ? note : n));
    }
  };

  const handleNoteDelete = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    setTotalNotesCount(prev => Math.max(0, prev - 1));
  };

  // Function to refresh notes in current folder
  const refreshNotes = async () => {
    if (!currentWorkspace || !selectedNotesFolder) return;
    
    try {
      setIsLoadingNotes(true);
      const response = await noteService.getNotes(
        currentWorkspace.id,
        selectedNotesFolder,
        0,
        100 // Get more notes to ensure we have all data
      );
      
      if (response.notes) {
        setNotes(response.notes);
      }
    } catch (error) {
      console.error('Failed to refresh notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
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
          <button 
            onClick={() => setShowFileUpload(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors"
            disabled={!selectedFolder}
          >
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
              <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{globalTotalFiles}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Brain className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Processed</p>
              <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                {processedFilesCount}
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
              <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{totalNotesCount}</p>
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
                   onClick={() => {
                     setShowCreateFolder(true);
                     setCreateAsRoot(false);
                   }}
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
                {/* File Upload Modal */}
                {showFileUpload && selectedFolder && (
                  <div className="mb-6 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Upload File</h3>
                      <button
                        onClick={() => setShowFileUpload(false)}
                        className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <FileUpload
                      onUpload={async (file) => {
                        await uploadKnowledgeFile(file);
                        setShowFileUpload(false);
                      }}
                      supportedExtensions={supportedExtensions}
                      maxFileSizeMb={maxFileSizeMb}
                      isUploading={uploadState.isUploading}
                      uploadProgress={uploadState.progress}
                    />
                  </div>
                )}

                {/* Error message */}
                {filesError && (
                  <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-error-700 dark:text-error-300">{filesError}</span>
                    <button onClick={clearFilesError} className="text-error-500 hover:text-error-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {selectedFolder && knowledgeFiles.length > 0 ? (
                  <KnowledgeFileList
                    files={knowledgeFiles}
                    loading={filesLoading}
                    onReprocess={reprocessFile}
                    onDelete={handleDeleteFile}
                    onLoadMore={loadMoreFiles}
                    hasMore={hasMoreFiles}
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
                        onClick={() => setShowFileUpload(true)}
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
                   onClick={() => {
                     setShowCreateFolder(true);
                     setCreateAsRoot(false);
                   }}
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
               
               {/* Bulk Actions */}
               {selectedNotesFolder && (
                 <div className="flex items-center space-x-2">
                   <button
                     onClick={refreshNotes}
                     disabled={isLoadingNotes}
                     className="flex items-center space-x-2 px-4 py-2 bg-neutral-600 dark:bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                     title="Refresh notes"
                   >
                     <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                     <span>Refresh</span>
                   </button>
                   {filteredNotes.some(note => !note.isEmbedded || (note.updatedAt && note.lastEmbeddedAt && new Date(note.updatedAt) > new Date(note.lastEmbeddedAt))) && (
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
                 
                 return (
                   <>
                     {selectedFolderName ? (
                       <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                         <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Parent Folder:</p>
                         <div className="flex items-center justify-between">
                           <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
                             <Folder className="h-4 w-4 mr-2" />
                             {selectedFolderName}
                           </p>
                           <button
                             onClick={() => {
                               if (activeTab === 'files') {
                                 setSelectedFolder(null);
                               } else if (activeTab === 'notes') {
                                 setSelectedNotesFolder(null);
                               }
                             }}
                             className="p-1 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                             title="Remove parent folder (create as root-level)"
                           >
                             <X className="h-4 w-4" />
                           </button>
                         </div>
                       </div>
                     ) : (
                       <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                         <p className="text-sm text-neutral-600 dark:text-neutral-400">This will be a root-level folder</p>
                       </div>
                     )}
                   </>
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
                 onClick={() => {
                   setShowCreateFolder(false);
                   setCreateAsRoot(false);
                 }}
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