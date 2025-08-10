'use client';

import React, { useState } from 'react';
import { Plus, Search, Upload, FileText, Globe, Database, MoreVertical, Download, Trash2 } from 'lucide-react';

export default function KnowledgePage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock knowledge base data
  const documents = [
    {
      id: '1',
      name: 'Product Manual.pdf',
      type: 'pdf',
      size: '2.4 MB',
      uploadedAt: '2024-01-15T10:00:00Z',
      status: 'processed',
      tags: ['product', 'manual', 'documentation']
    },
    {
      id: '2',
      name: 'API Documentation.docx',
      type: 'docx',
      size: '1.8 MB',
      uploadedAt: '2024-01-14T15:30:00Z',
      status: 'processed',
      tags: ['api', 'documentation', 'technical']
    },
    {
      id: '3',
      name: 'Company Policies.pdf',
      type: 'pdf',
      size: '3.2 MB',
      uploadedAt: '2024-01-13T09:15:00Z',
      status: 'processing',
      tags: ['policies', 'hr', 'company']
    },
    {
      id: '4',
      name: 'Sales Training Materials.pptx',
      type: 'pptx',
      size: '5.1 MB',
      uploadedAt: '2024-01-12T14:20:00Z',
      status: 'processed',
      tags: ['sales', 'training', 'presentation']
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

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-600">Manage your documents and knowledge sources</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Globe className="h-4 w-4" />
            <span>Add Web Source</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
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
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-semibold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {documents.filter(d => d.status === 'processed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-semibold text-gray-900">
                {documents.filter(d => d.status === 'processing').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Web Sources</p>
              <p className="text-2xl font-semibold text-gray-900">{webSources.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
        </div>
        <div className="p-6">
          {filteredDocuments.length > 0 ? (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{doc.name}</h3>
                      <p className="text-xs text-gray-500">
                        {doc.size} • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'processed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status === 'processed' ? 'Processed' : 'Processing'}
                        </span>
                        {doc.tags.map((tag, index) => (
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No documents found' : 'No documents yet'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Upload your first document to get started'
                }
              </p>
              {!searchTerm && (
                <button className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Upload Document</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Web Sources */}
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
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Globe className="h-6 w-6 text-purple-600" />
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
    </div>
  );
} 