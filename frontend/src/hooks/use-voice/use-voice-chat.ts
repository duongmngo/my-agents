/**
 * useVoiceChat Hook
 * 
 * Main integration hook that combines microphone recording, sentence buffering,
 * audio playback, and voice service calls for full voice chat functionality.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useMicrophoneRecorder } from './use-microphone-recorder';
import { useSentenceBuffer } from './use-sentence-buffer';
import { useAudioQueue } from './use-audio-queue';
import { voiceService, Voice } from '@/services/voice-service';

export interface VoiceChatOptions {
  /**
   * Default voice ID for TTS (default: 'nova')
   */
  defaultVoice?: string;
  
  /**
   * TTS speed (0.25 to 4.0, default: 1.0)
   */
  speed?: number;
  
  /**
   * Language code for STT (optional, auto-detected if not provided)
   */
  language?: string;
  
  /**
   * Maximum recording duration in milliseconds (default: 60000 = 1 minute)
   */
  maxRecordingDuration?: number;
  
  /**
   * Called when speech is transcribed to text
   */
  onTranscription?: (text: string) => void;
  
  /**
   * Called when an error occurs
   */
  onError?: (error: Error) => void;
  
  /**
   * Called when voice chat state changes
   */
  onStateChange?: (state: VoiceChatState) => void;
}

export type VoiceChatMode = 'idle' | 'recording' | 'transcribing' | 'speaking';

export interface VoiceChatState {
  /**
   * Current mode of voice chat
   */
  mode: VoiceChatMode;
  
  /**
   * Whether voice output is enabled
   */
  voiceOutputEnabled: boolean;
  
  /**
   * Current voice ID for TTS
   */
  currentVoice: string;
  
  /**
   * Available voices
   */
  availableVoices: Voice[];
  
  /**
   * Whether microphone permission is granted
   */
  hasPermission: boolean | null;
  
  /**
   * Current error, if any
   */
  error: Error | null;
  
  /**
   * Whether TTS is currently processing
   */
  isSynthesizing: boolean;
}

export interface VoiceChatReturn extends VoiceChatState {
  /**
   * Start voice recording
   */
  startRecording: () => Promise<void>;
  
  /**
   * Stop recording and transcribe
   */
  stopRecording: () => void;
  
  /**
   * Cancel recording without transcribing
   */
  cancelRecording: () => void;
  
  /**
   * Toggle voice output on/off
   */
  toggleVoiceOutput: () => void;
  
  /**
   * Set voice output enabled state
   */
  setVoiceOutputEnabled: (enabled: boolean) => void;
  
  /**
   * Change the TTS voice
   */
  setVoice: (voiceId: string) => void;
  
  /**
   * Speak text (add to audio queue)
   */
  speak: (text: string) => Promise<void>;
  
  /**
   * Process streaming text for TTS (call with each chunk)
   */
  processStreamingText: (text: string) => void;
  
  /**
   * Flush remaining buffered text to TTS
   */
  flushStreamingText: () => void;
  
  /**
   * Stop current speech playback
   */
  stopSpeaking: () => void;
  
  /**
   * Pause speech playback
   */
  pauseSpeaking: () => void;
  
  /**
   * Resume speech playback
   */
  resumeSpeaking: () => void;
  
  /**
   * Request microphone permission
   */
  requestPermission: () => Promise<boolean>;
  
  /**
   * Load available voices from provider
   */
  loadVoices: () => Promise<void>;
}

