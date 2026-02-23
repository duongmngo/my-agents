'use client';

import React from 'react';
import { Tool } from '@/types/tool-types';
import { ToolCard } from './tool-card';

interface ToolListProps {
  tools: Tool[];
  emptyMessage?: string;
  onConfigure: (tool: Tool) => void;
  onToggleActive: (tool: Tool) => void;
}

export const ToolList: React.FC<ToolListProps> = ({
  tools,
  emptyMessage = 'No tools found',
  onConfigure,
  onToggleActive,
}) => {
  if (tools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          onConfigure={onConfigure}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  );
};

export default ToolList;
