export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'owner';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  features: string[];
  limits: {
    users: number;
    agents: number;
    storage: number;
    apiCalls: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  instructions: string;
  avatar?: string;
  model: string;
  temperature: number;
  tenantId: string;
  createdBy: string;
  isPublic: boolean;
  tools: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  tenantId: string;
  createdBy: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  model?: string;
  tokens?: number;
  files?: FileAttachment[];
  createdAt: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

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

export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  createdAt: string;
} 