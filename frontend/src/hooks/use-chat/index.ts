/**
 * Chat hook for managing conversations, messages, and real-time communication
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Conversation, 
  Message, 
  Agent, 
  CreateConversationRequest,
  UpdateConversationRequest,
  CreateMessageRequest,
  UpdateMessageRequest,
  ConversationStats,
  StreamingMessage,
  UseChatReturn,
  WebSocketMessageType,
  WebSocketEnvelope,
} from '@/types/chat-types';
import { chatService } from '@/services/chat-service';
import { websocketService } from '@/services/websocket-service';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { useWebSocket } from '@/providers/websocket-provider';

export function useChat(): UseChatReturn {
  const { user } = useAuthStore();
  const wsContext = useWebSocket();
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // WebSocket state
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // Streaming state
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const streamingMessageRef = useRef<StreamingMessage | null>(null);
  
  // Polling fallback state
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingAttemptsRef = useRef(0);
  const maxPollingAttempts = 60; // ~5 minutes at 5s intervals

  // Load initial data
  useEffect(() => {
    if (user) {
      loadConversations();
      loadAgents();
    }
  }, [user]);

  // WebSocket connection management
  useEffect(() => {
    if (currentConversation && user) {
      // Join conversation room
      const roomId = `conversation:${currentConversation.id}`;
      wsContext.join(roomId);
      console.log(`Joined room: ${roomId}`);
    } else {
      // Leave previous conversation room if any
      if (currentConversation) {
        const roomId = `conversation:${currentConversation.id}`;
        wsContext.leave(roomId);
        console.log(`Left room: ${roomId}`);
      }
    }

    return () => {
      if (currentConversation) {
        wsContext.leave(`conversation:${currentConversation.id}`);
      }
    };
  }, [currentConversation, wsContext]);

  // WebSocket connection state and error handlers
  useEffect(() => {
    setIsConnected(wsContext.isConnected);
  }, [wsContext.isConnected]);

  // WebSocket event handlers
  useEffect(() => {
    if (!currentConversation) {
      return;
    }

    // Handle agent response chunks
    const handleAgentChunk = (envelope: WebSocketEnvelope) => {
      const payload = envelope.payload;
      if (payload.conversationId === currentConversation.id) {
        if (!streamingMessageRef.current || streamingMessageRef.current.id !== payload.messageId) {
          // Start new streaming message
          const newStreamingMessage: StreamingMessage = {
            id: payload.messageId,
            content: payload.chunk || '',
            isComplete: false,
            isStreaming: true,
            chunks: [payload.chunk || ''],
            metadata: payload.metadata
          };
          streamingMessageRef.current = newStreamingMessage;
          setStreamingMessage(newStreamingMessage);
        } else {
          // Append to existing streaming message
          streamingMessageRef.current.chunks.push(payload.chunk || '');
          streamingMessageRef.current.content += payload.chunk || '';
          setStreamingMessage({ ...streamingMessageRef.current });
        }
      }
    };

    // Handle agent response completion
    const handleAgentComplete = (envelope: WebSocketEnvelope) => {
      const payload = envelope.payload;
      if (payload.conversationId === currentConversation.id && streamingMessageRef.current) {
        if (streamingMessageRef.current.id === payload.messageId) {
          streamingMessageRef.current.isComplete = true;
          streamingMessageRef.current.isStreaming = false;
          setStreamingMessage({ ...streamingMessageRef.current });
          
          // Convert to regular message and add to messages
          const finalMessage: Message = {
            id: streamingMessageRef.current.id,
            conversationId: currentConversation.id,
            content: streamingMessageRef.current.content,
            type: 'ai_response',
            role: 'assistant',
            isEdited: false,
            isDeleted: false,
            isPinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            aiModel: payload.metadata?.model || streamingMessageRef.current.metadata?.aiModel,
            aiPromptTokens: payload.usage?.promptTokens,
            aiCompletionTokens: payload.usage?.completionTokens
          };
          
          setMessages(prev => [finalMessage, ...prev]);
          setStreamingMessage(null);
          streamingMessageRef.current = null;
          
          // Stop polling if active
          stopPolling();
        }
      }
    };

    // Handle agent errors
    const handleAgentError = (envelope: WebSocketEnvelope) => {
      const payload = envelope.payload;
      if (payload.conversationId === currentConversation.id) {
        setError(payload.message);
        setStreamingMessage(null);
        streamingMessageRef.current = null;
        stopPolling();
      }
    };

    // Handle typing indicators
    const handleTyping = (envelope: WebSocketEnvelope) => {
      const payload = envelope.payload;
      if (payload.conversationId === currentConversation.id) {
        if (payload.isTyping) {
          setTypingUsers(prev => Array.from(new Set([...prev, payload.userId])));
        } else {
          setTypingUsers(prev => prev.filter(id => id !== payload.userId));
        }
      }
    };

    // Subscribe to envelope types
    wsContext.on(WebSocketMessageType.AgentResponseChunk, handleAgentChunk);
    wsContext.on(WebSocketMessageType.AgentResponseComplete, handleAgentComplete);
    wsContext.on(WebSocketMessageType.AgentError, handleAgentError);
    wsContext.on(WebSocketMessageType.Typing, handleTyping);

    return () => {
      wsContext.off(WebSocketMessageType.AgentResponseChunk, handleAgentChunk);
      wsContext.off(WebSocketMessageType.AgentResponseComplete, handleAgentComplete);
      wsContext.off(WebSocketMessageType.AgentError, handleAgentError);
      wsContext.off(WebSocketMessageType.Typing, handleTyping);
    };
  }, [currentConversation, wsContext]);

  // Polling fallback for when WS is unavailable or streaming
  const startPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      return; // Already polling
    }

    console.log('Starting polling fallback for AI response...');
    pollingAttemptsRef.current = 0;

    pollingTimerRef.current = setInterval(async () => {
      pollingAttemptsRef.current++;

      if (pollingAttemptsRef.current > maxPollingAttempts) {
        stopPolling();
        setError('Timeout waiting for AI response');
        return;
      }

      try {
        if (!currentConversation) {
          stopPolling();
          return;
        }

        const response = await chatService.getMessages(currentConversation.id);
        if (response.success && response.data) {
          // Look for the latest AI response
          const aiResponse = response.data.data?.find(
            (msg: Message) => msg.type === 'ai_response' && msg.role === 'assistant'
          );

          if (aiResponse) {
            // Found AI response, add it and stop polling
            if (!messages.find(m => m.id === aiResponse.id)) {
              setMessages(prev => [aiResponse, ...prev]);
            }
            stopPolling();
            setStreamingMessage(null);
            streamingMessageRef.current = null;
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000); // Poll every 5 seconds
  }, [currentConversation, messages]);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
      console.log('Stopped polling');
    }
  }, []);

  // Start polling if WS not connected
  useEffect(() => {
    if (!isConnected && streamingMessage && streamingMessage.isStreaming) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [isConnected, streamingMessage?.isStreaming, startPolling, stopPolling]);

  // API Methods
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await chatService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        setError(response.message || 'Failed to load conversations');
      }
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAgents = useCallback(async () => {
    try {
      const response = await chatService.getAgents();
      if (response.success && response.data) {
        setAgents(response.data);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await chatService.getMessages(conversationId);
      if (response.success && response.data) {
        setMessages(response.data.data);
      } else {
        setError(response.message || 'Failed to load messages');
      }
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Conversation Methods
  const createConversation = useCallback(async (data: CreateConversationRequest): Promise<Conversation | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await chatService.createConversation(data);
      if (response.success && response.data) {
        setConversations(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        setError(response.message || 'Failed to create conversation');
        return null;
      }
    } catch (err) {
      setError('Failed to create conversation');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConversation = useCallback(async (id: string, data: UpdateConversationRequest): Promise<Conversation | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await chatService.updateConversation(id, data);
      if (response.success && response.data) {
        setConversations(prev => 
          prev.map(conv => conv.id === id ? response.data! : conv)
        );
        if (currentConversation?.id === id) {
          setCurrentConversation(response.data!);
        }
        return response.data;
      } else {
        setError(response.message || 'Failed to update conversation');
        return null;
      }
    } catch (err) {
      setError('Failed to update conversation');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  const deleteConversation = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await chatService.deleteConversation(id);
      if (response.success) {
        setConversations(prev => prev.filter(conv => conv.id !== id));
        if (currentConversation?.id === id) {
          setCurrentConversation(null);
          setMessages([]);
        }
        return true;
      } else {
        setError(response.message || 'Failed to delete conversation');
        return false;
      }
    } catch (err) {
      setError('Failed to delete conversation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  const selectConversation = useCallback((id: string | null) => {
    if (id) {
      const conversation = conversations.find(conv => conv.id === id);
      if (conversation) {
        setCurrentConversation(conversation);
        loadMessages(id);
        
        // Set selected agent if conversation has one
        if (conversation.agentId) {
          const agent = agents.find(a => a.id === conversation.agentId);
          setSelectedAgent(agent || null);
        } else {
          setSelectedAgent(null);
        }
      }
    } else {
      setCurrentConversation(null);
      setMessages([]);
      setSelectedAgent(null);
    }
  }, [conversations, agents, loadMessages]);

  // Message Methods
  const sendMessage = useCallback(async (content: string): Promise<Message | null> => {
    if (!currentConversation) return null;

    try {
      const messageData: CreateMessageRequest = {
        conversationId: currentConversation.id,
        content,
        type: 'text'
      };

      const response = await chatService.sendMessage(messageData);
      if (response.success && response.data) {
        setMessages(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        setError(response.message || 'Failed to send message');
        return null;
      }
    } catch (err) {
      setError('Failed to send message');
      return null;
    }
  }, [currentConversation]);

  const updateMessage = useCallback(async (id: string, data: UpdateMessageRequest): Promise<Message | null> => {
    try {
      const response = await chatService.updateMessage(id, data);
      if (response.success && response.data) {
        setMessages(prev => 
          prev.map(msg => msg.id === id ? response.data! : msg)
        );
        return response.data;
      } else {
        setError(response.message || 'Failed to update message');
        return null;
      }
    } catch (err) {
      setError('Failed to update message');
      return null;
    }
  }, []);

  const deleteMessage = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await chatService.deleteMessage(id);
      if (response.success) {
        setMessages(prev => prev.filter(msg => msg.id !== id));
        return true;
      } else {
        setError(response.message || 'Failed to delete message');
        return false;
      }
    } catch (err) {
      setError('Failed to delete message');
      return false;
    }
  }, []);

  // Agent Methods
  const attachAgent = useCallback(async (conversationId: string, agentId: string): Promise<boolean> => {
    try {
      const response = await chatService.attachAgent(conversationId, agentId);
      if (response.success) {
        // Refresh conversation to get updated agent info
        const convResponse = await chatService.getConversation(conversationId);
        if (convResponse.success && convResponse.data) {
          setConversations(prev => 
            prev.map(conv => conv.id === conversationId ? convResponse.data! : conv)
          );
          if (currentConversation?.id === conversationId) {
            setCurrentConversation(convResponse.data!);
            const agent = agents.find(a => a.id === agentId);
            setSelectedAgent(agent || null);
          }
        }
        return true;
      } else {
        setError(response.message || 'Failed to attach agent');
        return false;
      }
    } catch (err) {
      setError('Failed to attach agent');
      return false;
    }
  }, [agents, currentConversation]);

  const detachAgent = useCallback(async (conversationId: string): Promise<boolean> => {
    try {
      const response = await chatService.detachAgent(conversationId);
      if (response.success) {
        // Refresh conversation
        const convResponse = await chatService.getConversation(conversationId);
        if (convResponse.success && convResponse.data) {
          setConversations(prev => 
            prev.map(conv => conv.id === conversationId ? convResponse.data! : conv)
          );
          if (currentConversation?.id === conversationId) {
            setCurrentConversation(convResponse.data!);
            setSelectedAgent(null);
          }
        }
        return true;
      } else {
        setError(response.message || 'Failed to detach agent');
        return false;
      }
    } catch (err) {
      setError('Failed to detach agent');
      return false;
    }
  }, [currentConversation]);

  // Search Methods
  const searchConversations = useCallback(async (query: string) => {
    try {
      const response = await chatService.getConversations({ search: query });
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (err) {
      console.error('Failed to search conversations:', err);
    }
  }, []);

  const searchMessages = useCallback(async (query: string) => {
    // This would need to be implemented in the backend
    console.log('Search messages:', query);
  }, []);

  // Refresh Methods
  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  const refreshMessages = useCallback(async () => {
    if (currentConversation) {
      await loadMessages(currentConversation.id);
    }
  }, [currentConversation, loadMessages]);

  return {
    // State
    conversations,
    currentConversation,
    messages,
    agents,
    selectedAgent,
    isLoading,
    error,
    
    // Actions
    createConversation,
    updateConversation,
    deleteConversation,
    selectConversation,
    
    sendMessage,
    updateMessage,
    deleteMessage,
    
    attachAgent,
    detachAgent,
    
    // WebSocket
    isConnected,
    isTyping,
    typingUsers,
    
    // Search
    searchConversations,
    searchMessages,
    
    // Refresh
    refreshConversations,
    refreshMessages,
  };
}
