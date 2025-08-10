import { User, Tenant, Agent, Conversation, Message } from '@/types/common-types';

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
    name: 'Sales Assistant',
    description: 'AI assistant specialized in sales and customer service',
    instructions: 'You are a sales assistant with expertise in product knowledge, customer service, and sales techniques. Help customers with product inquiries and sales support.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sales&backgroundColor=8b5cf6&mouth=smile&style=circle',
    model: 'gpt-4',
    temperature: 0.7,
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    isPublic: true,
    tools: ['web_search', 'file_reader'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'agent-2',
    name: 'Code Assistant',
    description: 'AI assistant specialized in programming and code review',
    instructions: 'You are a programming assistant with expertise in multiple programming languages. Help with code review, debugging, and best practices.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=code&backgroundColor=ef4444&mouth=smile&style=circle',
    model: 'gpt-4',
    temperature: 0.3,
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    isPublic: true,
    tools: ['code_executor', 'file_reader'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'agent-3',
    name: 'Marketing Assistant',
    description: 'AI assistant specialized in marketing and content creation',
    instructions: 'You are a marketing assistant with expertise in content creation, social media, and marketing strategies. Help with content ideas and marketing campaigns.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=marketing&backgroundColor=f59e0b&mouth=smile&style=circle',
    model: 'gpt-4',
    temperature: 0.8,
    tenantId: 'tenant-1',
    createdBy: 'user-1',
    isPublic: false,
    tools: ['web_search', 'image_generator'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Product Inquiry',
    agentId: 'agent-1',
    tenantId: 'tenant-1',
    createdBy: 'user-2',
    lastMessageAt: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'conv-2',
    title: 'Code Review Help',
    agentId: 'agent-2',
    tenantId: 'tenant-1',
    createdBy: 'user-2',
    lastMessageAt: '2024-01-14T15:45:00Z',
    createdAt: '2024-01-14T15:00:00Z',
    updatedAt: '2024-01-14T15:45:00Z',
  },
  {
    id: 'conv-3',
    title: 'Marketing Campaign Ideas',
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