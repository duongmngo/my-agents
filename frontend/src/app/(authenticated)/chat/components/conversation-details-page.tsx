'use client';

import React from 'react';
import { User } from 'lucide-react';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { MarkdownMessage } from '@/components/features/chat-system/markdown-message';

interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  model?: string;
  tokens?: number;
}

interface ConversationDetailsPageProps {
  messages: Message[];
  currentAgent: any;
}

export function ConversationDetailsPage({ messages, currentAgent }: ConversationDetailsPageProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <AgentAvatar size="lg" />
        <p className="mt-4">Start a conversation with {currentAgent.name}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-3xl ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
            <div className={`flex items-start space-x-3 ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`flex-shrink-0 ${
                msg.role === 'user' ? 'ml-3' : 'mr-3'
              }`}>
                {msg.role === 'user' ? (
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  currentAgent.avatar ? (
                    <img 
                      src={currentAgent.avatar} 
                      alt={currentAgent.name}
                      className="h-8 w-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8">
                      <AgentAvatar size="sm" />
                    </div>
                  )
                )}
              </div>
              <div className={`px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap text-sm">
                    {msg.content}
                  </div>
                ) : (
                  <MarkdownMessage 
                    content={msg.content} 
                    className="text-sm"
                  />
                )}
                {msg.model && (
                  <p className="text-xs opacity-70 mt-1">
                    {msg.model} • {msg.tokens} tokens
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
