'use client';

import React from 'react';
import { Bot } from 'lucide-react';

interface CompanyAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({ 
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
    <div className={`${sizeClasses[size]} bg-purple-100 rounded-full flex items-center justify-center ${className}`}>
      <Bot className={`${iconSizes[size]} text-purple-600`} />
    </div>
  );
}; 