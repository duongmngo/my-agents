'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { LoadingSpinner } from '@/components/common/loading';
import { chatService } from '@/services/chat-service';
import { agentService } from '@/services/agent-service';
import { useConversationStore } from '@/hooks/use-chat/conversation-store';
import { useWebSocketStreaming } from '@/hooks/use-websocket-streaming';
import { useVoiceChat } from '@/hooks/use-voice';
import { VoiceInputButton, VoiceSettingsButton } from '@/components/voice';
import { useToast } from '@/components/common/toast';
import websocketService from '@/services/websocket-service';
import { Conversation } from '@/types/chat-types';
import { Agent } from '@/types/agent-types';
import { WebSocketMessageType, WebSocketEnvelope } from '@/types/chat-types';
import { ConversationDetailsPage } from './conversation-details-page';

interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  model?: string;
  tokens?: number;
}

interface ConversationPageProps {
  conversationId: string;
  initialPrompt?: string;
}

export function ConversationPage({ conversationId, initialPrompt }: ConversationPageProps) {
  const router = useRouter();
  const toast = useToast();
  
  // State
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageLimit] = useState(50);
  const [hasSentInitialPrompt, setHasSentInitialPrompt] = useState(false);
  
  // Use conversation store and WebSocket streaming
  const { 
    setSelectedConversation,
    messages: storeMessages,
    setMessages,
    sendMessage: storeSendMessage,
  } = useConversationStore();
  
  // Connect WebSocket streaming handlers
  useWebSocketStreaming();

  // Voice chat integration
  const voiceChat = useVoiceChat({
    onTranscription: (text) => {
      // Put the transcribed text into the input field
      setMessage(text);
    },
    onError: (error) => {
      console.error('Voice chat error:', error);
      toast.addToast({
        type: 'error',
        title: 'Voice Error',
        message: error.message || 'Voice error occurred',
      });
    },
  });

  // Listen for streaming tokens to process for TTS
  useEffect(() => {
    if (!voiceChat.voiceOutputEnabled) return;

    const onAgentToken = (envelope: WebSocketEnvelope) => {
      const payload = envelope.payload as any;
      const { conversationId: tokenConversationId, chunk } = payload;
      
      // Only process tokens for the current conversation
      if (tokenConversationId === conversationId) {
        voiceChat.processStreamingText(chunk);
      }
    };

    const onAgentComplete = (envelope: WebSocketEnvelope) => {
      const payload = envelope.payload as any;
      const { conversationId: completeConversationId } = payload;
      
      // Flush remaining text when message completes
      if (completeConversationId === conversationId) {
        voiceChat.flushStreamingText();
      }
    };

    websocketService.on(WebSocketMessageType.AgentToken, onAgentToken);
    websocketService.on(WebSocketMessageType.AgentComplete, onAgentComplete);

    return () => {
      websocketService.off(WebSocketMessageType.AgentToken, onAgentToken);
      websocketService.off(WebSocketMessageType.AgentComplete, onAgentComplete);
    };
  }, [conversationId, voiceChat.voiceOutputEnabled, voiceChat.processStreamingText, voiceChat.flushStreamingText]);

  // Get current messages for this conversation
  const currentMessages = storeMessages
    .filter(msg => msg.conversationId === conversationId)
    .map(msg => msg as Message);

  // Load conversation and messages on mount
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setIsLoadingConversation(true);
        setIsLoadingMessages(true);
        setError(null);
        
        // Set selected conversation in store
        setSelectedConversation(conversationId);

        // Load conversation details
        const conversationResponse = await chatService.getConversation(conversationId);
        if (!mounted) return;
        
        if (conversationResponse.success && conversationResponse.data) {
          setConversation(conversationResponse.data);
          
          // Load agent data if available
          if (conversationResponse.data.agentId) {
            try {
              const fetchedAgent = await agentService.getAgent(conversationResponse.data.agentId);
              if (mounted) {
                setAgent(fetchedAgent);
              }
            } catch (err) {
              console.error('Error loading agent:', err);
              // Create fallback agent
              if (mounted) {
                setAgent({
                  id: conversationResponse.data.agentId,
                  name: 'Assistant',
                  description: '',
                } as Agent);
              }
            }
          }
        } else {
          setError(conversationResponse.message || 'Failed to load conversation');
          return;
        }

        // Load messages
        const messagesResponse = await chatService.getMessages(conversationId, { 
          limit: messageLimit 
        });
        if (!mounted) return;
        
        if (messagesResponse.success && messagesResponse.data) {
          const filteredMessages = messagesResponse.data.data.filter(
            (msg: any) => msg.role === 'user' || msg.role === 'assistant'
          );
          setMessages(filteredMessages);
          
          // Handle initial prompt (send first message automatically)
          if (initialPrompt && filteredMessages.length === 0 && !hasSentInitialPrompt) {
            setHasSentInitialPrompt(true);
            try {
              await storeSendMessage(conversationId, initialPrompt);
              // Clear the initialPrompt from URL
              const newUrl = `/chat?conversationId=${conversationId}`;
              router.replace(newUrl);
            } catch (err) {
              console.error('Error sending initial message:', err);
            }
          }
        } else {
          setError(messagesResponse.message || 'Failed to load messages');
        }
      } catch (err) {
        if (mounted) {
          setError('An unexpected error occurred while loading conversation data');
          console.error('Error loading conversation data:', err);
        }
      } finally {
        if (mounted) {
          setIsLoadingConversation(false);
          setIsLoadingMessages(false);
        }
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [conversationId, initialPrompt, hasSentInitialPrompt, router, setSelectedConversation, setMessages, storeSendMessage, messageLimit]);

  // Load more messages (older messages)
  const loadMoreMessages = async () => {
    if (isLoadingMoreMessages) return;

    try {
      setIsLoadingMoreMessages(true);
      
      const currentCount = currentMessages.length;
      
      const messagesResponse = await chatService.getMessages(conversationId, {
        skip: currentCount,
        limit: messageLimit
      });
      
      if (messagesResponse.success && messagesResponse.data) {
        const olderMessages = messagesResponse.data.data.filter(
          (msg: any) => msg.role === 'user' || msg.role === 'assistant'
        );
        
        if (olderMessages.length > 0) {
          setMessages([...storeMessages, ...olderMessages]);
        }
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

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
      await storeSendMessage(conversationId, messageContent);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      setMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  // Loading state
  if (isLoadingConversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
        <LoadingSpinner size="lg" text="Loading conversation..." />
      </div>
    );
  }

  // Error state
  if (error && !conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
        <div className="text-center">
          <p className="text-error-600 dark:text-error-400 mb-2">Error loading conversation</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  const currentAgent = agent || {
    id: conversation?.agentId || 'unknown',
    name: 'Assistant',
    description: '',
  } as Agent;

  return (
    <div className="h-full flex bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="flex-1 flex flex-col h-full">
        {/* Conversation Header */}
        <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {currentAgent.avatarUrl ? (
              <img 
                src={currentAgent.avatarUrl} 
                alt={currentAgent.name}
                className="h-10 w-10 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`h-10 w-10 ${currentAgent.avatarUrl ? 'hidden' : ''}`}>
              <AgentAvatar size="md" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {conversation?.title || 'Conversation'}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                with {currentAgent.name}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
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

        {/* Message Input */}
        <div className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 p-4 flex-shrink-0">
          {error && (
            <div className="mb-3 p-2 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
              <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${currentAgent.name}...`}
                disabled={isSending || voiceChat.mode === 'recording' || voiceChat.mode === 'transcribing'}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            
            {/* Send Button */}
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
            
            {/* Voice Input Button */}
            <VoiceInputButton
              mode={voiceChat.mode}
              hasPermission={voiceChat.hasPermission}
              onStartRecording={voiceChat.startRecording}
              onStopRecording={voiceChat.stopRecording}
              onCancelRecording={voiceChat.cancelRecording}
              size="md"
              disabled={isSending}
            />
            
            {/* Voice Settings */}
            <VoiceSettingsButton
              voiceOutputEnabled={voiceChat.voiceOutputEnabled}
              onToggleVoiceOutput={voiceChat.toggleVoiceOutput}
              mode={voiceChat.mode}
              currentVoice={voiceChat.currentVoice}
              availableVoices={voiceChat.availableVoices}
              onVoiceChange={voiceChat.setVoice}
              onStopSpeaking={voiceChat.stopSpeaking}
              isSynthesizing={voiceChat.isSynthesizing}
              size="md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
