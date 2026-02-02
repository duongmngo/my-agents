"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { MessageSquare } from 'lucide-react';
import { Conversation } from '@/types/common-types';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { useConversationStore } from '@/hooks/use-chat/conversation-store';
import chatService from '@/services/chat-service';

type ApiListResponse = {
  conversations?: Conversation[];
  total?: number;
  skip?: number;
  limit?: number;
};

export const RecentConversations: React.FC = () => {
  const t = useTranslations();
  const { setSelectedConversation, selectedConversationId } = useConversationStore();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false); // Prevent duplicate requests

  const refreshConversations = async () => {
    // Reset state and fetch from beginning
    setConversations([]);
    setSkip(0);
    setHasMore(true);
    await fetchPage(0);
  };

  const fetchPage = async (s: number) => {
    // Prevent duplicate requests
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const res = await chatService.getConversations({ skip: s, limit });
    
      if (!res.success) throw new Error(res.message || res.error || 'Failed to fetch conversations');

      const json = res.data as any;

      // backend may return wrapper { conversations, total } or an array directly
      let page: Conversation[] = [];
      let total: number | undefined;

      if (Array.isArray(json)) {
        page = json as Conversation[];
      } else if (json && Array.isArray(json.conversations)) {
        page = json.conversations as Conversation[];
        total = json.total;
      } else if (json && Array.isArray(json.data)) {
        page = json.data as Conversation[];
      } else {
        // fallback: no items
        page = [];
      }

      setConversations((prev) => {
        // avoid duplicates when concatenating pages
        const existingIds = new Set(prev.map((c) => c.id));
        const newItems = page.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newItems];
      });

      if (typeof total === 'number') {
        setHasMore((prev) => prev && (skip + page.length) < total);
      } else {
        // if we got fewer items than limit, assume no more
        setHasMore(page.length === limit);
      }

      setSkip((cur) => cur + page.length);
    } catch (err) {
      // Error fetching conversations - don't fall back to mock data
      setHasMore(false);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    // initial load - use ref to prevent double-call in StrictMode
    let mounted = true;
    if (mounted && conversations.length === 0) {
      fetchPage(0);
    }
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for conversation created event
  useEffect(() => {
    const handleConversationCreated = () => {
      refreshConversations();
    };

    window.addEventListener('conversationCreated', handleConversationCreated);
    return () => {
      window.removeEventListener('conversationCreated', handleConversationCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // infinite scroll handler
  const onScroll = () => {
    if (!containerRef.current || loading || !hasMore) return;
    const el = containerRef.current;
    const threshold = 80; // px from bottom
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      fetchPage(skip);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversation(conversationId);
    // Move selected conversation to top of the list for visibility
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conversationId);
      if (idx === -1) return prev;
      const item = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      return [item, ...rest];
    });

    // scroll container to top so the selected conversation is visible
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }

    // Use next-intl router which handles locale automatically
    router.push(`/chat?conversationId=${conversationId}`);
  };

  return (
    <div className="px-4 py-6 border-t border-neutral-200 dark:border-neutral-700 flex-1 flex flex-col overflow-hidden">
      <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-3">
        {t('chat.conversations')}
      </h3>

      <div
        ref={containerRef}
        onScroll={onScroll}
        className="space-y-2 overflow-auto pr-1 flex-1"
      >
        {conversations.map((conversation) => {
          const isSelected = selectedConversationId === conversation.id;

          return (
            <button
              key={conversation.id}
              onClick={() => handleConversationClick(conversation.id)}
              className={`flex items-center space-x-3 p-2 rounded-lg text-sm transition-colors w-full text-left ${
                isSelected
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <div className="flex-shrink-0">
                <AgentAvatar size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{conversation.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{conversation.agentName || 'Unknown Agent'}</p>
              </div>
            </button>
          );
        })}

        {!loading && conversations.length === 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('chat.noConversations')}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default RecentConversations;
