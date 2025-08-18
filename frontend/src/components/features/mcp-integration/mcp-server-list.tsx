import React from 'react';
import { MCPServer } from '@/types/mcp-types';
import { MCPServerCard } from './mcp-server-card';

interface MCPServerListProps {
  servers: MCPServer[];
  onStart?: (serverId: string) => void;
  onStop?: (serverId: string) => void;
  onRestart?: (serverId: string) => void;
  onEdit?: (serverId: string) => void;
  onDelete?: (serverId: string) => void;
  onViewTools?: (serverId: string) => void;
  onViewMetrics?: (serverId: string) => void;
  showActions?: boolean;
}

export const MCPServerList: React.FC<MCPServerListProps> = ({
  servers,
  onStart,
  onStop,
  onRestart,
  onEdit,
  onDelete,
  onViewTools,
  onViewMetrics,
  showActions = true
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {servers.map((server) => (
        <MCPServerCard
          key={server.id}
          server={server}
          onStart={onStart}
          onStop={onStop}
          onRestart={onRestart}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewTools={onViewTools}
          onViewMetrics={onViewMetrics}
          showActions={showActions}
        />
      ))}
    </div>
  );
};
