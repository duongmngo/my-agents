import React from 'react';
import { MCPServerEvent } from '@/types/mcp-types';

interface MCPServerEventsProps {
  events: MCPServerEvent[];
  serverId: string;
}

export const MCPServerEvents: React.FC<MCPServerEventsProps> = ({
  events,
  serverId
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Events</h3>
      <p className="text-sm text-gray-500 mb-4">Events for server: {serverId}</p>
      
      <div className="text-center py-8 text-gray-500">
        <p>Event timeline will be implemented here</p>
        <p className="text-sm">Showing {events.length} events</p>
      </div>
    </div>
  );
};
