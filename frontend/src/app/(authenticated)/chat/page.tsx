'use client';

import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { mockAgents, mockConversations } from '@/utils/mock-data';
import { useConversationStore } from '@/hooks/use-chat/conversation-store';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { useSearchParams } from 'next/navigation';
import { EmptyChatPage, ConversationDetailsPage } from './components';
import { chatService } from '@/services/chat-service';
import { LoadingSpinner } from '@/components/common/loading';
import { Conversation } from '@/types/common-types';

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
  const [message, setMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showConversationStarters, setShowConversationStarters] = useState(false);
  const [localSelectedConversationId, setLocalSelectedConversationId] = useState<string | null>(null);
  
  // New state for API data loading
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
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

  // Conversation starters for each agent type
  const conversationStarters = {
    'PM Agent': [
      'Help me create a project timeline for our new feature',
      'What are the best practices for sprint planning?',
      'How can I improve team collaboration in my project?',
      'Help me track project progress and identify blockers'
    ],
    'BA Agent': [
      'Help me gather requirements for a new user feature',
      'What questions should I ask stakeholders?',
      'Help me create user stories for our product',
      'How can I improve our business processes?'
    ],
    'SA Agent': [
      'Help me design a scalable system architecture',
      'What are the best patterns for microservices?',
      'Help me review our current system design',
      'How can I optimize our database performance?'
    ]
  };

  // Handle URL parameters on component mount
  useEffect(() => {
    if (!searchParams) return;
    
    const agentId = searchParams.get('agentId');
    const agentName = searchParams.get('agentName');
    const conversationId = searchParams.get('conversationId');
    
    if (conversationId) {
      setLocalSelectedConversationId(conversationId);
      setShowConversationStarters(false);
    } else if (agentId && agentName) {
      const agent = mockAgents.find(a => a.id === agentId);
      if (agent) {
        setSelectedAgent(agent);
        setShowConversationStarters(true);
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
      } catch (err) {
        setError('An unexpected error occurred while loading conversation data');
        console.error('Error loading conversation data:', err);
      } finally {
        setIsLoadingConversation(false);
        setIsLoadingMessages(false);
      }
    };

    loadConversationData();
  }, [localSelectedConversationId]);

  const handleConversationStarter = (starter: string) => {
    setMessage(starter);
    setShowConversationStarters(false);
  };

  // Get current agent data
  const currentAgent = currentConversation 
    ? mockAgents.find(a => a.id === currentConversation.agentId)
    : selectedAgent;



  if (!user) return null;

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    if (localSelectedConversationId) {
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
    <div className="h-full flex bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50">
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
                  <p className="text-red-600 mb-2">Error loading conversation</p>
                  <p className="text-sm text-gray-600">{error}</p>
                </div>
              </div>
            ) : currentConversation && currentAgent ? (
              <>
                {/* Fixed Conversation Header */}
                <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
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
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner text="Loading messages..." />
                    </div>
                  ) : (
                    <ConversationDetailsPage messages={currentMessages} currentAgent={currentAgent} />
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600">Conversation not found</p>
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
            conversationStarters={conversationStarters}
          />
        )}
      </div>
    </div>
  );
} 