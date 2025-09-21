'use client';

import React from 'react';
import { 
  Brain, 
  Zap, 
  Clock, 
  Hash, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Loader
} from 'lucide-react';
import { EmbeddingStats } from '@/services/note-service';

interface EmbeddingStatsProps {
  stats?: EmbeddingStats;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  compact?: boolean;
  showDetails?: boolean;
}

export const EmbeddingStatsComponent: React.FC<EmbeddingStatsProps> = ({
  stats,
  status,
  compact = false,
  showDetails = false
}) => {
  // If no stats and not processing, show not embedded state
  if (!stats?.generated && status !== 'processing') {
    return (
      <div className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">Not embedded</span>
      </div>
    );
  }

  // If processing, show loading state
  if (status === 'processing') {
    return (
      <div className="flex items-center space-x-1 text-blue-500 dark:text-blue-400">
        <Loader className="h-3 w-3 animate-spin" />
        <span className="text-xs">Processing...</span>
      </div>
    );
  }

  // If failed, show error state
  if (status === 'failed') {
    return (
      <div className="flex items-center space-x-1 text-red-500 dark:text-red-400">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">Embedding failed</span>
      </div>
    );
  }

  // If completed but no stats, show generic success
  if (status === 'completed' && !stats?.generated) {
    return (
      <div className="flex items-center space-x-1 text-green-500 dark:text-green-400">
        <CheckCircle className="h-3 w-3" />
        <span className="text-xs">Embedded</span>
      </div>
    );
  }

  // Show detailed stats if available
  if (stats?.generated) {
    if (compact) {
      return (
        <div className="flex items-center space-x-1 text-green-500 dark:text-green-400">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs">Embedded</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Status */}
        <div className="flex items-center space-x-1 text-green-500 dark:text-green-400">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs font-medium">Embedded</span>
        </div>

        {/* Basic Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {stats.model && (
            <div className="flex items-center space-x-1 text-neutral-600 dark:text-neutral-400">
              <Brain className="h-3 w-3" />
              <span className="truncate" title={stats.model}>
                {stats.model}
              </span>
            </div>
          )}
          
          {stats.dimension && (
            <div className="flex items-center space-x-1 text-neutral-600 dark:text-neutral-400">
              <Hash className="h-3 w-3" />
              <span>{stats.dimension}D</span>
            </div>
          )}
          
          {stats.latencyMs && (
            <div className="flex items-center space-x-1 text-neutral-600 dark:text-neutral-400">
              <Zap className="h-3 w-3" />
              <span>{stats.latencyMs}ms</span>
            </div>
          )}
          
          {stats.tokensProcessed && (
            <div className="flex items-center space-x-1 text-neutral-600 dark:text-neutral-400">
              <Hash className="h-3 w-3" />
              <span>{stats.tokensProcessed} tokens</span>
            </div>
          )}
        </div>

        {/* Additional Details */}
        {showDetails && (
          <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
            {stats.provider && (
              <div className="flex items-center space-x-1">
                <span>Provider:</span>
                <span className="font-medium">{stats.provider}</span>
              </div>
            )}
            
            {stats.generatedAt && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(stats.generatedAt).toLocaleDateString()} {new Date(stats.generatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            )}
            
            {stats.costEstimate && (
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3" />
                <span>${stats.costEstimate.toFixed(4)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400">
      <AlertCircle className="h-3 w-3" />
      <span className="text-xs">Unknown status</span>
    </div>
  );
};
