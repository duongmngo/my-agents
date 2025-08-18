export interface MCPServer {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  health: 'healthy' | 'unhealthy' | 'unknown';
  endpoint: string;
  port: number;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  authentication: {
    type: 'jwt' | 'api_key' | 'none';
    token?: string;
  };
  resources: {
    cpu: number;
    memory: number;
    network: string;
  };
  tools: MCPTool[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    lastHealthCheck: string;
    uptime: number;
    totalRequests: number;
    errorCount: number;
  };
  tenantId: string;
  workspaceId: string;
  createdBy: string;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  parameters: MCPToolParameter[];
  permissions: string[];
  enabled: boolean;
  metadata: {
    icon?: string;
    color?: string;
    tags?: string[];
  };
}

export interface MCPToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
  pattern?: string;
  min?: number;
  max?: number;
}

export interface MCPServerConfiguration {
  id: string;
  name: string;
  description?: string;
  serverType: 'custom' | 'predefined';
  image: string;
  command: string[];
  environment: Record<string, string>;
  volumes: MCPVolume[];
  ports: MCPPort[];
  resources: {
    cpu: number;
    memory: number;
    network: string;
  };
  healthCheck: {
    endpoint: string;
    interval: number;
    timeout: number;
    retries: number;
  };
  authentication: {
    type: 'jwt' | 'api_key' | 'none';
    secret?: string;
  };
  enabled: boolean;
  tenantId: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MCPVolume {
  name: string;
  source: string;
  target: string;
  readOnly: boolean;
}

export interface MCPPort {
  containerPort: number;
  hostPort: number;
  protocol: 'tcp' | 'udp';
}

export interface MCPServerMetrics {
  serverId: string;
  timestamp: string;
  cpu: number;
  memory: number;
  networkIn: number;
  networkOut: number;
  requestsPerSecond: number;
  errorRate: number;
  responseTime: number;
}

export interface MCPServerLog {
  id: string;
  serverId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface MCPServerEvent {
  id: string;
  serverId: string;
  type: 'started' | 'stopped' | 'restarted' | 'error' | 'health_check';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
