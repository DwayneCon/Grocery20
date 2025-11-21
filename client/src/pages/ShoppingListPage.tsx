/* client/src/pages/ShoppingListPage.tsx */
import { useState } from 'react';
import { Box, Typography, Button, Grid, IconButton } from '@mui/material';
import { Share, Add, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import { sanitizeText } from '../utils/sanitize';
import { useTheme } from '../contexts/ThemeContext';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

const ShoppingListPage = () => {
  const { mode } = useTheme();
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: '1', name: 'Chicken Breast', quantity: '2 lbs', category: 'Meat & Seafood', checked: false },
    { id: '2', name: 'Fresh Salmon', quantity: '1 lb', category: 'Meat & Seafood', checked: false },
    { id: '3', name: 'Romaine Lettuce', quantity: '1 head', category: 'Produce', checked: false },
    { id: '4', name: 'Avocados', quantity: '3', category: 'Produce', checked: true },
    { id: '5', name: 'Oat Milk', quantity: '1 gal', category: 'Dairy', checked: false },
  ]);

  const handleToggle = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const categories = Array.from(new Set(items.map(item => item.category || 'Uncategorized')));

  // Theme-aware aurora colors - Vibrant 5-color gradient
  const auroraColors = mode === 'dark'
    ? ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']
    : ['#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ff9a9e'];

  return (
    <AuroraBackground colors={auroraColors} speed={20}>
      <Box sx={{ p: { xs: 2, md: 6 }, maxWidth: '1200px', mx: 'auto', position: 'relative', zIndex: 2 }}>

        {/* Header */}
        <GlassCard intensity="medium" sx={{ mb: 6, p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" fontWeight="800" sx={{ color: 'white' }}>Shopping List</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {items.filter(i => !i.checked).length} items remaining
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Share />}
            sx={{ bgcolor: 'white', color: 'black', borderRadius: 4, fontWeight: 'bold', px: 3, '&:hover': { bgcolor: '#f0f0f0' } }}
          >
            Share
          </Button>
        </GlassCard>

        {/* Categories Grid */}
        <Grid container spacing={4}>
          {categories.map((category) => (
            <Grid size={{ xs: 12, md: 6 }} key={category}>
              <GlassCard intensity="light" sx={{ p: 0, overflow: 'hidden', height: '100%' }}>
                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#4ECDC4' }}>
                    {sanitizeText(category)}
                  </Typography>
                </Box>

                <Box sx={{ p: 2 }}>
                  <AnimatePresence>
                    {items.filter(item => item.category === category).map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Box
                          onClick={() => handleToggle(item.id)}
                          sx={{
                            p: 2,
                            mb: 1,
                            borderRadius: 3,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            bgcolor: item.checked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.1)',
                            transition: 'all 0.2s ease',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
                          }}
                        >
                          <IconButton size="small" sx={{ color: item.checked ? '#4ECDC4' : 'rgba(255,255,255,0.5)' }}>
                            {item.checked ? <CheckCircle /> : <RadioButtonUnchecked />}
                          </IconButton>
                          <Box sx={{ flex: 1, opacity: item.checked ? 0.5 : 1, textDecoration: item.checked ? 'line-through' : 'none' }}>
                            <Typography variant="body1" fontWeight="500" sx={{ color: 'white' }}>
                              {sanitizeText(item.name)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              {sanitizeText(item.quantity)}
                            </Typography>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* Floating Add Button */}
        <IconButton
          sx={{
            position: 'fixed', bottom: 100, right: 32,
            width: 64, height: 64,
            bgcolor: '#4ECDC4', color: 'white',
            boxShadow: '0 10px 30px rgba(78, 205, 196, 0.4)',
            '&:hover': { bgcolor: '#3dbdb6', transform: 'scale(1.1)' },
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            zIndex: 100
          }}
        >
          <Add sx={{ fontSize: 32 }} />
        </IconButton>

      </Box>
    </AuroraBackground>
  );
};

export default ShoppingListPage;
