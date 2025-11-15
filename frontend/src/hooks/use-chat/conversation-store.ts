/**
 * Legacy conversation store - now uses the new useChat hook
 * This file is kept for backward compatibility but should be migrated to useChat
 */
import { create } from 'zustand';
import { Conversation, Message } from '@/types/chat-types';

interface ConversationStore {
  selectedConversationId: string | null;
  conversations: Conversation[];
  messages: Message[];
  setSelectedConversation: (conversationId: string | null) => void;
  getCurrentConversation: () => Conversation | null;
  getCurrentAgent: () => any | null;
  getCurrentMessages: () => Message[];
  sendMessage: (content: string) => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  selectedConversationId: null,
  conversations: [],
  messages: [],

  setSelectedConversation: (conversationId: string | null) => {
    set({ selectedConversationId: conversationId });
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

  sendMessage: (content: string) => {
    const { selectedConversationId, messages } = get();
    if (!selectedConversationId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversationId,
      content,
      type: 'text',
      role: 'user',
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({ messages: [...messages, newMessage] });
  },
})); 