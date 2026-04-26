'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/format-utils/class-names';
import { Voice } from '@/services/voice-service';
import { VoiceChatMode } from '@/hooks/use-voice';

interface VoiceSettingsButtonProps {
  /**
   * Whether voice output is enabled
   */
  voiceOutputEnabled: boolean;
  
  /**
   * Toggle voice output on/off
   */
  onToggleVoiceOutput: () => void;
  
  /**
   * Current voice mode
   */
  mode: VoiceChatMode;
  
  /**
   * Current selected voice
   */
  currentVoice: string;
  
  /**
   * Available voices
   */
  availableVoices: Voice[];
  
  /**
   * Called when voice is changed
   */
  onVoiceChange: (voiceId: string) => void;
  
  /**
   * Called to stop speaking
   */
  onStopSpeaking?: () => void;
  
  /**
   * Whether TTS is synthesizing
   */
  isSynthesizing?: boolean;
  
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Gear/Settings Icon
const GearIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

// Speaker Icon (on)
const SpeakerOnIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

// Speaker Icon (off)
const SpeakerOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

// Stop Icon
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

// Sound Wave Animation
const SoundWaveAnimation: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center gap-0.5', className)}>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className={cn(
          'w-0.5 bg-primary-500 rounded-full animate-sound-wave',
          'dark:bg-primary-400'
        )}
        style={{
          animationDelay: `${i * 0.1}s`,
          height: '10px',
        }}
      />
    ))}
  </div>
);

export const VoiceSettingsButton: React.FC<VoiceSettingsButtonProps> = ({
  voiceOutputEnabled,
  onToggleVoiceOutput,
  mode,
  currentVoice,
  availableVoices,
  onVoiceChange,
  onStopSpeaking,
  isSynthesizing = false,
  size = 'md',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isSpeaking = mode === 'speaking';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Voice settings"
        aria-label="Voice settings"
        className={cn(
          'relative inline-flex items-center justify-center rounded-full transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
          'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
          'dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600',
          sizes[size],
          className
        )}
      >
        {/* Show speaking indicator or gear icon */}
        {(isSpeaking || isSynthesizing) ? (
          <SoundWaveAnimation />
        ) : (
          <GearIcon className={iconSizes[size]} />
        )}
        
        {/* Indicator dot for voice enabled */}
        {voiceOutputEnabled && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary-500 rounded-full border-2 border-white dark:border-neutral-800" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            'absolute bottom-full right-0 mb-2 z-50',
            'w-56 py-2 rounded-lg shadow-lg',
            'bg-white border border-neutral-200',
            'dark:bg-neutral-800 dark:border-neutral-700'
          )}
        >
          {/* Voice Output Toggle */}
          <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => {
                onToggleVoiceOutput();
              }}
              className="w-full flex items-center justify-between"
            >
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                Voice Output
              </span>
              <div className={cn(
                'relative w-10 h-5 rounded-full transition-colors',
                voiceOutputEnabled 
                  ? 'bg-primary-500' 
                  : 'bg-neutral-300 dark:bg-neutral-600'
              )}>
                <div className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  voiceOutputEnabled ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </div>
            </button>
          </div>

          {/* Stop Speaking (when speaking) */}
          {(isSpeaking || isSynthesizing) && onStopSpeaking && (
            <button
              type="button"
              onClick={() => {
                onStopSpeaking();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 flex items-center gap-2 text-sm text-error-600 dark:text-error-400 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              <StopIcon className="w-4 h-4" />
              Stop Speaking
            </button>
          )}

          {/* Voice Selection */}
          {voiceOutputEnabled && availableVoices.length > 0 && (
            <div className="pt-1">
              <div className="px-3 py-1">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Voice
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {availableVoices.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => {
                      onVoiceChange(voice.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full px-3 py-1.5 text-left text-sm transition-colors',
                      'hover:bg-neutral-50 dark:hover:bg-neutral-700',
                      voice.id === currentVoice
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-neutral-700 dark:text-neutral-300'
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span>{voice.name}</span>
                      {voice.id === currentVoice && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceSettingsButton;
