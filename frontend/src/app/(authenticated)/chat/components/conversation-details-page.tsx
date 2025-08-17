'use client';

import React, { useState } from 'react';
import { User, StickyNote, Folder, X } from 'lucide-react';
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
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', folderId: '' });

  // Notes folder structure (same as in knowledge page)
  const notesFolders = [
    { id: 'meetings', name: 'Meeting Notes' },
    { id: 'technical', name: 'Technical Notes' },
    { id: 'ideas', name: 'Ideas & Concepts' },
    { id: 'research', name: 'Research' }
  ];

  const handleCreateNoteFromMessage = (message: Message) => {
    setSelectedMessage(message);
    setNewNote({
      title: `Note from conversation - ${new Date().toLocaleDateString()}`,
      content: message.content,
      folderId: ''
    });
    setShowCreateNote(true);
  };

  const handleCreateNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      // Here you would call API to create note
      console.log('Creating note from message:', {
        ...newNote,
        sourceMessageId: selectedMessage?.id,
        sourceConversationId: selectedMessage?.conversationId
      });
      
      // Reset form and close modal
      setNewNote({ title: '', content: '', folderId: '' });
      setSelectedMessage(null);
      setShowCreateNote(false);
    }
  };

  const handleCloseCreateNote = () => {
    setShowCreateNote(false);
    setSelectedMessage(null);
    setNewNote({ title: '', content: '', folderId: '' });
  };

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
                 {/* Create Note Button - Only for AI responses */}
                 {msg.role === 'assistant' && (
                   <div className="flex justify-end mt-2">
                     <button
                       onClick={() => handleCreateNoteFromMessage(msg)}
                       className="inline-flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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

      {/* Create Note Modal */}
      {showCreateNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Note from Message</h3>
              <button
                onClick={handleCloseCreateNote}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Source Message Preview */}
            {selectedMessage && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Source Message:</p>
                <div className="text-sm text-gray-700 line-clamp-3">
                  {selectedMessage.content.length > 200 
                    ? `${selectedMessage.content.substring(0, 200)}...` 
                    : selectedMessage.content
                  }
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Title
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Content
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter note content..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder
                </label>
                <select
                  value={newNote.folderId}
                  onChange={(e) => setNewNote(prev => ({ ...prev, folderId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a folder (optional)</option>
                  {notesFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={handleCloseCreateNote}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNote.title.trim() || !newNote.content.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
