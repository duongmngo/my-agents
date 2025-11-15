'use client';

import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { mockAgents, mockConversations } from '@/utils/mock-data';
import { useConversationStore } from '@/hooks/use-chat/conversation-store';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { EmptyChatPage, ConversationDetailsPage } from './components';
import { chatService } from '@/services/chat-service';
import { LoadingSpinner } from '@/components/common/loading';
import { Conversation } from '@/types/chat-types';
import { Agent } from '@/types/agent-types';

// Define local Message type to match ConversationDetailsPage expectations
interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  model?: string;
  tokens?: number;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const [message, setMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showConversationStarters, setShowConversationStarters] = useState(false);
  const [localSelectedConversationId, setLocalSelectedConversationId] = useState<string | null>(null);
  
  // New state for API data loading
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    selectedConversationId: storeSelectedConversationId, 
    setSelectedConversation, 
    getCurrentConversation, 
    getCurrentAgent, 
    getCurrentMessages,
    sendMessage 
  } = useConversationStore();

  // Handle URL parameters on component mount
  useEffect(() => {
    if (!searchParams) return;
    
    const agentId = searchParams.get('agentId');
    const agentName = searchParams.get('agentName');
    const conversationId = searchParams.get('conversationId');
    const initialPrompt = searchParams.get('initialPrompt');
    
    if (conversationId) {
      setLocalSelectedConversationId(conversationId);
      setShowConversationStarters(false);
    } else if (agentId && agentName) {
      const agent = mockAgents.find(a => a.id === agentId);
      if (agent) {
        setSelectedAgent(agent);
        setShowConversationStarters(true);
        
        // If there's an initial prompt, set it as the message
        if (initialPrompt) {
          setMessage(decodeURIComponent(initialPrompt));
        }
      }
    }
  }, [searchParams]);

  // Load conversation data when conversation ID changes
  useEffect(() => {
    if (!localSelectedConversationId) {
      setCurrentConversation(null);
      setCurrentMessages([]);
      setError(null);
      return;
    }

    const loadConversationData = async () => {
      try {
        setIsLoadingConversation(true);
        setIsLoadingMessages(true);
        setError(null);

        // Load conversation details
        const conversationResponse = await chatService.getConversation(localSelectedConversationId);
        if (conversationResponse.success && conversationResponse.data) {
          setCurrentConversation(conversationResponse.data);
        } else {
          setError(conversationResponse.message || 'Failed to load conversation');
          return;
        }

        // Load messages
        const messagesResponse = await chatService.getMessages(localSelectedConversationId);
        if (messagesResponse.success && messagesResponse.data) {
          // Filter out system messages to match the expected type
          const filteredMessages = messagesResponse.data.data.filter(
            msg => msg.role === 'user' || msg.role === 'assistant'
          ) as Message[];
          setCurrentMessages(filteredMessages);
        } else {
          setError(messagesResponse.message || 'Failed to load messages');
        }

        // Check if there's an initial prompt to send
        const initialPrompt = searchParams?.get('initialPrompt');
        if (initialPrompt && messagesResponse.success && messagesResponse.data) {
          // Only send if there are no existing messages (new conversation)
          if (messagesResponse.data.data.length === 0) {
            const promptText = decodeURIComponent(initialPrompt);
            // Send the message after a short delay to ensure UI is ready
            setTimeout(async () => {
              try {
                const sendResponse = await chatService.sendMessage({
                  conversationId: localSelectedConversationId,
                  content: promptText,
                  type: 'text'
                });
                
                if (sendResponse.success && sendResponse.data) {
                  // Filter to ensure only user/assistant messages are added
                  const newMessage = sendResponse.data;
                  if (newMessage.role === 'user' || newMessage.role === 'assistant') {
                    setCurrentMessages([newMessage as Message, ...currentMessages]);
                    // Clear the initialPrompt from URL
                    const newUrl = `/${locale}/chat?conversationId=${localSelectedConversationId}`;
                    router.replace(newUrl);
                  }
                }
              } catch (err) {
                console.error('Error sending initial message:', err);
              }
            }, 100);
          }
        }
      } catch (err) {
        setError('An unexpected error occurred while loading conversation data');
        console.error('Error loading conversation data:', err);
      } finally {
        setIsLoadingConversation(false);
        setIsLoadingMessages(false);
      }
    };

    loadConversationData();
  }, [localSelectedConversationId, searchParams, router, locale]);

  const handleConversationStarter = (starter: string) => {
    setMessage(starter);
    setShowConversationStarters(false);
  };

  // Get current agent data
  const currentAgent = currentConversation 
    ? mockAgents.find(a => a.id === currentConversation.agentId)
    : selectedAgent;

  if (!user) return null;

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const messageContent = message.trim();
    setMessage('');
    
    // If there's already a conversation, send the message directly
    if (localSelectedConversationId) {
      sendMessage(messageContent);
      return;
    }
    
    // Otherwise, create a new conversation first
    try {
      setIsCreatingConversation(true);
      setError(null);
      
      // Create a new conversation (with agent if selected)
      const conversationResponse = await chatService.createConversation({
        title: messageContent.substring(0, 100), // Use first 100 chars as title
        type: 'ai_chat',
        agentId: selectedAgent?.id,
        isPrivate: true
      });
      
      if (conversationResponse.success && conversationResponse.data) {
        const newConversationId = conversationResponse.data.id;
        
        // Navigate to the conversation detail page with the message as initialPrompt
        const newUrl = `/${locale}/chat?conversationId=${newConversationId}&initialPrompt=${encodeURIComponent(messageContent)}`;
        router.push(newUrl);
        
        // The useEffect will handle sending the message after navigation
      } else {
        setError(conversationResponse.message || 'Failed to create conversation');
        setIsCreatingConversation(false);
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      setIsCreatingConversation(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {localSelectedConversationId ? (
          /* Conversation Detail View */
          <div className="flex-1 flex flex-col h-full">
            {/* Loading or Error State */}
            {isLoadingConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading conversation..." />
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-error-600 dark:text-error-400 mb-2">Error loading conversation</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{error}</p>
                </div>
              </div>
            ) : currentConversation && currentAgent ? (
              <>
                {/* Fixed Conversation Header */}
                <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-4 flex-shrink-0">
                  <div className="flex items-center space-x-3">
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
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          {currentConversation.title}
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          with {currentAgent.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scrollable Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner text="Loading messages..." />
                    </div>
                  ) : (
                    <ConversationDetailsPage messages={currentMessages} currentAgent={currentAgent} />
                  )}
                </div>

                {/* Fixed Message Input */}
                <div className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 p-4 flex-shrink-0">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Message ${currentAgent.name}...`}
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="px-4 py-3 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-neutral-600 dark:text-neutral-400">Conversation not found</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Welcome Screen */
          <EmptyChatPage
            selectedAgent={selectedAgent}
            showConversationStarters={showConversationStarters}
            message={message}
            setMessage={setMessage}
            handleConversationStarter={handleConversationStarter}
            handleKeyPress={handleKeyPress}
            handleSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
} 