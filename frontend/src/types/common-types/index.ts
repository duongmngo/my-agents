export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'owner' | 'super_admin';
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  isDefault: boolean;
  settings: {
    theme: 'light' | 'dark';
    primaryColor: string;
    secondaryColor: string;
  };
  createdAt: string;
  updatedAt: string;
  // Additional fields from backend
  slug?: string;
  color?: string;
  icon?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  userRole?: string;
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
  // Additional fields from backend
  isActive?: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  instructions: string;
  avatar?: string;
  model: string;
  temperature: number;
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
  userId: string;
  messages: Message[];
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

// New types for workspace-based embedding configurations
export interface EmbeddingProviderConfig {
  id: string;
  name: string;
  provider: 'openai' | 'azure' | 'cohere' | 'huggingface' | 'local';
  isActive: boolean;
  config: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    organizationId?: string;
    dimensions?: number;
    maxTokens?: number;
    temperature?: number;
    [key: string]: any; // Allow additional provider-specific config
  };
  metadata?: {
    description?: string;
    version?: string;
    lastUsed?: string;
    usageCount?: number;
    costPerToken?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceEmbeddingSettings {
  id: string;
  workspaceId: string;
  providers: EmbeddingProviderConfig[];
  activeProviderId: string;
  defaultProviderId: string;
  settings: {
    autoRotate: boolean;
    fallbackProviderId?: string;
    batchSize: number;
    retryAttempts: number;
    timeout: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmbeddingProviderInfo {
  name: string;
  displayName: string;
  description: string;
  logo?: string;
  website?: string;
  supportedModels: string[];
  defaultConfig: Record<string, any>;
  features: string[];
  pricing?: {
    costPerToken: number;
    freeTier?: number;
    billingModel: 'per-token' | 'per-request' | 'subscription';
  };
} 