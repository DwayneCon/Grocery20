import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { CompareArrows, Store, TrendingDown } from '@mui/icons-material';
import { motion } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import storeService, { PriceComparison as PriceComparisonData, StoreTotals } from '../../services/storeService';
import { logger } from '../../utils/logger';

interface PriceComparisonProps {
  shoppingListId?: string;
  items: Array<{
    ingredientId?: string;
    name: string;
    quantity: number;
    unit: string;
  }>;
}

const PriceComparison = ({ items }: PriceComparisonProps) => {
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<PriceComparisonData[] | null>(null);
  const [storeTotals, setStoreTotals] = useState<StoreTotals[] | null>(null);
  const [bestStore, setBestStore] = useState<StoreTotals | null>(null);
  const [potentialSavings, setPotentialSavings] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await storeService.comparePrices(items);

      if (response.success) {
        setComparison(response.data.itemComparison);
        setStoreTotals(response.data.storeTotals);
        setBestStore(response.data.bestStore);
        setPotentialSavings(response.data.potentialSavings);
      }
    } catch (err) {
      logger.error('Error comparing prices', err instanceof Error ? err : undefined);
      setError('Failed to compare prices');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <GlassCard intensity="strong" sx={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Store sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)' }} />
        <Typography sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          Add items to your shopping list to compare prices
        </Typography>
      </GlassCard>
    );
  }

  if (!comparison) {
    return (
      <GlassCard intensity="strong" sx={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CompareArrows sx={{ fontSize: 64, color: '#4ECDC4' }} />
        <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
          Ready to Compare Prices
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', mb: 2 }}>
          Find the best deals across {items.length} {items.length === 1 ? 'item' : 'items'}
        </Typography>
        <Button
          variant="contained"
          onClick={handleCompare}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CompareArrows />}
          sx={{
            bgcolor: '#4ECDC4',
            color: 'white',
            '&:hover': {
              bgcolor: '#45b8b0',
            },
          }}
        >
          {loading ? 'Comparing...' : 'Compare Prices'}
        </Button>
      </GlassCard>
    );
  }

  return (
    <Box>
      {/* Best Store Card */}
      {bestStore && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard intensity="strong" sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(78,205,196,0.2), rgba(78,205,196,0.05))' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="overline" sx={{ color: '#4ECDC4', letterSpacing: 2 }}>
                  BEST DEAL
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mt: 1 }}>
                  {bestStore.storeName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                  {bestStore.itemsAvailable} of {items.length} items available
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h3" fontWeight="900" sx={{ color: '#4ECDC4' }}>
                  ${bestStore.total.toFixed(2)}
                </Typography>
                {potentialSavings > 0 && (
                  <Chip
                    icon={<TrendingDown />}
                    label={`Save $${potentialSavings.toFixed(2)}`}
                    sx={{
                      bgcolor: '#4ECDC4',
                      color: 'white',
                      fontWeight: 'bold',
                      mt: 1,
                    }}
                  />
                )}
              </Box>
            </Box>
          </GlassCard>
        </motion.div>
      )}

      {/* Store Totals Table */}
      {storeTotals && storeTotals.length > 0 && (
        <GlassCard intensity="light" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Store Comparison
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Store
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Items
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {storeTotals.map((store, index) => (
                  <TableRow
                    key={store.storeName}
                    component={motion.tr}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {store.storeName}
                      {store.storeName === bestStore?.storeName && (
                        <Chip
                          label="Best"
                          size="small"
                          sx={{ ml: 1, bgcolor: '#4ECDC4', color: 'white', height: 20 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {store.itemsAvailable}/{items.length}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      ${store.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </GlassCard>
      )}

      {/* Retry Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          onClick={handleCompare}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CompareArrows />}
          sx={{
            color: '#4ECDC4',
            borderColor: '#4ECDC4',
            '&:hover': {
              borderColor: '#4ECDC4',
              bgcolor: 'rgba(78,205,196,0.1)',
            },
          }}
        >
          {loading ? 'Comparing...' : 'Compare Again'}
        </Button>
      </Box>
    </Box>
  );
};

export default PriceComparison;
