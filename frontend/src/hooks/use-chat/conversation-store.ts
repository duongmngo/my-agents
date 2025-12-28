/**
 * Conversation store for managing chat state and WebSocket streaming
 */
import { create } from 'zustand';
import { Conversation, Message } from '@/types/chat-types';
import { chatService } from '@/services/chat-service';

interface ConversationStore {
  selectedConversationId: string | null;
  conversations: Conversation[];
  messages: Message[];
  
  // Basic actions
  setSelectedConversation: (conversationId: string | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  
  // API actions
  sendMessage: (conversationId: string, content: string) => Promise<Message | null>;
  
  // Getters
  getCurrentConversation: () => Conversation | null;
  getCurrentAgent: () => any | null;
  getCurrentMessages: () => Message[];
  
  // WebSocket streaming handlers
  handleAgentToken: (messageId: string, conversationId: string, chunk: string) => void;
  handleAgentStep: (messageId: string, conversationId: string, content: string) => void;
  handleAgentComplete: (messageId: string, conversationId: string, finalText: string) => void;
  handleAgentError: (messageId: string, conversationId: string, error: string) => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  selectedConversationId: null,
  conversations: [],
  messages: [],

  setSelectedConversation: (conversationId: string | null) => {
    set({ selectedConversationId: conversationId });
  },

  setConversations: (conversations: Conversation[]) => {
    set({ conversations });
  },

  setMessages: (messages: Message[]) => {
    set({ messages });
  },

  addMessage: (message: Message) => {
    set(state => ({
      messages: [message, ...state.messages]
    }));
  },

  updateMessage: (messageId: string, updates: Partial<Message>) => {
    set(state => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    }));
  },

  sendMessage: async (conversationId: string, content: string) => {
    try {
      const response = await chatService.sendMessage({
        conversationId,
        content,
        type: 'text'
      });
      
      if (response.success && response.data) {
        get().addMessage(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  getCurrentConversation: () => {
    const { selectedConversationId, conversations } = get();
    return selectedConversationId 
      ? conversations.find(conv => conv.id === selectedConversationId) || null
      : null;
  },

  getCurrentAgent: () => {
    const currentConversation = get().getCurrentConversation();
    return currentConversation?.agent || null;
  },

  getCurrentMessages: () => {
    const { selectedConversationId, messages } = get();
    return selectedConversationId 
      ? messages.filter(msg => msg.conversationId === selectedConversationId)
      : [];
  },

  // Handle agent_token: append chunks to the last assistant message
  handleAgentToken: (messageId: string, conversationId: string, chunk: string) => {
    set(state => {
      const messageIndex = state.messages.findIndex(m => m.id === messageId);
      
      if (messageIndex >= 0) {
        // Message exists, append chunk to content
        const newMessages = [...state.messages];
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          content: newMessages[messageIndex].content + chunk,
        };
        return { messages: newMessages };
      } else if (conversationId === state.selectedConversationId) {
        // Create new placeholder message
        const placeholderMessage: Message = {
          id: messageId,
          conversationId,
          content: chunk,
          type: 'ai_response',
          role: 'assistant',
          isEdited: false,
          isDeleted: false,
          isPinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { messages: [placeholderMessage, ...state.messages] };
      }
      
      return state;
    });
  },

  // Handle agent_step: append step content to message
  handleAgentStep: (messageId: string, conversationId: string, content: string) => {
    set(state => {
      const messageIndex = state.messages.findIndex(m => m.id === messageId);
      
      if (messageIndex >= 0) {
        const newMessages = [...state.messages];
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          content: newMessages[messageIndex].content + '\n' + content,
        };
        return { messages: newMessages };
      }
      
      return state;
    });
  },

  // Handle agent_complete: update message with final text
  handleAgentComplete: (messageId: string, conversationId: string, finalText: string) => {
    set(state => {
      const messageIndex = state.messages.findIndex(m => m.id === messageId);
      
      if (messageIndex >= 0) {
        // Update existing message with final text
        const newMessages = [...state.messages];
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          content: finalText,
          updatedAt: new Date().toISOString(),
        };
        return { messages: newMessages };
      } else if (conversationId === state.selectedConversationId) {
        // Add new complete message
        const completeMessage: Message = {
          id: messageId,
          conversationId,
          content: finalText,
          type: 'ai_response',
          role: 'assistant',
          isEdited: false,
          isDeleted: false,
          isPinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { messages: [completeMessage, ...state.messages] };
      }
      
      return state;
    });
  },

  // Handle agent_error: update message with error
  handleAgentError: (messageId: string, conversationId: string, error: string) => {
    set(state => {
      const messageIndex = state.messages.findIndex(m => m.id === messageId);
      
      if (messageIndex >= 0) {
        const newMessages = [...state.messages];
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          content: `Error: ${error}`,
          updatedAt: new Date().toISOString(),
        };
        return { messages: newMessages };
      }
      
      return state;
    });
  },
})); 