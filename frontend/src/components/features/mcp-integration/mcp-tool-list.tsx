import React from 'react';
import { MCPTool } from '@/types/mcp-types';
import { MCPToolCard } from './mcp-tool-card';

interface MCPToolListProps {
  tools: MCPTool[];
  onEdit?: (toolId: string) => void;
  onDelete?: (toolId: string) => void;
  onToggle?: (toolId: string, enabled: boolean) => void;
  showActions?: boolean;
}

export const MCPToolList: React.FC<MCPToolListProps> = ({
  tools,
  onEdit,
  onDelete,
  onToggle,
  showActions = true
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool) => (
        <MCPToolCard
          key={tool.id}
          tool={tool}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
          showActions={showActions}
        />
      ))}
    </div>
  );
};
