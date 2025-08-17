'use client';

import React, { useState } from 'react';
import { MessageSquare, Sparkles, BookOpen, Target, Lightbulb, GraduationCap } from 'lucide-react';
import { ConversationStarter } from '@/types/agent-types';

interface ConversationStartersProps {
  starters: ConversationStarter[];
  onStartConversation: (prompt: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons = {
  general: Sparkles,
  specific: Target,
  example: Lightbulb,
  tutorial: GraduationCap,
};

const categoryColors = {
  general: 'bg-blue-100 text-blue-800',
  specific: 'bg-green-100 text-green-800',
  example: 'bg-yellow-100 text-yellow-800',
  tutorial: 'bg-purple-100 text-purple-800',
};

export default function ConversationStarters({ starters, onStartConversation, isOpen, onClose }: ConversationStartersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set(starters.map(s => s.category)))];
  
  const filteredStarters = starters.filter(starter => {
    const matchesCategory = selectedCategory === 'all' || starter.category === selectedCategory;
    const matchesSearch = starter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         starter.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         starter.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleStartConversation = (starter: ConversationStarter) => {
    onStartConversation(starter.prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Conversation Starters</h2>
              <p className="text-sm text-gray-500">Choose a topic to start your conversation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search conversation starters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => {
                const Icon = category === 'all' ? BookOpen : categoryIcons[category as keyof typeof categoryIcons];
                const isActive = selectedCategory === category;
                
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="capitalize">{category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredStarters.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation starters found</h3>
              <p className="text-gray-500">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStarters.map((starter) => {
                const Icon = categoryIcons[starter.category];
                const colorClass = categoryColors[starter.category];
                
                return (
                  <div
                    key={starter.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleStartConversation(starter)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{starter.title}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                            {starter.category}
                          </span>
                        </div>
                      </div>
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {starter.description}
                    </p>

                    {starter.tags && starter.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {starter.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Click to start conversation with this prompt
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
