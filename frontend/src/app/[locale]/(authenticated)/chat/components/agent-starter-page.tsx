'use client';

import React, { useState, useEffect } from 'react';
import { Send, Plus, Paperclip, BookOpen, Image, Lightbulb, Search, MoreHorizontal, Loader2, MessageSquare } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { AgentAvatar } from '@/components/common/avatar/agent-avatar';
import { LoadingSpinner } from '@/components/common/loading';
import { agentService } from '@/services/agent-service';
import { chatService } from '@/services/chat-service';
import { Agent } from '@/types/agent-types';

interface AgentStarterPageProps {
  agentId: string;
  agentName?: string;
  agentType: 'built_in' | 'custom';
  initialPrompt?: string;
}

export function AgentStarterPage({ agentId, agentName, agentType, initialPrompt }: AgentStarterPageProps) {
  const router = useRouter();
  
  // State
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState(initialPrompt || '');
  const [isSending, setIsSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Fetch agent data on mount
  useEffect(() => {
    let mounted = true;
    
    const fetchAgent = async () => {
      try {
        setIsLoadingAgent(true);
        setError(null);
        const fetchedAgent = await agentService.getAgent(agentId);
        if (mounted) {
          setAgent(fetchedAgent);
        }
      } catch (err) {
        console.error('Error fetching agent:', err);
        if (mounted) {
          // Create a basic agent object from URL params as fallback
          setAgent({
            id: agentId,
            name: agentName || 'Agent',
            description: '',
            instructions: '',
            agentType: 'user-agent',
            isBuiltIn: false,
            status: 'active',
            isPublic: true,
            isActive: true,
            aiModel: 'gpt-4',
            temperature: '0.7',
            conversationCount: 0,
            messageCount: 0,
            totalTokensUsed: 0,
            version: '1.0.0',
            workspaceId: '',
            createdBy: '',
            createdAt: '',
            updatedAt: '',
            conversationStarters: [],
          } as Agent);
        }
      } finally {
        if (mounted) {
          setIsLoadingAgent(false);
        }
      }
    };

    fetchAgent();
    return () => { mounted = false; };
  }, [agentId, agentName]);

  const handleConversationStarter = (prompt: string) => {
    setMessage(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    const messageContent = message.trim();
    setMessage('');
    setIsSending(true);
    setError(null);

    try {
      // Create a new conversation with the agent
      console.log('Creating conversation with:', { agentType, agentId });
      
      const conversationResponse = await chatService.createConversation({
        title: messageContent.substring(0, 100),
        type: 'ai_chat',
        agentType: agentType,
        agentId: agentId,
        isPrivate: true,
      });

      if (conversationResponse.success && conversationResponse.data) {
        const newConversationId = conversationResponse.data.id;
        
        // Dispatch event to refresh sidebar conversations
        window.dispatchEvent(new Event('conversationCreated'));
        
        // Navigate to conversation page with the initial message
        const newUrl = `/chat?conversationId=${newConversationId}&initialPrompt=${encodeURIComponent(messageContent)}`;
        router.push(newUrl);
      } else {
        setError(conversationResponse.message || 'Failed to create conversation');
        setMessage(messageContent); // Restore message on error
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      setMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  // Loading state
  if (isLoadingAgent) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
        <LoadingSpinner size="lg" text={`Loading ${agentName || 'agent'}...`} />
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gradient-to-br from-orange-50 via-yellow-50 to-blue-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-4xl w-full text-center">
            {/* Agent Info */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-3 mb-6">
                {agent?.avatarUrl ? (
                  <img 
                    src={agent.avatarUrl} 
                    alt={agent.name}
                    className="h-16 w-16 rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`h-16 w-16 ${agent?.avatarUrl ? 'hidden' : ''}`}>
                  <AgentAvatar size="lg" />
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{agent?.name}</h2>
                  {agent?.description && (
                    <p className="text-neutral-600 dark:text-neutral-400">{agent.description}</p>
                  )}
                </div>
              </div>
              
              {/* Conversation Starters */}
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  Start a conversation with {agent?.name}
                </h3>
                
                {agent?.conversationStarters && agent.conversationStarters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {agent.conversationStarters.map((starter) => (
                      <button
                        key={starter.id}
                        onClick={() => handleConversationStarter(starter.prompt)}
                        disabled={isSending}
                        className="flex items-center p-4 text-left bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all disabled:opacity-50"
                      >
                        <MessageSquare className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0" />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">{starter.prompt}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Or type your own message below
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              </div>
            )}

            {/* Input Container */}
            <div className="relative max-w-3xl mx-auto">
              <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-center space-x-3">
                  {/* Plus Button with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      disabled={isSending}
                      className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    
                    {showMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-10">
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <Paperclip className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                          <span>Add photos & files</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <BookOpen className="h-4 w-4 text-neutral-500" />
                          <span>Study and learn</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <Image className="h-4 w-4 text-neutral-500" />
                          <span>Create image</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <Lightbulb className="h-4 w-4 text-neutral-500" />
                          <span>Think longer</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <Search className="h-4 w-4 text-neutral-500" />
                          <span>Deep research</span>
                        </button>
                        <button className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                          <span>More</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Input Field */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Message ${agent?.name || agentName || 'Agent'}...`}
                      disabled={isSending}
                      className="w-full px-4 py-3 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none text-lg bg-transparent disabled:opacity-50"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isSending}
                    className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
