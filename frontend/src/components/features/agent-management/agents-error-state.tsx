'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface AgentsErrorStateProps {
  error: string;
}

export const AgentsErrorState: React.FC<AgentsErrorStateProps> = ({ error }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="h-16 w-16 mx-auto mb-4 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-error-600 dark:text-error-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">Error loading agents</h3>
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
};
