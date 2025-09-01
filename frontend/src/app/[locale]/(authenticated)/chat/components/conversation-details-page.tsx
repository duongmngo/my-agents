'use client';

import React, { useState } from 'react';
import { User, StickyNote, Folder, X } from 'lucide-react';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { MarkdownMessage } from '@/components/features/chat-system/markdown-message';
import { NoteDetailModal } from '@/components/features/knowledge-base/note-detail-modal';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';

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
  const { currentWorkspace } = useWorkspaceStore();
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Notes folder structure (same as in knowledge page)
  const notesFolders = [
    { id: 'meetings', name: 'Meeting Notes' },
    { id: 'technical', name: 'Technical Notes' },
    { id: 'ideas', name: 'Ideas & Concepts' },
    { id: 'research', name: 'Research' }
  ];

  const handleCreateNoteFromMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowNoteModal(true);
  };

  const handleNoteSave = (note: any) => {
    console.log('Note created from message:', {
      note,
      sourceMessageId: selectedMessage?.id,
      sourceConversationId: selectedMessage?.conversationId
    });
    
    // Reset and close modal
    setSelectedMessage(null);
    setShowNoteModal(false);
  };

  const handleNoteDelete = (noteId: string) => {
    console.log('Note deleted:', noteId);
  };

  if (messages.length === 0) {
    return (
      <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
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
                 {/* Create Note Button - Only for AI responses */}
                 {msg.role === 'assistant' && (
                   <div className="flex justify-end mt-2">
                     <button
                       onClick={() => handleCreateNoteFromMessage(msg)}
                       className="inline-flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                       title="Create note from this AI response"
                     >
                       <StickyNote className="h-3 w-3" />
                       <span>Create Note</span>
                     </button>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Note Detail Modal */}
      {showNoteModal && (
        <NoteDetailModal
          isOpen={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          note={undefined}
          mode="create"
          workspaceId={currentWorkspace?.id || ''}
          folderId={undefined}
          initialTitle={`Note from conversation - ${new Date().toLocaleDateString()}`}
          initialContent={selectedMessage?.content || ''}
          onSave={handleNoteSave}
          onDelete={handleNoteDelete}
        />
      )}
    </div>
  );
}
