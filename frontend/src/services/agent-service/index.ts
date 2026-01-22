import { Agent, AgentFormData, UserAgentCustomization, UserAgentCustomizationFormData } from '@/types/agent-types';
import { ApiResponse, PaginatedResponse } from '@/types/common-types';
import { mockAgents, mockUserAgentCustomizations } from '@/utils/mock-data';
import { apiClient } from '@/services/api-client';

class AgentService {
  private baseUrl = '/api/v1/agents';

  // Helper to normalize agent from backend (camelCase only)
  private normalizeAgent(agent: any): Agent {
    if (!agent || !agent.id) {
      throw new Error('Agent object is missing or malformed (missing id). Backend response: ' + JSON.stringify(agent));
    }
    // ...existing code...
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      instructions: agent.instructions,
      agentType: agent.agentType,
      isBuiltIn: agent.isBuiltIn ?? false,
      status: agent.status?.toLowerCase() || 'active',
      isPublic: agent.isPublic ?? true,
      isActive: agent.isActive ?? true,
      aiModel: agent.aiModel,
      temperature: agent.temperature?.toString() || '0.7',
      maxTokens: agent.maxTokens,
      capabilities: agent.capabilities,
      // Convert tools object {toolId: {enabled: true}} to array [toolId]
      tools: agent.tools && typeof agent.tools === 'object' && !Array.isArray(agent.tools)
        ? Object.keys(agent.tools).filter(key => agent.tools[key]?.enabled !== false)
        : (agent.tools || []),
      systemPrompt: agent.systemPrompt,
      avatarUrl: agent.avatarUrl,
      color: agent.color,
      conversationCount: agent.conversationCount || 0,
      messageCount: agent.messageCount || 0,
      totalTokensUsed: agent.totalTokensUsed || 0,
      version: agent.version || '1.0.0',
      parentAgentId: agent.parentAgentId,
      workspaceId: agent.workspaceId,
      createdBy: agent.createdBy,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      conversationStarters: agent.conversationStarters || [],
    };
  }

  // Get all agents for the current tenant
  async getAgents(agentType?: 'default-agent' | 'user-agent', isActive?: boolean): Promise<Agent[]> {
    try {
      const params = new URLSearchParams();      
      if (agentType) params.append('agent_type', agentType);
      if (isActive !== undefined) params.append('is_active', String(isActive));
      
      const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
      const response = await apiClient.get<any[]>(url);
      return response.map(agent => this.normalizeAgent(agent));
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Fallback to mock data
      return [...mockAgents];
    }
  }

  // Get a single agent by ID
  async getAgent(id: string): Promise<Agent> {
    try {
      const response = await apiClient.get<any>(`${this.baseUrl}/${id}`);
      // Some APIs return the object directly, some wrap in .data
      const agentObj = response?.data ?? response;
      return this.normalizeAgent(agentObj);
    } catch (error) {
      console.error('Error fetching agent:', error);
      // Fallback to mock data
      const agent = mockAgents.find(a => a.id === id);
      if (!agent) {
        throw new Error('Agent not found');
      }
      return agent;
    }
  }

  // Create a new agent
  async createAgent(agentData: AgentFormData): Promise<Agent> {
    try {
      // Transform form data to match API expectations
      const payload = {
        name: agentData.name,
        description: agentData.description,
        instructions: agentData.instructions,
        agent_type: agentData.agentType || 'user-agent',
        ai_model: agentData.aiModel || agentData.model || 'gpt-4',
        temperature: agentData.temperature?.toString() || '0.7',
        max_tokens: agentData.maxTokens,
        capabilities: agentData.capabilities,
        // Convert tools array to object for backend (array of tool IDs -> {enabled: true} map)
        tools: Array.isArray(agentData.tools) 
          ? agentData.tools.reduce((acc, toolId) => ({ ...acc, [toolId]: { enabled: true } }), {})
          : (agentData.tools || {}),
        system_prompt: agentData.systemPrompt,
        avatar_url: agentData.avatarUrl || agentData.avatar,
        color: agentData.color,
        is_public: agentData.isPublic ?? true,
        conversationStarters: agentData.conversationStarters,
      };
      
      const response = await apiClient.post<any>(this.baseUrl, payload);
      // apiClient returns the data directly, not wrapped in .data
      return this.normalizeAgent(response);
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  // Update an existing agent
  async updateAgent(id: string, agentData: AgentFormData): Promise<Agent> {
    try {
      // Transform form data to match API expectations
      const payload = {
        name: agentData.name,
        description: agentData.description,
        instructions: agentData.instructions,
        agent_type: agentData.agentType,
        ai_model: agentData.aiModel || agentData.model,
        temperature: agentData.temperature?.toString(),
        max_tokens: agentData.maxTokens,
        capabilities: agentData.capabilities,
        // Convert tools array to object for backend (array of tool IDs -> {enabled: true} map)
        tools: Array.isArray(agentData.tools) 
          ? agentData.tools.reduce((acc, toolId) => ({ ...acc, [toolId]: { enabled: true } }), {})
          : (agentData.tools || {}),
        system_prompt: agentData.systemPrompt,
        avatar_url: agentData.avatarUrl || agentData.avatar,
        color: agentData.color,
        is_public: agentData.isPublic,
        is_active: agentData.isActive ?? agentData.isEnabled,
        conversationStarters: agentData.conversationStarters,
      };
      
      const response = await apiClient.put<any>(`${this.baseUrl}/${id}`, payload);
      return this.normalizeAgent(response);
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  // Delete an agent
  async deleteAgent(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  }

  // Duplicate an agent
  async duplicateAgent(id: string): Promise<Agent> {
    try {
      const response = await apiClient.post<Agent>(`${this.baseUrl}/${id}/duplicate`);
      return response.data;
    } catch (error) {
      console.error('Error duplicating agent:', error);
      throw error;
    }
  }

  // Get user customizations for agents
  async getUserCustomizations(): Promise<UserAgentCustomization[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Return mock customizations
      return [...mockUserAgentCustomizations];
    } catch (error) {
      console.error('Error fetching customizations:', error);
      throw error;
    }
  }

  // Get user customization for a specific agent
  async getUserCustomization(agentId: string): Promise<UserAgentCustomization | null> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const customization = mockUserAgentCustomizations.find(c => c.agentId === agentId);
      return customization || null;
    } catch (error) {
      console.error('Error fetching customization:', error);
      throw error;
    }
  }

  // Save or update user customization
  async saveUserCustomization(agentId: string, customizationData: UserAgentCustomizationFormData): Promise<UserAgentCustomization> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const existingCustomization = mockUserAgentCustomizations.find(c => c.agentId === agentId);
      
      const customization: UserAgentCustomization = {
        id: existingCustomization?.id || `custom-${Date.now()}`,
        userId: 'user-2', // In real app, this would be the current user
        agentId,
        tenantId: 'tenant-1',
        ...customizationData,
        isActive: true,
        createdAt: existingCustomization?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // In a real implementation, this would be saved to the backend
      console.log('Saved customization for agent:', agentId);
      
      return customization;
    } catch (error) {
      console.error('Error saving customization:', error);
      throw error;
    }
  }

  // Delete user customization
  async deleteUserCustomization(agentId: string): Promise<void> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const customization = mockUserAgentCustomizations.find(c => c.agentId === agentId);
      if (!customization) {
        throw new Error('Customization not found');
      }
      
      // In a real implementation, this would be deleted from the backend
      console.log('Deleted customization for agent:', agentId);
    } catch (error) {
      console.error('Error deleting customization:', error);
      throw error;
    }
  }

  // Get agent templates
  async getAgentTemplates(): Promise<any[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Return mock templates based on the existing agents
      const templates = [
        {
          id: 'project-manager',
          name: 'Project Manager',
          description: 'Specialized in project management and team coordination',
          instructions: 'You are a project management assistant with expertise in agile methodologies, task tracking, and team collaboration. Help with project planning, progress tracking, and team coordination.',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 4000,
          tools: ['web_search', 'file_reader'],
        },
        {
          id: 'business-analyst',
          name: 'Business Analyst',
          description: 'Specialized in business analysis and requirements gathering',
          instructions: 'You are a business analyst assistant with expertise in requirements analysis, process modeling, and stakeholder management. Help with business requirements, user stories, and process optimization.',
          model: 'gpt-4',
          temperature: 0.5,
          maxTokens: 4000,
          tools: ['web_search', 'file_reader', 'data_analyzer'],
        },
        {
          id: 'solution-architecture',
          name: 'Solution Architecture',
          description: 'Specialized in solution architecture and technical design',
          instructions: 'You are a solution architect assistant with expertise in software architecture, system design, and technical planning. Help with architectural decisions, system design patterns, and technical specifications.',
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 4000,
          tools: ['web_search', 'file_reader', 'code_interpreter'],
        },
        {
          id: 'prompt-enhancer',
          name: 'Prompt Enhancer',
          description: 'Specialized in optimizing and enhancing prompts for better AI interactions',
          instructions: 'You are a prompt engineering specialist with expertise in crafting effective prompts, optimizing AI interactions, and improving response quality. Help users create better prompts and understand prompt engineering best practices.',
          model: 'gpt-4',
          temperature: 0.6,
          maxTokens: 4000,
          tools: ['web_search', 'file_reader'],
        },
      ];
      
      return templates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }
}

export const agentService = new AgentService();
export default agentService;
// AgentService remains frontend-only, no db/session logic required
// All API calls use apiClient, no backend session management
