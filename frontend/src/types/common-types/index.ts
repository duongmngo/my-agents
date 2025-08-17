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

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  createdBy: string;
  isDefault: boolean;
  settings: {
    theme: 'light' | 'dark';
    primaryColor: string;
    secondaryColor: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'admin' | 'member' | 'viewer';
  permissions: {
    canManageAgents: boolean;
    canManageKnowledge: boolean;
    canManageFiles: boolean;
    canManageSettings: boolean;
    canInviteMembers: boolean;
    canViewAnalytics: boolean;
  };
  joinedAt: string;
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

// New types for LLM and Embedding Model Management
export interface LLMProvider {
  id: string;
  name: string;
  logo?: string;
  description: string;
  website: string;
  isActive: boolean;
}

export interface LLMModel {
  id: string;
  name: string;
  providerId: string;
  provider: LLMProvider;
  modelType: 'chat' | 'completion' | 'function-calling';
  maxTokens: number;
  contextWindow: number;
  pricing: {
    input: number; // cost per 1K tokens
    output: number; // cost per 1K tokens
  };
  capabilities: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmbeddingModel {
  id: string;
  name: string;
  providerId: string;
  provider: LLMProvider;
  dimensions: number;
  maxTokens: number;
  pricing: {
    perToken: number; // cost per 1K tokens
  };
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelConfiguration {
  id: string;
  tenantId: string;
  userId?: string; // null for tenant-level config
  agentId?: string; // null for user/tenant-level config
  level: 'tenant' | 'user' | 'agent';
  defaultLLMModelId?: string;
  defaultEmbeddingModelId?: string;
  openAIApiKey?: string; // encrypted
  customModels?: {
    llmModels: LLMModel[];
    embeddingModels: EmbeddingModel[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface SettingsFormData {
  embeddingModel: {
    openAIApiKey: string;
    defaultEmbeddingModelId: string;
  };
  llmModels: {
    models: LLMModel[];
    defaultLLMModelId: string;
  };
  memberSettings: {
    allowCustomModels: boolean;
    allowApiKeyOverride: boolean;
  };
} 