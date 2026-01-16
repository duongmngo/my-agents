'use client';

import React from 'react';

export const AgentsLoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="h-16 w-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">Loading agents...</h3>
        <p className="text-neutral-500 dark:text-neutral-400">Please wait while we fetch your AI assistants.</p>
      </div>
    </div>
  );
};
