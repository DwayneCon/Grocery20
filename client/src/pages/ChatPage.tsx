/* client/src/pages/ChatPage.tsx */
import { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, List, ListItem, Avatar, Typography, CircularProgress, Alert, Snackbar } from '@mui/material';
import { Send, SmartToy, Person, Mic } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import { sanitizeAIContent, sanitizeInput } from '../utils/sanitize';
import { aiService, ConversationMessage } from '../services/aiService';

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const sanitizedInput = sanitizeInput(input);
    const userMsg: Message = {
      id: Date.now().toString(),
      text: sanitizedInput,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setError(null);

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

  return (
    <AuroraBackground colors={['#2C3E50', '#4CA1AF', '#000000']} speed={25}>
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
          <List>
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
                      bgcolor: message.sender === 'user' ? 'primary.main' : 'transparent',
                      border: message.sender === 'ai' ? '1px solid rgba(255,255,255,0.3)' : 'none',
                    }}>
                      {message.sender === 'user' ? <Person /> : <SmartToy sx={{ color: '#4ECDC4' }} />}
                    </Avatar>

                    <GlassCard
                      intensity={message.sender === 'user' ? 'strong' : 'medium'}
                      sx={{
                        p: 2.5,
                        borderRadius: message.sender === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                        background: message.sender === 'user'
                          ? 'linear-gradient(135deg, rgba(78, 205, 196, 0.8), rgba(44, 62, 80, 0.8))'
                          : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Typography variant="body1" sx={{ color: 'white', lineHeight: 1.6 }}>
                        {message.text}
                      </Typography>
                    </GlassCard>
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
            <IconButton sx={{ color: '#4ECDC4' }}>
              <Mic />
            </IconButton>
            <TextField
              fullWidth
              variant="standard"
              placeholder="Ask for a meal plan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              InputProps={{
                disableUnderline: true,
                sx: { color: 'white', fontSize: '1.1rem' }
              }}
              sx={{ flex: 1 }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim()}
              sx={{
                bgcolor: input.trim() ? '#4ECDC4' : 'rgba(255,255,255,0.1)',
                color: input.trim() ? 'black' : 'white',
                '&:hover': { bgcolor: '#45b7af' },
                transition: 'all 0.2s'
              }}
            >
              <Send fontSize="small" />
            </IconButton>
          </GlassCard>
        </Box>
      </Box>
    </AuroraBackground>
  );
};

export default ChatPage;
