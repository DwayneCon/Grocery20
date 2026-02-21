import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Kitchen, Delete, Warning, CheckCircle } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import inventoryService, { InventoryItem } from '../../services/inventoryService';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';

interface InventoryListProps {
  householdId: string;
}

const InventoryList = ({ householdId }: InventoryListProps) => {
  const { mode } = useTheme();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (householdId) {
      loadInventory();
    }
  }, [householdId]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryService.getHouseholdInventory(householdId);
      if (response.success) {
        setItems(response.data);
      }
    } catch (err) {
      logger.error('Error loading inventory', err instanceof Error ? err : undefined);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await inventoryService.deleteItem(itemId);
      setItems(items.filter(item => item.id !== itemId));
    } catch (err) {
      logger.error('Error deleting item', err instanceof Error ? err : undefined);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh':
        return '#4ECDC4';
      case 'expiring_soon':
        return '#FFE66D';
      case 'expired':
        return '#FF6B6B';
      default:
        return 'rgba(255,255,255,0.5)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fresh':
        return <CheckCircle />;
      case 'expiring_soon':
      case 'expired':
        return <Warning />;
      default:
        return <Kitchen />;
    }
  };

  if (loading) {
    return (
      <GlassCard intensity="strong" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress sx={{ color: '#4ECDC4' }} />
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard intensity="strong" sx={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{error}</Typography>
      </GlassCard>
    );
  }

  if (items.length === 0) {
    return (
      <GlassCard intensity="strong" sx={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Kitchen sx={{ fontSize: 64, color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
        <Typography sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', textAlign: 'center' }}>
          No items in your inventory yet
        </Typography>
        <Typography variant="body2" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', textAlign: 'center' }}>
          Start tracking your groceries to reduce waste
        </Typography>
      </GlassCard>
    );
  }

  // Group by location
  const grouped = items.reduce((acc, item) => {
    const location = item.location || 'Other';
    if (!acc[location]) acc[location] = [];
    acc[location].push(item);
    return acc;
  }, {} as { [key: string]: InventoryItem[] });

  return (
    <Box>
      {Object.entries(grouped).map(([location, locationItems]) => (
        <Box key={location} sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', letterSpacing: 2, mb: 1, display: 'block' }}>
            {location}
          </Typography>
          <GlassCard intensity="light">
            <List sx={{ p: 0 }}>
              <AnimatePresence>
                {locationItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ListItem
                      sx={{
                        borderBottom: index < locationItems.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        py: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: `${getStatusColor(item.status)}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                        }}
                      >
                        {getStatusIcon(item.status)}
                      </Box>

                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ color: mode === 'dark' ? 'white' : '#000000', fontWeight: 500 }}>
                            {item.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={`${item.quantity} ${item.unit}`}
                              size="small"
                              sx={{
                                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                color: mode === 'dark' ? 'white' : '#000000',
                                height: 20
                              }}
                            />
                            {item.expirationDate && (
                              <Chip
                                label={new Date(item.expirationDate).toLocaleDateString()}
                                size="small"
                                sx={{
                                  bgcolor: `${getStatusColor(item.status)}20`,
                                  color: getStatusColor(item.status),
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>
                        }
                      />

                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDelete(item.id)}
                          sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
          </GlassCard>
        </Box>
      ))}
    </Box>
  );
};

export default InventoryList;
