import { User, Tenant, Conversation, Message, Workspace, WorkspaceMember } from '@/types/common-types';
import { Agent, UserAgentCustomization } from '@/types/agent-types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@demo.com',
    name: 'Admin User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin&backgroundColor=b6e3f4&mouth=smile&style=circle',
    role: 'admin',
    tenantId: 'tenant-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'user@demo.com',
    name: 'Demo User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo&backgroundColor=c0aede&mouth=smile&style=circle',
    role: 'user',
    tenantId: 'tenant-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock Tenants
export const mockTenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Demo Company',
    domain: 'demo.com',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=DC&backgroundColor=3b82f6&textColor=ffffff&fontSize=40&fontWeight=600&width=120&height=40',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    features: ['chat', 'agents', 'knowledge-base', 'analytics'],
    limits: {
      users: 100,
      agents: 50,
      storage: 1000,
      apiCalls: 10000,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock Agents
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Project Manager',
    description: 'AI assistant specialized in project management and team coordination',
    instructions: 'You are a project management assistant with expertise in agile methodologies, task tracking, and team collaboration. Help with project planning, progress tracking, and team coordination. Provide actionable insights and practical recommendations for project success.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=pm&backgroundColor=3b82f6&mouth=smile&style=circle',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    isPublic: true,
    isEnabled: true,
    tools: ['web_search', 'file_reader'],
    knowledgeBaseIds: [],
    conversationStarters: [
      {
        id: 'pm-1',
        prompt: 'I need to create a project plan for a new software development project. Can you help me break it down into phases, identify key milestones, and create a timeline?'
      },
      {
        id: 'pm-2',
        prompt: 'I\'m starting a new project and want to identify potential risks. Can you help me create a risk assessment matrix and suggest mitigation strategies?'
      },
      {
        id: 'pm-3',
        prompt: 'I have a team of 5 developers and need to coordinate their tasks. Can you help me create a RACI matrix and task assignment plan?'
      },
      {
        id: 'pm-4',
        prompt: 'I want to set up an agile sprint planning session for my team. Can you walk me through the process and help me prepare the necessary materials?'
      }
    ],
    diagram: {
      id: 'diagram-1',
      type: 'langgraph',
      title: 'Project Management Workflow',
      description: 'LangGraph workflow for project management tasks',
      data: {
        nodes: [
          { id: 'start', name: 'Start', type: 'start', position: { x: 100, y: 300 } },
          { id: 'analyze', name: 'Analyze Requirements', type: 'process', position: { x: 250, y: 200 } },
          { id: 'plan', name: 'Create Plan', type: 'process', position: { x: 400, y: 200 } },
          { id: 'execute', name: 'Execute Tasks', type: 'process', position: { x: 550, y: 200 } },
          { id: 'review', name: 'Review Progress', type: 'decision', position: { x: 700, y: 200 } },
          { id: 'complete', name: 'Complete', type: 'end', position: { x: 850, y: 200 } },
          { id: 'adjust', name: 'Adjust Plan', type: 'process', position: { x: 700, y: 350 } },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'analyze' },
          { id: 'e2', source: 'analyze', target: 'plan' },
          { id: 'e3', source: 'plan', target: 'execute' },
          { id: 'e4', source: 'execute', target: 'review' },
          { id: 'e5', source: 'review', target: 'complete', label: 'On Track' },
          { id: 'e6', source: 'review', target: 'adjust', label: 'Needs Adjustment' },
          { id: 'e7', source: 'adjust', target: 'execute' },
        ],
        metadata: {
          version: '1.0',
          description: 'Project management workflow with feedback loop',
          author: 'System'
        }
      },
      isVisible: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'agent-2',
    name: 'Business Analyst',
    description: 'AI assistant specialized in business analysis and requirements gathering',
    instructions: 'You are a business analyst assistant with expertise in requirements analysis, process modeling, and stakeholder management. Help with business requirements, user stories, and process optimization. Focus on understanding business needs and translating them into actionable specifications.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ba&backgroundColor=10b981&mouth=smile&style=circle',
    model: 'gpt-4',
    temperature: 0.5,
    maxTokens: 4000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    isPublic: true,
    isEnabled: true,
    tools: ['web_search', 'file_reader', 'data_analyzer'],
    knowledgeBaseIds: [],
    conversationStarters: [
      {
        id: 'ba-1',
        prompt: 'I need to gather requirements for a new customer portal feature. Can you help me create a requirements gathering plan and interview questions?'
      },
      {
        id: 'ba-2',
        prompt: 'I have a list of features for a mobile app. Can you help me break them down into user stories with proper acceptance criteria?'
      },
      {
        id: 'ba-3',
        prompt: 'I want to analyze our current order fulfillment process. Can you help me map the current process and identify improvement opportunities?'
      },
      {
        id: 'ba-4',
        prompt: 'I\'m working with multiple stakeholders on a complex project. Can you help me create a stakeholder management plan and communication strategy?'
      }
    ],
    diagram: {
      id: 'diagram-2',
      type: 'flowchart',
      title: 'Requirements Analysis Process',
      description: 'Business analysis workflow for requirements gathering',
      data: {},
      isVisible: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'agent-3',
    name: 'Solution Architecture',
    description: 'AI assistant specialized in solution architecture and technical design',
    instructions: 'You are a solution architect assistant with expertise in software architecture, system design, and technical planning. Help with architectural decisions, system design patterns, and technical specifications. Provide detailed technical guidance and best practices for building scalable solutions.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sa&backgroundColor=f59e0b&mouth=smile&style=circle',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 4000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    isPublic: false,
    isEnabled: true,
    tools: ['web_search', 'file_reader', 'code_interpreter'],
    knowledgeBaseIds: [],
    conversationStarters: [
      {
        id: 'sa-1',
        prompt: 'I\'m building a web application that needs to handle 10,000 concurrent users. Can you help me design a scalable architecture with proper load balancing and database considerations?'
      },
      {
        id: 'sa-2',
        prompt: 'I need to choose a technology stack for a real-time messaging application. Can you help me evaluate different options and recommend the best approach?'
      },
      {
        id: 'sa-3',
        prompt: 'I want to break down my monolithic application into microservices. Can you help me identify service boundaries and design the communication patterns?'
      },
      {
        id: 'sa-4',
        prompt: 'I\'m designing a financial application that needs to handle sensitive data. Can you help me design security architecture with proper authentication, authorization, and data protection?'
      }
    ],
    diagram: {
      id: 'diagram-3',
      type: 'langgraph',
      title: 'System Architecture Design',
      description: 'LangGraph workflow for system architecture design',
      data: {
        nodes: [
          { id: 'start', name: 'Start', type: 'start', position: { x: 100, y: 300 } },
          { id: 'requirements', name: 'Gather Requirements', type: 'input', position: { x: 250, y: 200 } },
          { id: 'analyze', name: 'Analyze Constraints', type: 'process', position: { x: 400, y: 200 } },
          { id: 'design', name: 'Design Architecture', type: 'process', position: { x: 550, y: 200 } },
          { id: 'validate', name: 'Validate Design', type: 'decision', position: { x: 700, y: 200 } },
          { id: 'document', name: 'Document', type: 'output', position: { x: 850, y: 200 } },
          { id: 'refine', name: 'Refine Design', type: 'process', position: { x: 700, y: 350 } },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'requirements' },
          { id: 'e2', source: 'requirements', target: 'analyze' },
          { id: 'e3', source: 'analyze', target: 'design' },
          { id: 'e4', source: 'design', target: 'validate' },
          { id: 'e5', source: 'validate', target: 'document', label: 'Valid' },
          { id: 'e6', source: 'validate', target: 'refine', label: 'Needs Changes' },
          { id: 'e7', source: 'refine', target: 'design' },
        ],
        metadata: {
          version: '1.0',
          description: 'System architecture design workflow',
          author: 'System'
        }
      },
      isVisible: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'agent-4',
    name: 'Prompt Enhancer',
    description: 'AI assistant specialized in optimizing and enhancing prompts for better AI interactions',
    instructions: 'You are a prompt engineering specialist with expertise in crafting effective prompts, optimizing AI interactions, and improving response quality. Help users create better prompts, refine existing ones, and understand prompt engineering best practices. Focus on clarity, specificity, and achieving desired outcomes.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=prompt&backgroundColor=8b5cf6&mouth=smile&style=circle',
    model: 'gpt-4',
    temperature: 0.6,
    maxTokens: 4000,
    topP: 1,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    isPublic: true,
    isEnabled: true,
    tools: ['web_search', 'file_reader'],
    knowledgeBaseIds: [],
    conversationStarters: [
      {
        id: 'pe-1',
        prompt: 'I have a prompt that\'s not giving me the results I want. Can you help me analyze it and suggest improvements for better clarity and specificity?'
      },
      {
        id: 'pe-2',
        prompt: 'I want to create a prompt that makes the AI act as a professional consultant. Can you help me craft a role-based prompt with clear expectations?'
      },
      {
        id: 'pe-3',
        prompt: 'I need the AI to provide responses in a specific JSON format. Can you help me create a prompt that ensures consistent structured output?'
      },
      {
        id: 'pe-4',
        prompt: 'I\'m new to prompt engineering. Can you teach me the best practices for creating effective prompts and common patterns to follow?'
      }
    ],
    diagram: {
      id: 'diagram-4',
      type: 'mindmap',
      title: 'Prompt Optimization Strategy',
      description: 'Mind map for prompt engineering strategies',
      data: {},
      isVisible: true,
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-05T00:00:00Z',
    },
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
];

// Mock User Agent Customizations
export const mockUserAgentCustomizations: UserAgentCustomization[] = [
  {
    id: 'custom-1',
    userId: 'user-2',
    agentId: 'agent-1',
    tenantId: 'tenant-1',
    customInstructions: 'Please be more concise in your responses and focus on actionable insights.',
    customTemperature: 0.8,
    customMaxTokens: 3000,
    customTopP: 0.9,
    customFrequencyPenalty: 0.1,
    customPresencePenalty: 0.1,
    customTools: ['web_search', 'file_reader'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'custom-2',
    userId: 'user-2',
    agentId: 'agent-2',
    tenantId: 'tenant-1',
    customInstructions: 'Focus on enterprise-level business analysis and strategic planning. Be more formal and data-driven in your approach.',
    customTemperature: 0.4,
    customMaxTokens: 5000,
    customTopP: 0.95,
    customFrequencyPenalty: 0,
    customPresencePenalty: 0.1,
    customTools: ['web_search', 'file_reader', 'data_analyzer'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'custom-3',
    userId: 'user-1',
    agentId: 'agent-3',
    tenantId: 'tenant-1',
    customInstructions: 'Provide more detailed technical explanations and include code examples when relevant. Focus on modern architecture patterns and cloud-native solutions.',
    customTemperature: 0.2,
    customMaxTokens: 6000,
    customTopP: 1,
    customFrequencyPenalty: 0,
    customPresencePenalty: 0,
    customTools: ['web_search', 'file_reader', 'code_interpreter'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'custom-4',
    userId: 'user-1',
    agentId: 'agent-4',
    tenantId: 'tenant-1',
    customInstructions: 'Be more creative and experimental in prompt optimization. Focus on advanced prompt engineering techniques and innovative approaches.',
    customTemperature: 0.8,
    customMaxTokens: 4000,
    customTopP: 0.8,
    customFrequencyPenalty: 0.2,
    customPresencePenalty: 0.2,
    customTools: ['web_search', 'file_reader'],
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
];

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Project Planning Session',
    agentId: 'agent-1',
    tenantId: 'tenant-1',
    createdBy: 'user-2',
    lastMessageAt: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'conv-2',
    title: 'Requirements Analysis',
    agentId: 'agent-2',
    tenantId: 'tenant-1',
    createdBy: 'user-2',
    lastMessageAt: '2024-01-14T15:45:00Z',
    createdAt: '2024-01-14T15:00:00Z',
    updatedAt: '2024-01-14T15:45:00Z',
  },
  {
    id: 'conv-3',
    title: 'System Architecture Review',
    agentId: 'agent-3',
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    lastMessageAt: '2024-01-13T09:20:00Z',
    createdAt: '2024-01-13T09:00:00Z',
    updatedAt: '2024-01-13T09:20:00Z',
  },
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    content: 'Hi! I\'m interested in learning more about your product features. Can you help me understand what makes your solution different from competitors?',
    role: 'user',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    content: 'Hello! I\'d be happy to help you understand our product features. Our solution stands out in several key ways:\n\n## 🚀 Key Features\n\n1. **Advanced AI Integration**: We use cutting-edge AI models for intelligent automation\n2. **Multi-tenant Architecture**: Secure, isolated environments for each organization\n3. **Custom Agent Creation**: Build specialized AI assistants for your specific needs\n4. **Real-time Collaboration**: Team-based workflows with live updates\n5. **Comprehensive Analytics**: Detailed insights into usage and performance\n\n### Example Agent Configuration\n\n```javascript\nconst agentConfig = {\n  name: "Sales Assistant",\n  model: "gpt-4",\n  temperature: 0.7,\n  tools: ["web_search", "file_upload", "calendar"],\n  instructions: "You are a helpful sales assistant..."\n};\n```\n\nWould you like me to elaborate on any of these features or discuss how they could benefit your organization?',
    role: 'assistant',
    model: 'gpt-4',
    tokens: 150,
    createdAt: '2024-01-15T10:01:00Z',
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    content: 'That sounds great! I\'m particularly interested in the custom agent creation. How easy is it to set up and configure agents for different departments?',
    role: 'user',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'msg-4',
    conversationId: 'conv-2',
    content: 'I have this React component that\'s not working as expected. Can you help me debug it?\\n\\n```jsx\\nfunction UserProfile({ user }) {\\n  const [isEditing, setIsEditing] = useState(false);\\n  \\n  return (\\n    <div>\\n      {isEditing ? (\\n        <EditForm user={user} onSave={() => setIsEditing(false)} />\\n      ) : (\\n        <DisplayProfile user={user} onEdit={() => setIsEditing(true)} />\\n      )}\\n    </div>\\n  );\\n}\\n```',
    role: 'user',
    createdAt: '2024-01-14T15:00:00Z',
  },
  {
    id: 'msg-5',
    conversationId: 'conv-2',
    content: 'I can see the issue! You\'re missing the `useState` import. Here\'s the corrected version:\n\n```jsx\nimport React, { useState } from \'react\';\n\nfunction UserProfile({ user }) {\n  const [isEditing, setIsEditing] = useState(false);\n  \n  return (\n    <div>\n      {isEditing ? (\n        <EditForm user={user} onSave={() => setIsEditing(false)} />\n      ) : (\n        <DisplayProfile user={user} onEdit={() => setIsEditing(true)} />\n      )}\n    </div>\n  );\n}\n```\n\n### Common React Hooks\n\n| Hook | Purpose | Example |\n|------|---------|---------|\n| `useState` | State management | `const [count, setCount] = useState(0)` |\n| `useEffect` | Side effects | `useEffect(() => {}, [deps])` |\n| `useContext` | Context consumption | `const theme = useContext(ThemeContext)` |\n\n> **Pro tip**: Always import hooks at the top of your component file!\n\nThe error was likely a "useState is not defined" error. Always make sure to import the hooks you\'re using from React.',
    role: 'assistant',
    model: 'gpt-4',
    tokens: 120,
    createdAt: '2024-01-14T15:01:00Z',
  },
  {
    id: 'msg-6',
    conversationId: 'conv-3',
    content: 'I need some creative ideas for our Q1 marketing campaign. We\'re launching a new AI-powered productivity tool. Can you suggest some campaign themes and messaging approaches?',
    role: 'user',
    createdAt: '2024-01-13T09:00:00Z',
  },
  {
    id: 'msg-7',
    conversationId: 'conv-3',
    content: 'Great! Here are some creative campaign themes for your AI productivity tool:\n\n## 🎯 Campaign Themes\n\n### 1. "Work Smarter, Not Harder"\n- Focus on time-saving and efficiency gains\n- Show before/after scenarios\n- Target busy professionals\n\n### 2. "Your AI Co-Pilot"\n- Position the tool as a collaborative partner\n- Emphasize human-AI teamwork\n- Appeal to innovation-minded users\n\n### 3. "Future of Work, Today"\n- Highlight cutting-edge AI technology\n- Position as industry-leading\n- Target early adopters\n\n## 📱 Messaging Approaches\n\n| Approach | Description | Target Audience |\n|----------|-------------|-----------------|\n| **Social Proof** | Customer success stories and testimonials | Decision makers |\n| **Educational Content** | "How AI is transforming productivity" | Tech enthusiasts |\n| **Interactive Demos** | Let users experience the tool firsthand | Hands-on users |\n| **Influencer Partnerships** | Tech influencers and productivity experts | Trend followers |\n\n### Sample Campaign Copy\n\n```html\n<div class="hero-section">\n  <h1>Transform Your Workflow with AI</h1>\n  <p>Join 10,000+ professionals who save 5+ hours daily</p>\n  <button class="cta-button">Start Free Trial</button>\n</div>\n```\n\n> **Key Message**: "Stop working harder. Start working smarter with AI-powered productivity."\n\nWould you like me to elaborate on any of these themes or help develop specific messaging for your target audience?',
    role: 'assistant',
    model: 'gpt-4',
    tokens: 200,
    createdAt: '2024-01-13T09:01:00Z',
  },
];

// Mock authentication data
export const mockAuthData = {
  token: 'mock-jwt-token-12345',
  refreshToken: 'mock-refresh-token-67890',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
};

// Mock Workspaces
export const mockWorkspaces: Workspace[] = [
  {
    id: 'workspace-1',
    name: 'My Workspace',
    description: 'Default workspace for personal projects',
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    isDefault: true,
    settings: {
      theme: 'light',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace-2',
    name: 'Team Collaboration',
    description: 'Workspace for team projects and collaboration',
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    isDefault: false,
    settings: {
      theme: 'light',
      primaryColor: '#10B981',
      secondaryColor: '#059669'
    },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'workspace-3',
    name: 'Client Projects',
    description: 'Workspace for client-specific projects',
    tenantId: 'tenant-1',
    createdBy: 'user-2',
    isDefault: false,
    settings: {
      theme: 'light',
      primaryColor: '#F59E0B',
      secondaryColor: '#D97706'
    },
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
];

// Mock Workspace Members
export const mockWorkspaceMembers: WorkspaceMember[] = [
  // My Workspace - Admin User is admin
  {
    id: 'member-1',
    workspaceId: 'workspace-1',
    userId: 'user-1',
    role: 'admin',
    permissions: {
      canManageAgents: true,
      canManageKnowledge: true,
      canManageFiles: true,
      canManageSettings: true,
      canInviteMembers: true,
      canViewAnalytics: true,
    },
    joinedAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  // Team Collaboration - Admin User is admin, Demo User is member
  {
    id: 'member-2',
    workspaceId: 'workspace-2',
    userId: 'user-1',
    role: 'admin',
    permissions: {
      canManageAgents: true,
      canManageKnowledge: true,
      canManageFiles: true,
      canManageSettings: true,
      canInviteMembers: true,
      canViewAnalytics: true,
    },
    joinedAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'member-3',
    workspaceId: 'workspace-2',
    userId: 'user-2',
    role: 'member',
    permissions: {
      canManageAgents: true,
      canManageKnowledge: true,
      canManageFiles: true,
      canManageSettings: false,
      canInviteMembers: false,
      canViewAnalytics: true,
    },
    joinedAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
  },
  // Client Projects - Demo User is admin, Admin User is member
  {
    id: 'member-4',
    workspaceId: 'workspace-3',
    userId: 'user-2',
    role: 'admin',
    permissions: {
      canManageAgents: true,
      canManageKnowledge: true,
      canManageFiles: true,
      canManageSettings: true,
      canInviteMembers: true,
      canViewAnalytics: true,
    },
    joinedAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'member-5',
    workspaceId: 'workspace-3',
    userId: 'user-1',
    role: 'member',
    permissions: {
      canManageAgents: true,
      canManageKnowledge: true,
      canManageFiles: true,
      canManageSettings: false,
      canInviteMembers: false,
      canViewAnalytics: true,
    },
    joinedAt: '2024-01-21T00:00:00Z',
    updatedAt: '2024-01-21T00:00:00Z',
  },
];

// Mock credentials for demo
export const mockCredentials = {
  admin: {
    email: 'admin@demo.com',
    password: 'admin123',
  },
  user: {
    email: 'user@demo.com',
    password: 'user123',
  },
}; 