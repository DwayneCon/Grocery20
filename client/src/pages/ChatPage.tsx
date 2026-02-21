/* client/src/pages/ChatPage.tsx */
import { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, List, ListItem, Avatar, Typography, CircularProgress, Alert, Snackbar, Tooltip, Fab, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import { Send, Person, Mic, MicOff, CalendarMonth, VolumeUp, VolumeOff } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import NoraAvatar from '../components/common/NoraAvatar';
import MealPlanCanvas from '../components/chat/MealPlanCanvas';
import { sanitizeAIContent, sanitizeInput } from '../utils/sanitize';
import { aiService } from '../services/aiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import QuickActionChips from '../components/chat/QuickActionChips';
import MessageReactions from '../components/chat/MessageReactions';
import MealPlanDisplay from '../components/chat/MealPlanDisplay';
import { useTTS } from '../hooks/useTTS';
import { useTheme } from '../contexts/ThemeContext';
import { RootState } from '../features/store';
import { parseMealPlan, isMealPlan } from '../utils/mealParser';
import { logger } from '../utils/logger';
import { generateChatWelcomeMessage, generateContextualPrompts } from '../utils/contextualMessages';
import { createEmptyWeekPlan, DayName, calculateCompletion } from '../types/mealPlanCanvas';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isMealPlan?: boolean;
}

