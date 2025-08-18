import React from 'react';
import { MCPServerMetrics } from '@/types/mcp-types';

interface MCPServerMetricsProps {
  metrics: MCPServerMetrics[];
  serverId: string;
}

export const MCPServerMetrics: React.FC<MCPServerMetricsProps> = ({
  metrics,
  serverId
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Metrics</h3>
      <p className="text-sm text-gray-500 mb-4">Metrics for server: {serverId}</p>
      
      <div className="text-center py-8 text-gray-500">
        <p>Metrics visualization will be implemented here</p>
        <p className="text-sm">Showing {metrics.length} data points</p>
      </div>
    </div>
  );
};
