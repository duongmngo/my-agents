import { Message, Conversation, ApiResponse, PaginatedResponse } from '@/types/common-types';

// Mock delay to simulate API calls
const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ChatServiceInterface {
  getMessages: (conversationId: string, page?: number, limit?: number) => Promise<ApiResponse<PaginatedResponse<Message>>>;
  getConversation: (conversationId: string) => Promise<ApiResponse<Conversation>>;
  sendMessage: (conversationId: string, content: string) => Promise<ApiResponse<Message>>;
}

// Mock data for messages
const mockMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    content: 'Hi! I\'m interested in learning more about your product features. Can you help me understand what makes your solution different from competitors?',
    role: 'user',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    content: 'Hello! I\'d be happy to help you understand our product features. Our solution stands out in several key ways:\n\n## 🚀 Key Features\n\n1. **Advanced AI Integration**: We use cutting-edge AI models for intelligent automation\n2. **Multi-tenant Architecture**: Secure, isolated environments for each organization\n3. **Custom Agent Creation**: Build specialized AI assistants for your specific needs\n4. **Real-time Collaboration**: Team-based workflows with live updates\n5. **Comprehensive Analytics**: Detailed insights into usage and performance\n\n### Example Agent Configuration\n\n```javascript\nconst agentConfig = {\n  name: "Sales Assistant",\n  model: "gpt-4",\n  temperature: 0.7,\n  tools: ["web_search", "file_upload", "calendar"],\n  instructions: "You are a helpful sales assistant..."\n};\n```\n\nWould you like me to elaborate on any of these features or discuss how they could benefit your organization?',
    role: 'assistant',
    model: 'gpt-4',
    tokens: 150,
    createdAt: '2024-01-15T10:01:00Z',
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    content: 'That sounds great! I\'m particularly interested in the custom agent creation. How easy is it to set up and configure agents for different departments?',
    role: 'user',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'msg-4',
    conversationId: 'conv-2',
    content: 'Can you help me with project planning?',
    role: 'user',
    createdAt: '2024-01-16T09:00:00Z',
  },
  {
    id: 'msg-5',
    conversationId: 'conv-2',
    content: 'Absolutely! I can help you with project planning. Let me start by understanding your project requirements and timeline.',
    role: 'assistant',
    model: 'gpt-4',
    tokens: 45,
    createdAt: '2024-01-16T09:01:00Z',
  }
];

// Mock data for conversations
const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Product Feature Discussion',
    agentId: 'agent-1',
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    lastMessageAt: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'conv-2',
    title: 'Project Planning Session',
    agentId: 'agent-2',
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    lastMessageAt: '2024-01-16T09:01:00Z',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T09:01:00Z',
  }
];

class ChatService implements ChatServiceInterface {
  async getMessages(
    conversationId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<ApiResponse<PaginatedResponse<Message>>> {
    try {
      // Simulate API delay
      await mockDelay(800);

      // Filter messages by conversation ID
      const conversationMessages = mockMessages.filter(
        msg => msg.conversationId === conversationId
      );

      // Sort by creation date (newest first)
      const sortedMessages = conversationMessages.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMessages = sortedMessages.slice(startIndex, endIndex);

      const total = conversationMessages.length;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          data: paginatedMessages,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch messages',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    try {
      // Simulate API delay
      await mockDelay(500);

      const conversation = mockConversations.find(conv => conv.id === conversationId);

      if (!conversation) {
        return {
          success: false,
          error: 'Conversation not found',
          message: `Conversation with ID ${conversationId} was not found`,
        };
      }

      return {
        success: true,
        data: conversation,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch conversation',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async sendMessage(conversationId: string, content: string): Promise<ApiResponse<Message>> {
    try {
      // Simulate API delay
      await mockDelay(1000);

      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        content,
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      // In a real implementation, this would be sent to the API
      // For now, we'll just return the message
      return {
        success: true,
        data: newMessage,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to send message',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
