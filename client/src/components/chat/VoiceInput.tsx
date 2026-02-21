/* client/src/components/chat/VoiceInput.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { IconButton, Box, Typography, Tooltip, Fade } from '@mui/material';
import { Mic, MicOff, Stop } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, onError, disabled = false }) => {
  const { mode } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showFirstTimeTooltip, setShowFirstTimeTooltip] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if user has used voice input before
    const hasUsedVoice = localStorage.getItem('hasUsedVoice');
    if (!hasUsedVoice) {
      setShowFirstTimeTooltip(true);
      setTimeout(() => setShowFirstTimeTooltip(false), 5000);
    }

    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        logger.error('Speech recognition error', undefined, { errorType: event.error });
        onError?.(event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart if still supposed to be listening
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, onError]);

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (!analyserRef.current || !isListening) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(average / 255);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      logger.error('Error accessing microphone', error instanceof Error ? error : undefined);
      onError?.('Microphone access denied');
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsListening(false);
      setAudioLevel(0);

      // Send transcript if we have one
      if (transcript.trim()) {
        onTranscript(transcript.trim());
        setTranscript('');
      }

      // Mark as used
      localStorage.setItem('hasUsedVoice', 'true');
    } else {
      // Start listening
      if (recognitionRef.current) {
        recognitionRef.current.start();
        startAudioVisualization();
        setIsListening(true);
        setTranscript('');
      } else {
        onError?.('Speech recognition not supported in this browser');
      }
    }
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <Tooltip
        title={
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {isListening ? 'Click to stop recording' : 'Click to start voice input'}
            </Typography>
            <Typography variant="caption">
              {isListening ? 'Tap anywhere when done speaking' : 'Speak naturally - I\'ll understand!'}
            </Typography>
          </Box>
        }
        open={showFirstTimeTooltip || undefined}
        arrow
        placement="top"
      >
        <Box sx={{ position: 'relative' }}>
          {/* Pulsing circles when listening */}
          <AnimatePresence>
            {isListening && (
              <>
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5 + audioLevel, opacity: 0.3 }}
                  exit={{ scale: 1, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    zIndex: 0,
                  }}
                />
                <motion.div
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px solid var(--primary)',
                    zIndex: 0,
                  }}
                />
              </>
            )}
          </AnimatePresence>

          <IconButton
            onClick={handleToggleListening}
            disabled={disabled}
            sx={{
              position: 'relative',
              zIndex: 1,
              bgcolor: isListening ? 'var(--error)' : 'var(--surface)',
              color: isListening ? '#fff' : 'var(--primary)',
              '&:hover': {
                bgcolor: isListening ? 'var(--error)' : 'var(--surface-light)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
              boxShadow: isListening ? '0 4px 12px rgba(255,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {isListening ? <Stop /> : <Mic />}
          </IconButton>
        </Box>
      </Tooltip>

      {/* Live transcript display */}
      <Fade in={isListening && transcript.length > 0}>
        <Box
          sx={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            mb: 2,
            px: 2,
            py: 1,
            borderRadius: 'var(--radius-md)',
            bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            maxWidth: '300px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mb: 0.5 }}>
            Listening...
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {transcript}
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
};

export default VoiceInput;
