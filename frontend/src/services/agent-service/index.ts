import { Agent, AgentFormData, UserAgentCustomization, UserAgentCustomizationFormData } from '@/types/agent-types';
import { ApiResponse, PaginatedResponse } from '@/types/common-types';
import { mockAgents, mockUserAgentCustomizations } from '@/utils/mock-data';

class AgentService {
  private baseUrl = '/api/agents';

  // Get all agents for the current tenant
  async getAgents(): Promise<Agent[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock agents
      return [...mockAgents];
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  }

  // Get a single agent by ID
  async getAgent(id: string): Promise<Agent> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const agent = mockAgents.find(a => a.id === id);
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      return agent;
    } catch (error) {
      console.error('Error fetching agent:', error);
      throw error;
    }
  }

  // Create a new agent
  async createAgent(agentData: AgentFormData): Promise<Agent> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        ...agentData,
        tenantId: 'tenant-1',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // In a real implementation, this would be saved to the backend
      // For now, we'll just return the new agent
      console.log('Created new agent:', newAgent);
      
      return newAgent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  // Update an existing agent
  async updateAgent(id: string, agentData: AgentFormData): Promise<Agent> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const existingAgent = mockAgents.find(a => a.id === id);
      if (!existingAgent) {
        throw new Error('Agent not found');
      }
      
      const updatedAgent: Agent = {
        ...existingAgent,
        ...agentData,
        updatedAt: new Date().toISOString(),
      };
      
      // In a real implementation, this would be saved to the backend
      console.log('Updated agent:', updatedAgent);
      
      return updatedAgent;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  // Delete an agent
  async deleteAgent(id: string): Promise<void> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const agent = mockAgents.find(a => a.id === id);
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      // In a real implementation, this would be deleted from the backend
      console.log('Deleted agent:', agent.name);
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  }

  // Duplicate an agent
  async duplicateAgent(id: string): Promise<Agent> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      const originalAgent = mockAgents.find(a => a.id === id);
      if (!originalAgent) {
        throw new Error('Agent not found');
      }
      
      const duplicatedAgent: Agent = {
        ...originalAgent,
        id: `agent-${Date.now()}`,
        name: `${originalAgent.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // In a real implementation, this would be saved to the backend
      console.log('Duplicated agent:', duplicatedAgent.name);
      
      return duplicatedAgent;
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
