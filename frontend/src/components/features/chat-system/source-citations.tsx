'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, File, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Source citation from knowledge base search results
 */
export interface KnowledgeSource {
  /** Unique ID of the source/chunk */
  id: string;
  /** Relevance score (0-1) */
  score: number;
  /** Type of source: note, file, note_chunk, file_chunk, knowledge_file, knowledge_file_chunk (supports snake_case from backend) */
  sourceType?: 'note' | 'file' | 'note_chunk' | 'file_chunk' | 'knowledge_file' | 'knowledge_file_chunk';
  source_type?: string;
  /** ID of the source document */
  sourceId?: string;
  source_id?: string;
  /** Source details for display */
  source: {
    type: string;
    id: string;
    title: string;
    folderId?: string;
    folder_id?: string;
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
    /** For chunks: parent document ID */
    parentId?: string;
    parent_id?: string;
    /** For chunks: position in original document */
    chunkIndex?: number;
    chunk_index?: number;
    totalChunks?: number;
    total_chunks?: number;
    charStart?: number;
    char_start?: number;
    charEnd?: number;
    char_end?: number;
    /** For files: file name */
    fileName?: string;
    file_name?: string;
    /** For files: file type */
    fileType?: string;
    file_type?: string;
    /** For files: file size in bytes */
    fileSize?: number;
    file_size?: number;
    /** For notes: note title */
    noteTitle?: string;
    note_title?: string;
    /** For notes: note format */
    noteFormat?: string;
    note_format?: string;
    /** For notes: word count */
    wordCount?: number;
    word_count?: number;
    /** For notes: character count */
    characterCount?: number;
    character_count?: number;
  };
  /** Content snippet (optional) */
  content?: string;
  /** Tags */
  tags?: string[];
}

/**
 * Normalize a knowledge source to use consistent camelCase keys
 */
function normalizeSource(src: KnowledgeSource): KnowledgeSource {
  return {
    id: src.id,
    score: src.score,
    sourceType: (src.sourceType || src.source_type) as KnowledgeSource['sourceType'],
    sourceId: src.sourceId || src.source_id,
    source: {
      type: src.source.type,
      id: src.source.id,
      title: src.source.title,
      folderId: src.source.folderId || src.source.folder_id,
      createdAt: src.source.createdAt || src.source.created_at,
      updatedAt: src.source.updatedAt || src.source.updated_at,
      parentId: src.source.parentId || src.source.parent_id,
      chunkIndex: src.source.chunkIndex ?? src.source.chunk_index,
      totalChunks: src.source.totalChunks ?? src.source.total_chunks,
      charStart: src.source.charStart ?? src.source.char_start,
      charEnd: src.source.charEnd ?? src.source.char_end,
      // File-specific fields
      fileName: src.source.fileName || src.source.file_name,
      fileType: src.source.fileType || src.source.file_type,
      fileSize: src.source.fileSize ?? src.source.file_size,
      // Note-specific fields
      noteTitle: src.source.noteTitle || src.source.note_title,
      noteFormat: src.source.noteFormat || src.source.note_format,
      wordCount: src.source.wordCount ?? src.source.word_count,
      characterCount: src.source.characterCount ?? src.source.character_count,
    },
    content: src.content,
    tags: src.tags,
  };
}

interface SourceCitationsProps {
  /** List of knowledge sources */
  sources: KnowledgeSource[];
  /** Whether to show content snippets */
  showContent?: boolean;
  /** Maximum sources to show before collapsing */
  maxVisible?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Displays knowledge base source citations at the bottom of AI responses.
 * 
 * Usage:
 * ```tsx
 * <SourceCitations 
 *   sources={message.metadata?.sources || []}
 *   showContent={false}
 *   maxVisible={3}
 * />
 * ```
 */
export const SourceCitations: React.FC<SourceCitationsProps> = ({
  sources,
  showContent = false,
  maxVisible = 3,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [expandedSources, setExpandedSources] = React.useState<Set<string>>(new Set());

  // Normalize sources to handle snake_case from backend
  const normalizedSources = React.useMemo(
    () => sources?.map(normalizeSource) || [],
    [sources]
  );

  if (!normalizedSources || normalizedSources.length === 0) {
    return null;
  }

  // Deduplicate sources by parent document (for chunks)
  const deduplicatedSources = React.useMemo(() => {
    const parentMap = new Map<string, KnowledgeSource>();
    
    for (const source of normalizedSources) {
      const parentId = source.source.parentId || source.sourceId;
      const existing = parentMap.get(parentId!);
      
      // Keep the one with highest score
      if (!existing || source.score > existing.score) {
        parentMap.set(parentId!, source);
      }
    }
    
    return Array.from(parentMap.values())
      .sort((a, b) => b.score - a.score);
  }, [normalizedSources]);

  const visibleSources = isExpanded 
    ? deduplicatedSources 
    : deduplicatedSources.slice(0, maxVisible);
  
  const hasMore = deduplicatedSources.length > maxVisible;

  const getSourceIcon = (type: string) => {
    if (type.includes('note')) {
      return <FileText className="h-3.5 w-3.5" />;
    }
    // Handles file, file_chunk, knowledge_file, knowledge_file_chunk
    return <File className="h-3.5 w-3.5" />;
  };

  const getSourceUrl = (source: KnowledgeSource) => {
    // Remove _chunk suffix to get the base type
    const baseType = source.source.type.replace('_chunk', '');
    const id = source.source.parentId || source.sourceId;
    
    if (baseType === 'note') {
      return `/notes/${id}`;
    }
    // Handles file, knowledge_file
    return `/knowledge/${id}`;
  };

  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const toggleSourceExpand = (id: string) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className={`mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Sources ({deduplicatedSources.length})
        </p>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show all ({deduplicatedSources.length}) <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Source List */}
      <div className="space-y-2">
        {visibleSources.map((source) => (
          <div
            key={source.id}
            className="group bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <div className="flex items-start gap-2">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5 text-neutral-500 dark:text-neutral-400">
                {getSourceIcon(source.sourceType || 'file')}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title & Score */}
                <div className="flex items-center gap-2">
                  <Link
                    href={getSourceUrl(source)}
                    className="text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 truncate"
                  >
                    {source.source.title}
                  </Link>
                  <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300">
                    {formatScore(source.score)}
                  </span>
                  {source.source.totalChunks && source.source.totalChunks > 1 && (
                    <span className="flex-shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                      chunk {(source.source.chunkIndex || 0) + 1}/{source.source.totalChunks}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {source.tags && source.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {source.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {source.tags.length > 3 && (
                      <span className="text-xs text-neutral-400">
                        +{source.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Content snippet (collapsible) */}
                {showContent && source.content && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleSourceExpand(source.id)}
                      className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1"
                    >
                      {expandedSources.has(source.id) ? (
                        <>Hide snippet <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>Show snippet <ChevronDown className="h-3 w-3" /></>
                      )}
                    </button>
                    {expandedSources.has(source.id) && (
                      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 p-2 rounded border border-neutral-200 dark:border-neutral-700 whitespace-pre-wrap">
                        {source.content.length > 300 
                          ? source.content.slice(0, 300) + '...' 
                          : source.content}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* External link */}
              <Link
                href={getSourceUrl(source)}
                className="flex-shrink-0 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity"
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceCitations;
