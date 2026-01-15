import { useState, useEffect, useCallback } from 'react';
import { Agent, UserAgentCustomization, AgentFormData, UserAgentCustomizationFormData } from '@/types/agent-types';
import { agentService } from '@/services/agent-service';
import { useToast } from '@/components/common/toast';

interface UseAgentsReturn {
  agents: Agent[];
  userCustomizations: UserAgentCustomization[];
  isLoading: boolean;
  error: string | null;
  createAgent: (data: AgentFormData) => Promise<void>;
  updateAgent: (id: string, data: AgentFormData) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  duplicateAgent: (id: string) => Promise<void>;
  saveCustomization: (agentId: string, data: UserAgentCustomizationFormData) => Promise<void>;
  deleteCustomization: (agentId: string) => Promise<void>;
  refreshAgents: () => Promise<void>;
  refreshCustomizations: () => Promise<void>;
}

export function useAgents(): UseAgentsReturn {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [userCustomizations, setUserCustomizations] = useState<UserAgentCustomization[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const refreshAgents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedAgents = await agentService.getAgents();
      setAgents(fetchedAgents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCustomizations = useCallback(async () => {
    try {
      setError(null);
      const fetchedCustomizations = await agentService.getUserCustomizations();
      setUserCustomizations(fetchedCustomizations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customizations');
    }
  }, []);

  const createAgent = useCallback(async (data: AgentFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const newAgent = await agentService.createAgent(data);
      setAgents(prev => [...prev, newAgent]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAgent = useCallback(async (id: string, data: AgentFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedAgent = await agentService.updateAgent(id, data);
      setAgents(prev => prev.map(agent => 
        agent.id === id ? updatedAgent : agent
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAgent = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await agentService.deleteAgent(id);
      await refreshAgents();
      toast.addToast({
        type: 'success',
        title: 'Agent Deleted',
        message: 'The agent was deleted successfully.'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
      toast.addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err instanceof Error ? err.message : 'Failed to delete agent.'
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshAgents, toast]);

  const duplicateAgent = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const duplicatedAgent = await agentService.duplicateAgent(id);
      setAgents(prev => [...prev, duplicatedAgent]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate agent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCustomization = useCallback(async (agentId: string, data: UserAgentCustomizationFormData) => {
    try {
      setError(null);
      const savedCustomization = await agentService.saveUserCustomization(agentId, data);
      
      setUserCustomizations(prev => {
        const existingIndex = prev.findIndex(custom => custom.agentId === agentId);
        if (existingIndex >= 0) {
          // Update existing customization
          const updated = [...prev];
          updated[existingIndex] = savedCustomization;
          return updated;
        } else {
          // Add new customization
          return [...prev, savedCustomization];
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customization');
      throw err;
    }
  }, []);

  const deleteCustomization = useCallback(async (agentId: string) => {
    try {
      setError(null);
      await agentService.deleteUserCustomization(agentId);
      setUserCustomizations(prev => prev.filter(custom => custom.agentId !== agentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customization');
      throw err;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load both agents and customizations in parallel
        const [fetchedAgents, fetchedCustomizations] = await Promise.all([
          agentService.getAgents(),
          agentService.getUserCustomizations()
        ]);
        
        setAgents(fetchedAgents);
        setUserCustomizations(fetchedCustomizations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load initial data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  return {
    agents,
    userCustomizations,
    isLoading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    duplicateAgent,
    saveCustomization,
    deleteCustomization,
    refreshAgents,
    refreshCustomizations,
  };
}
