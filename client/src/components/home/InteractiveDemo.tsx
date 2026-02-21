/* client/src/components/home/InteractiveDemo.tsx */
import { useState } from 'react';
import { Box, Typography, TextField, IconButton, Chip } from '@mui/material';
import { Send, PlayArrow } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import NoraAvatar from '../common/NoraAvatar';
import { useTheme } from '../../contexts/ThemeContext';

interface DemoMessage {
  id: string;
  text: string;
  sender: 'user' | 'nora';
}

/**
 * InteractiveDemo - Live demonstration of chatting with Nora
 *
 * Features:
 * - Simulated conversation flow
 * - Quick prompt suggestions
 * - Animated message display
 * - Visual meal card responses
 */
const InteractiveDemo = () => {
  const { mode } = useTheme();
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [demoStarted, setDemoStarted] = useState(false);

  const quickPrompts = [
    "Plan healthy meals for this week",
    "Quick dinner under 30 minutes",
    "Budget-friendly meal ideas",
  ];

  const demoResponses: Record<string, string> = {
    "Plan healthy meals for this week": `Great! I'd love to help you plan a healthy week. Let me suggest:

**Monday** 🥗
Grilled Salmon with Quinoa & Roasted Vegetables
⏱️ 35 min | 💰 $8/serving

**Tuesday** 🍜
Mediterranean Chickpea Bowl with Tahini Dressing
⏱️ 25 min | 💰 $6/serving

**Wednesday** 🍗
Herb-Crusted Chicken Breast with Sweet Potato Mash
⏱️ 40 min | 💰 $7/serving

Would you like me to add these to your meal plan?`,

    "Quick dinner under 30 minutes": `Perfect! Here are 3 delicious options under 30 minutes:

🍝 **Garlic Shrimp Pasta**
Fresh linguine, garlic butter sauce, cherry tomatoes
⏱️ 20 min | 💰 $9/serving

🥙 **Chicken Fajita Bowls**
Seasoned chicken, peppers, onions, cilantro rice
⏱️ 25 min | 💰 $7/serving

🍲 **Thai Curry Noodles**
Rice noodles, coconut curry, vegetables, lime
⏱️ 18 min | 💰 $6/serving

Which sounds good to you?`,

    "Budget-friendly meal ideas": `I've got fantastic budget-friendly options for you!

💰 **Under $5 per serving:**

🍛 Bean & Rice Burrito Bowl - $3.50/serving
🍝 Tomato Basil Pasta - $2.80/serving
🥚 Veggie Egg Fried Rice - $3.20/serving
🌮 Black Bean Tacos - $2.50/serving

These meals are nutritious, filling, and easy on your wallet. Want detailed recipes?`,
  };

  const handleStartDemo = () => {
    setDemoStarted(true);
    setMessages([
      {
        id: '1',
        text: "Hi! I'm Nora, your AI culinary assistant. 👋 Ask me anything about meal planning!",
        sender: 'nora',
      },
    ]);
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    // Add user message
    const userMsg: DemoMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate Nora's response
    setTimeout(() => {
      setIsTyping(false);
      const response = demoResponses[messageText] ||
        `That's a great question! In the full app, I can help you with personalized meal plans, shopping lists, budget tracking, and more. Try one of the suggested prompts to see a demo response!`;

      const noraMsg: DemoMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'nora',
      };
      setMessages(prev => [...prev, noraMsg]);
    }, 1500);
  };

  if (!demoStarted) {
    return (
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        sx={{
          textAlign: 'center',
          py: { xs: 8, md: 12 },
          px: { xs: 2, md: 4 },
        }}
      >
        <Typography
          variant="h2"
          fontWeight="900"
          gutterBottom
          sx={{
            fontSize: { xs: '2rem', md: '3rem' },
            background: mode === 'dark'
              ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
              : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          See Nora in Action
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            maxWidth: '700px',
            mx: 'auto',
            mb: 4,
          }}
        >
          Try our interactive demo to see how Nora plans meals, manages budgets, and creates shopping lists
        </Typography>

        <GlassCard
          intensity="ultra"
          sx={{
            maxWidth: '800px',
            mx: 'auto',
            p: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <NoraAvatar size="xlarge" state="cooking" showChefHat animated />

          <Typography variant="h5" fontWeight="600">
            Chat with Nora
          </Typography>

          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleStartDemo}
            sx={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FF8C5A 0%, var(--chef-orange) 100%)',
                boxShadow: '0 12px 32px rgba(255, 107, 53, 0.5)',
              },
            }}
          >
            <PlayArrow sx={{ fontSize: 48 }} />
          </IconButton>

          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Click to start the demo
          </Typography>
        </GlassCard>
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        py: { xs: 6, md: 10 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Typography
        variant="h2"
        fontWeight="900"
        textAlign="center"
        gutterBottom
        sx={{
          fontSize: { xs: '2rem', md: '3rem' },
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
            : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 4,
        }}
      >
        Interactive Demo
      </Typography>

      <GlassCard
        intensity="ultra"
        sx={{
          maxWidth: '900px',
          mx: 'auto',
          height: '600px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <AnimatePresence>
            {messages.map((message) => (
              <Box
                key={message.id}
                component={motion.div}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-start',
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                }}
              >
                {message.sender === 'nora' && (
                  <NoraAvatar size="small" state="idle" showChefHat animated={false} />
                )}

                <Box
                  sx={{
                    maxWidth: '70%',
                    p: 2,
                    borderRadius: message.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: message.sender === 'user'
                      ? 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)'
                      : mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.05)',
                    color: message.sender === 'user'
                      ? 'white'
                      : mode === 'dark' ? 'white' : '#000000',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {message.text}
                  </Typography>
                </Box>
              </Box>
            ))}
          </AnimatePresence>

          {isTyping && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <NoraAvatar size="small" state="thinking" showChefHat animated />
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Nora is thinking...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              px: 3,
              pb: 2,
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {quickPrompts.map((prompt) => (
              <Chip
                key={prompt}
                label={prompt}
                onClick={() => handleSendMessage(prompt)}
                sx={{
                  bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: mode === 'dark' ? 'white' : '#000000',
                  '&:hover': {
                    bgcolor: 'rgba(255, 107, 53, 0.2)',
                  },
                }}
              />
            ))}
          </Box>
        )}

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            fullWidth
            variant="standard"
            placeholder="Try asking about meal planning..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            InputProps={{
              disableUnderline: true,
              sx: {
                color: mode === 'dark' ? 'white' : '#000000',
                fontSize: '1rem',
              },
            }}
          />
          <IconButton
            onClick={() => handleSendMessage()}
            disabled={!input.trim()}
            sx={{
              background: input.trim()
                ? 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)'
                : mode === 'dark'
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.05)',
              color: input.trim() ? 'white' : mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              '&:hover': {
                background: input.trim()
                  ? 'linear-gradient(135deg, #FF8C5A 0%, var(--chef-orange) 100%)'
                  : mode === 'dark'
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.1)',
              },
              '&:disabled': {
                opacity: 0.3,
              },
            }}
          >
            <Send />
          </IconButton>
        </Box>
      </GlassCard>
    </Box>
  );
};

export default InteractiveDemo;
