'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Home, 
  MessageSquare, 
  Bot, 
  Database, 
  BarChart3, 
  Settings
} from 'lucide-react';
import { mockConversations, mockAgents } from '@/utils/mock-data';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { useConversationStore } from '@/hooks/use-chat/conversation-store';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher/workspace-switcher';

const navigationItems = [
  { name: 'navigation.dashboard', href: '/dashboard', icon: Home },
  { name: 'navigation.chat', href: '/chat', icon: MessageSquare },
  { name: 'navigation.agents', href: '/agents', icon: Bot },
  { name: 'navigation.knowledge', href: '/knowledge', icon: Database },
  { name: 'navigation.analytics', href: '/analytics', icon: BarChart3 },
  { name: 'navigation.settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { setSelectedConversation, selectedConversationId } = useConversationStore();

  // Helper function to create locale-aware paths
  const createLocalePath = (path: string) => {
    return `/${locale}${path}`;
  };

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversation(conversationId);
    router.push(createLocalePath(`/chat?conversationId=${conversationId}`));
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
      {/* Workspace Switcher */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <WorkspaceSwitcher />
      </div>
      
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          // Check if current path matches this navigation item (accounting for locale)
          const isActive = pathname === item.href || pathname === createLocalePath(item.href);
          
          return (
            <Link
              key={item.name}
              href={createLocalePath(item.href)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`} />
              <span>{t(item.name)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Recent Conversations */}
      <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          {t('chat.conversations')}
        </h3>
        <div className="space-y-2">
                     {mockConversations.slice(0, 5).map((conversation) => {
             const agent = mockAgents.find(a => a.id === conversation.agentId);
             const isSelected = selectedConversationId === conversation.id;
            
            return (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                                 className={`flex items-center space-x-3 p-2 rounded-lg text-sm transition-colors w-full text-left ${
                   isSelected
                     ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                     : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                 }`}
              >
                <div className="flex-shrink-0">
                  {agent?.avatar ? (
                    <img 
                      src={agent.avatar} 
                      alt={agent.name}
                      className="h-6 w-6 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`h-6 w-6 ${agent?.avatar ? 'hidden' : ''}`}>
                    <AgentAvatar size="sm" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {conversation.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {agent?.name || 'Unknown Agent'}
                  </p>
                </div>
              </button>
            );
          })}
          
          {mockConversations.length === 0 && (
            <div className="text-center py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('chat.noConversations')}</p>
            </div>
          )}
          
          {mockConversations.length > 5 && (
            <Link
              href={createLocalePath("/chat")}
              className="flex items-center space-x-3 p-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <span className="text-xs">{t('chat.conversations')}</span>
            </Link>
          )}
        </div>
      </div>

    </aside>
  );
}; 