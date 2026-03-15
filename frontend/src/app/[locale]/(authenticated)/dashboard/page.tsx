'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { 
  MessageSquare, 
  Bot, 
  Database, 
  FileText, 
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { useWorkspaceStore } from '@/hooks/use-workspace';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { DefaultAvatar } from '@/components/common/avatar/default-avatar';
import { agentService } from '@/services/agent-service';
import { chatService } from '@/services/chat-service';
import { fileService } from '@/services/file-service';
import { noteService } from '@/services/note-service';
import { Agent } from '@/types/agent-types';
import { Conversation } from '@/types/chat-types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const router = useRouter();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    agentCount: 0,
    conversationCount: 0,
    knowledgeBase: 0,
    filesUploaded: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch agents
        const agentsData = await agentService.getAgents();
        setAgents(agentsData);
        
        // Fetch conversations
        const conversationsResponse = await chatService.getConversations({ skip: 0, limit: 5 });
        if (conversationsResponse.success && conversationsResponse.data) {
          const convData = conversationsResponse.data as any;
          const convList = Array.isArray(convData) ? convData : (convData.conversations || []);
          setConversations(convList);
          
          // Get total count
          const totalConversations = convData.total || convList.length;
          setStats(prev => ({ ...prev, conversationCount: totalConversations }));
        }
        
        // Fetch knowledge base counts (files + notes)
        let filesCount = 0;
        let notesCount = 0;
        if (currentWorkspace?.id) {
          try {
            filesCount = await fileService.countFiles(currentWorkspace.id);
          } catch (error) {
            console.error('Error fetching files count:', error);
          }
          try {
            const notesResponse = await noteService.getNotesCount(currentWorkspace.id);
            notesCount = notesResponse.total;
          } catch (error) {
            console.error('Error fetching notes count:', error);
          }
        }
        
        // Update stats
        setStats(prev => ({
          ...prev,
          agentCount: agentsData.length,
          knowledgeBase: filesCount + notesCount,
          filesUploaded: filesCount,
        }));
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, currentWorkspace?.id]);

  if (!user) return null;

  const statsData = [
    {
      name: 'Active Agents',
      value: stats.agentCount,
      icon: Bot,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Conversations',
      value: stats.conversationCount,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Knowledge Base',
      value: stats.knowledgeBase,
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Files Uploaded',
      value: stats.filesUploaded,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const recentConversations = conversations.slice(0, 5);
  const recentAgents = agents.slice(0, 6);

  const handleCreateAgent = () => {
    router.push('/agents/create');
  };

  const handleStartChat = () => {
    router.push('/chat');
  };

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
        {statsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{stat.name}</p>
                  <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{loading ? '...' : stat.value}</p>
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
            {loading ? (
              <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">Loading agents...</p>
            ) : recentAgents.length > 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleCreateAgent}
            className="flex items-center space-x-3 p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Create New Agent</span>
          </button>
          <button 
            onClick={handleStartChat}
            className="flex items-center space-x-3 p-4 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <MessageSquare className="h-5 w-5 text-success-600 dark:text-success-400" />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Start New Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
} 