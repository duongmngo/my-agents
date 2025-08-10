'use client';

import React, { useState } from 'react';
import { Plus, Search, MoreVertical, Settings, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { mockAgents } from '@/utils/mock-data';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';

export default function AgentsPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  if (!user) return null;

  // Filter agents based on search and visibility
  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = showPublicOnly ? agent.isPublic : true;
    return matchesSearch && matchesVisibility;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-600">Manage your AI assistants</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Create Agent</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <button
          onClick={() => setShowPublicOnly(!showPublicOnly)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            showPublicOnly 
              ? 'bg-primary-50 border-primary-200 text-primary-700' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {showPublicOnly ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          <span>{showPublicOnly ? 'Public Only' : 'All Agents'}</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.length > 0 ? (
          filteredAgents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              {/* Agent Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {agent.avatar ? (
                        <img 
                          src={agent.avatar} 
                          alt={agent.name}
                          className="h-12 w-12 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-12 w-12 ${agent.avatar ? 'hidden' : ''}`}>
                        <AgentAvatar size="md" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500">{agent.model}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Agent Content */}
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {agent.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    agent.isPublic 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {agent.isPublic ? 'Public' : 'Private'}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {agent.tools.length} tools
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Temp: {agent.temperature}
                  </span>
                </div>

                {/* Tools */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Tools</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.tools.map((tool, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Created {new Date(agent.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No agents found' : 'No agents yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first AI agent to get started'
                }
              </p>
              {!searchTerm && (
                <button className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Create Agent</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Agents</p>
          <p className="text-2xl font-semibold text-gray-900">{mockAgents.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Public Agents</p>
          <p className="text-2xl font-semibold text-gray-900">
            {mockAgents.filter(a => a.isPublic).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Private Agents</p>
          <p className="text-2xl font-semibold text-gray-900">
            {mockAgents.filter(a => !a.isPublic).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Tools</p>
          <p className="text-2xl font-semibold text-gray-900">
            {mockAgents.reduce((sum, agent) => sum + agent.tools.length, 0)}
          </p>
        </div>
      </div>
    </div>
  );
} 