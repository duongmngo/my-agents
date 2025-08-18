import React from 'react';
import { MCPServerLog } from '@/types/mcp-types';

interface MCPServerLogsProps {
  logs: MCPServerLog[];
  serverId: string;
}

export const MCPServerLogs: React.FC<MCPServerLogsProps> = ({
  logs,
  serverId
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Logs</h3>
      <p className="text-sm text-gray-500 mb-4">Logs for server: {serverId}</p>
      
      <div className="text-center py-8 text-gray-500">
        <p>Log viewer will be implemented here</p>
        <p className="text-sm">Showing {logs.length} log entries</p>
      </div>
    </div>
  );
};
