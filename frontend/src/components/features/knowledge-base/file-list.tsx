'use client';

import React from 'react';
import { 
  Download, 
  Trash2, 
  MoreVertical, 
  Eye, 
  Sparkles 
} from 'lucide-react';
import { FileItem } from '@/types/knowledge-types';
import { getFileIcon, getStatusColor, getStatusText } from '@/utils/knowledge-utils';

interface FileListProps {
  files: FileItem[];
  onEmbedFile: (fileId: string) => void;
  onViewFile: (fileId: string) => void;
  onDownloadFile: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onEmbedFile,
  onViewFile,
  onDownloadFile,
  onDeleteFile
}) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <svg className="h-10 w-10 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          No files found
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
          Try adjusting your search terms or browse different folders
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {files.map((file) => {
        const FileIcon = getFileIcon(file.fileType);
        return (
          <div 
            key={file.id} 
            className="group flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 hover:shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                <FileIcon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-50">
                  {file.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {file.size} • {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                    {getStatusText(file.status)}
                  </span>
                  {file.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {file.status === 'uploaded' && (
                <button 
                  onClick={() => onEmbedFile(file.id)}
                  className="p-2 text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  title="Trigger embedding"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={() => onViewFile(file.id)}
                className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title="View file"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button 
                onClick={() => onDownloadFile(file.id)}
                className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </button>
              <button 
                className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              <button 
                onClick={() => onDeleteFile(file.id)}
                className="p-2 text-error-400 dark:text-error-400 hover:text-error-600 dark:hover:text-error-300 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                title="Delete file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
