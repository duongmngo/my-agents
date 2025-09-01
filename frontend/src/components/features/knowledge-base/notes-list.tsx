'use client';

import React from 'react';
import { 
  Trash2, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Sparkles,
  StickyNote
} from 'lucide-react';
import { Note } from '@/types/knowledge-types';

interface NotesListProps {
  notes: Note[];
  onEmbedNote: (noteId: string) => void;
  onViewNote: (noteId: string) => void;
  onEditNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  onEmbedNote,
  onViewNote,
  onEditNote,
  onDeleteNote
}) => {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-primary-100 dark:bg-primary-900/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <StickyNote className="h-10 w-10 text-primary-500 dark:text-primary-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          No notes found
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
          Try adjusting your search terms or browse different folders
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div 
          key={note.id} 
          className="group flex items-start justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 hover:shadow-sm"
        >
          <div className="flex items-start space-x-4 flex-1">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-900/30 transition-colors">
              <StickyNote className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-neutral-50 mb-1">
                {note.title}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                {note.content}
              </p>
              <div className="flex items-center space-x-2 mt-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  note.status === 'embedded' 
                    ? 'bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-400' 
                    : 'bg-warning-100 dark:bg-warning-900/20 text-warning-800 dark:text-warning-400'
                }`}>
                  {note.status === 'embedded' ? 'Embedded' : 'Draft'}
                </span>
                {note.tags.map((tag, index) => (
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
            {note.status === 'draft' && (
              <button 
                onClick={() => onEmbedNote(note.id)}
                className="p-2 text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                title="Trigger embedding"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            )}
            <button 
              onClick={() => onEditNote(note.id)}
              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              title="Edit note"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button 
              onClick={() => onViewNote(note.id)}
              className="p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              title="View note"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button 
              onClick={() => onDeleteNote(note.id)}
              className="p-2 text-error-400 dark:text-error-400 hover:text-error-600 dark:hover:text-error-300 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
              title="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
