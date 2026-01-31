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
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { DefaultAvatar } from '@/components/common/avatar/default-avatar';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

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
    <div className="p-6 space-y-6 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-500 dark:via-primary-600 dark:to-primary-700 rounded-xl p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
          <p className="text-primary-100 dark:text-primary-200 text-lg">
            Here's what's happening with your AI agents today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{stat.name}</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recent Conversations</h2>
          </div>
          <div className="p-6">
            {recentConversations.length > 0 ? (
              <div className="space-y-4">
                {recentConversations.map((conversation) => {
                  return (
                    <div key={conversation.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8">
                          <DefaultAvatar size="md" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          with {conversation.agentName || 'Unknown Agent'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {new Date(conversation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">No recent conversations</p>
            )}
          </div>
        </div>

        {/* Active Agents */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Active Agents</h2>
          </div>
          <div className="p-6">
            {recentAgents.length > 0 ? (
              <div className="space-y-4">
                {recentAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <div className="flex-shrink-0">
                      {agent.avatar ? (
                        <img 
                          src={agent.avatar} 
                          alt={agent.name}
                          className="h-8 w-8 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-8 w-8 ${agent.avatar ? 'hidden' : ''}`}>
                        <AgentAvatar size="md" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {agent.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {agent.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        agent.isPublic
                          ? 'bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-400' 
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-300'
                      }`}>
                        {agent.isPublic ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">No active agents</p>
            )}
          </div>
        </div>
      </div>



      {/* Quick Actions */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Create New Agent</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <MessageSquare className="h-5 w-5 text-success-600 dark:text-success-400" />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Start New Chat</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <FileText className="h-5 w-5 text-warning-600 dark:text-warning-400" />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Upload Files</span>
          </button>
        </div>
      </div>
    </div>
  );
} 