// Tool types for the frontend
export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'built_in' | 'custom';
  isBuiltIn: boolean;
  isActive: boolean;
  toolIdentifier: string;
  configSchema: ToolConfigSchema;
  defaultConfig: Record<string, any>;
  config?: Record<string, any>; // Current configuration
}

export interface ToolConfigSchema {
  type: string;
  properties: Record<string, ToolConfigProperty>;
  required?: string[];
}

export interface ToolConfigProperty {
  type: string;
  title?: string;
  description?: string;
  default?: any;
  minimum?: number;
  maximum?: number;
  enum?: string[];
  items?: { type: string };
  additionalProperties?: { type: string };
}

export interface AgentToolConfig {
  toolId: string;
  enabled: boolean;
  priority: number;
  config: Record<string, any>;
}

// Icon mapping for tools
export const TOOL_ICONS: Record<string, string> = {
  'database-search': 'Database',
  'globe': 'Globe',
  'link': 'Link',
  'api': 'Webhook',
};
