/**
 * useSentenceBuffer Hook
 * 
 * Buffers streaming text and emits complete sentences for TTS synthesis.
 * Uses sentence-level chunking for low-latency voice responses.
 */
import { useState, useCallback, useRef, useEffect } from 'react';

export interface SentenceBufferOptions {
  /**
   * Called when a complete sentence is detected
   */
  onSentence?: (sentence: string) => void;
  
  /**
   * Minimum character length for a sentence (default: 10)
   */
  minSentenceLength?: number;
  
  /**
   * Timeout in ms to flush partial sentences when no new text arrives (default: 2000)
   */
  flushTimeout?: number;
  
  /**
   * Whether to skip code blocks from TTS (default: true)
   */
  skipCodeBlocks?: boolean;
}

export interface SentenceBufferReturn {
  /**
   * Current buffer content (not yet emitted)
   */
  buffer: string;
  
  /**
   * Add text to the buffer (call with each streaming chunk)
   */
  addText: (text: string) => void;
  
  /**
   * Force flush any remaining buffer content
   */
  flush: () => void;
  
  /**
   * Reset the buffer
   */
  reset: () => void;
  
  /**
   * List of sentences emitted so far
   */
  sentences: string[];
}

// Sentence-ending punctuation regex
// Matches: . ! ? and their combinations, followed by space or end
const SENTENCE_END_REGEX = /[.!?]+(?:\s+|$)/;

// Code block detection regex
const CODE_BLOCK_START = /```[\w]*/;
const CODE_BLOCK_END = /```/;

/**
 * Check if text is inside a code block
 */
function isInsideCodeBlock(text: string): boolean {
  const starts = (text.match(CODE_BLOCK_START) || []).length;
  const ends = (text.match(CODE_BLOCK_END) || []).length;
  // If we have an odd number of code block markers, we're inside one
  return starts > ends;
}

/**
 * Remove code blocks from text
 */
function removeCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, ' ').trim();
}

/**
 * Extract sentences from text
 */
function extractSentences(
  text: string,
  minLength: number
): { sentences: string[]; remaining: string } {
  const sentences: string[] = [];
  let remaining = text;

  // Find sentence boundaries
  let match;
  while ((match = SENTENCE_END_REGEX.exec(remaining)) !== null) {
    const endIndex = match.index + match[0].length;
    const sentence = remaining.substring(0, endIndex).trim();
    
    if (sentence.length >= minLength) {
      sentences.push(sentence);
      remaining = remaining.substring(endIndex);
    } else {
      // Sentence too short, keep it in buffer
      break;
    }
  }

  return { sentences, remaining };
}

export function useSentenceBuffer(
  options: SentenceBufferOptions = {}
): SentenceBufferReturn {
  const {
    onSentence,
    minSentenceLength = 10,
    flushTimeout = 2000,
    skipCodeBlocks = true,
  } = options;

  const [buffer, setBuffer] = useState('');
  const [sentences, setSentences] = useState<string[]>([]);
  
  const bufferRef = useRef('');
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inCodeBlockRef = useRef(false);

  /**
   * Process buffer and emit complete sentences
   */
  const processBuffer = useCallback(() => {
    let textToProcess = bufferRef.current;
    
    // Handle code blocks
    if (skipCodeBlocks) {
      // Check if we're entering or exiting a code block
      if (CODE_BLOCK_START.test(textToProcess)) {
        inCodeBlockRef.current = isInsideCodeBlock(textToProcess);
      }
      
      // If inside code block, don't process for sentences
      if (inCodeBlockRef.current) {
        // Check if code block is now closed
        if (!isInsideCodeBlock(textToProcess)) {
          inCodeBlockRef.current = false;
          textToProcess = removeCodeBlocks(textToProcess);
        } else {
          // Still inside code block, wait for it to close
          return;
        }
      } else {
        // Remove any complete code blocks
        textToProcess = removeCodeBlocks(textToProcess);
      }
    }

    const { sentences: newSentences, remaining } = extractSentences(
      textToProcess,
      minSentenceLength
    );

    if (newSentences.length > 0) {
      // Update buffer with remaining text
      if (skipCodeBlocks) {
        // Keep the original buffer but mark where we've processed
        bufferRef.current = remaining;
      } else {
        bufferRef.current = remaining;
      }
      setBuffer(remaining);

      // Emit sentences
      setSentences(prev => [...prev, ...newSentences]);
      newSentences.forEach(sentence => {
        onSentence?.(sentence);
      });
    }
  }, [minSentenceLength, skipCodeBlocks, onSentence]);

  /**
   * Add text to the buffer
   */
  const addText = useCallback((text: string) => {
    // Clear flush timeout since we got new text
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }

    bufferRef.current += text;
    setBuffer(bufferRef.current);
    
    // Process for complete sentences
    processBuffer();

    // Set timeout to flush partial content if no more text arrives
    flushTimeoutRef.current = setTimeout(() => {
      if (bufferRef.current.trim().length >= minSentenceLength) {
        const partialSentence = bufferRef.current.trim();
        if (!inCodeBlockRef.current && partialSentence) {
          // Remove any incomplete code blocks
          const cleaned = skipCodeBlocks
            ? partialSentence.replace(/```[\w]*[^`]*$/g, '').trim()
            : partialSentence;
          
          if (cleaned.length >= minSentenceLength) {
            setSentences(prev => [...prev, cleaned]);
            onSentence?.(cleaned);
            bufferRef.current = '';
            setBuffer('');
          }
        }
      }
    }, flushTimeout);
  }, [processBuffer, minSentenceLength, flushTimeout, skipCodeBlocks, onSentence]);

  /**
   * Force flush remaining buffer
   */
  const flush = useCallback(() => {
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }

    const remaining = bufferRef.current.trim();
    if (remaining.length > 0) {
      // Clean up any incomplete code blocks
      const cleaned = skipCodeBlocks
        ? removeCodeBlocks(remaining).replace(/```[\w]*[^`]*$/g, '').trim()
        : remaining;
      
      if (cleaned.length > 0) {
        setSentences(prev => [...prev, cleaned]);
        onSentence?.(cleaned);
      }
    }

    bufferRef.current = '';
    setBuffer('');
    inCodeBlockRef.current = false;
  }, [skipCodeBlocks, onSentence]);

  /**
   * Reset the buffer and sentences
   */
  const reset = useCallback(() => {
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }

    bufferRef.current = '';
    inCodeBlockRef.current = false;
    setBuffer('');
    setSentences([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
    };
  }, []);

  return {
    buffer,
    addText,
    flush,
    reset,
    sentences,
  };
}

export default useSentenceBuffer;
