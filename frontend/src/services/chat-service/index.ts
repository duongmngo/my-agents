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
import {
  ConversationCreateResponseDto,
  ConversationItemDto,
  MessageItemDto,
  MessageListResponseDto
} from '@/types/chat-dtos';
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
      // Backend may return either a DTO wrapper ({ success, conversation })
      // or a legacy snake_case object. Handle both paths.
      const response = await apiClient.get<any>(`${this.baseUrl}/conversations/${conversationId}`);
      const raw = response?.conversation ?? response;

      // Normalize to frontend Conversation shape
      const conversation: Conversation = {
        id: raw.id,
        title: raw.title || '',
        type: (raw.type as any) || 'ai_chat',
        isPrivate: raw.isPrivate ?? raw.is_private ?? true,
        isArchived: raw.isArchived ?? raw.is_archived ?? false,
        isPinned: raw.isPinned ?? raw.is_pinned ?? false,
        agentId: raw.agentId ?? raw.agent_id ?? undefined,
        messageCount: raw.messageCount ?? raw.message_count ?? 0,
        participantCount: raw.participantCount ?? raw.participant_count ?? 0,
        workspaceId: raw.workspaceId ?? raw.workspace_id ?? undefined,
        createdBy: raw.createdBy ?? raw.created_by ?? undefined,
        createdAt: raw.createdAt ?? raw.created_at,
        updatedAt: raw.updatedAt ?? raw.updated_at,
      };
      
      return {
        success: true,
        data: conversation,
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
      // Backend returns ConversationCreateResponseDto: { success, conversation, message }
      const response = await apiClient.post<ConversationCreateResponseDto>(`${this.baseUrl}/conversations`, data);
      
      // Extract conversation from nested response
      const conversationDto = response.conversation;
      
      // Convert DTO to Conversation type
      const conversation: Conversation = {
        id: conversationDto.id,
        title: conversationDto.title || '',
        type: (conversationDto.type as any),
        isPrivate: true, // Default, can be updated if passed in DTO
        isArchived: false,
        isPinned: false,
        agentId: data.agentId,
        messageCount: conversationDto.messageCount,
        participantCount: conversationDto.participantCount,
        workspaceId: conversationDto.workspaceId,
        createdBy: conversationDto.createdBy,
        createdAt: conversationDto.createdAt,
        updatedAt: conversationDto.updatedAt || conversationDto.createdAt,
      };
      
      return {
        success: true,
        data: conversation,
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

      // Backend returns List[MessageItemDto] (camelCase) or legacy snake_case list
      const response = await apiClient.get<any[]>(`${this.baseUrl}/conversations/${conversationId}/messages?${queryParams.toString()}`);

      const messages: Message[] = response.map(msg => {
        const raw = msg?.data ?? msg; // support { data: MessageItem } wrapper or raw item

        // Determine role based on message type
        const t = raw.type ?? raw.type;
        let role: 'user' | 'assistant' | 'system' = 'user';
        if (t === 'ai_response' || t === 'AI_RESPONSE') {
          role = 'assistant';
        } else if (t === 'system' || t === 'SYSTEM') {
          role = 'system';
        }

        return {
          id: raw.id,
          conversationId: raw.conversationId ?? raw.conversation_id,
          content: raw.content,
          type: (raw.type || raw.type || 'text') as any,
          role,
          isEdited: raw.isEdited ?? raw.is_edited ?? false,
          isDeleted: raw.isDeleted ?? raw.is_deleted ?? false,
          isPinned: raw.isPinned ?? raw.is_pinned ?? false,
          replyToMessageId: raw.replyToMessageId ?? raw.reply_to_message_id,
          threadId: raw.threadId ?? raw.thread_id,
          attachments: raw.attachments,
          metadata: raw.metadata ?? raw.message_metadata,
          aiModel: raw.aiModel ?? raw.ai_model,
          aiPromptTokens: raw.aiPromptTokens ?? raw.ai_prompt_tokens,
          aiCompletionTokens: raw.aiCompletionTokens ?? raw.ai_completion_tokens,
          createdAt: raw.createdAt ?? raw.created_at,
          updatedAt: raw.updatedAt ?? raw.updated_at,
        };
      });
      
      // Wrap in PaginatedResponse format that frontend expects
      const paginatedData: PaginatedResponse<Message> = {
        data: messages,
        pagination: {
          page: params?.skip ? Math.floor(params.skip / (params.limit || 50)) : 0,
          limit: params?.limit || 50,
          total: messages.length,
          totalPages: 1,
        }
      };
      
      return {
        success: true,
        data: paginatedData,
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
      // Backend returns MessageResponseDto { success, data: MessageItem } or legacy raw message
      const response = await apiClient.post<any>(`${this.baseUrl}/messages`, data);
      const raw = response?.data ?? response;

      const t = raw.type ?? raw.type;
      let role: 'user' | 'assistant' | 'system' = 'user';
      if (t === 'ai_response' || t === 'AI_RESPONSE') {
        role = 'assistant';
      } else if (t === 'system' || t === 'SYSTEM') {
        role = 'system';
      }

      const message: Message = {
        id: raw.id,
        conversationId: raw.conversationId ?? raw.conversation_id,
        content: raw.content,
        type: (raw.type || 'text') as any,
        role,
        isEdited: raw.isEdited ?? raw.is_edited ?? false,
        isDeleted: raw.isDeleted ?? raw.is_deleted ?? false,
        isPinned: raw.isPinned ?? raw.is_pinned ?? false,
        replyToMessageId: raw.replyToMessageId ?? raw.reply_to_message_id,
        threadId: raw.threadId ?? raw.thread_id,
        attachments: raw.attachments,
        metadata: raw.metadata ?? raw.message_metadata,
        aiModel: raw.aiModel ?? raw.ai_model,
        aiPromptTokens: raw.aiPromptTokens ?? raw.ai_prompt_tokens,
        aiCompletionTokens: raw.aiCompletionTokens ?? raw.ai_completion_tokens,
        createdAt: raw.createdAt ?? raw.created_at,
        updatedAt: raw.updatedAt ?? raw.updated_at,
      };
      
      return {
        success: true,
        data: message,
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
