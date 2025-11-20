/* client/src/pages/ShoppingListPage.tsx */
import { useState } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { Share, Add, CheckCircle } from '@mui/icons-material';
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
      <Box sx={{ p: { xs: 2, md: 6 }, position: 'relative', zIndex: 2, maxWidth: '100%', mx: 'auto' }}>

        <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
             <Typography variant="h2" fontWeight="800" sx={{ color: 'white' }}>Shopping List</Typography>
             <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
               {items.filter(i => !i.checked).length} items remaining
             </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Share />}
            sx={{ bgcolor: 'white', color: 'black', borderRadius: 4, px: 3, fontWeight: 'bold' }}
          >
            Share
          </Button>
        </Box>

        <Grid container spacing={4}>
          {categories.map((category, i) => (
            <Grid item xs={12} md={6} lg={4} key={category}>
              <GlassCard
                intensity="medium"
                component={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                sx={{ height: '100%', p: 0, overflow: 'hidden', borderRadius: '24px' }}
              >
                <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#4ECDC4' }}>
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
                            color: item.checked ? '#4ECDC4' : 'rgba(0,0,0,0.3)',
                            display: 'flex'
                          }}>
                            <CheckCircle />
                          </Box>
                          <Box>
                            <Typography
                              variant="body1"
                              fontWeight="600"
                              sx={{
                                textDecoration: item.checked ? 'line-through' : 'none',
                                color: item.checked ? 'text.disabled' : 'text.primary'
                              }}
                            >
                              {sanitizeText(item.name)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">
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

        {/* Floating Add Button */}
        <Box sx={{ position: 'fixed', bottom: { xs: 100, md: 48 }, right: { xs: 24, md: 48 }, zIndex: 10 }}>
           <Button
            variant="contained"
            sx={{
              borderRadius: '50%',
              width: 64,
              height: 64,
              minWidth: 0,
              bgcolor: '#4ECDC4',
              boxShadow: '0 8px 32px rgba(78, 205, 196, 0.4)',
              '&:hover': { bgcolor: '#45b7af' }
            }}
          >
            <Add sx={{ fontSize: 32 }} />
          </Button>
        </Box>

      </Box>
    </AuroraBackground>
  );
};

export default ShoppingListPage;
