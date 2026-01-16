'use client';

import React from 'react';
import { MessageSquare, Edit, Copy, Trash2, User } from 'lucide-react';
import { Agent } from '@/types/agent-types';

interface AgentDropdownMenuProps {
  agent: Agent;
  isAdmin: boolean;
  userCustomization: any;
  onStartConversation: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCustomize: () => void;
}

export const AgentDropdownMenu: React.FC<AgentDropdownMenuProps> = ({
  agent,
  isAdmin,
  userCustomization,
  onStartConversation,
  onEdit,
  onDuplicate,
  onDelete,
  onCustomize,
}) => {
  return (
    <div className="absolute right-0 top-8 w-48 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-10">
      <div className="py-1">
        <button
          onClick={onStartConversation}
          className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Start Conversation
        </button>
        
        {!agent.isBuiltIn && (
          <>
            {!isAdmin && (
              <button
                onClick={onCustomize}
                className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                Customize
              </button>
            )}
            
            {isAdmin && (
              <>
                <button
                  onClick={onEdit}
                  className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
              </>
            )}
          </>
        )}
        
        {isAdmin && (
          <>
            <button
              onClick={onDuplicate}
              className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </button>
            {!agent.isBuiltIn && (
              <button
                onClick={onDelete}
                className="flex items-center w-full px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
