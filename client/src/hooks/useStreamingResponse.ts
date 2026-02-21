/* client/src/hooks/useStreamingResponse.ts */
import { useState, useCallback, useRef, useEffect } from 'react';

export interface StreamingState {
  isStreaming: boolean;
  currentText: string;
  fullText: string;
  progress: number; // 0-100
}

interface UseStreamingResponseOptions {
  speed?: number; // Characters per second (default: 50)
  onComplete?: () => void;
  onStart?: () => void;
}

/**
 * Hook for streaming text character-by-character
 * Creates a ChatGPT-like typing effect for AI responses
 */
export const useStreamingResponse = (options: UseStreamingResponseOptions = {}) => {
  const { speed = 50, onComplete, onStart } = options;

  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentText: '',
    fullText: '',
    progress: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const fullTextRef = useRef('');

  /**
   * Stop the streaming animation
   */
  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      currentText: fullTextRef.current,
      progress: 100,
    }));
    onComplete?.();
  }, [onComplete]);

  /**
   * Start streaming a new text
   */
  const startStreaming = useCallback(
    (text: string) => {
      // Clear any existing stream
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      fullTextRef.current = text;
      indexRef.current = 0;

      setState({
        isStreaming: true,
        currentText: '',
        fullText: text,
        progress: 0,
      });

      onStart?.();

      const interval = 1000 / speed; // milliseconds per character

      intervalRef.current = setInterval(() => {
        indexRef.current += 1;
        const currentText = fullTextRef.current.slice(0, indexRef.current);
        const progress = (indexRef.current / fullTextRef.current.length) * 100;

        setState({
          isStreaming: true,
          currentText,
          fullText: fullTextRef.current,
          progress,
        });

        if (indexRef.current >= fullTextRef.current.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            progress: 100,
          }));
          onComplete?.();
        }
      }, interval);
    },
    [speed, onStart, onComplete]
  );

  /**
   * Skip to the end of the current stream
   */
  const skipToEnd = useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

  /**
   * Reset the streaming state
   */
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState({
      isStreaming: false,
      currentText: '',
      fullText: '',
      progress: 0,
    });
    fullTextRef.current = '';
    indexRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startStreaming,
    stopStreaming,
    skipToEnd,
    reset,
  };
};

/**
 * Hook for streaming AI responses with realistic pauses
 * Adds pauses at punctuation for a more natural feel
 */
export const useRealisticStreaming = (options: UseStreamingResponseOptions = {}) => {
  const { speed = 50, onComplete, onStart } = options;

  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentText: '',
    fullText: '',
    progress: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const fullTextRef = useRef('');

  const stopStreaming = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      currentText: fullTextRef.current,
      progress: 100,
    }));
    onComplete?.();
  }, [onComplete]);

  const scheduleNext = useCallback((baseDelay: number) => {
    if (indexRef.current >= fullTextRef.current.length) {
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        progress: 100,
      }));
      onComplete?.();
      return;
    }

    const currentChar = fullTextRef.current[indexRef.current];
    const nextChar = fullTextRef.current[indexRef.current + 1];

    // Add realistic pauses
    let delay = baseDelay;
    if (currentChar === '.' || currentChar === '!' || currentChar === '?') {
      delay = baseDelay * 4; // Longer pause after sentence
    } else if (currentChar === ',' || currentChar === ';' || currentChar === ':') {
      delay = baseDelay * 2; // Medium pause after comma
    } else if (currentChar === '\n') {
      delay = baseDelay * 3; // Pause at line breaks
    } else if (currentChar === ' ' && nextChar === ' ') {
      delay = baseDelay * 0.5; // Faster through multiple spaces
    }

    timeoutRef.current = setTimeout(() => {
      indexRef.current += 1;
      const currentText = fullTextRef.current.slice(0, indexRef.current);
      const progress = (indexRef.current / fullTextRef.current.length) * 100;

      setState({
        isStreaming: true,
        currentText,
        fullText: fullTextRef.current,
        progress,
      });

      scheduleNext(baseDelay);
    }, delay);
  }, [onComplete]);

  const startStreaming = useCallback(
    (text: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      fullTextRef.current = text;
      indexRef.current = 0;

      setState({
        isStreaming: true,
        currentText: '',
        fullText: text,
        progress: 0,
      });

      onStart?.();

      const baseDelay = 1000 / speed;
      scheduleNext(baseDelay);
    },
    [speed, onStart, scheduleNext]
  );

  const skipToEnd = useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState({
      isStreaming: false,
      currentText: '',
      fullText: '',
      progress: 0,
    });
    fullTextRef.current = '';
    indexRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startStreaming,
    stopStreaming,
    skipToEnd,
    reset,
  };
};
