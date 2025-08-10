'use client';

import React from 'react';
import { Bot } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} bg-primary-600 rounded-lg flex items-center justify-center`}>
        <Bot className={`${sizeClasses[size]} text-white`} />
      </div>
      {showText && (
        <span className={`font-bold text-gray-900 ${textSizes[size]}`}>
          My Agents
        </span>
      )}
    </div>
  );
}; 