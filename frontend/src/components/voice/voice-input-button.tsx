'use client';

import React from 'react';
import { cn } from '@/utils/format-utils/class-names';
import { VoiceChatMode } from '@/hooks/use-voice';

interface VoiceInputButtonProps {
  /**
   * Current mode of voice chat
   */
  mode: VoiceChatMode;
  
  /**
   * Whether microphone permission is granted
   */
  hasPermission: boolean | null;
  
  /**
   * Called when button is clicked while idle (start recording)
   */
  onStartRecording: () => void;
  
  /**
   * Called when button is clicked while recording (stop recording)
   */
  onStopRecording: () => void;
  
  /**
   * Called when button is long-pressed/right-clicked while recording (cancel)
   */
  onCancelRecording?: () => void;
  
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
}

// Microphone Icon
const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
  </svg>
);

// Stop Icon (square)
const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

// Loading/Processing Icon
const LoadingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className={cn('animate-spin', className)}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  mode,
  hasPermission,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  size = 'md',
  className,
  disabled = false,
}) => {
  const isRecording = mode === 'recording';
  const isTranscribing = mode === 'transcribing';
  const isDisabled = disabled || isTranscribing || hasPermission === false;

  const handleClick = () => {
    if (isDisabled) return;
    
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isRecording && onCancelRecording) {
      e.preventDefault();
      onCancelRecording();
    }
  };

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Get title/tooltip text
  const getTitle = () => {
    if (hasPermission === false) {
      return 'Microphone permission denied';
    }
    if (isTranscribing) {
      return 'Transcribing...';
    }
    if (isRecording) {
      return 'Click to stop recording (right-click to cancel)';
    }
    return 'Click to start voice input';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={isDisabled}
      title={getTitle()}
      aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Default state
        !isRecording && !isTranscribing && [
          'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
          'dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600',
        ],
        // Recording state
        isRecording && [
          'bg-error-500 text-white hover:bg-error-600',
          'dark:bg-error-500 dark:hover:bg-error-600',
          'animate-pulse',
        ],
        // Transcribing state
        isTranscribing && [
          'bg-primary-500 text-white',
          'dark:bg-primary-500',
        ],
        sizes[size],
        className
      )}
    >
      {/* Recording pulse ring */}
      {isRecording && (
        <span className="absolute inset-0 rounded-full animate-ping bg-error-400 opacity-75" />
      )}
      
      {/* Icon */}
      <span className="relative">
        {isTranscribing ? (
          <LoadingIcon className={iconSizes[size]} />
        ) : isRecording ? (
          <StopIcon className={iconSizes[size]} />
        ) : (
          <MicrophoneIcon className={iconSizes[size]} />
        )}
      </span>
    </button>
  );
};

export default VoiceInputButton;
