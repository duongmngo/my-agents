'use client';

import React, { useState } from 'react';
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

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  type: 'folder';
  children?: (Folder | FileItem)[];
}

interface FileItem {
  id: string;
  name: string;
  type: 'file';
  fileType: 'document' | 'image' | 'video' | 'archive' | 'note';
  size: string;
  uploadedAt: string;
  folderId?: string;
  status: 'uploaded' | 'processing' | 'embedded' | 'failed';
  tags: string[];
  content?: string; // For notes
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'embedded';
  tags: string[];
  folderId?: string;
}

export default function KnowledgePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNotesFolder, setSelectedNotesFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [activeTab, setActiveTab] = useState<'files' | 'notes' | 'web-sources'>('files');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', folderId: '' });

  // Mock data structure with folders and files
  const fileStructure: (Folder | FileItem)[] = [
    {
      id: 'root',
      name: 'Knowledge Base',
      type: 'folder',
      children: [
        {
          id: 'documents',
          name: 'Documents',
          type: 'folder',
          parentId: 'root',
          children: [
            {
              id: '1',
              name: 'Product Manual.pdf',
              type: 'file',
              fileType: 'document',
              size: '2.4 MB',
              uploadedAt: '2024-01-15T10:00:00Z',
              folderId: 'documents',
              status: 'embedded',
              tags: ['product', 'manual', 'documentation']
            },
            {
              id: '2',
              name: 'API Documentation.docx',
              type: 'file',
              fileType: 'document',
              size: '1.8 MB',
              uploadedAt: '2024-01-14T15:30:00Z',
              folderId: 'documents',
              status: 'embedded',
              tags: ['api', 'documentation', 'technical']
            }
          ]
        },
        {
          id: 'images',
          name: 'Images',
          type: 'folder',
          parentId: 'root',
          children: [
            {
              id: '3',
              name: 'screenshot.png',
              type: 'file',
              fileType: 'image',
              size: '1.2 MB',
              uploadedAt: '2024-01-14T15:30:00Z',
              folderId: 'images',
              status: 'uploaded',
              tags: ['screenshot', 'ui']
            }
          ]
        },
        {
          id: 'policies',
          name: 'Company Policies',
          type: 'folder',
          parentId: 'root',
          children: [
            {
              id: '4',
              name: 'Company Policies.pdf',
              type: 'file',
              fileType: 'document',
              size: '3.2 MB',
              uploadedAt: '2024-01-13T09:15:00Z',
              folderId: 'policies',
              status: 'processing',
              tags: ['policies', 'hr', 'company']
            }
          ]
        }
      ]
    }
  ];

  // Notes folder structure
  const notesFolders = [
    { id: 'meetings', name: 'Meeting Notes' },
    { id: 'technical', name: 'Technical Notes' },
    { id: 'ideas', name: 'Ideas & Concepts' },
    { id: 'research', name: 'Research' }
  ];

  const notes: Note[] = [
    {
      id: '1',
      title: 'Q1 Planning Meeting',
      content: 'Discussed Q1 goals and strategies for the upcoming quarter...',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      status: 'embedded',
      tags: ['meeting', 'planning', 'q1'],
      folderId: 'meetings'
    },
    {
      id: '2',
      title: 'System Architecture Decisions',
      content: 'System architecture decisions and implementation notes...',
      createdAt: '2024-01-14T15:30:00Z',
      updatedAt: '2024-01-14T15:30:00Z',
      status: 'draft',
      tags: ['technical', 'architecture'],
      folderId: 'technical'
    },
    {
      id: '3',
      title: 'AI Integration Ideas',
      content: 'Ideas for integrating AI features into the platform...',
      createdAt: '2024-01-13T12:00:00Z',
      updatedAt: '2024-01-13T12:00:00Z',
      status: 'draft',
      tags: ['ai', 'ideas', 'integration'],
      folderId: 'ideas'
    },
    {
      id: '4',
      title: 'Market Research Summary',
      content: 'Summary of recent market research findings...',
      createdAt: '2024-01-12T09:00:00Z',
      updatedAt: '2024-01-12T09:00:00Z',
      status: 'embedded',
      tags: ['research', 'market', 'analysis'],
      folderId: 'research'
    }
  ];

  const webSources = [
    {
      id: '1',
      url: 'https://example.com/docs',
      title: 'External Documentation',
      lastSync: '2024-01-15T08:00:00Z',
      status: 'active'
    },
    {
      id: '2',
      url: 'https://api.example.com',
      title: 'API Reference',
      lastSync: '2024-01-14T16:00:00Z',
      status: 'active'
    }
  ];

  // Helper functions
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return Image;
      case 'video': return Video;
      case 'archive': return Archive;
      case 'note': return StickyNote;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'embedded': return 'bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-400';
      case 'processing': return 'bg-warning-100 dark:bg-warning-900/20 text-warning-800 dark:text-warning-400';
      case 'uploaded': return 'bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-400';
      case 'failed': return 'bg-error-100 dark:bg-error-900/20 text-error-800 dark:text-error-400';
      default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'embedded': return 'Embedded';
      case 'processing': return 'Processing';
      case 'uploaded': return 'Uploaded';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  const getAllFiles = (items: (Folder | FileItem)[]): FileItem[] => {
    let files: FileItem[] = [];
    items.forEach(item => {
      if (item.type === 'file') {
        files.push(item);
      } else if (item.children) {
        files = [...files, ...getAllFiles(item.children)];
      }
    });
    return files;
  };

  const getFilesInFolder = (folderId: string | null): FileItem[] => {
    if (!folderId) {
      return getAllFiles(fileStructure);
    }
    
    const findFolder = (items: (Folder | FileItem)[]): Folder | null => {
      for (const item of items) {
        if (item.type === 'folder') {
          if (item.id === folderId) return item;
          if (item.children) {
            const found = findFolder(item.children);
            if (found) return found;
          }
        }
      }
      return null;
    };

    const folder = findFolder(fileStructure);
    if (folder && folder.children) {
      return folder.children.filter(item => item.type === 'file') as FileItem[];
    }
    return [];
  };

  const filteredFiles = getFilesInFolder(selectedFolder).filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFolder = selectedNotesFolder ? note.folderId === selectedNotesFolder : true;
    return matchesSearch && matchesFolder;
  });

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      // Here you would call API to create folder
      console.log('Creating folder:', newFolderName);
      setNewFolderName('');
      setShowCreateFolder(false);
    }
  };

  const handleCreateNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      // Here you would call API to create note
      console.log('Creating note:', newNote);
      setNewNote({ title: '', content: '', folderId: '' });
      setShowCreateNote(false);
    }
  };

  const handleEmbedFile = (fileId: string) => {
    // Here you would call API to trigger embedding
    console.log('Triggering embedding for file:', fileId);
  };

  const handleEmbedNote = (noteId: string) => {
    // Here you would call API to trigger embedding
    console.log('Triggering embedding for note:', noteId);
  };

  const renderFolderTree = (items: (Folder | FileItem)[], level: number = 0) => {
    return items.map(item => {
      if (item.type === 'folder') {
        const isExpanded = expandedFolders.has(item.id);
        const hasChildren = item.children && item.children.length > 0;
        
        return (
          <div key={item.id}>
            <button
              onClick={() => toggleFolder(item.id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                selectedFolder === item.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
              style={{ paddingLeft: `${level * 16 + 12}px` }}
            >
              <div className="flex items-center space-x-2">
                {hasChildren && (
                  isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                )}
                <Folder className="h-4 w-4" />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              {hasChildren && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{item.children?.length}</span>
              )}
            </button>
            {isExpanded && hasChildren && (
              <div className="ml-4">
                {renderFolderTree(item.children!, level + 1)}
              </div>
            )}
          </div>
        );
      }
      return null;
    });
  };

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
              <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{getAllFiles(fileStructure).length}</p>
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
                {getAllFiles(fileStructure).filter(f => f.status === 'embedded').length}
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
            onClick={() => setActiveTab('files')}
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
            onClick={() => setActiveTab('notes')}
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
            onClick={() => setActiveTab('web-sources')}
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
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedFolder === null
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Folder className="h-5 w-5" />
                  <span className="text-sm font-medium">All Files</span>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{getAllFiles(fileStructure).length}</span>
              </button>
              {renderFolderTree(fileStructure)}
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
                  {selectedFolder ? 'Files in selected folder' : 'All Files'}
                </h2>
              </div>
              <div className="p-6">
                {filteredFiles.length > 0 ? (
                  <div className="space-y-4">
                    {filteredFiles.map((file) => {
                      const FileIcon = getFileIcon(file.fileType);
                      return (
                        <div key={file.id} className="group flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 hover:shadow-sm">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                              <FileIcon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-50">{file.name}</h3>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                {file.size} • {new Date(file.uploadedAt).toLocaleDateString()}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                                  {getStatusText(file.status)}
                                </span>
                                {file.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {file.status === 'uploaded' && (
                              <button 
                                onClick={() => handleEmbedFile(file.id)}
                                className="p-2 text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                title="Trigger embedding"
                              >
                                <Sparkles className="h-4 w-4" />
                              </button>
                            )}
                            <button 
                              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                              title="View file"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-2 text-error-400 dark:text-error-400 hover:text-error-600 dark:hover:text-error-300 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                              title="Delete file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      {searchTerm ? 'No files found' : 'No files yet'}
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                      {searchTerm 
                        ? 'Try adjusting your search terms or browse different folders' 
                        : 'Upload your first file to start building your knowledge base'
                      }
                    </p>
                    {!searchTerm && (
                      <button className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md">
                        <Upload className="h-4 w-4" />
                        <span>Upload Files</span>
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
              <button
                onClick={() => setSelectedNotesFolder(null)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedNotesFolder === null
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <StickyNote className="h-5 w-5" />
                  <span className="text-sm font-medium">All Notes</span>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{notes.length}</span>
              </button>
              {notesFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedNotesFolder(folder.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    selectedNotesFolder === folder.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5" />
                    <span className="text-sm font-medium">{folder.name}</span>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {notes.filter(note => note.folderId === folder.id).length}
                  </span>
                </button>
              ))}
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
                  {selectedNotesFolder ? notesFolders.find(f => f.id === selectedNotesFolder)?.name : 'All Notes'}
                </h2>
              </div>
              <div className="p-6">
              {filteredNotes.length > 0 ? (
                <div className="space-y-4">
                  {filteredNotes.map((note) => (
                    <div key={note.id} className="group flex items-start justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 hover:shadow-sm">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-900/30 transition-colors">
                          <StickyNote className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-50 mb-1">{note.title}</h3>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">{note.content}</p>
                          <div className="flex items-center space-x-2 mt-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              note.status === 'embedded' 
                                ? 'bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-400' 
                                : 'bg-warning-100 dark:bg-warning-900/20 text-warning-800 dark:text-warning-400'
                            }`}>
                              {note.status === 'embedded' ? 'Embedded' : 'Draft'}
                            </span>
                            {note.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {note.status === 'draft' && (
                          <button 
                            onClick={() => handleEmbedNote(note.id)}
                            className="p-2 text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="Trigger embedding"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          title="Edit note"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          title="View note"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 text-error-400 dark:text-error-400 hover:text-error-600 dark:hover:text-error-300 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-primary-100 dark:bg-primary-900/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <StickyNote className="h-10 w-10 text-primary-500 dark:text-primary-400" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    {searchTerm ? 'No notes found' : 'No notes yet'}
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                    {searchTerm 
                      ? 'Try adjusting your search terms or browse different folders' 
                      : 'Create your first note to capture ideas and insights'
                    }
                  </p>
                  {!searchTerm && (
                    <button 
                      onClick={() => setShowCreateNote(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
                    >
                      <StickyNote className="h-4 w-4" />
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
                  {notesFolders.map((folder) => (
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