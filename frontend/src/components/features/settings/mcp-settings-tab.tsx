'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/hooks/use-auth/auth-store';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { mcpService } from '@/services/mcp-service';
import { Button } from '@/components/common/button';
import { LoadingSpinner } from '@/components/common/loading';
import { MCPServerList, MCPServerForm } from '@/components/features/mcp-integration';
import { 
  Plus, 
  AlertCircle,
  Server
} from 'lucide-react';
import { 
  MCPServer, 
  MCPServerConfiguration 
} from '@/types/mcp-types';

interface MCPSettingsTabProps {
  userRole: 'user' | 'admin' | 'owner' | 'super_admin';
  canManageSettings: boolean;
}

export const MCPSettingsTab: React.FC<MCPSettingsTabProps> = ({ userRole, canManageSettings }) => {
  const t = useTranslations();
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  
  // State for data loading
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for MCP
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [mcpConfigurations, setMcpConfigurations] = useState<MCPServerConfiguration[]>([]);
  const [showMcpServerForm, setShowMcpServerForm] = useState(false);
  const [editingMcpServer, setEditingMcpServer] = useState<MCPServerConfiguration | null>(null);

  // Check if user can manage MCP settings
  const canManageMCP = userRole === 'admin' || userRole === 'owner' || userRole === 'super_admin';

  // Load MCP data
  useEffect(() => {
    const loadMcpData = async () => {
      if (!user || !currentWorkspace) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const [mcpServersResponse, mcpConfigurationsResponse] = await Promise.all([
          mcpService.getServers(user.id, currentWorkspace.id),
          mcpService.getServerConfigurations(user.id, currentWorkspace.id)
        ]);

        if (mcpServersResponse.success && mcpServersResponse.data) {
          setMcpServers(mcpServersResponse.data);
        }

        if (mcpConfigurationsResponse.success && mcpConfigurationsResponse.data) {
          setMcpConfigurations(mcpConfigurationsResponse.data);
        }
        
      } catch (err) {
        setError('Failed to load MCP data');
        console.error('Error loading MCP data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMcpData();
  }, [user, currentWorkspace]);

  // MCP Server handlers
  const handleCreateMcpServer = async (config: Omit<MCPServerConfiguration, 'id'>) => {
    if (!user || !currentWorkspace) return;
    
    try {
      const response = await mcpService.createServerConfiguration(user.id, currentWorkspace.id, config);
      if (response.success) {
        setShowMcpServerForm(false);
        setEditingMcpServer(null);
        
        // Refresh configurations list
        const configurationsResponse = await mcpService.getServerConfigurations(user.id, currentWorkspace.id);
        if (configurationsResponse.success && configurationsResponse.data) {
          setMcpConfigurations(configurationsResponse.data);
        }
      } else {
        setError(response.message || 'Failed to create MCP server configuration');
      }
    } catch (err) {
      setError('Failed to create MCP server configuration');
      console.error('Error creating MCP server configuration:', err);
    }
  };

  const handleUpdateMcpServer = async (config: MCPServerConfiguration) => {
    if (!user || !currentWorkspace) return;
    
    try {
      const response = await mcpService.updateServerConfiguration(user.id, currentWorkspace.id, config.id, config);
      if (response.success) {
        setShowMcpServerForm(false);
        setEditingMcpServer(null);
        
        // Refresh configurations list
        const configurationsResponse = await mcpService.getServerConfigurations(user.id, currentWorkspace.id);
        if (configurationsResponse.success && configurationsResponse.data) {
          setMcpConfigurations(configurationsResponse.data);
        }
      } else {
        setError(response.message || 'Failed to update MCP server configuration');
      }
    } catch (err) {
      setError('Failed to update MCP server configuration');
      console.error('Error updating MCP server configuration:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading MCP settings..." />
      </div>
    );
  }

  if (!canManageMCP) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-400 dark:text-neutral-500 mb-4">
          <Server className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          Access Restricted
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          You need admin, owner, or super admin privileges to access MCP server settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MCP Server Management */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t('settings.mcp.title')}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('settings.mcp.description')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setEditingMcpServer(null);
              setShowMcpServerForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('settings.mcp.addServer')}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 flex items-center space-x-2 mb-6">
            <AlertCircle className="h-5 w-5 text-error-500 dark:text-error-400" />
            <span className="text-error-700 dark:text-error-300">{error}</span>
          </div>
        )}

        <MCPServerList 
          servers={mcpServers}
          onEdit={(serverId) => {
            const config = mcpConfigurations.find(c => c.id === serverId);
            if (config) {
              setEditingMcpServer(config);
              setShowMcpServerForm(true);
            }
          }}
          onDelete={(serverId) => console.log('Delete server:', serverId)}
          onStart={(serverId) => console.log('Start server:', serverId)}
          onStop={(serverId) => console.log('Stop server:', serverId)}
          onRestart={(serverId) => console.log('Restart server:', serverId)}
          showActions={canManageMCP}
        />

        {/* MCP Server Form Modal */}
        {showMcpServerForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
              <MCPServerForm
                config={editingMcpServer || undefined}
                onSave={(config) => {
                  if (editingMcpServer && config.id) {
                    handleUpdateMcpServer(config as MCPServerConfiguration);
                  } else {
                    handleCreateMcpServer(config as Omit<MCPServerConfiguration, 'id'>);
                  }
                }}
                onCancel={() => {
                  setShowMcpServerForm(false);
                  setEditingMcpServer(null);
                }}
                isEditing={!!editingMcpServer}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
