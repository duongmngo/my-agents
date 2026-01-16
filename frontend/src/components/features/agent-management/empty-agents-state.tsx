'use client';

import React from 'react';
import { User } from 'lucide-react';

interface EmptyAgentsStateProps {
  isAdmin: boolean;
}

export const EmptyAgentsState: React.FC<EmptyAgentsStateProps> = ({ isAdmin }) => {
  return (
    <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
      <div className="max-w-md mx-auto">
        <div className="h-16 w-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          No custom agents yet
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">
          {isAdmin 
            ? 'Create your first custom AI agent to get started'
            : 'No custom agents have been created for this workspace yet'
          }
        </p>
      </div>
    </div>
  );
};
