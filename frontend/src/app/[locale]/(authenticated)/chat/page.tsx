'use client';

import React, { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { mockAgents, mockConversations } from '@/utils/mock-data';
import { useConversationStore } from '@/hooks/use-chat/conversation-store';
import { useWebSocketStreaming } from '@/hooks/use-websocket-streaming';
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
  
  // New state for API data loading
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  
  // Pagination state for messages
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [messageLimit] = useState(50);
  
  // Use conversation store and WebSocket streaming
  const { 
    selectedConversationId,
    setSelectedConversation,
    messages: storeMessages,
    setMessages,
    addMessage,
    sendMessage: storeSendMessage,
  } = useConversationStore();
  
  // Connect WebSocket streaming handlers
  const { isConnected } = useWebSocketStreaming();

  // Get current messages for the selected conversation
  const currentMessages = storeMessages
    .filter(msg => msg.conversationId === selectedConversationId)
    .map(msg => msg as Message);

  // Handle URL parameters on component mount
  useEffect(() => {
    if (!searchParams) return;
    
    const agentId = searchParams.get('agentId');
    const agentName = searchParams.get('agentName');
    const conversationId = searchParams.get('conversationId');
    const initialPrompt = searchParams.get('initialPrompt');
    
    if (conversationId) {
      setSelectedConversation(conversationId);
      setShowConversationStarters(false);
      setSelectedAgent(null);
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
    } else {
      // No conversation or agent - show empty chat
      setSelectedAgent(null);
      setShowConversationStarters(false);
      setSelectedConversation(null);
    }
  }, [searchParams, setSelectedConversation]);

  // Load conversation data when conversation ID changes
  useEffect(() => {
    if (!selectedConversationId) {
      setCurrentConversation(null);
      setMessages([]);
      setError(null);
      return;
    }

    // Prevent duplicate loads
    let mounted = true;
    const loadConversationData = async () => {
      if (!mounted) return;
      
      try {
        setIsLoadingConversation(true);
        setIsLoadingMessages(true);
        setError(null);

        // Load conversation details
        const conversationResponse = await chatService.getConversation(selectedConversationId);
        if (conversationResponse.success && conversationResponse.data) {
          setCurrentConversation(conversationResponse.data);
        } else {
          setError(conversationResponse.message || 'Failed to load conversation');
          return;
        }

        // Load messages into store (initial load)
        const messagesResponse = await chatService.getMessages(selectedConversationId, { 
          limit: messageLimit 
        });
        if (messagesResponse.success && messagesResponse.data) {
          const filteredMessages = messagesResponse.data.data.filter(
            msg => msg.role === 'user' || msg.role === 'assistant'
          );
          setMessages(filteredMessages);

          // Check if there's an initial prompt to send
          const initialPrompt = searchParams?.get('initialPrompt');
          if (initialPrompt && filteredMessages.length === 0) {
            const promptText = decodeURIComponent(initialPrompt);
            
            try {
              await storeSendMessage(selectedConversationId, promptText);
              // Clear the initialPrompt from URL
              const newUrl = `/${locale}/chat?conversationId=${selectedConversationId}`;
              router.replace(newUrl);
            } catch (err) {
              console.error('Error sending initial message:', err);
            }
          }
        } else {
          setError(messagesResponse.message || 'Failed to load messages');
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
    return () => { mounted = false; };
  }, [selectedConversationId, searchParams, router, locale, setMessages, addMessage]);

  // Load more messages (older messages)
  const loadMoreMessages = async () => {
    if (!selectedConversationId || isLoadingMoreMessages) {
      return;
    }

    try {
      setIsLoadingMoreMessages(true);
      
      // Use current message count as skip for pagination
      const currentCount = currentMessages.length;
      
      const messagesResponse = await chatService.getMessages(selectedConversationId, {
        skip: currentCount,
        limit: messageLimit
      });
      
      if (messagesResponse.success && messagesResponse.data) {
        const olderMessages = messagesResponse.data.data.filter(
          msg => msg.role === 'user' || msg.role === 'assistant'
        );
        
        if (olderMessages.length > 0) {
          // Append older messages to the existing messages
          setMessages([...storeMessages, ...olderMessages]);
        }
        // If no messages returned, the observer will stop triggering
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

  const handleConversationStarter = (starter: string) => {
    setMessage(starter);
    setShowConversationStarters(false);
  };

  // Get current agent data
  const currentAgent = currentConversation
    ? (mockAgents.find(a => a.id === currentConversation.agentId) || selectedAgent || {
        id: currentConversation.agentId || 'unknown',
        name: currentConversation.agentId ? 'Agent' : 'Assistant',
        description: undefined,
        instructions: undefined,
        avatar: undefined,
        model: 'gpt',
        temperature: 0.7,
        createdBy: '',
        isPublic: false,
        tools: [],
        createdAt: '',
        updatedAt: '',
      } as unknown as Agent)
    : selectedAgent;

  if (!user) return null;

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;
    
    const messageContent = message.trim();
    setMessage('');
    
    // If there's already a conversation, send the message directly
    if (selectedConversationId) {
      try {
        setIsSending(true);
        setError(null);
        
        await storeSendMessage(selectedConversationId, messageContent);
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message');
      } finally {
        setIsSending(false);
      }
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
        
        // Update store with new conversation ID
        setSelectedConversation(newConversationId);
        
        // Navigate to the conversation detail page with the message as initialPrompt
        const newUrl = `/${locale}/chat?conversationId=${newConversationId}&initialPrompt=${encodeURIComponent(messageContent)}`;
        router.push(newUrl);
        
        // The useEffect will handle loading the conversation and sending the message
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

  // Determine what view to show
  const showConversationView = selectedConversationId && currentConversation;
  const showAgentStarterView = !selectedConversationId && selectedAgent && showConversationStarters;
  const showEmptyChatView = !selectedConversationId && !showAgentStarterView;

  return (
    <div className="h-full flex bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {showConversationView ? (
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
            ) : (
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
                    <ConversationDetailsPage 
                      messages={currentMessages} 
                      currentAgent={currentAgent}
                      isLoadingMore={isLoadingMoreMessages}
                      onLoadMore={loadMoreMessages}
                    />
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
                        disabled={isSending}
                        className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isSending}
                      className="px-4 py-3 bg-primary-600 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : showAgentStarterView ? (
          /* Agent Starter View - when user clicks on an agent */
          <EmptyChatPage
            selectedAgent={selectedAgent}
            showConversationStarters={showConversationStarters}
            message={message}
            setMessage={setMessage}
            handleConversationStarter={handleConversationStarter}
            handleKeyPress={handleKeyPress}
            handleSendMessage={handleSendMessage}
          />
        ) : (
          /* Empty Chat View - default when no agent or conversation selected */
          <EmptyChatPage
            selectedAgent={null}
            showConversationStarters={false}
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