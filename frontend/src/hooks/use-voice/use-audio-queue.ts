/**
 * useAudioQueue Hook
 * 
 * Manages a queue of audio URLs and plays them sequentially.
 * Supports pause, resume, skip, and stop operations.
 */
import { useState, useCallback, useRef, useEffect } from 'react';

export interface AudioQueueOptions {
  /**
   * Called when audio playback starts
   */
  onPlaybackStart?: () => void;
  
  /**
   * Called when audio playback ends (queue empty)
   */
  onPlaybackEnd?: () => void;
  
  /**
   * Called when an individual audio item finishes playing
   */
  onItemComplete?: (url: string, index: number) => void;
  
  /**
   * Called when an error occurs during playback
   */
  onError?: (error: Error) => void;
  
  /**
   * Default playback volume (0.0 to 1.0, default: 1.0)
   */
  volume?: number;
  
  /**
   * Default playback rate (0.25 to 4.0, default: 1.0)
   */
  playbackRate?: number;
}

export interface AudioQueueState {
  /**
   * Whether audio is currently playing
   */
  isPlaying: boolean;
  
  /**
   * Whether playback is paused
   */
  isPaused: boolean;
  
  /**
   * Current queue of audio URLs
   */
  queue: string[];
  
  /**
   * Index of currently playing item
   */
  currentIndex: number;
  
  /**
   * Current volume (0.0 to 1.0)
   */
  volume: number;
  
  /**
   * Current playback rate
   */
  playbackRate: number;
}

export interface AudioQueueReturn extends AudioQueueState {
  /**
   * Add audio URL(s) to the queue
   */
  enqueue: (urls: string | string[]) => void;
  
  /**
   * Start or resume playback
   */
  play: () => void;
  
  /**
   * Pause playback
   */
  pause: () => void;
  
  /**
   * Stop playback and clear queue
   */
  stop: () => void;
  
  /**
   * Skip to next item in queue
   */
  skip: () => void;
  
  /**
   * Clear the queue (stops current playback)
   */
  clear: () => void;
  
  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume: (volume: number) => void;
  
  /**
   * Set playback rate (0.25 to 4.0)
   */
  setPlaybackRate: (rate: number) => void;
}

export function useAudioQueue(options: AudioQueueOptions = {}): AudioQueueReturn {
  const {
    onPlaybackStart,
    onPlaybackEnd,
    onItemComplete,
    onError,
    volume: initialVolume = 1.0,
    playbackRate: initialPlaybackRate = 1.0,
  } = options;

  const [state, setState] = useState<AudioQueueState>({
    isPlaying: false,
    isPaused: false,
    queue: [],
    currentIndex: -1,
    volume: initialVolume,
    playbackRate: initialPlaybackRate,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const currentIndexRef = useRef(-1);
  const isPlayingRef = useRef(false);

  const isAbortError = useCallback((error: unknown) => {
    if (error instanceof DOMException) {
      return error.name === 'AbortError' || error.message.includes('interrupted by a call to pause');
    }

    if (typeof error === 'object' && error !== null) {
      return 'name' in error && (error as { name?: string }).name === 'AbortError';
    }

    if (typeof error === 'string') {
      return error.includes('interrupted by a call to pause');
    }

    return false;
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  /**
   * Play next item in queue
   */
  const playNext = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1;
    
    if (nextIndex >= queueRef.current.length) {
      // Queue empty, playback complete
      isPlayingRef.current = false;
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        currentIndex: -1,
      }));
      onPlaybackEnd?.();
      return;
    }

    const url = queueRef.current[nextIndex];
    currentIndexRef.current = nextIndex;
    
    setState(prev => ({
      ...prev,
      currentIndex: nextIndex,
    }));

    // Create new audio element
    cleanupAudio();
    const audio = new Audio(url);
    audio.volume = state.volume;
    audio.playbackRate = state.playbackRate;
    audioRef.current = audio;

    // Handle audio end
    audio.onended = () => {
      onItemComplete?.(url, nextIndex);
      // Revoke object URL to free memory
      URL.revokeObjectURL(url);
      playNext();
    };

    // Handle audio error
    audio.onerror = () => {
      const error = new Error(`Failed to play audio at index ${nextIndex}`);
      onError?.(error);
      // Try next item
      playNext();
    };

    // Start playback
    audio.play().catch(error => {
      if (isAbortError(error)) {
        return;
      }

      onError?.(error instanceof Error ? error : new Error(String(error)));
      playNext();
    });
  }, [state.volume, state.playbackRate, onPlaybackEnd, onItemComplete, onError, cleanupAudio, isAbortError]);

  /**
   * Add audio URL(s) to the queue
   */
  const enqueue = useCallback((urls: string | string[]) => {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    queueRef.current = [...queueRef.current, ...urlArray];
    
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, ...urlArray],
    }));

    // Start playing if not already playing
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      onPlaybackStart?.();
      setState(prev => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
      }));
      playNext();
    }
  }, [playNext, onPlaybackStart]);

  /**
   * Start or resume playback
   */
  const play = useCallback(() => {
    if (audioRef.current && state.isPaused) {
      audioRef.current.play().catch(error => {
        if (isAbortError(error)) {
          return;
        }

        onError?.(error instanceof Error ? error : new Error(String(error)));
      });
      setState(prev => ({
        ...prev,
        isPaused: false,
        isPlaying: true,
      }));
    } else if (!isPlayingRef.current && queueRef.current.length > 0) {
      isPlayingRef.current = true;
      onPlaybackStart?.();
      setState(prev => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
      }));
      playNext();
    }
  }, [state.isPaused, playNext, onPlaybackStart, onError, isAbortError]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setState(prev => ({
        ...prev,
        isPaused: true,
        isPlaying: false,
      }));
    }
  }, []);

  /**
   * Stop playback and clear queue
   */
  const stop = useCallback(() => {
    cleanupAudio();
    
    // Revoke all remaining URLs
    queueRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore errors for non-object URLs
      }
    });
    
    queueRef.current = [];
    currentIndexRef.current = -1;
    isPlayingRef.current = false;
    
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      queue: [],
      currentIndex: -1,
    }));
  }, [cleanupAudio]);

  /**
   * Skip to next item in queue
   */
  const skip = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      const currentUrl = queueRef.current[currentIndexRef.current];
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      playNext();
    }
  }, [playNext]);

  /**
   * Clear the queue
   */
  const clear = useCallback(() => {
    stop();
  }, [stop]);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    setState(prev => ({
      ...prev,
      volume: clampedVolume,
    }));
  }, []);

  /**
   * Set playback rate
   */
  const setPlaybackRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(4, rate));
    if (audioRef.current) {
      audioRef.current.playbackRate = clampedRate;
    }
    setState(prev => ({
      ...prev,
      playbackRate: clampedRate,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      // Revoke all URLs
      queueRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore
        }
      });
    };
  }, [cleanupAudio]);

  return {
    ...state,
    enqueue,
    play,
    pause,
    stop,
    skip,
    clear,
    setVolume,
    setPlaybackRate,
  };
}

export default useAudioQueue;
