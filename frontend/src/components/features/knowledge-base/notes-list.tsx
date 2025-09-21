'use client';

import React from 'react';
import { 
  Trash2, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Sparkles,
  StickyNote,
  Pin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { NoteResponse } from '@/services/note-service';
import { EmbeddingStatsComponent } from './embedding-stats';

interface NotesListProps {
  notes: NoteResponse[];
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
  // Helper function to determine if note needs embedding
  const needsEmbedding = (note: NoteResponse): boolean => {
    // If not embedded, needs embedding
    if (!note.isEmbedded) return true;
    
    // If updated after last embedding, needs re-embedding
    if (note.updatedAt && note.lastEmbeddedAt) {
      return new Date(note.updatedAt) > new Date(note.lastEmbeddedAt);
    }
    
    // If embedded but no last embedding time, assume it needs embedding
    return true;
  };


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
      {notes.map((note) => {
        const needsEmbed = needsEmbedding(note);
        
        return (
          <div 
            key={note.id} 
            className="group flex items-start justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 hover:shadow-sm"
          >
            <div className="flex items-start space-x-4 flex-1">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-900/30 transition-colors">
                <StickyNote className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:hover:text-neutral-50">
                    {note.title}
                  </h3>
                  {note.isPinned && (
                    <Pin className="h-3 w-3 text-primary-500 dark:text-primary-400" />
                  )}
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {note.excerpt || note.content || 'No content'}
                </p>
                
                {/* Embedding Status */}
                <div className="mt-2">
                  <EmbeddingStatsComponent 
                    stats={note.embeddingStats}
                    status={note.embeddingStatus}
                    compact={true}
                  />
                </div>
                
                {/* Timestamps */}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Created: {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  {note.updatedAt && note.updatedAt !== note.createdAt && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Updated: {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                  {note.embeddingStats?.generatedAt && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      Last embedded: {new Date(note.embeddingStats.generatedAt).toLocaleDateString()} {new Date(note.embeddingStats.generatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Embedding Button - Show different states based on embedding status */}
              <button 
                onClick={() => onEmbedNote(note.id)}
                disabled={note.embeddingStatus === 'processing'}
                className={`p-2 rounded-lg transition-colors ${
                  needsEmbed 
                    ? 'text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                    : 'text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                } ${note.embeddingStatus === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={
                  note.embeddingStatus === 'processing' 
                    ? 'Embedding in progress...' 
                    : needsEmbed 
                      ? 'Trigger embedding (note needs embedding)' 
                      : 'Re-embed note'
                }
              >
                {note.embeddingStatus === 'processing' ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </button>
              
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
                className="p-2 text-error-400 dark:text-error-400 hover:text-error-600 dark:hover:text-red-300 rounded-lg hover:bg-error-50 dark:hover:bg-red-900/20 transition-colors"
                title="Delete note"
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
