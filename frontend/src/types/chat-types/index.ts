/**
 * Chat system types matching backend schemas
 */

// Message Types
export type MessageType = 'text' | 'image' | 'file' | 'system' | 'ai_response';
export type ConversationType = 'direct' | 'group' | 'ai_chat';
export type AgentStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type AgentCapability = 'web_browsing' | 'code_execution' | 'file_processing' | 'image_generation' | 'function_calling' | 'knowledge_search';

// Base Message Interface
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  type: MessageType;
  role: 'user' | 'assistant' | 'system';
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  replyToMessageId?: string;
  threadId?: string;
  attachments?: FileAttachment[];
  metadata?: Record<string, any>;
  aiModel?: string;
  aiPromptTokens?: number;
  aiCompletionTokens?: number;
  createdAt: string;
  updatedAt: string;
}

// File Attachment Interface
export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
}

// Agent Interface
export interface Agent {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  status: AgentStatus;
  isPublic: boolean;
  isActive: boolean;
  aiModel: string;
  temperature: string;
  maxTokens?: number;
  capabilities?: AgentCapability[];
  tools?: Record<string, any>;
  systemPrompt?: string;
  avatarUrl?: string;
  color?: string;
  conversationCount: number;
  messageCount: number;
  totalTokensUsed: number;
  version: string;
  parentAgentId?: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Agent Template Interface
export interface AgentTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  templateConfig: Record<string, any>;
  isPublic: boolean;
  usageCount: number;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Conversation Interface
export interface Conversation {
  id: string;
  title: string;
  description?: string;
  type: ConversationType;
  isPrivate: boolean;
  isArchived: boolean;
  isPinned: boolean;
  agentId?: string;
  aiModel?: string;
  aiSystemPrompt?: string;
  aiTemperature?: string;
  settings?: Record<string, any>;
  messageCount: number;
  participantCount: number;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  agent?: Agent;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

// Conversation Participant Interface
export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: 'admin' | 'participant' | 'viewer';
  permissions?: Record<string, any>;
  isActive: boolean;
  isMuted: boolean;
  lastReadMessageId?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  // Relations
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

// WebSocket Envelope Types & Enums
export enum WebSocketMessageType {
  // Agent streaming
  AgentResponseChunk = 'agent_response_chunk',
  AgentResponseComplete = 'agent_response_complete',
  AgentStep = 'agent_step',
  AgentError = 'agent_error',
  
  // Typing & presence
  Typing = 'typing',
  
  // Notifications & system
  Notification = 'notification',
  Error = 'error',
  
  // Heartbeat
  Ping = 'ping',
  Pong = 'pong',
  
  // Room management
  JoinAck = 'join_ack',
  LeaveAck = 'leave_ack',
  
