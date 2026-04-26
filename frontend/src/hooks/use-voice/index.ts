/**
 * Voice Hooks
 * 
 * Exports all voice-related hooks for speech-to-text and text-to-speech functionality.
 */

export { useMicrophoneRecorder } from './use-microphone-recorder';
export type {
  MicrophoneRecorderOptions,
  MicrophoneRecorderState,
  MicrophoneRecorderReturn,
} from './use-microphone-recorder';

export { useSentenceBuffer } from './use-sentence-buffer';
export type {
  SentenceBufferOptions,
  SentenceBufferReturn,
} from './use-sentence-buffer';

export { useAudioQueue } from './use-audio-queue';
export type {
  AudioQueueOptions,
  AudioQueueState,
  AudioQueueReturn,
} from './use-audio-queue';

export { useVoiceChat } from './use-voice-chat';
export type {
  VoiceChatOptions,
  VoiceChatMode,
  VoiceChatState,
  VoiceChatReturn,
} from './use-voice-chat';
