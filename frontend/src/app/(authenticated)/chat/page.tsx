'use client';

import React, { useState } from 'react';
import { Send, Plus, Paperclip, BookOpen, Image, Lightbulb, Search, MoreHorizontal, Mic, BarChart3, ArrowLeft, User } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { mockAgents } from '@/utils/mock-data';
import { useConversationStore } from '@/hooks/use-chat/conversation-store';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { MarkdownMessage } from '@/components/features/chat-system/markdown-message';

export default function ChatPage() {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const { 
    selectedConversationId, 
    setSelectedConversation, 
    getCurrentConversation, 
    getCurrentAgent, 
    getCurrentMessages,
    sendMessage 
  } = useConversationStore();

  const currentConversation = getCurrentConversation();
  const currentAgent = getCurrentAgent();
  const currentMessages = getCurrentMessages();

  if (!user) return null;

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    if (selectedConversationId) {
      sendMessage(message);
    }
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50">
      {/* Main Content */}
      {selectedConversationId && currentConversation && currentAgent ? (
        /* Conversation Detail View */
        <div className="flex-1 flex flex-col h-full">
          {/* Fixed Conversation Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                {currentAgent.avatar ? (
                  <img 
                    src={currentAgent.avatar} 
                    alt={currentAgent.name}
                    className="h-10 w-10 rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`h-10 w-10 ${currentAgent.avatar ? 'hidden' : ''}`}>
                  <AgentAvatar size="md" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentConversation.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    with {currentAgent.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {currentMessages.length > 0 ? (
              currentMessages.map((msg) => (
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
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <AgentAvatar size="lg" />
                <p className="mt-4">Start a conversation with {currentAgent.name}</p>
              </div>
            )}
          </div>

          {/* Fixed Message Input */}
          <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${currentAgent.name}...`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Welcome Screen */
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-4xl w-full text-center">
            {/* Input Container */}
            <div className="relative max-w-3xl mx-auto">
              {/* Input Bar */}
              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  {/* Plus Button with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span>Add photos & files</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <span>Study and learn</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Image className="h-4 w-4 text-gray-500" />
                          <span>Create image</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Lightbulb className="h-4 w-4 text-gray-500" />
                          <span>Think longer</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Search className="h-4 w-4 text-gray-500" />
                          <span>Deep research</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                          <span>More</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Input Field */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask anything"
                      className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none text-lg"
                    />
                  </div>

                  {/* Right Side Icons */}
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                      <Mic className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                      <BarChart3 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <p className="text-sm text-gray-500 mt-6">
              Agents can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
} 