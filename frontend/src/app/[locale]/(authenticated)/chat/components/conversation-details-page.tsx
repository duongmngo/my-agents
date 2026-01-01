'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, StickyNote, Folder, X, ChevronDown, ChevronRight, Brain, Search, Globe } from 'lucide-react';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { MarkdownMessage } from '@/components/features/chat-system/markdown-message';
import { NoteDetailModal } from '@/components/features/knowledge-base/note-detail-modal';
import { useWorkspaceStore } from '@/hooks/use-workspace/workspace-store';
import { MessageStatus } from '@/types/chat-types';

interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  status?: MessageStatus;
  createdAt: string;
  model?: string;
  tokens?: number;
  steps?: Array<{
    stepIndex: number;
    kind: 'plan' | 'tool_call' | 'tool_result' | 'reasoning';
    content: string;
    toolName?: string;
    toolInput?: Record<string, any>;
    timestamp: number;
  }>;
}

interface ConversationDetailsPageProps {
  messages: Message[];
  currentAgent: any;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export function ConversationDetailsPage({ 
  messages, 
  currentAgent, 
  isLoadingMore = false, 
  onLoadMore 
}: ConversationDetailsPageProps) {
  const { currentWorkspace } = useWorkspaceStore();
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const prevMessageCountForScrollRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const lastLoadTimeRef = useRef(0);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const prevScrollHeightRef = useRef(0);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Check if user is near bottom of scroll
  const checkIfNearBottom = () => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const threshold = 150; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Find the scrollable parent container
  useEffect(() => {
    if (messagesEndRef.current) {
      let element = messagesEndRef.current.parentElement;
      while (element) {
        const overflow = window.getComputedStyle(element).overflowY;
        if (overflow === 'auto' || overflow === 'scroll') {
          scrollContainerRef.current = element;
          
          // Add scroll listener to track if user is near bottom
          const handleScroll = () => {
            setIsNearBottom(checkIfNearBottom());
          };
          
          element.addEventListener('scroll', handleScroll);
          
          return () => {
            element.removeEventListener('scroll', handleScroll);
          };
        }
        element = element.parentElement;
      }
    }
  }, []);

  // Preserve scroll position when loading older messages
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Store scroll height before loading starts
    if (!isLoadingMore) {
      prevScrollHeightRef.current = scrollContainer.scrollHeight;
      prevMessageCountForScrollRef.current = messages.length;
      return;
    }

    // Restore scroll position after new messages are added
    const currentCount = messages.length;
    const prevCount = prevMessageCountForScrollRef.current;
    
    if (currentCount > prevCount && isLoadingMore) {
      const newScrollHeight = scrollContainer.scrollHeight;
      const oldScrollHeight = prevScrollHeightRef.current;
      
      if (oldScrollHeight > 0) {
        // Calculate how much content was added at the top
        const addedHeight = newScrollHeight - oldScrollHeight;
        // Adjust scroll position to maintain the same visual position
        scrollContainer.scrollTop += addedHeight;
      }
      
      prevMessageCountForScrollRef.current = currentCount;
    }
  }, [messages.length, isLoadingMore]);

  // Auto-scroll to bottom on initial load or when new messages arrive (if user is near bottom)
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;

    // Scroll to bottom on initial load
    if (isInitialLoadRef.current && currentCount > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      isInitialLoadRef.current = false;
      prevMessageCountRef.current = currentCount;
      setIsNearBottom(true);
      return;
    }

    // Only auto-scroll if:
    // 1. New messages were added (count increased)
    // 2. We're not loading more (means new messages at the end, not prepended)
    // 3. User is near the bottom (not reading old messages)
    if (currentCount > prevCount && !isLoadingMore && isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Update the ref for next comparison
    prevMessageCountRef.current = currentCount;
  }, [messages.length, isLoadingMore, isNearBottom]);

  // Intersection observer for infinite scroll (load more when scrolling to top)
  useEffect(() => {
    if (!onLoadMore || isLoadingMore || messages.length < 50) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadTimeRef.current;
        
        // Only trigger if visible, not already loading, and at least 1 second since last load
        if (target.isIntersecting && !isLoadingMore && timeSinceLastLoad > 1000) {
          lastLoadTimeRef.current = now;
          onLoadMore();
        }
      },
      {
        root: null, // Use viewport as root since scroll is on parent
        rootMargin: '100px',
        threshold: 0,
      }
    );

    const currentTrigger = loadMoreTriggerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [isLoadingMore, onLoadMore, messages.length]);

  // Notes folder structure (same as in knowledge page)
  const notesFolders = [
    { id: 'meetings', name: 'Meeting Notes' },
    { id: 'technical', name: 'Technical Notes' },
    { id: 'ideas', name: 'Ideas & Concepts' },
    { id: 'research', name: 'Research' }
  ];

  const handleCreateNoteFromMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowNoteModal(true);
  };

  const handleNoteSave = (note: any) => {
    console.log('Note created from message:', {
      note,
      sourceMessageId: selectedMessage?.id,
      sourceConversationId: selectedMessage?.conversationId
    });
    
    // Reset and close modal
    setSelectedMessage(null);
    setShowNoteModal(false);
  };

  const handleNoteDelete = (noteId: string) => {
    console.log('Note deleted:', noteId);
  };

  const toggleThinking = (messageId: string) => {
    setExpandedThinking(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const getStepIcon = (kind: string) => {
    switch (kind) {
      case 'plan':
        return <Brain className="h-4 w-4 text-purple-600" />;
      case 'reasoning':
        return <Brain className="h-4 w-4 text-blue-600" />;
      case 'tool_call':
        return <Search className="h-4 w-4 text-orange-600" />;
      case 'tool_result':
        return <Globe className="h-4 w-4 text-green-600" />;
      default:
        return <Brain className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStepLabel = (kind: string) => {
    switch (kind) {
      case 'plan':
        return 'Planning';
      case 'reasoning':
        return 'Reasoning';
      case 'tool_call':
        return 'Tool Call';
      case 'tool_result':
        return 'Tool Result';
      default:
        return kind;
    }
  };

  if (messages.length === 0) {
    return (
      <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
        <AgentAvatar size="lg" />
        <p className="mt-4">Start a conversation with {currentAgent.name}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Load more trigger - placed at the top of messages */}
      {onLoadMore && messages.length >= 50 && (
        <div ref={loadMoreTriggerRef} className="h-1" />
      )}
      
      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-500"></div>
            <span className="text-sm">Loading older messages...</span>
          </div>
        </div>
      )}
      
      {[...messages].reverse().map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-3xl ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
            <div className={`flex items-start space-x-3 ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`flex-shrink-0 ${
                msg.role === 'user' ? 'ml-3' : 'mr-3'
              }`}>
                {msg.role === 'user' ? (
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  currentAgent.avatar ? (
                    <img 
                      src={currentAgent.avatar} 
                      alt={currentAgent.name}
                      className="h-10 w-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <div className="h-10 w-10">
                      <AgentAvatar size="sm" />
                    </div>
                  )
                )}
              </div>
              <div className={`px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap text-sm">
                    {msg.content}
                  </div>
                ) : (
                  <>
                    {/* Agent Thinking Process - Collapsible */}
                    {msg.steps && msg.steps.length > 0 && (
                      <div className="mb-3 border-l-2 border-neutral-200 dark:border-neutral-700">
                        <button
                          onClick={() => toggleThinking(msg.id)}
                          className="flex items-center space-x-2 px-3 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded transition-colors w-full text-left"
                        >
                          {expandedThinking[msg.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <Brain className="h-4 w-4" />
                          <span className="font-medium">AI Thinking Process</span>
                          <span className="text-neutral-400 dark:text-neutral-500">
                            ({msg.steps.length} {msg.steps.length === 1 ? 'step' : 'steps'})
                          </span>
                          {msg.status !== MessageStatus.Complete && (
                            <div className="flex space-x-1 ml-2">
                              <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          )}
                        </button>
                        
                        {expandedThinking[msg.id] && (
                          <div className="mt-2 space-y-2 px-3 pb-2">
                            {msg.steps.map((step, idx) => (
                              <div
                                key={idx}
                                className="flex items-start space-x-2 text-xs bg-neutral-50 dark:bg-neutral-800 p-2 rounded"
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  {getStepIcon(step.kind)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {getStepLabel(step.kind)}
                                    {step.toolName && (
                                      <span className="ml-2 text-neutral-500 dark:text-neutral-400">
                                        ({step.toolName})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap break-words">
                                    {step.content}
                                  </div>
                                  {step.toolInput && Object.keys(step.toolInput).length > 0 && (
                                    <div className="mt-1 text-neutral-500 dark:text-neutral-500 font-mono text-xs">
                                      Input: {JSON.stringify(step.toolInput)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Final Response */}
                    <MarkdownMessage 
                      content={msg.content} 
                      className="text-sm"
                    />
                  </>
                )}
                {msg.model && (
                   <p className="text-xs opacity-70 mt-1">
                     {msg.model} • {msg.tokens} tokens
                   </p>
                 )}
                 {/* Create Note Button - Only for AI responses */}
                 {msg.role === 'assistant' && (
                   <div className="flex justify-end mt-2">
                     <button
                       onClick={() => handleCreateNoteFromMessage(msg)}
                       className="inline-flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                       title="Create note from this AI response"
                     >
                       <StickyNote className="h-3 w-3" />
                       <span>Create Note</span>
                     </button>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />

      {/* Note Detail Modal */}
      {showNoteModal && (
        <NoteDetailModal
          isOpen={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          note={undefined}
          mode="create"
          workspaceId={currentWorkspace?.id || ''}
          folderId={undefined}
          initialTitle={`Note from conversation - ${new Date().toLocaleDateString()}`}
          initialContent={selectedMessage?.content || ''}
          onSave={handleNoteSave}
          onDelete={handleNoteDelete}
        />
      )}
    </div>
  );
}
