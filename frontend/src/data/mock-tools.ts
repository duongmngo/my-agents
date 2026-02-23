// Mock data for tools - will be replaced with API calls
import { Tool } from '@/types/tool-types';

export const MOCK_BUILT_IN_TOOLS: Tool[] = [
  {
    id: 'search_knowledge_base',
    name: 'Search Knowledge Base',
    description: 'Search workspace documents and files for relevant information using semantic search.',
    icon: 'database-search',
    type: 'built_in',
    isBuiltIn: true,
    isActive: true,
    toolIdentifier: 'search_knowledge_base',
    configSchema: {
      type: 'object',
      properties: {
        top_k: {
          type: 'integer',
          title: 'Number of Results',
          description: 'Maximum number of search results to return',
          default: 5,
          minimum: 1,
          maximum: 20,
        },
        similarity_threshold: {
          type: 'number',
          title: 'Similarity Threshold',
          description: 'Minimum similarity score (0-1) for results to be included',
          default: 0.7,
          minimum: 0,
          maximum: 1,
        },
        search_scope: {
          type: 'string',
          title: 'Search Scope',
          description: 'Scope of the search',
          enum: ['workspace', 'tagged_files'],
          default: 'workspace',
        },
      },
    },
    defaultConfig: {
      top_k: 5,
      similarity_threshold: 0.7,
      search_scope: 'workspace',
    },
    config: {
      top_k: 5,
      similarity_threshold: 0.7,
      search_scope: 'workspace',
    },
  },
  {
    id: 'search_web',
    name: 'Search Web',
    description: 'Search the internet for up-to-date information using web search engines.',
    icon: 'globe',
    type: 'built_in',
    isBuiltIn: true,
    isActive: true,
    toolIdentifier: 'search_web',
    configSchema: {
      type: 'object',
      properties: {
        max_results: {
          type: 'integer',
          title: 'Max Results',
          description: 'Maximum number of search results to return',
          default: 10,
          minimum: 1,
          maximum: 50,
        },
        search_depth: {
          type: 'string',
          title: 'Search Depth',
          description: 'How deep to search (basic returns snippets, standard follows links)',
          enum: ['basic', 'standard', 'deep'],
          default: 'standard',
        },
        include_domains: {
          type: 'array',
          title: 'Include Domains',
          description: 'Only search these domains (leave empty for all)',
          items: { type: 'string' },
          default: [],
        },
        exclude_domains: {
          type: 'array',
          title: 'Exclude Domains',
          description: 'Exclude these domains from search results',
          items: { type: 'string' },
          default: [],
        },
      },
    },
    defaultConfig: {
      max_results: 10,
      search_depth: 'standard',
      include_domains: [],
      exclude_domains: [],
    },
    config: {
      max_results: 10,
      search_depth: 'standard',
      include_domains: [],
      exclude_domains: [],
    },
  },
  {
    id: 'fetch_website',
    name: 'Fetch Website',
    description: 'Retrieve and extract content from a specific URL or webpage.',
    icon: 'link',
    type: 'built_in',
    isBuiltIn: true,
    isActive: true,
    toolIdentifier: 'fetch_website',
    configSchema: {
      type: 'object',
      properties: {
        timeout: {
          type: 'integer',
          title: 'Timeout (seconds)',
          description: 'Request timeout in seconds',
          default: 30,
          minimum: 5,
          maximum: 120,
        },
        max_content_length: {
          type: 'integer',
          title: 'Max Content Length',
          description: 'Maximum content length in characters',
          default: 50000,
          minimum: 1000,
          maximum: 200000,
        },
        extract_mode: {
          type: 'string',
          title: 'Extract Mode',
          description: 'How to extract content from the page',
          enum: ['text', 'markdown', 'html'],
          default: 'markdown',
        },
      },
    },
    defaultConfig: {
      timeout: 30,
      max_content_length: 50000,
      extract_mode: 'markdown',
    },
    config: {
      timeout: 30,
      max_content_length: 50000,
      extract_mode: 'markdown',
    },
  },
  {
    id: 'api_call',
    name: 'API Call',
    description: 'Make HTTP requests to external APIs. Configure URL, method, headers, and authentication.',
    icon: 'api',
    type: 'built_in',
    isBuiltIn: true,
    isActive: false,
    toolIdentifier: 'api_call',
    configSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: 'API Name',
          description: 'A descriptive name for this API call',
          default: '',
        },
        url: {
          type: 'string',
          title: 'URL',
          description: 'The API endpoint URL. Supports {{variable}} interpolation.',
          default: '',
        },
        method: {
          type: 'string',
          title: 'HTTP Method',
          description: 'The HTTP method to use',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'GET',
        },
        headers: {
          type: 'object',
          title: 'Headers',
          description: 'HTTP headers to include in the request',
          additionalProperties: { type: 'string' },
          default: {},
        },
        auth_type: {
          type: 'string',
          title: 'Authentication Type',
          description: 'Type of authentication to use',
          enum: ['none', 'api_key', 'bearer', 'basic'],
          default: 'none',
        },
        timeout: {
          type: 'integer',
          title: 'Timeout (seconds)',
          description: 'Request timeout in seconds',
          default: 30,
          minimum: 5,
          maximum: 120,
        },
      },
      required: ['url', 'method'],
    },
    defaultConfig: {
      method: 'GET',
      headers: {},
      auth_type: 'none',
      timeout: 30,
    },
    config: {
      method: 'GET',
      headers: {},
      auth_type: 'none',
      timeout: 30,
    },
  },
];

export const MOCK_CUSTOM_TOOLS: Tool[] = [
  {
    id: 'custom_weather_api',
    name: 'Weather API',
    description: 'Get current weather data for any location using OpenWeatherMap API.',
    icon: 'api',
    type: 'custom',
    isBuiltIn: false,
    isActive: true,
    toolIdentifier: 'custom_weather_api',
    configSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          title: 'URL',
          default: 'https://api.openweathermap.org/data/2.5/weather',
        },
        method: {
          type: 'string',
          title: 'HTTP Method',
          enum: ['GET'],
          default: 'GET',
        },
      },
    },
    defaultConfig: {
      url: 'https://api.openweathermap.org/data/2.5/weather',
      method: 'GET',
      auth_type: 'api_key',
    },
    config: {
      url: 'https://api.openweathermap.org/data/2.5/weather',
      method: 'GET',
      auth_type: 'api_key',
    },
  },
];

// Helper to get all tools
export function getAllMockTools(): Tool[] {
  return [...MOCK_BUILT_IN_TOOLS, ...MOCK_CUSTOM_TOOLS];
}

// Helper to get tool by ID
export function getMockToolById(id: string): Tool | undefined {
  return getAllMockTools().find((tool) => tool.id === id);
}
