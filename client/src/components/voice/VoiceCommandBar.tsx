/* client/src/components/voice/VoiceCommandBar.tsx */
import { useEffect, useState } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Mic, MicOff, NavigateNext, Replay, Timer } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface VoiceCommandBarProps {
  isListening: boolean;
  transcript: string;
  onToggleListening: () => void;
  onCommand: (command: string) => void;
  hasRecognitionSupport: boolean;
}

const VoiceCommandBar = ({
  isListening,
  transcript,
  onToggleListening,
  onCommand,
  hasRecognitionSupport,
}: VoiceCommandBarProps) => {
  const { mode } = useTheme();
  const [displayedTranscript, setDisplayedTranscript] = useState('');

  // Update displayed transcript with a brief delay to avoid flicker
  useEffect(() => {
    if (transcript) {
      setDisplayedTranscript(transcript);
    }
  }, [transcript]);

  // Clear displayed transcript after a short pause of no input
  useEffect(() => {
    if (!isListening && displayedTranscript) {
      const timeout = setTimeout(() => {
        setDisplayedTranscript('');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isListening, displayedTranscript]);

  const quickCommands = [
    { label: 'Next', icon: <NavigateNext />, command: 'next step' },
    { label: 'Repeat', icon: <Replay />, command: 'repeat' },
    { label: 'Timer', icon: <Timer />, command: 'set timer' },
  ];

  // Waveform bars for listening animation
  const waveformBars = Array.from({ length: 12 }, (_, i) => i);

  return (
    <AnimatePresence>
      <Box
        component={motion.div}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          px: 2,
          pb: 2,
          pt: 1,
        }}
      >
        <Box
          sx={{
            maxWidth: 600,
            mx: 'auto',
            borderRadius: 'var(--radius-xl)',
            background:
              mode === 'dark'
                ? 'rgba(20, 20, 25, 0.92)'
                : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: `1px solid ${
              mode === 'dark'
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.08)'
            }`,
            boxShadow:
              mode === 'dark'
                ? '0 -4px 32px rgba(0,0,0,0.6)'
                : '0 -4px 32px rgba(0,0,0,0.15)',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {/* Waveform + Mic Button Row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {/* Mic toggle button */}
            {hasRecognitionSupport && (
              <Tooltip
                title={isListening ? 'Stop listening' : 'Start listening'}
                arrow
                placement="top"
              >
                <IconButton
                  onClick={onToggleListening}
                  sx={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    bgcolor: isListening
                      ? 'rgba(255, 107, 53, 0.2)'
                      : mode === 'dark'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                    color: isListening
                      ? 'var(--chef-orange)'
                      : mode === 'dark'
                      ? 'rgba(255,255,255,0.7)'
                      : 'rgba(0,0,0,0.6)',
                    border: isListening
                      ? '2px solid var(--chef-orange)'
                      : '2px solid transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 107, 53, 0.15)',
                      color: 'var(--chef-orange)',
                    },
                  }}
                  aria-label={
                    isListening ? 'Stop listening' : 'Start listening'
                  }
                >
                  {isListening ? <MicOff /> : <Mic />}
                </IconButton>
              </Tooltip>
            )}

            {/* Waveform visualization */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                height: 32,
                overflow: 'hidden',
              }}
            >
              {isListening ? (
                waveformBars.map((i) => (
                  <Box
                    key={i}
                    component={motion.div}
                    animate={{
                      scaleY: [
                        0.3,
                        0.5 + Math.random() * 1.5,
                        0.3,
                        0.8 + Math.random() * 1.2,
                        0.3,
                      ],
                    }}
                    transition={{
                      duration: 0.8 + Math.random() * 0.4,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: 'easeInOut',
                    }}
                    sx={{
                      width: 3,
                      height: 20,
                      borderRadius: 2,
                      bgcolor: 'var(--chef-orange)',
                      transformOrigin: 'center',
                      opacity: 0.8,
                    }}
                  />
                ))
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      mode === 'dark'
                        ? 'rgba(255,255,255,0.4)'
                        : 'rgba(0,0,0,0.4)',
                    fontStyle: 'italic',
                    fontSize: '0.85rem',
                  }}
                >
                  Tap mic or say a command
                </Typography>
              )}
            </Box>
          </Box>

          {/* Recognized transcript display */}
          <AnimatePresence mode="wait">
            {displayedTranscript && (
              <Box
                component={motion.div}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--chef-orange)',
                    fontWeight: 600,
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    px: 1,
                  }}
                >
                  "{displayedTranscript}"
                </Typography>
              </Box>
            )}
          </AnimatePresence>

          {/* Quick command chips */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {quickCommands.map((cmd) => (
              <Chip
                key={cmd.label}
                icon={cmd.icon}
                label={cmd.label}
                onClick={() => onCommand(cmd.command)}
                variant="outlined"
                size="small"
                sx={{
                  borderColor:
                    mode === 'dark'
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(0,0,0,0.15)',
                  color:
                    mode === 'dark'
                      ? 'rgba(255,255,255,0.8)'
                      : 'rgba(0,0,0,0.7)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '& .MuiChip-icon': {
                    color:
                      mode === 'dark'
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(0,0,0,0.5)',
                  },
                  '&:hover': {
                    borderColor: 'var(--chef-orange)',
                    color: 'var(--chef-orange)',
                    bgcolor: 'rgba(255, 107, 53, 0.08)',
                    '& .MuiChip-icon': {
                      color: 'var(--chef-orange)',
                    },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </AnimatePresence>
  );
};

export default VoiceCommandBar;
