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
import RecentConversations from '@/components/layout/sidebar/recent-conversations';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { useConversationStore } from '@/hooks/use-chat/conversation-store';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher/workspace-switcher';

const navigationItems = [
  { name: 'navigation.dashboard', href: '/dashboard', icon: Home },
  { name: 'navigation.chat', href: '/chat', icon: MessageSquare },
  { name: 'navigation.agents', href: '/agents', icon: Bot },
  { name: 'navigation.knowledge', href: '/knowledge', icon: Database },
  // { name: 'navigation.analytics', href: '/analytics', icon: BarChart3 },
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
    <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 h-full flex flex-col">
      {/* Workspace Switcher */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
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
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'}`} />
              <span>{t(item.name)}</span>
            </Link>
          );
        })}
      </nav>

      <RecentConversations />

    </aside>
  );
}; 