const ChatPage = () => {
  const { mode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const user = useSelector((state: RootState) => state.auth.user);
  const householdId = user?.householdId;

  // Generate contextual welcome message
  const contextualWelcome = generateChatWelcomeMessage({
    userName: user?.name,
    // TODO: Add real data when available
    hasMealPlan: false,
    hasShoppingList: false,
    upcomingMealsCount: 0,
    expiringItemsCount: 0,
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: contextualWelcome,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Meal Plan Canvas state
  const [weekPlan, setWeekPlan] = useState(createEmptyWeekPlan());
  const [canvasVisible, setCanvasVisible] = useState(!isMobile); // Default visible on desktop
  const [selectedDay, setSelectedDay] = useState<DayName | null>(null);

  // Voice recognition
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport,
    error: voiceError,
  } = useSpeechRecognition();

  // Text-to-speech for Nora
  const { speak, stop: stopSpeaking, isSpeaking } = useTTS();
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const handleSpeak = (messageId: string, text: string) => {
    if (isSpeaking && speakingMessageId === messageId) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      // Stop any current speech before starting new one
      if (isSpeaking) {
        stopSpeaking();
      }
      setSpeakingMessageId(messageId);
      speak(text).then(() => {
        // Reset speaking message ID when done (handled by onended in hook, but also here for safety)
      });
    }
  };

  // Sync speakingMessageId with isSpeaking state
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageId(null);
    }
  }, [isSpeaking]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Update input when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Handle voice error
  useEffect(() => {
    if (voiceError) {
      setError(voiceError);
    }
  }, [voiceError]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const sanitizedInput = sanitizeInput(textToSend);
    const userMsg: Message = {
      id: Date.now().toString(),
      text: sanitizedInput,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setShowQuickActions(false);
    setIsTyping(true);
    setError(null);
    resetTranscript();

    try {
      // Call AI chat endpoint with householdId
      const response = await aiService.chat({
        message: sanitizedInput,
        householdId,
        useHistory: true
      });

      setIsTyping(false);

      const sanitizedResponse = sanitizeAIContent(response.response);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: sanitizedResponse,
        sender: 'ai',
        timestamp: new Date(),
        isMealPlan: isMealPlan(sanitizedResponse),
      };

      setMessages(prev => [...prev, aiMsg]);

      // If this is a meal plan, update the canvas with the meals
      if (aiMsg.isMealPlan) {
        const mealPlan = parseMealPlan(sanitizedResponse);
        logger.info('Parsed meal plan', {
          metadata: {
            hasMeals: mealPlan.hasMeals,
            mealCount: mealPlan.meals.length,
            meals: mealPlan.meals.map(m => ({
              name: m.name,
              day: m.day,
              mealType: m.mealType
            }))
          }
        });

        if (mealPlan.hasMeals && mealPlan.meals.length > 0) {
          setWeekPlan(prevWeek => {
            const updatedDays = [...prevWeek.days];
            let mealsUpdated = 0;

            mealPlan.meals.forEach(meal => {
              logger.debug('Processing meal', {
                metadata: {
                  mealName: meal.name,
                  mealDay: meal.day,
                  mealType: meal.mealType
                }
              });

              // Find the matching day
              const dayIndex = updatedDays.findIndex(
                d => d.dayName.toLowerCase() === meal.day?.toLowerCase()
              );

              logger.debug('Day search result', {
                metadata: {
                  dayIndex,
                  searchingFor: meal.day?.toLowerCase(),
                  availableDays: updatedDays.map(d => d.dayName.toLowerCase())
                }
              });

              if (dayIndex !== -1 && meal.mealType) {
                // Find the matching meal slot
                const mealSlotIndex = updatedDays[dayIndex].meals.findIndex(
                  m => m.mealType === meal.mealType.toLowerCase()
                );

                logger.debug('Meal slot search result', {
                  metadata: {
                    mealSlotIndex,
                    searchingFor: meal.mealType.toLowerCase(),
                    availableSlots: updatedDays[dayIndex].meals.map(m => m.mealType)
                  }
                });

                if (mealSlotIndex !== -1) {
                  // Update the meal slot
                  updatedDays[dayIndex].meals[mealSlotIndex] = {
                    ...updatedDays[dayIndex].meals[mealSlotIndex],
                    meal: meal,
                    status: 'suggested',
                  };
                  mealsUpdated++;

                  logger.info('Meal slot updated!', {
                    metadata: {
                      day: updatedDays[dayIndex].dayName,
                      mealType: meal.mealType,
                      mealName: meal.name
                    }
                  });

                  // Update day status
                  const filledSlots = updatedDays[dayIndex].meals.filter(
                    m => m.status !== 'empty'
                  ).length;
                  if (filledSlots === updatedDays[dayIndex].meals.length) {
                    updatedDays[dayIndex].status = 'complete';
                  } else if (filledSlots > 0) {
                    updatedDays[dayIndex].status = 'partial';
                  }
                } else {
                  logger.warn('Meal slot not found', {
                    metadata: {
                      day: updatedDays[dayIndex].dayName,
                      mealType: meal.mealType
                    }
                  });
                }
              } else {
                logger.warn('Day not found or meal type missing', {
                  metadata: {
                    dayIndex,
                    mealDay: meal.day,
                    mealType: meal.mealType
                  }
                });
              }
            });

            // Recalculate completion
            const completion = calculateCompletion(updatedDays);

            logger.info('Week plan update complete', {
              metadata: {
                totalMeals: mealPlan.meals.length,
                mealsUpdated,
                completionPercentage: completion
              }
            });

            return {
              ...prevWeek,
              days: updatedDays,
              completionPercentage: completion,
            };
          });
        } else {
          logger.warn('No meals found in parsed meal plan');
        }
      }

      // Show warning if fallback model was used
      if (response.fallback) {
        setError('Using simplified AI model - responses may be less detailed');
      }
    } catch (err: any) {
      setIsTyping(false);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to get AI response';
      setError(errorMessage);

      // Add error message to chat
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `I apologize, but I'm having trouble connecting right now. ${errorMessage}. Please try again.`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleQuickAction = (action: string) => {
    handleSend(action);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleReaction = (messageId: string, reaction: string) => {
    logger.info('Reaction', { metadata: { messageId, reaction } });
    // You can implement reaction tracking here
  };

  const handleMealAccepted = (meal: ParsedMeal) => {
    logger.info('Meal accepted, updating weekPlan', { metadata: { mealName: meal.name, day: meal.day, mealType: meal.mealType } });

    // Update weekPlan to change meal status from 'suggested' to 'accepted'
    setWeekPlan(prevWeek => {
      const updatedDays = [...prevWeek.days];

      // Find the day
      const dayIndex = updatedDays.findIndex(
        d => d.dayName.toLowerCase() === meal.day?.toLowerCase()
      );

      if (dayIndex !== -1 && meal.mealType) {
        // Find the meal slot
        const mealSlotIndex = updatedDays[dayIndex].meals.findIndex(
          m => m.mealType === meal.mealType.toLowerCase()
        );

        if (mealSlotIndex !== -1) {
          // Update status to 'accepted'
          updatedDays[dayIndex].meals[mealSlotIndex] = {
            ...updatedDays[dayIndex].meals[mealSlotIndex],
            status: 'accepted',
          };

          // Update day status
          const allMealsAccepted = updatedDays[dayIndex].meals.every(
            m => m.status === 'accepted' || m.status === 'completed'
          );
          if (allMealsAccepted) {
            updatedDays[dayIndex].status = 'approved';
          }

          logger.info('Updated meal status to accepted', {
            metadata: {
              day: updatedDays[dayIndex].dayName,
              mealType: meal.mealType
            }
          });
        }
      }

      // Recalculate completion
      const completion = calculateCompletion(updatedDays);

      return {
        ...prevWeek,
        days: updatedDays,
        completionPercentage: completion,
      };
    });
  };

  const handleDayApproved = (approvedDay: string, nextDay: string | null) => {
    logger.info(`Day approved: ${approvedDay}, Next day: ${nextDay}`);

    // Update all meals for the approved day to 'accepted' status
    setWeekPlan(prevWeek => {
      const updatedDays = [...prevWeek.days];
      const dayIndex = updatedDays.findIndex(
        d => d.dayName.toLowerCase() === approvedDay.toLowerCase()
      );

      if (dayIndex !== -1) {
        // Mark all meals as accepted
        updatedDays[dayIndex].meals = updatedDays[dayIndex].meals.map(m => ({
          ...m,
          status: m.meal ? 'accepted' : m.status,
        }));
        updatedDays[dayIndex].status = 'approved';
      }

      const completion = calculateCompletion(updatedDays);

      return {
        ...prevWeek,
        days: updatedDays,
        completionPercentage: completion,
      };
    });

    if (nextDay) {
      // Automatically generate next day's meals
      setTimeout(() => {
        handleSend(`Generate ${nextDay}'s meals (breakfast, lunch, dinner)`);
      }, 1500); // Small delay for better UX
    } else {
      // All days completed!
      setSnackbarMessage('🎉 Congratulations! Your full week meal plan is complete!');
    }
  };

  const setSnackbarMessage = (message: string) => {
    setError(message);
  };

  // Canvas handlers
  const handleDaySelect = (dayName: DayName) => {
    logger.info('Day selected in canvas', { metadata: { dayName } });
    setSelectedDay(dayName);
    // Auto-send message to plan that day
    handleSend(`Let's plan ${dayName}'s meals`);
  };

  const handleMealClick = (day: DayName, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    logger.info('Meal slot clicked', { metadata: { day, mealType } });
    // Auto-send message to plan specific meal
    handleSend(`Suggest a ${mealType} for ${day}`);
  };

  const handleCanvasToggle = () => {
    setCanvasVisible(!canvasVisible);
  };

  // Culinary Spectrum aurora colors for consistency
  const auroraColors = mode === 'dark'
    ? ['#FF6B35', '#F4A460', '#6A4C93', '#05AF5C', '#FFD93D']
    : ['#FFDDC1', '#FFEDBC', '#E8D5F2', '#C1F7DC', '#FFF9D6'];

  return (
    <AuroraBackground colors={auroraColors} speed={20}>
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          onClose={() => setError(null)}
          role="status"
          aria-live="polite"
          sx={{
            borderRadius: 'var(--radius-md)',
            bgcolor: 'rgba(255, 167, 38, 0.1)',
            border: '1px solid rgba(255, 167, 38, 0.3)',
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Two-column layout: Chat + Canvas */}
      <Box sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Chat Area */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: isMobile ? '100%' : '1200px',
          mx: 'auto',
          width: '100%',
        }}>

        {/* Messages Area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: { xs: 2, md: 6 }, pt: 4, pb: 20 }}>
          {/* Quick Action Chips - Show at the start */}
          {showQuickActions && messages.length === 1 && (
            <QuickActionChips
              onActionClick={handleQuickAction}
              contextualPrompts={generateContextualPrompts({
                // TODO: Add real data when available
                hasMealPlan: false,
                hasShoppingList: false,
                expiringItemsCount: 0,
                upcomingMealsCount: 0,
              })}
            />
          )}

          <List role="log" aria-live="polite" aria-label="Chat messages">
            <AnimatePresence>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  component={motion.li}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    mb: 3,
                    px: 0
                  }}
                >
                  <Box sx={{
                    display: 'flex',
                    flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 2,
                    maxWidth: { xs: '90%', md: '70%' }
                  }}>
                    {message.sender === 'user' ? (
                      <Avatar
                        component={motion.div}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        sx={{
                          background: 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)',
                          boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-bounce)'
                        }}
                      >
                        <Person />
                      </Avatar>
                    ) : (
                      <NoraAvatar
                        size="medium"
                        state="idle"
                        showChefHat
                        animated
                      />
                    )}

                    <Box sx={{ width: '100%' }}>
                      {/* Chat Bubble - Only for non-meal-plan messages or intro text */}
                      {!(message.sender === 'ai' && message.isMealPlan) && (
                        <GlassCard
                          intensity={message.sender === 'user' ? 'ultra' : 'ultra'}
                          sx={{
                            p: 2.5,
                            borderRadius: message.sender === 'user'
                              ? 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)'
                              : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                            background: message.sender === 'user'
                              ? 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)'
                              : mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(0, 0, 0, 0.1)',
                            boxShadow: message.sender === 'user'
                              ? '0 8px 32px rgba(255, 107, 53, 0.3)'
                              : 'none',
                            mb: 2
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              color: message.sender === 'user' ? 'var(--pure-white)' : mode === 'dark' ? 'white' : '#000000',
                              lineHeight: 1.6
                            }}
                          >
                            {message.text}
                          </Typography>
                        </GlassCard>
                      )}

                      {/* Meal Plan Display - Rendered OUTSIDE chat bubble */}
                      {message.sender === 'ai' && message.isMealPlan && (
                        <Box sx={{ width: '100%', mt: 2 }}>
                          <MealPlanDisplay
                            mealPlan={parseMealPlan(message.text)}
                            onDayApproved={handleDayApproved}
                            onMealAccepted={handleMealAccepted}
                          />
                        </Box>
                      )}

                      {/* Message Reactions and TTS - Only for AI messages */}
                      {message.sender === 'ai' && message.id !== '1' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          {/* Speaker Button */}
                          <Tooltip title={isSpeaking && speakingMessageId === message.id ? 'Stop speaking' : 'Listen to Nora'} arrow placement="top">
                            <IconButton
                              onClick={() => handleSpeak(message.id, message.text)}
                              size="small"
                              sx={{
                                color: isSpeaking && speakingMessageId === message.id
                                  ? 'var(--chef-orange)'
                                  : mode === 'dark'
                                  ? 'rgba(255,255,255,0.5)'
                                  : 'rgba(0,0,0,0.4)',
                                transition: 'all var(--transition-normal)',
                                '&:hover': {
                                  color: 'var(--chef-orange)',
                                  bgcolor: 'rgba(255, 107, 53, 0.1)',
                                },
                              }}
                              aria-label={isSpeaking && speakingMessageId === message.id ? 'Stop speaking' : 'Listen to Nora read this message'}
                            >
                              {isSpeaking && speakingMessageId === message.id ? (
                                <Box component={motion.div} sx={{ display: 'flex', alignItems: 'center' }}>
                                  <VolumeOff fontSize="small" />
                                  {/* Sound wave animation */}
                                  <Box sx={{ display: 'flex', gap: '2px', ml: 0.5, alignItems: 'center' }}>
                                    {[0, 1, 2].map((i) => (
                                      <Box
                                        key={i}
                                        component={motion.div}
                                        animate={{
                                          scaleY: [1, 2.5, 1],
                                        }}
                                        transition={{
                                          duration: 0.5,
                                          repeat: Infinity,
                                          delay: i * 0.12,
                                          ease: 'easeInOut',
                                        }}
                                        sx={{
                                          width: 2,
                                          height: 6,
                                          borderRadius: '1px',
                                          bgcolor: 'var(--chef-orange)',
                                          transformOrigin: 'center',
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              ) : (
                                <VolumeUp fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>

                          {/* Message Reactions - non-meal-plan only */}
                          {!message.isMealPlan && (
                            <MessageReactions
                              messageId={message.id}
                              messageText={message.text}
                              onReaction={handleReaction}
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </AnimatePresence>

            {isTyping && (
              <Box sx={{ display: 'flex', gap: 2, ml: 2, mt: 2, alignItems: 'center' }}>
                 <NoraAvatar size="small" state="thinking" showChefHat animated />
                 <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>Nora is thinking...</Typography>
              </Box>
            )}
            <div ref={bottomRef} />
          </List>
        </Box>

        {/* Floating Input - Positioned ABOVE the Nav Dock */}
        <Box sx={{
          position: 'fixed',
          bottom: { xs: 100, md: 120 }, // Clears the nav dock
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '800px',
          px: 2,
          zIndex: 10
        }}>
          <GlassCard intensity="ultra" sx={{
            p: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderRadius: 'var(--radius-full)',
            boxShadow: mode === 'dark'
              ? '0 20px 40px rgba(0,0,0,0.4)'
              : '0 20px 40px rgba(0,0,0,0.2)',
            border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
          }}>
            {hasRecognitionSupport && (
              <Tooltip
                title={isListening ? 'Stop recording' : 'Start voice input'}
                arrow
                placement="top"
              >
                <Box
                  component={motion.div}
                  animate={isListening ? {
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  sx={{ position: 'relative', display: 'flex' }}
                >
                  {/* Glowing Ring Effect - Only when listening */}
                  {isListening && (
                    <Box
                      component={motion.div}
                      animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.6, 0, 0.6],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        border: '3px solid var(--chef-orange)',
                        pointerEvents: 'none',
                        zIndex: 0,
                      }}
                    />
                  )}

                  <IconButton
                    onClick={handleVoiceToggle}
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      color: isListening ? 'var(--chef-orange)' : mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      bgcolor: isListening
                        ? 'rgba(255, 107, 53, 0.15)'
                        : mode === 'dark'
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.05)',
                      transition: 'all var(--transition-normal)',
                      '&:hover': {
                        bgcolor: isListening
                          ? 'rgba(255, 107, 53, 0.25)'
                          : mode === 'dark'
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.1)',
                        color: isListening ? 'var(--chef-orange)' : 'var(--chef-orange)',
                        transform: 'scale(1.1)',
                      },
                    }}
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  >
                    {isListening ? <MicOff /> : <Mic />}
                  </IconButton>

                  {/* Voice Wave Indicator - Only when listening */}
                  {isListening && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -2,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 0.3,
                        alignItems: 'flex-end',
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <Box
                          key={i}
                          component={motion.div}
                          animate={{
                            scaleY: [1, 2, 1],
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: 'easeInOut',
                          }}
                          sx={{
                            width: 2,
                            height: 3,
                            borderRadius: 'var(--radius-sm)',
                            bgcolor: 'var(--chef-orange)',
                            transformOrigin: 'bottom',
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Tooltip>
            )}
            <TextField
              fullWidth
              variant="standard"
              placeholder={isListening ? 'Listening...' : 'Ask for a meal plan...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              InputProps={{
                disableUnderline: true,
                sx: { color: mode === 'dark' ? 'white' : '#000000', fontSize: '1.1rem' }
              }}
              sx={{
                flex: 1,
                '& ::placeholder': {
                  color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                },
              }}
              aria-label="Chat message input"
            />
            <Tooltip title="Send message" arrow placement="top">
              <span>
                <IconButton
                  component={motion.button}
                  whileHover={{ scale: input.trim() ? 1.1 : 1 }}
                  whileTap={{ scale: input.trim() ? 0.9 : 1 }}
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  sx={{
                    bgcolor: input.trim()
                      ? 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)'
                      : mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.05)',
                    color: input.trim() ? 'var(--pure-white)' : mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                    background: input.trim()
                      ? 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)'
                      : undefined,
                    boxShadow: input.trim() ? '0 4px 12px rgba(255, 107, 53, 0.3)' : 'none',
                    transition: 'all var(--transition-normal)',
                    '&:hover': {
                      background: input.trim()
                        ? 'linear-gradient(135deg, #FF8C5A 0%, var(--chef-orange) 100%)'
                        : mode === 'dark'
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.1)',
                      boxShadow: input.trim() ? '0 6px 16px rgba(255, 107, 53, 0.4)' : 'none',
                    },
                    '&:disabled': {
                      opacity: 0.4,
                      cursor: 'not-allowed',
                    },
                  }}
                  aria-label="Send message"
                >
                  <Send fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </GlassCard>
        </Box>
        </Box>

        {/* Meal Plan Canvas - Desktop sidebar or Mobile drawer */}
        <MealPlanCanvas
          weekPlan={weekPlan}
          onDaySelect={handleDaySelect}
          onMealClick={handleMealClick}
          isVisible={canvasVisible}
          onClose={() => setCanvasVisible(false)}
        />
      </Box>

      {/* Floating Action Button - Mobile only */}
      {isMobile && !canvasVisible && (
        <Tooltip title="Open Meal Plan Canvas" arrow placement="left">
          <Fab
            onClick={handleCanvasToggle}
            sx={{
              position: 'fixed',
              bottom: { xs: 180, md: 200 },
              right: 24,
              background: 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.4)',
              transition: 'all var(--transition-normal)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FF8C5A 0%, var(--chef-orange) 100%)',
                transform: 'scale(1.1)',
                boxShadow: '0 12px 32px rgba(255, 107, 53, 0.5)',
              },
            }}
            aria-label="Open meal plan canvas"
          >
            <CalendarMonth />
          </Fab>
        </Tooltip>
      )}
    </AuroraBackground>
  );
};

export default ChatPage;
