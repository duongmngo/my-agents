/**
 * Chat API DTOs matching backend response structure
 * These types represent the actual API response format with camelCase fields
 */

// Base conversation item (matches backend ConversationItem)
export interface ConversationItemDto {
  id: string;
  title?: string;
  type: string;
  workspaceId: string;
  createdBy: string;
  participantCount: number;
  messageCount: number;
  createdAt: string;
  updatedAt?: string;
}

// Conversation create response (matches backend ConversationCreateResponse)
export interface ConversationCreateResponseDto {
  success: boolean;
  conversation: ConversationItemDto;
  message: string;
}

// Message item DTO (for future use)
export interface MessageItemDto {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  type: string;
  createdAt: string;
  updatedAt?: string;
}

// Generic API response wrapper (standard format)
export interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Conversation list response
export interface ConversationListResponseDto {
  conversations: ConversationItemDto[];
  total: number;
  skip: number;
  limit: number;
}

// Message list response with pagination
export interface MessageListResponseDto {
  data: MessageItemDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
