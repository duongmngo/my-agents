'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';

interface AgentStarterPageProps {
  selectedAgent: any;
  conversationStarters: Record<string, string[]>;
  handleConversationStarter: (starter: string) => void;
}

export function AgentStarterPage({
  selectedAgent,
  conversationStarters,
  handleConversationStarter
}: AgentStarterPageProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-3 mb-6">
        {selectedAgent.avatar ? (
          <img 
            src={selectedAgent.avatar} 
            alt={selectedAgent.name}
            className="h-16 w-16 rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`h-16 w-16 ${selectedAgent.avatar ? 'hidden' : ''}`}>
          <AgentAvatar size="lg" />
        </div>
        <div className="text-left">
          <h2 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h2>
          <p className="text-gray-600">{selectedAgent.description}</p>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Start a conversation with {selectedAgent.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {conversationStarters[selectedAgent.name as keyof typeof conversationStarters]?.map((starter, index) => (
            <button
              key={index}
              onClick={() => handleConversationStarter(starter)}
              className="flex items-center p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <MessageSquare className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0" />
              <span className="text-sm text-gray-700">{starter}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => {/* This will be handled by parent component */}}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700"
        >
          Or type your own message below
        </button>
      </div>
    </div>
  );
}
