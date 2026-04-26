/**
 * useMicrophoneRecorder Hook
 * 
 * Handles audio recording using the MediaRecorder API.
 * Supports configurable audio formats and real-time recording state.
 */
import { useState, useCallback, useRef, useEffect } from 'react';

export interface MicrophoneRecorderOptions {
  /**
   * Audio MIME type (default: 'audio/webm')
   */
  mimeType?: string;
  
  /**
   * Called when recording completes with audio blob
   */
  onRecordingComplete?: (audioBlob: Blob) => void;
  
  /**
   * Called when an error occurs
   */
  onError?: (error: Error) => void;
  
  /**
   * Maximum recording duration in milliseconds (optional)
   */
  maxDuration?: number;
}

export interface MicrophoneRecorderState {
  isRecording: boolean;
  isProcessing: boolean;
  hasPermission: boolean | null;
  error: Error | null;
}

export interface MicrophoneRecorderReturn extends MicrophoneRecorderState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  requestPermission: () => Promise<boolean>;
}

/**
 * Get the best supported MIME type for audio recording
 */
function getSupportedMimeType(): string {
  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/mpeg',
  ];

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return 'audio/webm';
}

export function useMicrophoneRecorder(
  options: MicrophoneRecorderOptions = {}
): MicrophoneRecorderReturn {
  const {
    mimeType = getSupportedMimeType(),
    onRecordingComplete,
    onError,
    maxDuration,
  } = options;

  const [state, setState] = useState<MicrophoneRecorderState>({
    isRecording: false,
    isProcessing: false,
    hasPermission: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);

  /**
   * Clean up media stream and recorder
   */
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    chunksRef.current = [];
  }, []);

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setState(prev => ({ ...prev, hasPermission: true, error: null }));
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        hasPermission: false,
        error: error instanceof Error ? error : new Error('Permission denied'),
      }));
      return false;
    }
  }, []);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      isCancelledRef.current = false;
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        if (!isCancelledRef.current && chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          onRecordingComplete?.(audioBlob);
        }
        cleanup();
        setState(prev => ({ ...prev, isRecording: false, isProcessing: false }));
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        const error = new Error('Recording failed');
        setState(prev => ({ ...prev, error, isRecording: false, isProcessing: false }));
        onError?.(error);
        cleanup();
      };

      // Start recording
      mediaRecorder.start();
      setState(prev => ({
        ...prev,
        isRecording: true,
        isProcessing: false,
        hasPermission: true,
      }));

      // Set max duration timeout if specified
      if (maxDuration) {
        timeoutRef.current = setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, maxDuration);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start recording');
      setState(prev => ({
        ...prev,
        error: err,
        isRecording: false,
        isProcessing: false,
        hasPermission: false,
      }));
      onError?.(err);
      cleanup();
    }
  }, [mimeType, maxDuration, onRecordingComplete, onError, cleanup]);

  /**
   * Stop recording and process audio
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * Cancel recording without processing
   */
  const cancelRecording = useCallback(() => {
    isCancelledRef.current = true;
    cleanup();
    setState(prev => ({ ...prev, isRecording: false, isProcessing: false }));
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    requestPermission,
  };
}

export default useMicrophoneRecorder;
