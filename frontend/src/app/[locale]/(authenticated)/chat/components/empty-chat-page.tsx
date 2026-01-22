'use client';

import React, { useState } from 'react';
import { Send, Plus, Paperclip, BookOpen, Image, Lightbulb, Search, MoreHorizontal, Mic, BarChart3, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { chatService } from '@/services/chat-service';

export function EmptyChatPage() {
  const router = useRouter();
  const locale = useLocale();
  
  const [message, setMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    const messageContent = message.trim();
    setMessage('');
    setIsSending(true);
    setError(null);

    try {
      // Create a new conversation (no agent selected)
      const conversationResponse = await chatService.createConversation({
        title: messageContent.substring(0, 100),
        type: 'ai_chat',
        isPrivate: true,
      });

      if (conversationResponse.success && conversationResponse.data) {
        const newConversationId = conversationResponse.data.id;
        
        // Navigate to conversation page with the initial message
        const newUrl = `/${locale}/chat?conversationId=${newConversationId}&initialPrompt=${encodeURIComponent(messageContent)}`;
        router.push(newUrl);
      } else {
        setError(conversationResponse.message || 'Failed to create conversation');
        setMessage(messageContent);
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      setMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-4xl w-full text-center">
            {/* Welcome Message */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                What can I help with?
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Start a conversation or select an agent from the sidebar
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              </div>
            )}

            {/* Input Container */}
            <div className="relative max-w-3xl mx-auto">
              <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-center space-x-3">
                  {/* Plus Button with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      disabled={isSending}
                      className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    
                    {showMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-10">
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <Paperclip className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                          <span>Add photos & files</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <BookOpen className="h-4 w-4 text-neutral-500" />
                          <span>Study and learn</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <Image className="h-4 w-4 text-neutral-500" />
                          <span>Create image</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <Lightbulb className="h-4 w-4 text-neutral-500" />
                          <span>Think longer</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <Search className="h-4 w-4 text-neutral-500" />
                          <span>Deep research</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-neutral-500" />
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
                      disabled={isSending}
                      className="w-full px-4 py-3 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none text-lg bg-transparent disabled:opacity-50"
                    />
                  </div>

                  {/* Right Side Icons */}
                  <div className="flex items-center space-x-2">
                    <button 
                      className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors disabled:opacity-50"
                      disabled={isSending}
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                    <button 
                      className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors disabled:opacity-50"
                      disabled={isSending}
                    >
                      <BarChart3 className="h-5 w-5" />
                    </button>
                    {message.trim() && (
                      <button
                        onClick={handleSendMessage}
                        disabled={isSending}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50"
                        title="Send message"
                      >
                        {isSending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-6">
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
      </div>
    </div>
  );
}
