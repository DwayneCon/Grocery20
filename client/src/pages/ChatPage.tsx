import { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, List, ListItem, Avatar, Typography, CircularProgress } from '@mui/material';
import { Send, SmartToy, Person, Mic } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import { sanitizeAIContent, sanitizeInput } from '../utils/sanitize';

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
      text: "Greetings, Chef. I'm ready to design your perfect meal plan. What are you in the mood for?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      text: sanitizeInput(input),
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI latency + stream effect
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "I can certainly help with that. Based on your household preferences, I'd suggest...",
        sender: 'ai',
        timestamp: new Date(),
      }]);
    }, 1500);
  };

  return (
    <AuroraBackground colors={['#2C3E50', '#4CA1AF', '#000000']} speed={25}>
      <Box sx={{
        height: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '1000px',
        mx: 'auto',
        pt: 2,
        position: 'relative',
        zIndex: 2
      }}>

        {/* Chat Container */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: { xs: 2, md: 4 }, pb: 12 }}>
          <List>
            <AnimatePresence>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  component={motion.li}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 100 }}
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
                    maxWidth: '85%'
                  }}>
                    <Avatar sx={{
                      bgcolor: message.sender === 'user' ? 'primary.main' : 'transparent',
                      border: message.sender === 'ai' ? '1px solid rgba(255,255,255,0.3)' : 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                      {message.sender === 'user' ? <Person /> : <SmartToy sx={{ color: '#4ECDC4' }} />}
                    </Avatar>

                    <GlassCard
                      intensity={message.sender === 'user' ? 'strong' : 'medium'}
                      sx={{
                        p: 2.5,
                        borderRadius: message.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: message.sender === 'user'
                          ? 'linear-gradient(135deg, rgba(132, 94, 194, 0.8), rgba(132, 94, 194, 0.4))'
                          : 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ color: 'white', lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={
                          message.sender === 'ai'
                            ? { __html: sanitizeAIContent(message.text) }
                            : undefined
                        }
                      >
                        {message.sender === 'user' && message.text}
                      </Typography>
                    </GlassCard>
                  </Box>
                </ListItem>
              ))}
            </AnimatePresence>

            {isTyping && (
              <Box sx={{ display: 'flex', gap: 2, ml: 2, mt: 2 }}>
                 <CircularProgress size={20} thickness={5} sx={{ color: '#4ECDC4' }} />
                 <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>AI is thinking...</Typography>
              </Box>
            )}
            <div ref={bottomRef} />
          </List>
        </Box>

        {/* Floating Input Area */}
        <Box sx={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          px: { xs: 2, md: 4 }
        }}>
          <GlassCard intensity="strong" sx={{
            p: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderRadius: '50px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
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
                bgcolor: input.trim() ? 'primary.main' : 'rgba(255,255,255,0.1)',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
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
