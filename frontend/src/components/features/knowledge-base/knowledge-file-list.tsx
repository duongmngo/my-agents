'use client';

import React from 'react';
import { 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  FileText,
  MoreHorizontal,
} from 'lucide-react';
import { KnowledgeFile, FileStatus } from '@/types/knowledge-types';
import { getFileIcon, getStatusColor, getStatusText } from '@/utils/knowledge-utils';

interface KnowledgeFileListProps {
  files: KnowledgeFile[];
  loading?: boolean;
  onReprocess: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const KnowledgeFileList: React.FC<KnowledgeFileListProps> = ({
  files,
  loading = false,
  onReprocess,
  onDelete,
  onLoadMore,
  hasMore = false,
}) => {
  if (files.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <FileText className="h-10 w-10 text-neutral-400 dark:text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          No files uploaded
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
          Upload files to add them to your knowledge base
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'processed':
        return <CheckCircle2 className="h-4 w-4 text-success-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-warning-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-primary-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      default:
        return null;
    }
  };

  const parseTags = (tagsString?: string): string[] => {
    if (!tagsString) return [];
    return tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
  };

  return (
    <div className="space-y-3">
      {files.map((file) => {
        const FileIcon = getFileIcon(file.fileType);
        const tags = parseTags(file.tags);
        
        return (
          <div 
            key={file.id} 
            className="group flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200"
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex-shrink-0">
                <FileIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {file.originalFilename}
                  </h3>
                  {getStatusIcon(file.status)}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>{file.sizeDisplay}</span>
                  <span>•</span>
                  <span>{file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}</span>
                  {file.wordCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{file.wordCount.toLocaleString()} words</span>
                    </>
                  )}
                  {file.embeddingStats?.chunkCount && (
                    <>
                      <span>•</span>
                      <span>{file.embeddingStats.chunkCount} chunks</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                    {getStatusText(file.status)}
                  </span>
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {file.errorMessage && (
                  <p className="text-xs text-error-500 mt-1 truncate">{file.errorMessage}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
              {(file.status === 'failed' || file.status === 'pending') && (
                <button 
                  onClick={() => onReprocess(file.id)}
                  className="p-2 text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  title="Reprocess file"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={() => onDelete(file.id)}
                className="p-2 text-error-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
                title="Delete file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
          <span className="ml-2 text-sm text-neutral-500">Loading...</span>
        </div>
      )}
      
      {/* Load more button */}
      {hasMore && !loading && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            Load more files
          </button>
        </div>
      )}
    </div>
  );
};