export function useVoiceChat(options: VoiceChatOptions = {}): VoiceChatReturn {
  const {
    defaultVoice = 'nova',
    speed = 1.0,
    language,
    maxRecordingDuration = 60000,
    onTranscription,
    onError,
    onStateChange,
  } = options;

  const [state, setState] = useState<VoiceChatState>({
    mode: 'idle',
    voiceOutputEnabled: true,
    currentVoice: defaultVoice,
    availableVoices: [],
    hasPermission: null,
    error: null,
    isSynthesizing: false,
  });

  const synthesizingCountRef = useRef(0);
  const currentVoiceRef = useRef(defaultVoice);
  const voiceOutputEnabledRef = useRef(true);

  // Update state and notify
  const updateState = useCallback((updates: Partial<VoiceChatState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    updateState({ error });
    onError?.(error);
  }, [updateState, onError]);

  // Synthesize text to audio
  const synthesizeToAudio = useCallback(async (text: string): Promise<string | null> => {
    if (!voiceOutputEnabledRef.current || !text.trim()) {
      return null;
    }

    synthesizingCountRef.current++;
    updateState({ isSynthesizing: true });

    try {
      const audioUrl = await voiceService.synthesize(
        text,
        currentVoiceRef.current,
        speed
      );
      return audioUrl;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('TTS synthesis failed'));
      return null;
    } finally {
      synthesizingCountRef.current--;
      if (synthesizingCountRef.current === 0) {
        updateState({ isSynthesizing: false });
      }
    }
  }, [speed, updateState, handleError]);

  // Audio queue for playback
  const audioQueue = useAudioQueue({
    onPlaybackStart: () => {
      updateState({ mode: 'speaking' });
    },
    onPlaybackEnd: () => {
      updateState({ mode: 'idle' });
    },
    onError: handleError,
  });

  // Sentence buffer for streaming TTS
  const sentenceBuffer = useSentenceBuffer({
    onSentence: async (sentence) => {
      const audioUrl = await synthesizeToAudio(sentence);
      if (audioUrl) {
        audioQueue.enqueue(audioUrl);
      }
    },
  });

  // Handle recording completion
  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    updateState({ mode: 'transcribing' });
    
    try {
      const text = await voiceService.transcribe(audioBlob, language);
      updateState({ mode: 'idle' });
      onTranscription?.(text);
    } catch (error) {
      updateState({ mode: 'idle' });
      handleError(error instanceof Error ? error : new Error('Transcription failed'));
    }
  }, [language, onTranscription, updateState, handleError]);

  // Microphone recorder
  const microphone = useMicrophoneRecorder({
    maxDuration: maxRecordingDuration,
    onRecordingComplete: handleRecordingComplete,
    onError: handleError,
  });

  // Sync microphone permission state
  useEffect(() => {
    if (microphone.hasPermission !== state.hasPermission) {
      updateState({ hasPermission: microphone.hasPermission });
    }
  }, [microphone.hasPermission, state.hasPermission, updateState]);

  /**
   * Start voice recording
   */
  const startRecording = useCallback(async () => {
    // Stop any current playback
    audioQueue.stop();
    sentenceBuffer.reset();
    
    updateState({ mode: 'recording', error: null });
    await microphone.startRecording();
  }, [microphone, audioQueue, sentenceBuffer, updateState]);

  /**
   * Stop recording and transcribe
   */
  const stopRecording = useCallback(() => {
    microphone.stopRecording();
  }, [microphone]);

  /**
   * Cancel recording
   */
  const cancelRecording = useCallback(() => {
    microphone.cancelRecording();
    updateState({ mode: 'idle' });
  }, [microphone, updateState]);

  /**
   * Toggle voice output
   */
  const toggleVoiceOutput = useCallback(() => {
    voiceOutputEnabledRef.current = !voiceOutputEnabledRef.current;
    updateState({ voiceOutputEnabled: voiceOutputEnabledRef.current });
    
    // Stop playback if disabling
    if (!voiceOutputEnabledRef.current) {
      audioQueue.stop();
    }
  }, [audioQueue, updateState]);

  /**
   * Set voice output enabled
   */
  const setVoiceOutputEnabled = useCallback((enabled: boolean) => {
    voiceOutputEnabledRef.current = enabled;
    updateState({ voiceOutputEnabled: enabled });
    
    if (!enabled) {
      audioQueue.stop();
    }
  }, [audioQueue, updateState]);

  /**
   * Change TTS voice
   */
  const setVoice = useCallback((voiceId: string) => {
    currentVoiceRef.current = voiceId;
    updateState({ currentVoice: voiceId });
  }, [updateState]);

  /**
   * Speak text directly (for non-streaming use)
   */
  const speak = useCallback(async (text: string) => {
    const audioUrl = await synthesizeToAudio(text);
    if (audioUrl) {
      audioQueue.enqueue(audioUrl);
    }
  }, [synthesizeToAudio, audioQueue]);

  /**
   * Process streaming text
   */
  const processStreamingText = useCallback((text: string) => {
    if (voiceOutputEnabledRef.current) {
      sentenceBuffer.addText(text);
    }
  }, [sentenceBuffer]);

  /**
   * Flush remaining buffered text
   */
  const flushStreamingText = useCallback(() => {
    sentenceBuffer.flush();
  }, [sentenceBuffer]);

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(() => {
    audioQueue.stop();
    sentenceBuffer.reset();
    updateState({ mode: 'idle' });
  }, [audioQueue, sentenceBuffer, updateState]);

  /**
   * Pause speaking
   */
  const pauseSpeaking = useCallback(() => {
    audioQueue.pause();
  }, [audioQueue]);

  /**
   * Resume speaking
   */
  const resumeSpeaking = useCallback(() => {
    audioQueue.play();
  }, [audioQueue]);

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async () => {
    const granted = await microphone.requestPermission();
    updateState({ hasPermission: granted });
    return granted;
  }, [microphone, updateState]);

  /**
   * Load available voices
   */
  const loadVoices = useCallback(async () => {
    try {
      const response = await voiceService.getVoices();
      updateState({ availableVoices: response.voices });
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to load voices'));
    }
  }, [updateState, handleError]);

  // Load voices on mount
  useEffect(() => {
    loadVoices();
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    toggleVoiceOutput,
    setVoiceOutputEnabled,
    setVoice,
    speak,
    processStreamingText,
    flushStreamingText,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    requestPermission,
    loadVoices,
  };
}

export default useVoiceChat;
