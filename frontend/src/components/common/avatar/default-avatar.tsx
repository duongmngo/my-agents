'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';

interface DefaultAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={`${sizeClasses[size]} bg-gray-200 rounded-full flex items-center justify-center ${className}`}>
      <MessageSquare className={`${iconSizes[size]} text-gray-500`} />
    </div>
  );
}; 