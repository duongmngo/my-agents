export interface Agent {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  agentType: 'default-agent' | 'user-agent';
  isBuiltIn: boolean;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  isPublic: boolean;
  isActive: boolean;
  aiModel: string;
  temperature: string;
  maxTokens?: number;
  capabilities?: string[];
  tools?: string[] | Record<string, any>; // Array for UI, Object from backend
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
  conversationStarters?: ConversationStarter[];
  // Legacy support
  avatar?: string;
  model?: string;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  knowledgeBaseIds?: string[];
  diagram?: AgentDiagram;
}

export interface AgentDiagram {
  id: string;
  type: 'langgraph' | 'flowchart' | 'mindmap' | 'sequence';
  title: string;
  description?: string;
  data: any; // Diagram-specific data (nodes, edges, etc.)
  thumbnail?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LangGraphNode {
  id: string;
  name: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'input' | 'output';
  position: { x: number; y: number };
  data?: any;
  config?: any;
}

export interface LangGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface LangGraphData {
  nodes: LangGraphNode[];
  edges: LangGraphEdge[];
  metadata?: {
    version: string;
    description?: string;
    author?: string;
  };
}

export interface UserAgentCustomization {
  id: string;
  userId: string;
  agentId: string;
  tenantId: string;
  customInstructions?: string;
  customTemperature?: number;
  customMaxTokens?: number;
  customTopP?: number;
  customFrequencyPenalty?: number;
  customPresencePenalty?: number;
  customTools?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFormData {
  name: string;
  description?: string;
  instructions?: string;
  agentType?: 'default-agent' | 'user-agent';
  aiModel?: string;
  temperature?: string;
  maxTokens?: number;
  capabilities?: string[];
  tools?: string[] | Record<string, any>; // Array for UI, Object from backend
  systemPrompt?: string;
  avatarUrl?: string;
  color?: string;
  isPublic?: boolean;
  isActive?: boolean;
  conversationStarters?: ConversationStarter[];
  starterMessages?: string[];
  // Legacy support
  avatar?: string;
  model?: string;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  isEnabled?: boolean;
  knowledgeBaseIds?: string[];
}

export interface UserAgentCustomizationFormData {
  customInstructions?: string;
  customTemperature?: number;
  customMaxTokens?: number;
  customTopP?: number;
  customFrequencyPenalty?: number;
  customPresencePenalty?: number;
  customTools?: string[];
  isActive: boolean;
}

export interface AgentWithCustomization extends Agent {
  userCustomization?: UserAgentCustomization;
}

export interface AgentModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  isAvailable: boolean;
  pricing?: {
    input: number; // per 1K tokens
    output: number; // per 1K tokens
  };
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  instructions: string;
  model: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
  isPublic: boolean;
}

export interface ConversationStarter {
  id: string;
  title: string;
  prompt: string;
  description?: string;
  category?: 'general' | 'specific' | 'example' | 'tutorial';
  tags?: string[];
}
