export interface Agent {
  id: string;
  name: string;
  description: string;
  instructions: string;
  avatar?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  tenantId: string;
  createdBy: string;
  isPublic: boolean;
  isEnabled: boolean;
  tools: string[];
  knowledgeBaseIds: string[];
  diagram?: AgentDiagram; // Add diagram support
  conversationStarters?: ConversationStarter[]; // Add conversation starters
  createdAt: string;
  updatedAt: string;
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
  description: string;
  instructions: string;
  avatar?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  isPublic: boolean;
  isEnabled: boolean;
  tools: string[];
  knowledgeBaseIds: string[];
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
  description: string;
  prompt: string;
  category: 'general' | 'specific' | 'example' | 'tutorial';
  tags?: string[];
}
