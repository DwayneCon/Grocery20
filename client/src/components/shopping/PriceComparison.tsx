import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from '@mui/material';
import { TrendingDown, Store, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import storeService, { PriceComparison as PriceComparisonType } from '../../services/storeService';
import { ShoppingListItem } from '../../services/shoppingListService';
import { useTheme } from '../../contexts/ThemeContext';

interface PriceComparisonProps {
  items: ShoppingListItem[];
}

const PriceComparison = ({ items }: PriceComparisonProps) => {
  const { mode } = useTheme();
  const [comparison, setComparison] = useState<PriceComparisonType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length > 0) {
      loadPriceComparison();
    }
  }, [items]);

  const loadPriceComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert shopping list items to the format needed for price comparison
      const itemsToCompare = items.map(item => ({
        ingredientId: item.ingredientId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      }));

      const response = await storeService.comparePrices(itemsToCompare);
      if (response.success) {
        setComparison(response.data);
      }
    } catch (err) {
      console.error('Error loading price comparison:', err);
      setError('Failed to load price comparison');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard intensity="strong" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress sx={{ color: '#4ECDC4' }} />
      </GlassCard>
    );
  }

  if (error || !comparison) {
    return (
      <GlassCard intensity="strong" sx={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Store sx={{ fontSize: 64, color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
        <Typography sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', textAlign: 'center' }}>
          {error || 'No price comparison available'}
        </Typography>
        <Button onClick={loadPriceComparison} sx={{ color: '#4ECDC4' }}>
          Retry
        </Button>
      </GlassCard>
    );
  }

  if (items.length === 0) {
    return (
      <GlassCard intensity="strong" sx={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Store sx={{ fontSize: 64, color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
        <Typography sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', textAlign: 'center' }}>
          Add items to your shopping list to compare prices
        </Typography>
      </GlassCard>
    );
  }

  const bestStore = comparison.stores.reduce((best, current) =>
    current.totalCost < best.totalCost ? current : best
  );

  return (
    <Box>
      {/* Best Deal Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlassCard intensity="ultra" sx={{ mb: 3, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(78,205,196,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingDown sx={{ color: '#4ECDC4', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                Best Deal
              </Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
                {bestStore.storeName}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<TrendingDown sx={{ "&&": { color: '#4ECDC4' } }} />}
              label={`Save $${comparison.potentialSavings.toFixed(2)}`}
              sx={{
                bgcolor: mode === 'dark' ? 'rgba(78,205,196,0.2)' : 'rgba(78,205,196,0.1)',
                color: '#4ECDC4',
                fontWeight: 'bold',
              }}
            />
            <Chip
              label={`Total: $${bestStore.totalCost.toFixed(2)}`}
              sx={{
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: mode === 'dark' ? 'white' : '#000000',
              }}
            />
            <Chip
              label={`${bestStore.itemsAvailable}/${comparison.stores[0].items.length} items available`}
              sx={{
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: mode === 'dark' ? 'white' : '#000000',
              }}
            />
          </Box>
        </GlassCard>
      </motion.div>

      {/* Price Comparison Table */}
      <Typography variant="overline" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', letterSpacing: 2, mb: 2, display: 'block' }}>
        STORE COMPARISON
      </Typography>

      <GlassCard intensity="light">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontWeight: 'bold', borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                  Store
                </TableCell>
                <TableCell align="right" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontWeight: 'bold', borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                  Total Cost
                </TableCell>
                <TableCell align="right" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontWeight: 'bold', borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                  Available
                </TableCell>
                <TableCell align="right" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontWeight: 'bold', borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparison.stores.map((store, index) => {
                const isBest = store.storeId === bestStore.storeId;
                return (
                  <motion.tr
                    key={store.storeId}
                    component={TableRow}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    sx={{
                      bgcolor: isBest ? (mode === 'dark' ? 'rgba(78,205,196,0.1)' : 'rgba(78,205,196,0.05)') : 'transparent',
                    }}
                  >
                    <TableCell sx={{ color: mode === 'dark' ? 'white' : '#000000', fontWeight: isBest ? 'bold' : 'normal', borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Store sx={{ fontSize: 20, color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                        {store.storeName}
                        {isBest && (
                          <Chip
                            size="small"
                            label="Best"
                            icon={<CheckCircle sx={{ "&&": { color: '#4ECDC4' } }} />}
                            sx={{
                              bgcolor: 'rgba(78,205,196,0.2)',
                              color: '#4ECDC4',
                              height: 24,
                              ml: 1,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ color: mode === 'dark' ? 'white' : '#000000', fontWeight: 'bold', fontSize: '1.1rem', borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                      ${store.totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                      {store.itemsAvailable}/{store.items.length}
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                      <Chip
                        size="small"
                        label={store.itemsAvailable === store.items.length ? 'All available' : 'Some missing'}
                        sx={{
                          bgcolor: store.itemsAvailable === store.items.length
                            ? 'rgba(78,205,196,0.2)'
                            : 'rgba(255,230,109,0.2)',
                          color: store.itemsAvailable === store.items.length
                            ? '#4ECDC4'
                            : '#FFE66D',
                          height: 24,
                        }}
                      />
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>
    </Box>
  );
};

export default PriceComparison;
