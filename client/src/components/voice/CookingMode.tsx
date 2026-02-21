/* client/src/components/voice/CookingMode.tsx */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Close,
  NavigateBefore,
  NavigateNext,
  Replay,
  Timer,
  TimerOff,
  Pause,
  PlayArrow,
  Restaurant,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useTTS } from '../../hooks/useTTS';
import { useTheme } from '../../contexts/ThemeContext';
import VoiceCommandBar from './VoiceCommandBar';

export interface CookingRecipe {
  name: string;
  instructions: string[];
  ingredients?: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: string;
}

interface CookingModeProps {
  recipe: CookingRecipe;
  onClose: () => void;
}

const CookingMode = ({ recipe, onClose }: CookingModeProps) => {
  const { mode } = useTheme();
  const { speak, stop: stopSpeaking, isSpeaking } = useTTS();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport,
  } = useSpeechRecognition();

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTarget, setTimerTarget] = useState(0); // total seconds for display
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProcessedTranscript = useRef('');

  const totalSteps = recipe.instructions.length;

  // --- Timer logic ---
  const startTimer = useCallback((minutes: number) => {
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    const totalSecs = Math.round(minutes * 60);
    setTimerTarget(totalSecs);
    setTimerSeconds(totalSecs);
    setTimerRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerRunning(false);
  }, []);

  const resumeTimer = useCallback(() => {
    if (timerSeconds > 0) {
      setTimerRunning(true);
    }
  }, [timerSeconds]);

  const cancelTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerRunning(false);
    setTimerSeconds(0);
    setTimerTarget(0);
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            // Announce timer done
            speak('Timer is done!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerRunning, timerSeconds, speak]);

  // Format seconds into mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Step navigation ---
  const goToNextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      stopSpeaking();
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps, stopSpeaking]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      stopSpeaking();
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, stopSpeaking]);

  const repeatStep = useCallback(() => {
    stopSpeaking();
    speak(recipe.instructions[currentStep]);
  }, [currentStep, recipe.instructions, speak, stopSpeaking]);

  // Auto-read step aloud when step changes
  useEffect(() => {
    const stepText = `Step ${currentStep + 1} of ${totalSteps}. ${recipe.instructions[currentStep]}`;
    speak(stepText);
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Voice command processing ---
  useEffect(() => {
    if (!transcript || transcript === lastProcessedTranscript.current) return;

    const lowerTranscript = transcript.toLowerCase().trim();

    // Avoid re-processing the same transcript
    if (lowerTranscript.length < 3) return;

    // Check for commands
    if (
      lowerTranscript.includes('next step') ||
      lowerTranscript.includes('next') ||
      lowerTranscript.includes('go forward')
    ) {
      lastProcessedTranscript.current = transcript;
      resetTranscript();
      goToNextStep();
      return;
    }

    if (
      lowerTranscript.includes('previous step') ||
      lowerTranscript.includes('previous') ||
      lowerTranscript.includes('go back') ||
      lowerTranscript.includes('back')
    ) {
      lastProcessedTranscript.current = transcript;
      resetTranscript();
      goToPrevStep();
      return;
    }

    if (
      lowerTranscript.includes('repeat') ||
      lowerTranscript.includes('say again') ||
      lowerTranscript.includes('read again')
    ) {
      lastProcessedTranscript.current = transcript;
      resetTranscript();
      repeatStep();
      return;
    }

    if (lowerTranscript.includes("what's next") || lowerTranscript.includes('what is next')) {
      lastProcessedTranscript.current = transcript;
      resetTranscript();
      if (currentStep < totalSteps - 1) {
        speak(`Next up: ${recipe.instructions[currentStep + 1]}`);
      } else {
        speak("That was the last step! You're all done.");
      }
      return;
    }

    // Timer commands: "set timer 5 minutes", "timer 10 minutes", "set timer for 2 minutes"
    const timerMatch = lowerTranscript.match(
      /(?:set\s+)?timer\s+(?:for\s+)?(\d+)\s*(?:minute|min)/i
    );
    if (timerMatch) {
      const minutes = parseInt(timerMatch[1], 10);
      if (minutes > 0 && minutes <= 180) {
        lastProcessedTranscript.current = transcript;
        resetTranscript();
        startTimer(minutes);
        speak(`Timer set for ${minutes} minute${minutes > 1 ? 's' : ''}.`);
        return;
      }
    }

    // Stop/cancel timer
    if (
      lowerTranscript.includes('stop timer') ||
      lowerTranscript.includes('cancel timer')
    ) {
      lastProcessedTranscript.current = transcript;
      resetTranscript();
      cancelTimer();
      speak('Timer cancelled.');
      return;
    }

    // Pause timer
    if (lowerTranscript.includes('pause timer')) {
      lastProcessedTranscript.current = transcript;
      resetTranscript();
      pauseTimer();
      speak('Timer paused.');
      return;
    }

    // Resume timer
    if (lowerTranscript.includes('resume timer')) {
      lastProcessedTranscript.current = transcript;
      resetTranscript();
      resumeTimer();
      speak('Timer resumed.');
      return;
    }
  }, [
    transcript,
    resetTranscript,
    goToNextStep,
    goToPrevStep,
    repeatStep,
    startTimer,
    cancelTimer,
    pauseTimer,
    resumeTimer,
    currentStep,
    totalSteps,
    recipe.instructions,
    speak,
  ]);

  // Toggle listening
  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }, [isListening, stopListening, startListening, resetTranscript]);

  // Handle quick command from VoiceCommandBar chips
  const handleQuickCommand = useCallback(
    (command: string) => {
      switch (command) {
        case 'next step':
          goToNextStep();
          break;
        case 'repeat':
          repeatStep();
          break;
        case 'set timer':
          // Default 5 minute timer from chip
          startTimer(5);
          speak('Timer set for 5 minutes.');
          break;
        default:
          break;
      }
    },
    [goToNextStep, repeatStep, startTimer, speak]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (isListening) {
        stopListening();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle exit
  const handleExitRequest = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = () => {
    stopSpeaking();
    if (isListening) {
      stopListening();
    }
    cancelTimer();
    setShowExitDialog(false);
    onClose();
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  // Slide variants for step transitions
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        bgcolor: mode === 'dark' ? '#0a0a0f' : '#1a1a2e',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Cooking mode for ${recipe.name}`}
    >
      {/* Top Bar: Recipe name, timer, close */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 4 },
          py: 2,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        {/* Recipe name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
          <Restaurant sx={{ color: 'var(--chef-orange)', fontSize: '1.5rem' }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1rem', md: '1.25rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {recipe.name}
          </Typography>
        </Box>

        {/* Timer display */}
        {timerTarget > 0 && (
          <Box
            component={motion.div}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mx: 2,
              px: 2,
              py: 0.5,
              borderRadius: 'var(--radius-full)',
              bgcolor:
                timerSeconds <= 10 && timerSeconds > 0
                  ? 'rgba(244, 67, 54, 0.2)'
                  : 'rgba(255, 107, 53, 0.15)',
              border: `1px solid ${
                timerSeconds <= 10 && timerSeconds > 0
                  ? 'rgba(244, 67, 54, 0.5)'
                  : 'rgba(255, 107, 53, 0.3)'
              }`,
            }}
          >
            <Timer
              sx={{
                fontSize: '1.2rem',
                color:
                  timerSeconds <= 10 && timerSeconds > 0
                    ? '#f44336'
                    : 'var(--chef-orange)',
              }}
            />
            <Typography
              component={motion.span}
              animate={
                timerSeconds <= 10 && timerSeconds > 0
                  ? { scale: [1, 1.1, 1] }
                  : {}
              }
              transition={{
                duration: 1,
                repeat: timerSeconds <= 10 ? Infinity : 0,
              }}
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                fontFamily: 'monospace',
                color:
                  timerSeconds <= 10 && timerSeconds > 0
                    ? '#f44336'
                    : '#ffffff',
                minWidth: 55,
                textAlign: 'center',
              }}
            >
              {formatTime(timerSeconds)}
            </Typography>

            {/* Pause/Resume */}
            <IconButton
              onClick={timerRunning ? pauseTimer : resumeTimer}
              size="small"
              sx={{ color: 'rgba(255,255,255,0.7)', p: 0.5 }}
              aria-label={timerRunning ? 'Pause timer' : 'Resume timer'}
            >
              {timerRunning ? (
                <Pause sx={{ fontSize: '1rem' }} />
              ) : (
                <PlayArrow sx={{ fontSize: '1rem' }} />
              )}
            </IconButton>

            {/* Cancel timer */}
            <IconButton
              onClick={cancelTimer}
              size="small"
              sx={{ color: 'rgba(255,255,255,0.5)', p: 0.5 }}
              aria-label="Cancel timer"
            >
              <TimerOff sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Box>
        )}

        {/* Close button */}
        <Tooltip title="Exit cooking mode" arrow placement="bottom">
          <IconButton
            onClick={handleExitRequest}
            sx={{
              color: 'rgba(255,255,255,0.6)',
              '&:hover': {
                color: '#ffffff',
                bgcolor: 'rgba(255,255,255,0.1)',
              },
            }}
            aria-label="Exit cooking mode"
          >
            <Close />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4,
          flexShrink: 0,
          bgcolor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': {
            bgcolor: 'var(--chef-orange)',
            transition: 'transform 0.4s ease',
          },
        }}
        aria-label={`Step ${currentStep + 1} of ${totalSteps}`}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Step progress indicator */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          py: 2,
          flexShrink: 0,
        }}
      >
        <Chip
          label={`Step ${currentStep + 1} of ${totalSteps}`}
          size="small"
          sx={{
            bgcolor: 'rgba(255, 107, 53, 0.15)',
            color: 'var(--chef-orange)',
            fontWeight: 700,
            fontSize: '0.85rem',
            border: '1px solid rgba(255, 107, 53, 0.3)',
          }}
        />
        {isSpeaking && (
          <Chip
            label="Speaking..."
            size="small"
            sx={{
              bgcolor: 'rgba(5, 175, 92, 0.15)',
              color: '#05AF5C',
              fontWeight: 600,
              fontSize: '0.75rem',
              border: '1px solid rgba(5, 175, 92, 0.3)',
            }}
          />
        )}
      </Box>

      {/* Step dots indicator */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 0.75,
          pb: 2,
          flexShrink: 0,
          px: 2,
          flexWrap: 'wrap',
        }}
      >
        {recipe.instructions.map((_, idx) => (
          <Box
            key={idx}
            component={motion.div}
            animate={{
              scale: idx === currentStep ? 1.3 : 1,
              backgroundColor:
                idx === currentStep
                  ? '#FF6B35'
                  : idx < currentStep
                  ? 'rgba(255, 107, 53, 0.5)'
                  : 'rgba(255, 255, 255, 0.2)',
            }}
            transition={{ duration: 0.3 }}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              cursor: 'pointer',
            }}
            onClick={() => {
              stopSpeaking();
              setDirection(idx > currentStep ? 1 : -1);
              setCurrentStep(idx);
            }}
            role="button"
            aria-label={`Go to step ${idx + 1}`}
          />
        ))}
      </Box>

      {/* Main step content area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, md: 8 },
          py: 4,
          overflow: 'hidden',
          position: 'relative',
          minHeight: 0,
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <Box
            component={motion.div}
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            sx={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: 700,
              width: '100%',
              px: 2,
            }}
          >
            <Typography
              variant="h4"
              component="p"
              sx={{
                fontWeight: 500,
                fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
                lineHeight: 1.6,
                color: '#ffffff',
                letterSpacing: '0.01em',
                maxHeight: '60vh',
                overflow: 'auto',
              }}
            >
              {recipe.instructions[currentStep]}
            </Typography>
          </Box>
        </AnimatePresence>
      </Box>

      {/* Navigation buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: { xs: 2, md: 4 },
          pb: { xs: 14, md: 14 }, // Room for voice command bar
          pt: 2,
          flexShrink: 0,
        }}
      >
        <Tooltip title="Previous step" arrow placement="top">
          <span>
            <IconButton
              onClick={goToPrevStep}
              disabled={currentStep === 0}
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'rgba(255,255,255,0.08)',
                color: currentStep === 0 ? 'rgba(255,255,255,0.2)' : '#ffffff',
                border: '1px solid rgba(255,255,255,0.12)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.15)',
                },
                '&:disabled': {
                  bgcolor: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.15)',
                },
              }}
              aria-label="Previous step"
            >
              <NavigateBefore sx={{ fontSize: '2rem' }} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Repeat current step" arrow placement="top">
          <IconButton
            onClick={repeatStep}
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'rgba(255, 107, 53, 0.15)',
              color: 'var(--chef-orange)',
              border: '1px solid rgba(255, 107, 53, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: 'rgba(255, 107, 53, 0.25)',
              },
            }}
            aria-label="Repeat current step"
          >
            <Replay sx={{ fontSize: '1.8rem' }} />
          </IconButton>
        </Tooltip>

        <Tooltip
          title={
            currentStep === totalSteps - 1
              ? 'Last step'
              : 'Next step'
          }
          arrow
          placement="top"
        >
          <span>
            <IconButton
              onClick={goToNextStep}
              disabled={currentStep === totalSteps - 1}
              sx={{
                width: 56,
                height: 56,
                bgcolor:
                  currentStep === totalSteps - 1
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(255, 107, 53, 0.2)',
                color:
                  currentStep === totalSteps - 1
                    ? 'rgba(255,255,255,0.15)'
                    : '#ffffff',
                border:
                  currentStep === totalSteps - 1
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(255, 107, 53, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'rgba(255, 107, 53, 0.3)',
                },
                '&:disabled': {
                  bgcolor: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.15)',
                },
              }}
              aria-label="Next step"
            >
              <NavigateNext sx={{ fontSize: '2rem' }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Voice Command Bar */}
      <VoiceCommandBar
        isListening={isListening}
        transcript={transcript}
        onToggleListening={handleToggleListening}
        onCommand={handleQuickCommand}
        hasRecognitionSupport={hasRecognitionSupport}
      />

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={showExitDialog}
        onClose={handleCancelExit}
        PaperProps={{
          sx: {
            bgcolor: mode === 'dark' ? '#1a1a2e' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#000000',
            borderRadius: 'var(--radius-xl)',
            border: `1px solid ${
              mode === 'dark'
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.1)'
            }`,
          },
        }}
        aria-labelledby="exit-cooking-dialog-title"
      >
        <DialogTitle id="exit-cooking-dialog-title" sx={{ fontWeight: 700 }}>
          Exit Cooking Mode?
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              color: mode === 'dark'
                ? 'rgba(255,255,255,0.7)'
                : 'rgba(0,0,0,0.7)',
            }}
          >
            You are on step {currentStep + 1} of {totalSteps}. Your progress
            will not be saved. Are you sure you want to exit?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCancelExit}
            sx={{
              color: mode === 'dark'
                ? 'rgba(255,255,255,0.7)'
                : 'rgba(0,0,0,0.6)',
            }}
          >
            Keep Cooking
          </Button>
          <Button
            onClick={handleConfirmExit}
            variant="contained"
            sx={{
              bgcolor: 'var(--chef-orange)',
              '&:hover': { bgcolor: '#FF8C5A' },
              fontWeight: 700,
            }}
          >
            Exit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CookingMode;
