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
      case 'embedded': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'uploaded': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'hover:bg-gray-50 text-gray-700'
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
                <span className="text-xs text-gray-500">{item.children?.length}</span>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-600">Manage your documents, notes, and knowledge sources</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowCreateNote(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <StickyNote className="h-4 w-4" />
            <span>Create Note</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Globe className="h-4 w-4" />
            <span>Add Web Source</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Upload className="h-4 w-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-semibold text-gray-900">{getAllFiles(fileStructure).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Brain className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Embedded</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getAllFiles(fileStructure).filter(f => f.status === 'embedded').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <StickyNote className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Notes</p>
              <p className="text-2xl font-semibold text-gray-900">{notes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Globe className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Web Sources</p>
              <p className="text-2xl font-semibold text-gray-900">{webSources.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('files')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'files'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Files
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <StickyNote className="h-4 w-4 inline mr-2" />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('web-sources')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'web-sources'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          <div className="w-64 bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
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
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Folder className="h-5 w-5" />
                  <span className="text-sm font-medium">All Files</span>
                </div>
                <span className="text-xs text-gray-500">{getAllFiles(fileStructure).length}</span>
              </button>
              {renderFolderTree(fileStructure)}
            </div>
          </div>

          {/* Files Area */}
          <div className="flex-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Files List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedFolder ? 'Files in selected folder' : 'All Files'}
                </h2>
              </div>
              <div className="p-6">
                {filteredFiles.length > 0 ? (
                  <div className="space-y-4">
                    {filteredFiles.map((file) => {
                      const FileIcon = getFileIcon(file.fileType);
                      return (
                        <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <FileIcon className="h-6 w-6 text-gray-600" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{file.name}</h3>
                              <p className="text-xs text-gray-500">
                                {file.size} • {new Date(file.uploadedAt).toLocaleDateString()}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                                  {getStatusText(file.status)}
                                </span>
                                {file.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {file.status === 'uploaded' && (
                              <button 
                                onClick={() => handleEmbedFile(file.id)}
                                className="p-2 text-blue-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                                title="Trigger embedding"
                              >
                                <Sparkles className="h-4 w-4" />
                              </button>
                            )}
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                              <Download className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'No files found' : 'No files yet'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm 
                        ? 'Try adjusting your search terms' 
                        : 'Upload your first file to get started'
                      }
                    </p>
                    {!searchTerm && (
                      <button className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
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
          <div className="w-64 bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Note Folders</h2>
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
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
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <StickyNote className="h-5 w-5" />
                  <span className="text-sm font-medium">All Notes</span>
                </div>
                <span className="text-xs text-gray-500">{notes.length}</span>
              </button>
              {notesFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedNotesFolder(folder.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    selectedNotesFolder === folder.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5" />
                    <span className="text-sm font-medium">{folder.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Notes List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedNotesFolder ? notesFolders.find(f => f.id === selectedNotesFolder)?.name : 'All Notes'}
                </h2>
              </div>
              <div className="p-6">
              {filteredNotes.length > 0 ? (
                <div className="space-y-4">
                  {filteredNotes.map((note) => (
                    <div key={note.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <StickyNote className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{note.title}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.content}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              note.status === 'embedded' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {note.status === 'embedded' ? 'Embedded' : 'Draft'}
                            </span>
                            {note.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {note.status === 'draft' && (
                          <button 
                            onClick={() => handleEmbedNote(note.id)}
                            className="p-2 text-blue-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                            title="Trigger embedding"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <StickyNote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No notes found' : 'No notes yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms' 
                      : 'Create your first note to get started'
                    }
                  </p>
                  {!searchTerm && (
                    <button 
                      onClick={() => setShowCreateNote(true)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Web Sources</h2>
          </div>
          <div className="p-6">
            {webSources.length > 0 ? (
              <div className="space-y-4">
                {webSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Globe className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{source.title}</h3>
                        <p className="text-xs text-gray-500">{source.url}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Last synced: {new Date(source.lastSync).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        source.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {source.status}
                      </span>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No web sources yet</h3>
                <p className="text-gray-500 mb-4">Add web sources to import external knowledge</p>
                <button className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Folder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      {showCreateNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter note content..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder
                </label>
                <select
                  value={newNote.folderId}
                  onChange={(e) => setNewNote(prev => ({ ...prev, folderId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNote.title.trim() || !newNote.content.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
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