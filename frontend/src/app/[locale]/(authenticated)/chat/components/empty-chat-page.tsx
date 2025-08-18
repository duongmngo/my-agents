'use client';

import React, { useState } from 'react';
import { Send, Plus, Paperclip, BookOpen, Image, Lightbulb, Search, MoreHorizontal, Mic, BarChart3, User, MessageSquare } from 'lucide-react';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { Agent } from '@/types/agent-types';

interface EmptyChatPageProps {
  selectedAgent: Agent | null;
  showConversationStarters: boolean;
  message: string;
  setMessage: (message: string) => void;
  handleConversationStarter: (starter: string) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleSendMessage: () => void;
}

export function EmptyChatPage({
  selectedAgent,
  showConversationStarters,
  message,
  setMessage,
  handleConversationStarter,
  handleKeyPress,
  handleSendMessage
}: EmptyChatPageProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        {/* Agent Info and Conversation Starters */}
        {selectedAgent && showConversationStarters && (
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
              
              {selectedAgent.conversationStarters && selectedAgent.conversationStarters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {selectedAgent.conversationStarters.map((starter) => (
                    <button
                      key={starter.id}
                      onClick={() => handleConversationStarter(starter.prompt)}
                      className="flex items-center p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
                    >
                      <MessageSquare className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700 line-clamp-2">{starter.prompt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No conversation starters available for this agent.</p>
                    <p className="text-sm text-gray-500 mt-2">Try typing your own message below to get started.</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowMenu(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Or type your own message below
              </button>
            </div>
          </div>
        )}

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
                  placeholder={selectedAgent ? `Message ${selectedAgent.name}...` : "Ask anything"}
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
                {message.trim() && (
                  <button
                    onClick={handleSendMessage}
                    className="p-2 text-primary-600 hover:text-primary-700 transition-colors"
                    title="Send message"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <p className="text-sm text-gray-500 mt-6">
          Agents can make mistakes. Consider checking important information.
        </p>
      </div>

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
