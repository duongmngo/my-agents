'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, MoreVertical, Settings, Copy, Trash2, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { mockAgents } from '@/utils/mock-data';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { useRouter } from 'next/navigation';

export default function AgentsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Conversation starters for each agent type
  const conversationStarters = {
    'PM Agent': [
      'Help me create a project timeline for our new feature',
      'What are the best practices for sprint planning?',
      'How can I improve team collaboration in my project?',
      'Help me track project progress and identify blockers'
    ],
    'BA Agent': [
      'Help me gather requirements for a new user feature',
      'What questions should I ask stakeholders?',
      'Help me create user stories for our product',
      'How can I improve our business processes?'
    ],
    'SA Agent': [
      'Help me design a scalable system architecture',
      'What are the best patterns for microservices?',
      'Help me review our current system design',
      'How can I optimize our database performance?'
    ]
  };

  const handleStartConversation = (agent: any) => {
    // Navigate to chat page with agent information
    router.push(`/chat?agentId=${agent.id}&agentName=${encodeURIComponent(agent.name)}`);
    setOpenDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  if (!user) return null;

  // Filter agents based on search
  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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

      {/* Search */}
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
                  <div className="relative dropdown-container">
                    <button 
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      onClick={() => setOpenDropdown(openDropdown === agent.id ? null : agent.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openDropdown === agent.id && (
                      <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleStartConversation(agent)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Start Conversation
                          </button>
                          <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </button>
                          <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </button>
                          <hr className="my-1" />
                          <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
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
                    {agent.isPublic ? 'Enabled' : 'Disabled'}
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

      
    </div>
  );
} 