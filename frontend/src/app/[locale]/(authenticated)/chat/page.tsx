'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { EmptyChatPage, AgentStarterPage, ConversationPage } from './components';

/**
 * Chat Page - Route-based component loader
 * 
 * Routes:
 * - /chat                              → EmptyChatPage (no agent or conversation)
 * - /chat?agentId=...&agentName=...   → AgentStarterPage (fetch agent, show starters)
 * - /chat?conversationId=...          → ConversationPage (fetch conversation & messages)
 */
export default function ChatPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  if (!user) return null;

  // Get URL parameters
  const agentId = searchParams?.get('agentId');
  const agentName = searchParams?.get('agentName');
  const agentType = searchParams?.get('agentType') as 'built_in' | 'custom' | null;
  const conversationId = searchParams?.get('conversationId');
  const initialPrompt = searchParams?.get('initialPrompt');

  // Route to appropriate component based on URL params
  if (conversationId) {
    // Conversation view - show messages
    return (
      <ConversationPage 
        conversationId={conversationId}
        initialPrompt={initialPrompt ? decodeURIComponent(initialPrompt) : undefined}
      />
    );
  }

  if (agentId) {
    // Agent starter view - fetch agent and show conversation starters
    return (
      <AgentStarterPage 
        agentId={agentId}
        agentName={agentName ? decodeURIComponent(agentName) : undefined}
        agentType={agentType || 'custom'}
        initialPrompt={initialPrompt ? decodeURIComponent(initialPrompt) : undefined}
      />
    );
  }

  // Default empty chat view
  return <EmptyChatPage />;
} 