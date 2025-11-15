import { 
  Message, 
  Conversation, 
  Agent,
  ApiResponse, 
  PaginatedResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
  CreateMessageRequest,
  UpdateMessageRequest,
  ConversationStats,
  AgentStats
} from '@/types/chat-types';
import { apiClient } from '@/services/api-client';

export interface ChatServiceInterface {
  // Conversations
  getConversations: (params?: { skip?: number; limit?: number; agentId?: string; search?: string }) => Promise<ApiResponse<Conversation[]>>;
  getConversation: (conversationId: string) => Promise<ApiResponse<Conversation>>;
  createConversation: (data: CreateConversationRequest) => Promise<ApiResponse<Conversation>>;
  updateConversation: (id: string, data: UpdateConversationRequest) => Promise<ApiResponse<Conversation>>;
  deleteConversation: (id: string) => Promise<ApiResponse<void>>;
  
  // Messages
  getMessages: (conversationId: string, params?: { skip?: number; limit?: number; beforeMessageId?: string }) => Promise<ApiResponse<PaginatedResponse<Message>>>;
  sendMessage: (data: CreateMessageRequest) => Promise<ApiResponse<Message>>;
  updateMessage: (id: string, data: UpdateMessageRequest) => Promise<ApiResponse<Message>>;
  deleteMessage: (id: string) => Promise<ApiResponse<void>>;
  
  // Agents
  getAgents: () => Promise<ApiResponse<Agent[]>>;
  attachAgent: (conversationId: string, agentId: string) => Promise<ApiResponse<void>>;
  detachAgent: (conversationId: string) => Promise<ApiResponse<void>>;
  
  // Statistics
  getStats: () => Promise<ApiResponse<ConversationStats>>;
}

class ChatService implements ChatServiceInterface {
  private baseUrl = '/api/v1/chat';

  // Conversation Methods
  async getConversations(params?: { skip?: number; limit?: number; agentId?: string; search?: string }): Promise<ApiResponse<Conversation[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params?.agentId) queryParams.append('agentId', params.agentId);
      if (params?.search) queryParams.append('search', params.search);

      const response = await apiClient.get<{ data: Conversation[] }>(`${this.baseUrl}/conversations?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to fetch conversations',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    try {
      const response = await apiClient.get<{ data: Conversation }>(`${this.baseUrl}/conversations/${conversationId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to fetch conversation',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  async createConversation(data: CreateConversationRequest): Promise<ApiResponse<Conversation>> {
    try {
      const response = await apiClient.post<{ data: Conversation }>(`${this.baseUrl}/conversations`, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to create conversation',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  async updateConversation(id: string, data: UpdateConversationRequest): Promise<ApiResponse<Conversation>> {
    try {
      const response = await apiClient.put<{ data: Conversation }>(`${this.baseUrl}/conversations/${id}`, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to update conversation',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  async deleteConversation(id: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(`${this.baseUrl}/conversations/${id}`);
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to delete conversation',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  // Message Methods
  async getMessages(conversationId: string, params?: { skip?: number; limit?: number; beforeMessageId?: string }): Promise<ApiResponse<PaginatedResponse<Message>>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params?.beforeMessageId) queryParams.append('beforeMessageId', params.beforeMessageId);

      const response = await apiClient.get<{ data: PaginatedResponse<Message> }>(`${this.baseUrl}/conversations/${conversationId}/messages?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to fetch messages',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  async sendMessage(data: CreateMessageRequest): Promise<ApiResponse<Message>> {
    try {
      const response = await apiClient.post<{ data: Message }>(`${this.baseUrl}/messages`, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to send message',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  async updateMessage(id: string, data: UpdateMessageRequest): Promise<ApiResponse<Message>> {
    try {
      const response = await apiClient.put<{ data: Message }>(`${this.baseUrl}/messages/${id}`, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to update message',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  async deleteMessage(id: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(`${this.baseUrl}/messages/${id}`);
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to delete message',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  // Agent Methods
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    try {
      const response = await apiClient.get<{ data: Agent[] }>(`${this.baseUrl}/agents`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to fetch agents',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  async attachAgent(conversationId: string, agentId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.post(`${this.baseUrl}/conversations/${conversationId}/attach-agent`, { agentId });
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to attach agent',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  async detachAgent(conversationId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.delete(`${this.baseUrl}/conversations/${conversationId}/detach-agent`);
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to detach agent',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  // Statistics Methods
  async getStats(): Promise<ApiResponse<ConversationStats>> {
    try {
      const response = await apiClient.get<{ data: ConversationStats }>(`${this.baseUrl}/stats`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to fetch statistics',
        message: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
