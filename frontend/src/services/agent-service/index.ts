import { Agent, AgentFormData, UserAgentCustomization, UserAgentCustomizationFormData } from '@/types/agent-types';
import { ApiResponse, PaginatedResponse } from '@/types/common-types';
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
      throw error;
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
      throw error;
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
      const response = await apiClient.post<any>(`${this.baseUrl}/${id}/duplicate`);
      // apiClient returns the data directly, not wrapped in .data
      return this.normalizeAgent(response);
    } catch (error) {
      console.error('Error duplicating agent:', error);
      throw error;
    }
  }

  // Get user customizations for agents
  // TODO: Implement when backend API is ready
  async getUserCustomizations(): Promise<UserAgentCustomization[]> {
    // Feature not yet implemented - return empty array
    console.warn('getUserCustomizations: Feature not yet implemented');
    return [];
  }

  // Get user customization for a specific agent
  // TODO: Implement when backend API is ready
  async getUserCustomization(_agentId: string): Promise<UserAgentCustomization | null> {
    // Feature not yet implemented - return null
    console.warn('getUserCustomization: Feature not yet implemented');
    return null;
  }

  // Save or update user customization
  // TODO: Implement when backend API is ready
  async saveUserCustomization(_agentId: string, _customizationData: UserAgentCustomizationFormData): Promise<UserAgentCustomization> {
    throw new Error('saveUserCustomization: Feature not yet implemented');
  }

  // Delete user customization
  // TODO: Implement when backend API is ready
  async deleteUserCustomization(_agentId: string): Promise<void> {
    throw new Error('deleteUserCustomization: Feature not yet implemented');
  }

  // Get agent templates
  // TODO: Implement when backend API is ready
  async getAgentTemplates(): Promise<any[]> {
    // Feature not yet implemented - return empty array
    console.warn('getAgentTemplates: Feature not yet implemented');
    return [];
  }
}

export const agentService = new AgentService();
export default agentService;
// AgentService remains frontend-only, no db/session logic required
// All API calls use apiClient, no backend session management
