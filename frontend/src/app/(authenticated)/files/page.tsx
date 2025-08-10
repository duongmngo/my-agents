'use client';

import React, { useState } from 'react';
import { Upload, Search, Folder, File, Image, Video, Archive, MoreVertical, Download, Trash2, Eye } from 'lucide-react';

export default function FilesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Mock file data
  const files = [
    {
      id: '1',
      name: 'presentation.pptx',
      type: 'presentation',
      size: '2.4 MB',
      uploadedAt: '2024-01-15T10:00:00Z',
      folder: 'presentations',
      icon: File
    },
    {
      id: '2',
      name: 'screenshot.png',
      type: 'image',
      size: '1.2 MB',
      uploadedAt: '2024-01-14T15:30:00Z',
      folder: 'images',
      icon: Image
    },
    {
      id: '3',
      name: 'document.pdf',
      type: 'document',
      size: '3.8 MB',
      uploadedAt: '2024-01-13T09:15:00Z',
      folder: 'documents',
      icon: File
    },
    {
      id: '4',
      name: 'video.mp4',
      type: 'video',
      size: '15.2 MB',
      uploadedAt: '2024-01-12T14:20:00Z',
      folder: 'videos',
      icon: Video
    },
    {
      id: '5',
      name: 'archive.zip',
      type: 'archive',
      size: '8.7 MB',
      uploadedAt: '2024-01-11T11:45:00Z',
      folder: 'archives',
      icon: Archive
    }
  ];

  const folders = [
    { id: 'presentations', name: 'Presentations', count: 1 },
    { id: 'images', name: 'Images', count: 1 },
    { id: 'documents', name: 'Documents', count: 1 },
    { id: 'videos', name: 'Videos', count: 1 },
    { id: 'archives', name: 'Archives', count: 1 }
  ];

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder ? file.folder === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'archive': return Archive;
      default: return File;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <p className="text-gray-600">Manage your uploaded files</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Upload className="h-4 w-4" />
          <span>Upload Files</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <File className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-semibold text-gray-900">{files.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Folder className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Folders</p>
              <p className="text-2xl font-semibold text-gray-900">{folders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Image className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Images</p>
              <p className="text-2xl font-semibold text-gray-900">
                {files.filter(f => f.type === 'image').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Video className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Videos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {files.filter(f => f.type === 'video').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-6">
        {/* Folders Sidebar */}
        <div className="w-64 bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
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
              <span className="text-xs text-gray-500">{files.length}</span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedFolder === folder.id
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Folder className="h-5 w-5" />
                  <span className="text-sm font-medium">{folder.name}</span>
                </div>
                <span className="text-xs text-gray-500">{folder.count}</span>
              </button>
            ))}
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
                {selectedFolder ? folders.find(f => f.id === selectedFolder)?.name : 'All Files'}
              </h2>
            </div>
            <div className="p-6">
              {filteredFiles.length > 0 ? (
                <div className="space-y-4">
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file.type);
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
                            <p className="text-xs text-gray-400">
                              Folder: {folders.find(f => f.id === file.folder)?.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
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
                  <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
    </div>
  );
} 