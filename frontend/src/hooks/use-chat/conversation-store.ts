import { create } from 'zustand';
import { mockConversations, mockMessages, mockAgents } from '@/utils/mock-data';
import { Conversation, Message } from '@/types/common-types';

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
  conversations: mockConversations,
  messages: mockMessages,

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
    return currentConversation 
      ? mockAgents.find(agent => agent.id === currentConversation.agentId) || null
      : null;
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
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    set({ messages: [...messages, newMessage] });
  },
})); 