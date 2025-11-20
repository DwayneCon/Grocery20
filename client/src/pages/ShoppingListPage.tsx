import { useState } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { Share, Add } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import NeuroCard from '../components/common/NeuroCard';
import GlassCard from '../components/common/GlassCard';
import { sanitizeText } from '../utils/sanitize';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

const ShoppingListPage = () => {
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: '1', name: 'Chicken Breast', quantity: '2 lbs', category: 'Meat & Seafood', checked: false },
    { id: '2', name: 'Fresh Salmon', quantity: '1 lb', category: 'Meat & Seafood', checked: false },
    { id: '3', name: 'Romaine Lettuce', quantity: '1 head', category: 'Produce', checked: false },
    { id: '4', name: 'Avocados', quantity: '3', category: 'Produce', checked: true },
    { id: '5', name: 'Oat Milk', quantity: '1 gal', category: 'Dairy & Alternatives', checked: false },
  ]);

  const handleToggle = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const categories = Array.from(new Set(items.map(item => item.category)));

  return (
    <AuroraBackground colors={['#C7F464', '#4ECDC4', '#556270']} speed={20}>
      <Box sx={{ p: { xs: 2, md: 4 }, position: 'relative', zIndex: 2, maxWidth: '1200px', mx: 'auto' }}>

        {/* Header */}
        <GlassCard intensity="medium" sx={{ mb: 6, p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" fontWeight="800" sx={{ color: 'white' }}>Shopping List</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {items.filter(i => !i.checked).length} items remaining
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Share />}
            sx={{ bgcolor: 'white', color: 'black', borderRadius: 4, fontWeight: 'bold', '&:hover': { bgcolor: '#f0f0f0' } }}
          >
            Share
          </Button>
        </GlassCard>

        {/* Masonry Grid of Categories */}
        <Grid container spacing={4}>
          {categories.map((category) => (
            <Grid item xs={12} md={6} key={category}>
              <GlassCard intensity="light" sx={{ height: '100%', p: 0, overflow: 'hidden' }}>
                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                    {sanitizeText(category)}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <AnimatePresence>
                    {items.filter(item => item.category === category).map((item) => (
                      <NeuroCard
                        key={item.id}
                        pressed={item.checked}
                        onClick={() => handleToggle(item.id)}
                        sx={{
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: item.checked ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.9)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: item.checked ? '#4ECDC4' : 'text.secondary',
                            bgcolor: item.checked ? '#4ECDC4' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {item.checked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: 'white' }}>✓</motion.div>}
                          </Box>
                          <Box>
                            <Typography
                              variant="body1"
                              fontWeight="500"
                              sx={{
                                textDecoration: item.checked ? 'line-through' : 'none',
                                color: item.checked ? 'text.disabled' : 'text.primary'
                              }}
                            >
                              {sanitizeText(item.name)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {sanitizeText(item.quantity)}
                            </Typography>
                          </Box>
                        </Box>
                      </NeuroCard>
                    ))}
                  </AnimatePresence>
                </Box>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* Floating Action Button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 10 }}
        >
          <Button
            variant="contained"
            color="secondary"
            sx={{
              borderRadius: '50%',
              width: 64,
              height: 64,
              minWidth: 0,
              boxShadow: '0 8px 32px rgba(255, 107, 107, 0.4)'
            }}
          >
            <Add sx={{ fontSize: 32 }} />
          </Button>
        </motion.div>

      </Box>
    </AuroraBackground>
  );
};

export default ShoppingListPage;
