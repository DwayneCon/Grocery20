/* client/src/pages/ChatPage.tsx */
import { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, List, ListItem, Avatar, Typography, CircularProgress, Alert, Snackbar, Tooltip } from '@mui/material';
import { Send, SmartToy, Person, Mic, MicOff } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import { sanitizeAIContent, sanitizeInput } from '../utils/sanitize';
import { aiService, ConversationMessage } from '../services/aiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import QuickActionChips from '../components/chat/QuickActionChips';
import MessageReactions from '../components/chat/MessageReactions';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Greetings. I'm NutriAI, your culinary companion. I'm ready to design your perfect meal plan. What are you craving today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

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
      // Build conversation history for context
      const conversationHistory: ConversationMessage[] = messages
        .filter(msg => msg.id !== '1') // Exclude initial greeting
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      // Call AI chat endpoint
      const response = await aiService.chat({
        message: sanitizedInput,
        conversationHistory
      });

      setIsTyping(false);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: sanitizeAIContent(response.response),
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);

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
    console.log('Reaction:', messageId, reaction);
    // You can implement reaction tracking here
  };

  return (
    <AuroraBackground colors={['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']} speed={25}>
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '1200px',
        mx: 'auto',
        position: 'relative',
        zIndex: 2
      }}>

        {/* Messages Area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: { xs: 2, md: 6 }, pt: 4, pb: 20 }}>
          {/* Quick Action Chips - Show at the start */}
          {showQuickActions && messages.length === 1 && (
            <QuickActionChips onActionClick={handleQuickAction} />
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
                    <Avatar sx={{
                      bgcolor: message.sender === 'user' ? '#4ECDC4' : 'rgba(255,255,255,0.05)',
                      border: message.sender === 'ai' ? '1px solid rgba(255,255,255,0.3)' : 'none',
                    }}>
                      {message.sender === 'user' ? <Person /> : <SmartToy sx={{ color: '#4ECDC4' }} />}
                    </Avatar>

                    <Box>
                      <GlassCard
                        intensity={message.sender === 'user' ? 'ultra' : 'ultra'}
                        sx={{
                          p: 2.5,
                          borderRadius: message.sender === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                          background: message.sender === 'user'
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'rgba(255, 255, 255, 0.1)',
                          boxShadow: message.sender === 'user'
                            ? '0 8px 32px rgba(102, 126, 234, 0.3)'
                            : 'none'
                        }}
                      >
                        <Typography variant="body1" sx={{ color: 'white', lineHeight: 1.6 }}>
                          {message.text}
                        </Typography>
                      </GlassCard>

                      {/* Message Reactions - Only for AI messages */}
                      {message.sender === 'ai' && message.id !== '1' && (
                        <MessageReactions
                          messageId={message.id}
                          messageText={message.text}
                          onReaction={handleReaction}
                        />
                      )}
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </AnimatePresence>

            {isTyping && (
              <Box sx={{ display: 'flex', gap: 2, ml: 2, mt: 2, alignItems: 'center' }}>
                 <CircularProgress size={16} thickness={5} sx={{ color: '#4ECDC4' }} />
                 <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>AI is thinking...</Typography>
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
            borderRadius: '50px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            {hasRecognitionSupport && (
              <Tooltip title={isListening ? 'Stop recording' : 'Start voice input'} arrow>
                <IconButton
                  onClick={handleVoiceToggle}
                  sx={{
                    color: isListening ? '#FF6B6B' : '#4ECDC4',
                    animation: isListening ? 'pulse 1.5s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  {isListening ? <MicOff /> : <Mic />}
                </IconButton>
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
                sx: { color: 'white', fontSize: '1.1rem' }
              }}
              sx={{ flex: 1 }}
              aria-label="Chat message input"
            />
            <Tooltip title="Send message" arrow>
              <IconButton
                onClick={() => handleSend()}
                disabled={!input.trim()}
                sx={{
                  bgcolor: input.trim() ? '#4ECDC4' : 'rgba(255,255,255,0.1)',
                  color: input.trim() ? 'black' : 'white',
                  '&:hover': { bgcolor: input.trim() ? '#45b7af' : 'rgba(255,255,255,0.15)' },
                  transition: 'all 0.2s',
                  '&:disabled': { opacity: 0.5 }
                }}
                aria-label="Send message"
              >
                <Send fontSize="small" />
              </IconButton>
            </Tooltip>
          </GlassCard>
        </Box>
      </Box>
    </AuroraBackground>
  );
};

export default ChatPage;
