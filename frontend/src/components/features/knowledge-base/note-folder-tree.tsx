'use client';

import React from 'react';
import { Folder, ChevronRight, ChevronDown, StickyNote } from 'lucide-react';
import { NoteFolder } from '@/types/knowledge-types';

interface NoteFolderTreeProps {
  folders: NoteFolder[];
  selectedFolder: string | null;
  expandedFolders: Set<string>;
  onFolderSelect: (folderId: string | null) => void;
  onFolderToggle: (folderId: string) => void;
  level?: number;
}

export const NoteFolderTree: React.FC<NoteFolderTreeProps> = ({
  folders,
  selectedFolder,
  expandedFolders,
  onFolderSelect,
  onFolderToggle,
  level = 0
}) => {
  return (
    <div className="space-y-1">
      {folders.map((folder) => {
        const isExpanded = expandedFolders.has(folder.id);
        const childFolders = folder.children?.filter(item => 'type' in item && item.type === 'folder') as NoteFolder[] || [];
        const hasChildFolders = childFolders.length > 0;
        
        return (
          <div key={folder.id}>
            <button
              onClick={() => onFolderSelect(folder.id)}
              className={`w-full flex items-center p-2 rounded-lg transition-colors ${
                selectedFolder === folder.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
              style={{ paddingLeft: `${level * 16 + 12}px` }}
            >
              <div className="flex items-center space-x-2">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onFolderToggle(folder.id);
                  }}
                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded cursor-pointer"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
                <Folder className="h-4 w-4" />
                <span className="text-sm font-medium">{folder.name}</span>
              </div>
            </button>
            {isExpanded && hasChildFolders && (
              <div className="ml-4">
                <NoteFolderTree
                  folders={childFolders}
                  selectedFolder={selectedFolder}
                  expandedFolders={expandedFolders}
                  onFolderSelect={onFolderSelect}
                  onFolderToggle={onFolderToggle}
                  level={level + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
