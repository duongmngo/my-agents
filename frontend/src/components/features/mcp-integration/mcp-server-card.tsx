import React from 'react';
import { MCPServer } from '@/types/mcp-types';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  Trash2, 
  Activity,
  Server,
  Wrench
} from 'lucide-react';

interface MCPServerCardProps {
  server: MCPServer;
  onStart?: (serverId: string) => void;
  onStop?: (serverId: string) => void;
  onRestart?: (serverId: string) => void;
  onEdit?: (serverId: string) => void;
  onDelete?: (serverId: string) => void;
  onViewTools?: (serverId: string) => void;
  onViewMetrics?: (serverId: string) => void;
  showActions?: boolean;
}

export const MCPServerCard: React.FC<MCPServerCardProps> = ({
  server,
  onStart,
  onStop,
  onRestart,
  onEdit,
  onDelete,
  onViewTools,
  onViewMetrics,
  showActions = true
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'secondary';
      case 'error':
        return 'danger';
      case 'starting':
      case 'stopping':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'success';
      case 'unhealthy':
        return 'danger';
      default:
        return 'warning';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Server className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{server.name}</h3>
            {server.description && (
              <p className="text-sm text-gray-500">{server.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusColor(server.status)}>
            {server.status}
          </Badge>
          <Badge variant={getHealthColor(server.health)}>
            {server.health}
          </Badge>
        </div>
      </div>

      {/* Server Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Version</p>
          <p className="text-sm text-gray-900">{server.version}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Endpoint</p>
          <p className="text-sm text-gray-900 font-mono">{server.endpoint}:{server.port}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Protocol</p>
          <p className="text-sm text-gray-900 uppercase">{server.protocol}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Tools</p>
          <p className="text-sm text-gray-900">{server.tools.length} available</p>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Resource Usage</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">CPU</p>
            <p className="text-sm font-medium text-gray-900">{server.resources.cpu} cores</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Memory</p>
            <p className="text-sm font-medium text-gray-900">{server.resources.memory} MB</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Network</p>
            <p className="text-sm font-medium text-gray-900">{server.resources.network}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">Uptime</p>
          <p className="text-sm font-medium text-gray-900">
            {formatUptime(server.metadata.uptime)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Requests</p>
          <p className="text-sm font-medium text-gray-900">
            {server.metadata.totalRequests.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Errors</p>
          <p className="text-sm font-medium text-gray-900">
            {server.metadata.errorCount}
          </p>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewTools?.(server.id)}
              disabled={server.status !== 'running'}
            >
              <Wrench className="h-4 w-4 mr-1" />
              Tools
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewMetrics?.(server.id)}
            >
              <Activity className="h-4 w-4 mr-1" />
              Metrics
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {server.status === 'stopped' && (
              <Button
                size="sm"
                onClick={() => onStart?.(server.id)}
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
            
            {server.status === 'running' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStop?.(server.id)}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRestart?.(server.id)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restart
                </Button>
              </>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(server.id)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Edit
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(server.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
