'use client';

import React from 'react';
import { 
  MessageSquare, 
  Bot, 
  Database, 
  FileText, 
  Users, 
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { mockAgents, mockConversations } from '@/utils/mock-data';

export const DashboardPage: React.FC = () => {
  const { user, tenant } = useAuthStore();

  if (!user || !tenant) return null;

  const stats = [
    {
      name: 'Active Agents',
      value: mockAgents.length,
      icon: Bot,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Conversations',
      value: mockConversations.length,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Knowledge Base',
      value: '12',
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Files Uploaded',
      value: '45',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const recentConversations = mockConversations.slice(0, 5);
  const recentAgents = mockAgents.slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>
        <p className="text-primary-100 mt-1">
          Here's what's happening with your AI agents today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
          </div>
          <div className="p-6">
            {recentConversations.length > 0 ? (
              <div className="space-y-4">
                {recentConversations.map((conversation) => {
                  const agent = mockAgents.find(a => a.id === conversation.agentId);
                  return (
                    <div key={conversation.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0">
                        <img 
                          src={agent?.avatar || 'https://via.placeholder.com/32'} 
                          alt={agent?.name || 'Agent'}
                          className="h-8 w-8 rounded-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          with {agent?.name || 'Unknown Agent'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-xs text-gray-400">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {new Date(conversation.lastMessageAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent conversations</p>
            )}
          </div>
        </div>

        {/* Active Agents */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Agents</h2>
          </div>
          <div className="p-6">
            {recentAgents.length > 0 ? (
              <div className="space-y-4">
                {recentAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <img 
                        src={agent.avatar} 
                        alt={agent.name}
                        className="h-8 w-8 rounded-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {agent.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {agent.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        agent.isPublic 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No active agents</p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Sales Assistant</span> completed a conversation
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Code Assistant</span> was created
                </p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Database className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Knowledge base</span> was updated with 5 new documents
                </p>
                <p className="text-xs text-gray-500">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Bot className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-medium text-gray-900">Create New Agent</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Start New Chat</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-900">Upload Files</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 