  // Legacy (kept for compatibility)
  Message = 'message',
}

export interface WebSocketEnvelope<TPayload = unknown> {
  version: number;
  type: WebSocketMessageType;
  room: string; // e.g., 'user:{id}', 'conversation:{id}'
  ts: number; // ms since epoch
  id: string; // UUID for dedupe
  payload: TPayload;
  meta?: {
    traceId?: string;
    requestId?: string;
    serverId?: string;
    model?: string;
    tokens?: { prompt: number; completion: number };
  };
}

// Legacy WebSocket Message (for backward compat)
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'agent_response_chunk' | 'agent_response_complete' | 'error' | 'ping' | 'pong';
  data: Record<string, any>;
  conversationId: string;
  userId?: string;
}

// Payload types for envelope
export interface AgentResponseChunkPayload {
  conversationId: string;
  messageId: string;
  chunk: string;
  index?: number;
  metadata?: Record<string, any>;
}

export interface AgentResponseCompletePayload {
  conversationId: string;
  messageId: string;
  summary?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface AgentStepPayload {
  conversationId: string;
  stepId?: string;
  kind: 'plan' | 'tool_call' | 'tool_result' | 'final';
  text?: string;
  tool?: string;
  args?: Record<string, any>;
  output?: string;
  callId?: string;
}

export interface AgentErrorPayload {
  conversationId: string;
  code: string;
  message: string;
}

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface TypingPayload extends TypingIndicator {}

export interface NotificationPayload {
  title: string;
  body: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  actionUrl?: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface JoinAckPayload {
  room: string;
  success: boolean;
  message?: string;
}

export interface LeaveAckPayload {
  room: string;
  success: boolean;
}

// Legacy AgentResponseChunk (kept for backward compat)
export interface AgentResponseChunk {
  conversationId: string;
  messageId: string;
  chunk: string;
  isFinal: boolean;
  metadata?: Record<string, any>;
}

// Search and Filter Types
export interface ConversationSearch {
  query?: string;
  agentId?: string;
  type?: ConversationType;
  isArchived?: boolean;
  isPinned?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

export interface MessageSearch {
  query?: string;
  type?: MessageType;
  senderId?: string;
  createdAfter?: string;
  createdBefore?: string;
}

// Statistics Types
export interface ConversationStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  messagesToday: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
}

export interface AgentStats {
  agentId: string;
  agentName: string;
  conversationCount: number;
  messageCount: number;
  totalTokensUsed: number;
  avgResponseTime?: number;
  lastUsed?: string;
}

// API Request/Response Types
export interface CreateConversationRequest {
  title: string;
  description?: string;
  type?: ConversationType;
  isPrivate?: boolean;
  agentId?: string;
  aiModel?: string;
  aiSystemPrompt?: string;
  aiTemperature?: string;
  settings?: Record<string, any>;
}

export interface UpdateConversationRequest {
  title?: string;
  description?: string;
  isPrivate?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  agentId?: string;
  settings?: Record<string, any>;
}

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
  type?: MessageType;
  replyToMessageId?: string;
  threadId?: string;
  attachments?: FileAttachment[];
  metadata?: Record<string, any>;
  aiModel?: string;
  aiPromptTokens?: number;
  aiCompletionTokens?: number;
}

export interface UpdateMessageRequest {
  content?: string;
  isPinned?: boolean;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  instructions?: string;
  aiModel?: string;
  temperature?: string;
  maxTokens?: number;
  capabilities?: AgentCapability[];
  tools?: Record<string, any>;
  systemPrompt?: string;
  avatarUrl?: string;
  color?: string;
  isPublic?: boolean;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  instructions?: string;
  aiModel?: string;
  temperature?: string;
  maxTokens?: number;
  capabilities?: AgentCapability[];
  tools?: Record<string, any>;
  systemPrompt?: string;
  avatarUrl?: string;
  color?: string;
  isPublic?: boolean;
  isActive?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Chat UI State Types
export interface ChatUIState {
  selectedConversationId: string | null;
  selectedAgentId: string | null;
  isTyping: boolean;
  typingUsers: string[];
  isStreaming: boolean;
  streamingMessageId: string | null;
  error: string | null;
}

// Conversation List Item (for sidebar)
export interface ConversationListItem {
  id: string;
  title: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderName: string;
  };
  agent?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  updatedAt: string;
}

// Agent List Item (for selection)
export interface AgentListItem {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  color?: string;
  isActive: boolean;
  conversationCount: number;
  lastUsed?: string;
}

// Message List Item (for display)
export interface MessageListItem {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  type: MessageType;
  isEdited: boolean;
  isPinned: boolean;
  attachments?: FileAttachment[];
  aiModel?: string;
  tokens?: number;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
}

// Streaming Message State
export interface StreamingMessage {
  id: string;
  content: string;
  isComplete: boolean;
  isStreaming: boolean;
  chunks: string[];
  metadata?: Record<string, any>;
}

// Chat Hook Types
export interface UseChatReturn {
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  agents: Agent[];
  selectedAgent: Agent | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createConversation: (data: CreateConversationRequest) => Promise<Conversation | null>;
  updateConversation: (id: string, data: UpdateConversationRequest) => Promise<Conversation | null>;
  deleteConversation: (id: string) => Promise<boolean>;
  selectConversation: (id: string | null) => void;
  
  sendMessage: (content: string) => Promise<Message | null>;
  updateMessage: (id: string, data: UpdateMessageRequest) => Promise<Message | null>;
  deleteMessage: (id: string) => Promise<boolean>;
  
  attachAgent: (conversationId: string, agentId: string) => Promise<boolean>;
  detachAgent: (conversationId: string) => Promise<boolean>;
  
  // WebSocket
  isConnected: boolean;
  isTyping: boolean;
  typingUsers: string[];
  
  // Search
  searchConversations: (query: string) => void;
  searchMessages: (query: string) => void;
  
  // Refresh
  refreshConversations: () => Promise<void>;
  refreshMessages: () => Promise<void>;
}
