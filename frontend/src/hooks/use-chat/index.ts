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
  UseChatReturn
} from '@/types/chat-types';
import { chatService } from '@/services/chat-service';
import { websocketService } from '@/services/websocket-service';
import { useAuthStore } from '@/hooks/use-auth/auth-store';

export function useChat(): UseChatReturn {
  const { user } = useAuthStore();
  
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
      connectWebSocket();
    } else {
      websocketService.disconnect();
      setIsConnected(false);
    }

    return () => {
      websocketService.disconnect();
    };
  }, [currentConversation, user]);

  // WebSocket event handlers
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'message' && message.data) {
        // Handle new message
        const newMessage = message.data as Message;
        setMessages(prev => [newMessage, ...prev]);
      }
    };

    const handleAgentResponseChunk = (chunk: any) => {
      if (chunk.conversationId === currentConversation?.id) {
        if (!streamingMessageRef.current || streamingMessageRef.current.id !== chunk.messageId) {
          // Start new streaming message
          const newStreamingMessage: StreamingMessage = {
            id: chunk.messageId,
            content: chunk.chunk,
            isComplete: false,
            isStreaming: true,
            chunks: [chunk.chunk],
            metadata: chunk.metadata
          };
          streamingMessageRef.current = newStreamingMessage;
          setStreamingMessage(newStreamingMessage);
        } else {
          // Append to existing streaming message
          streamingMessageRef.current.chunks.push(chunk.chunk);
          streamingMessageRef.current.content += chunk.chunk;
          setStreamingMessage({ ...streamingMessageRef.current });
        }

        if (chunk.isFinal) {
          // Mark as complete
          if (streamingMessageRef.current) {
            streamingMessageRef.current.isComplete = true;
            streamingMessageRef.current.isStreaming = false;
            setStreamingMessage({ ...streamingMessageRef.current });
            
            // Convert to regular message and add to messages
            const finalMessage: Message = {
              id: streamingMessageRef.current.id,
              conversationId: currentConversation?.id || '',
              content: streamingMessageRef.current.content,
              type: 'ai_response',
              role: 'assistant',
              isEdited: false,
              isDeleted: false,
              isPinned: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              aiModel: streamingMessageRef.current.metadata?.aiModel,
              aiPromptTokens: streamingMessageRef.current.metadata?.promptTokens,
              aiCompletionTokens: streamingMessageRef.current.metadata?.completionTokens
            };
            
            setMessages(prev => [finalMessage, ...prev]);
            setStreamingMessage(null);
            streamingMessageRef.current = null;
          }
        }
      }
    };

    const handleTypingIndicator = (indicator: any) => {
      if (indicator.conversationId === currentConversation?.id) {
        if (indicator.isTyping) {
          setTypingUsers(prev => Array.from(new Set([...prev, indicator.userId])));
        } else {
          setTypingUsers(prev => prev.filter(id => id !== indicator.userId));
        }
      }
    };

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setTypingUsers([]);
    };

    const handleError = (error: Error) => {
      console.error('WebSocket error:', error);
      setError(error.message);
    };

    // Subscribe to WebSocket events
    websocketService.onMessage(handleMessage);
    websocketService.onAgentResponseChunk(handleAgentResponseChunk);
    websocketService.onTypingIndicator(handleTypingIndicator);
    websocketService.onConnect(handleConnect);
    websocketService.onDisconnect(handleDisconnect);
    websocketService.onError(handleError);

    return () => {
      websocketService.removeAllListeners();
    };
  }, [currentConversation]);

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

  const connectWebSocket = useCallback(async () => {
    if (currentConversation && user) {
      try {
        await websocketService.connect(currentConversation.id, user.id);
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
        setError('Failed to connect to real-time chat');
      }
    }
  }, [currentConversation, user]);

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
