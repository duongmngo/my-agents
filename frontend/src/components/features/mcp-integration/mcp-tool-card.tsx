import React from 'react';
import { MCPTool } from '@/types/mcp-types';
import { Badge } from '@/components/common/badge/badge';
import { Button } from '@/components/common/button';
import { Tool, Settings, Trash2 } from 'lucide-react';

interface MCPToolCardProps {
  tool: MCPTool;
  onEdit?: (toolId: string) => void;
  onDelete?: (toolId: string) => void;
  onToggle?: (toolId: string, enabled: boolean) => void;
  showActions?: boolean;
}

export const MCPToolCard: React.FC<MCPToolCardProps> = ({
  tool,
  onEdit,
  onDelete,
  onToggle,
  showActions = true
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Tool className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
            <p className="text-sm text-gray-500">{tool.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={tool.enabled ? 'success' : 'secondary'}>
            {tool.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
          <Badge variant="outline">{tool.category}</Badge>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-500">Version: {tool.version}</p>
        <p className="text-xs text-gray-500">Parameters: {tool.parameters.length}</p>
      </div>

      {showActions && (
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggle?.(tool.id, !tool.enabled)}
          >
            {tool.enabled ? 'Disable' : 'Enable'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit?.(tool.id)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete?.(tool.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
};
