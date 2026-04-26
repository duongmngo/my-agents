'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/format-utils/class-names';
import { Voice } from '@/services/voice-service';
import { VoiceChatMode } from '@/hooks/use-voice';

interface VoiceControlsProps {
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
   * Additional CSS classes
   */
  className?: string;
}

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
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className={cn(
          'w-1 bg-primary-500 rounded-full animate-sound-wave',
          'dark:bg-primary-400'
        )}
        style={{
          animationDelay: `${i * 0.1}s`,
          height: '12px',
        }}
      />
    ))}
  </div>
);

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  voiceOutputEnabled,
  onToggleVoiceOutput,
  mode,
  currentVoice,
  availableVoices,
  onVoiceChange,
  onStopSpeaking,
  isSynthesizing = false,
  className,
}) => {
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const isSpeaking = mode === 'speaking';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Voice Output Toggle */}
      <button
        type="button"
        onClick={onToggleVoiceOutput}
        title={voiceOutputEnabled ? 'Disable voice output' : 'Enable voice output'}
        aria-label={voiceOutputEnabled ? 'Disable voice output' : 'Enable voice output'}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          voiceOutputEnabled
            ? 'text-primary-600 bg-primary-50 hover:bg-primary-100 dark:text-primary-400 dark:bg-primary-900/30 dark:hover:bg-primary-900/50'
            : 'text-neutral-400 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-500 dark:bg-neutral-800 dark:hover:bg-neutral-700'
        )}
      >
        {voiceOutputEnabled ? (
          <SpeakerOnIcon className="w-5 h-5" />
        ) : (
          <SpeakerOffIcon className="w-5 h-5" />
        )}
      </button>

      {/* Speaking Indicator / Stop Button */}
      {(isSpeaking || isSynthesizing) && (
        <div className="flex items-center gap-2">
          <SoundWaveAnimation />
          {onStopSpeaking && (
            <button
              type="button"
              onClick={onStopSpeaking}
              title="Stop speaking"
              aria-label="Stop speaking"
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                'text-error-600 bg-error-50 hover:bg-error-100',
                'dark:text-error-400 dark:bg-error-900/30 dark:hover:bg-error-900/50',
                'focus:outline-none focus:ring-2 focus:ring-error-500'
              )}
            >
              <StopIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Voice Selector */}
      {voiceOutputEnabled && availableVoices.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowVoiceSelector(!showVoiceSelector)}
            title="Select voice"
            aria-label="Select voice"
            className={cn(
              'px-2 py-1 text-xs rounded-lg transition-colors',
              'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              'dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
          >
            {availableVoices.find(v => v.id === currentVoice)?.name || currentVoice}
          </button>

          {/* Dropdown */}
          {showVoiceSelector && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowVoiceSelector(false)}
              />
              
              {/* Menu */}
              <div className={cn(
                'absolute bottom-full left-0 mb-1 z-20',
                'min-w-[150px] py-1 rounded-lg shadow-lg',
                'bg-white border border-neutral-200',
                'dark:bg-neutral-800 dark:border-neutral-700'
              )}>
                {availableVoices.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => {
                      onVoiceChange(voice.id);
                      setShowVoiceSelector(false);
                    }}
                    className={cn(
                      'w-full px-3 py-1.5 text-left text-sm transition-colors',
                      'hover:bg-neutral-100 dark:hover:bg-neutral-700',
                      voice.id === currentVoice
                        ? 'text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-neutral-700 dark:text-neutral-300'
                    )}
                  >
                    <span className="block">{voice.name}</span>
                    {voice.description && (
                      <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                        {voice.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceControls;
