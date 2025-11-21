/* client/src/pages/ShoppingListPage.tsx */
import { useState } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';

import { Share, Add } from '@mui/icons-material';
import { motion } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import SwipeableShoppingItem from '../components/shopping/SwipeableShoppingItem';
import StoreSelector from '../components/shopping/StoreSelector';
import { sanitizeText } from '../utils/sanitize';
import { useTheme } from '../contexts/ThemeContext';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
  price?: number;
  store?: string;
}

const ShoppingListPage = () => {
  const { mode } = useTheme();
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: '1', name: 'Chicken Breast', quantity: '2 lbs', category: 'Meat & Seafood', checked: false, price: 8.99, store: 'Kroger' },
    { id: '2', name: 'Fresh Salmon', quantity: '1 lb', category: 'Meat & Seafood', checked: false, price: 12.99, store: 'Whole Foods' },
    { id: '3', name: 'Romaine Lettuce', quantity: '1 head', category: 'Produce', checked: false, price: 2.49, store: 'Kroger' },
    { id: '4', name: 'Avocados', quantity: '3', category: 'Produce', checked: true, price: 4.99, store: 'Trader Joes' },
    { id: '5', name: 'Oat Milk', quantity: '1 gal', category: 'Dairy & Alternatives', checked: false, price: 5.49, store: 'Target' },
    { id: '6', name: 'Greek Yogurt', quantity: '32 oz', category: 'Dairy & Alternatives', checked: false, price: 6.99, store: 'Walmart' },
    { id: '7', name: 'Bananas', quantity: '1 bunch', category: 'Produce', checked: false, price: 1.99 },
  ]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleEdit = (id: string) => {
    console.log('Edit item:', id);
    // Implement edit functionality
  };

  const categories = Array.from(new Set(items.map(item => item.category)));

  // Calculate total price
  const totalPrice = items
    .filter(item => !item.checked && item.price)
    .reduce((sum, item) => sum + (item.price || 0), 0);

  const savedPrice = items
    .filter(item => item.checked && item.price)
    .reduce((sum, item) => sum + (item.price || 0), 0);

  // Theme-aware aurora colors - Vibrant 5-color gradient
  const auroraColors = mode === 'dark'
    ? ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']
    : ['#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ff9a9e'];

  return (
    <AuroraBackground colors={auroraColors} speed={20}>
      <Box sx={{
        p: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
        position: 'relative',
        zIndex: 2,
        maxWidth: { xs: '100%', sm: '100%', md: '95%', lg: '90%', xl: '1800px' },
        mx: 'auto',
        width: '100%'
      }}>

        <Box sx={{
          mb: { xs: 3, md: 4 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
             <Typography
               variant="h2"
               fontWeight="900"
               sx={{
                 background: mode === 'dark'
                   ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                   : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                 lineHeight: 1
               }}
             >
               Shopping List
             </Typography>
             <Typography
               variant="h6"
               sx={{
                 color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                 fontSize: { xs: '1rem', md: '1.25rem' }
               }}
             >
               {items.filter(i => !i.checked).length} items remaining
             </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <StoreSelector selectedStore={selectedStore} onStoreSelect={setSelectedStore} />
            <Button
              variant="contained"
              startIcon={<Share />}
              sx={{
                bgcolor: mode === 'dark' ? 'white' : '#4ECDC4',
                color: mode === 'dark' ? 'black' : 'white',
                borderRadius: 4,
                px: 3,
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: mode === 'dark' ? '#f0f0f0' : '#3BA59E'
                }
              }}
            >
              Share
            </Button>
          </Box>
        </Box>

        {/* Budget Summary */}
        <GlassCard intensity="ultra" sx={{
          mb: { xs: 3, md: 4 },
          p: { xs: 2, md: 3 },
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            transition: 'all 0.3s ease'
          }
        }}>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}
                >
                  Estimated Total
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    background: 'linear-gradient(135deg, #4ECDC4 0%, #00d4aa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '1.75rem', md: '2rem' }
                  }}
                >
                  ${totalPrice.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}
                >
                  Already Purchased
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    color: mode === 'dark' ? 'white' : '#000000',
                    fontSize: { xs: '1.75rem', md: '2rem' }
                  }}
                >
                  ${savedPrice.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}
                >
                  Items
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    color: mode === 'dark' ? 'white' : '#000000',
                    fontSize: { xs: '1.75rem', md: '2rem' }
                  }}
                >
                  {items.filter(i => !i.checked).length} / {items.length}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </GlassCard>

        {/* Tip */}
        <Box sx={{ mb: { xs: 2, md: 3 }, textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{
              color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
              fontSize: { xs: '0.85rem', md: '0.875rem' }
            }}
          >
            💡 Swipe left on items to delete
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {categories.map((category, i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={category}>
              <GlassCard
                intensity="ultra"
                sx={{
                  height: '100%',
                  p: 0,
                  overflow: 'hidden',
                  borderRadius: { xs: '20px', md: '24px' },
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 20px 60px rgba(78, 205, 196, 0.3)'
                  }
                }}
              >
                <Box sx={{
                  p: { xs: 2, md: 3 },
                  bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
                }}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      background: 'linear-gradient(135deg, #4ECDC4 0%, #00d4aa 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: { xs: '1.1rem', md: '1.25rem' }
                    }}
                  >
                    {sanitizeText(category)}
                  </Typography>
                </Box>

                <Box sx={{ p: 2 }}>
                  {items.filter(item => item.category === category).map((item) => (
                    <SwipeableShoppingItem
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </Box>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* Floating Add Button */}
        <Box sx={{
          position: 'fixed',
          bottom: { xs: 100, md: 48 },
          right: { xs: 24, md: 48 },
          zIndex: 10
        }}>
           <Button
            variant="contained"
            sx={{
              borderRadius: '50%',
              width: { xs: 56, md: 64 },
              height: { xs: 56, md: 64 },
              minWidth: 0,
              background: 'linear-gradient(135deg, #4ECDC4 0%, #00d4aa 100%)',
              boxShadow: '0 8px 32px rgba(78, 205, 196, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00d4aa 0%, #4ECDC4 100%)',
                transform: 'scale(1.1) rotate(90deg)',
                transition: 'all 0.3s ease'
              }
            }}
          >
            <Add sx={{ fontSize: { xs: 28, md: 32 }, color: 'white' }} />
          </Button>
        </Box>

      </Box>
    </AuroraBackground>
  );
};

export default ShoppingListPage;
