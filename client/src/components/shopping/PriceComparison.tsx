import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  Button,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  TrendingDown,
  Store,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  Refresh,
  Info,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import apiClient from '../../utils/apiClient';
import { ShoppingListItem } from '../../services/shoppingListService';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';

// ---------- Response types from /stores/compare-live ----------

interface CompareStoreItem {
  itemName: string;
  productName: string | null;
  brand: string | null;
  regularPrice: number | null;
  promoPrice: number | null;
  quantity: number;
  totalPrice: number;
  found: boolean;
  imageUrl?: string | null;
  onSale?: boolean;
  salePrice?: number | null;
}

interface CompareStore {
  storeName: string;
  source: 'live_api' | 'scraped';
  totalRegular: number;
  totalWithDeals: number;
  savings: number;
  savingsPercent: number;
  itemsFound: number;
  itemsTotal: number;
  items: CompareStoreItem[];
  lastUpdated: string | null;
}

interface CompareLiveResponse {
  success: boolean;
  stores: CompareStore[];
  bestStore: string | null;
  potentialSavings: number;
  krogerConfigured: boolean;
  itemsRequested: number;
}

// ---------- Props ----------

interface PriceComparisonProps {
  items: ShoppingListItem[];
}

// ---------- Helpers ----------

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const isStale = (dateStr: string | null): boolean => {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() > STALE_THRESHOLD_MS;
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ---------- Component ----------

const PriceComparison = ({ items }: PriceComparisonProps) => {
  const { mode } = useTheme();
  const [data, setData] = useState<CompareLiveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedStores, setExpandedStores] = useState<Record<string, boolean>>({});

  const isDark = mode === 'dark';
  const textPrimary = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.87)';
  const textSecondary = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const fetchComparison = useCallback(async () => {
    if (items.length === 0) return;
    try {
      setLoading(true);
      setError(null);

      const mappedItems = items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category || undefined,
      }));

      const response = await apiClient.post<CompareLiveResponse>(
        '/stores/compare-live',
        { items: mappedItems },
      );

      setData(response.data);
    } catch (err: any) {
      logger.error('Error loading price comparison', err instanceof Error ? err : undefined, { context: 'PriceComparison' });
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load price comparison';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const toggleExpand = (storeName: string) => {
    setExpandedStores((prev) => ({ ...prev, [storeName]: !prev[storeName] }));
  };

  // ---- Empty state ----
  if (items.length === 0) {
    return (
      <GlassCard
        intensity="strong"
        hover={false}
        sx={{
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Store sx={{ fontSize: 64, color: textSecondary }} />
        <Typography sx={{ color: textSecondary, textAlign: 'center' }}>
          Add items to your shopping list to compare prices
        </Typography>
      </GlassCard>
    );
  }

  // ---- Loading state ----
  if (loading) {
    return (
      <GlassCard
        intensity="strong"
        hover={false}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300,
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: '#4ECDC4' }} />
        <Typography variant="body2" sx={{ color: textSecondary }}>
          Fetching live prices...
        </Typography>
      </GlassCard>
    );
  }

  // ---- Error state ----
  if (error || !data) {
    return (
      <GlassCard
        intensity="strong"
        hover={false}
        sx={{
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Store sx={{ fontSize: 64, color: textSecondary }} />
        <Typography sx={{ color: textSecondary, textAlign: 'center' }}>
          {error || 'No price comparison available'}
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={fetchComparison}
          sx={{ color: '#4ECDC4' }}
        >
          Retry
        </Button>
      </GlassCard>
    );
  }

  // ---- Determine best store from response ----
  const bestStoreName = data.bestStore;
  const bestStoreData = data.stores.find((s) => s.storeName === bestStoreName) || data.stores[0];

  return (
    <Box>
      {/* Kroger not configured info */}
      {!data.krogerConfigured && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ mb: 2 }}>
            <Chip
              icon={<Info sx={{ '&&': { color: isDark ? '#90CAF9' : '#1976D2' } }} />}
              label="Kroger API not configured -- live Kroger prices unavailable"
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(33,150,243,0.15)' : 'rgba(33,150,243,0.08)',
                color: isDark ? '#90CAF9' : '#1976D2',
                fontWeight: 500,
              }}
            />
          </Box>
        </motion.div>
      )}

      {/* Best Deal Summary Card */}
      {bestStoreData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
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
                  flexShrink: 0,
                }}
              >
                <TrendingDown sx={{ color: '#4ECDC4', fontSize: 28 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: textSecondary, letterSpacing: 1 }}
                >
                  Best Deal
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: textPrimary }}
                >
                  {bestStoreData.storeName}
                </Typography>
              </Box>

              {/* Source badge */}
              <Chip
                size="small"
                label={bestStoreData.source === 'live_api' ? 'Live API' : 'Scraped'}
                sx={{
                  bgcolor:
                    bestStoreData.source === 'live_api'
                      ? 'rgba(76,175,80,0.15)'
                      : 'rgba(33,150,243,0.15)',
                  color:
                    bestStoreData.source === 'live_api'
                      ? '#66BB6A'
                      : '#42A5F5',
                  fontWeight: 600,
                  height: 26,
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={`Total: $${bestStoreData.totalWithDeals.toFixed(2)}`}
                sx={{
                  bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  color: textPrimary,
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                }}
              />
              {data.potentialSavings > 0 && (
                <Chip
                  icon={
                    <TrendingDown sx={{ '&&': { color: '#4ECDC4' } }} />
                  }
                  label={`Save $${data.potentialSavings.toFixed(2)}`}
                  sx={{
                    bgcolor: isDark
                      ? 'rgba(78,205,196,0.2)'
                      : 'rgba(78,205,196,0.1)',
                    color: '#4ECDC4',
                    fontWeight: 'bold',
                  }}
                />
              )}
              {bestStoreData.savingsPercent > 0 && (
                <Chip
                  label={`${bestStoreData.savingsPercent.toFixed(1)}% off`}
                  sx={{
                    bgcolor: isDark
                      ? 'rgba(78,205,196,0.15)'
                      : 'rgba(78,205,196,0.08)',
                    color: '#4ECDC4',
                    fontWeight: 600,
                  }}
                />
              )}
              <Chip
                label={`${bestStoreData.itemsFound}/${bestStoreData.itemsTotal} items found`}
                sx={{
                  bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  color: textPrimary,
                }}
              />
            </Box>
          </GlassCard>
        </motion.div>
      )}

      {/* Section header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: textSecondary, letterSpacing: 2 }}
        >
          Store Comparison
        </Typography>
        <IconButton
          onClick={fetchComparison}
          size="small"
          sx={{ color: textSecondary, '&:hover': { color: '#4ECDC4' } }}
          aria-label="Refresh prices"
        >
          <Refresh fontSize="small" />
        </IconButton>
      </Box>

      {/* Store cards */}
      <AnimatePresence>
        {data.stores.map((storeData, index) => {
          const isBest = storeData.storeName === bestStoreName;
          const expanded = !!expandedStores[storeData.storeName];
          const stale = isStale(storeData.lastUpdated);

          return (
            <motion.div
              key={storeData.storeName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.35 }}
              style={{ marginBottom: 16 }}
            >
              <GlassCard
                intensity={isBest ? 'strong' : 'light'}
                hover={false}
                sx={{
                  p: 0,
                  border: isBest
                    ? '1px solid rgba(78,205,196,0.4)'
                    : undefined,
                }}
              >
                {/* Store header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2.5,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => toggleExpand(storeData.storeName)}
                >
                  <Store
                    sx={{
                      fontSize: 28,
                      color: isBest ? '#4ECDC4' : textSecondary,
                      mr: 1.5,
                    }}
                  />

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={isBest ? 700 : 600}
                        sx={{ color: textPrimary }}
                      >
                        {storeData.storeName}
                      </Typography>

                      {/* Source badge */}
                      <Chip
                        size="small"
                        label={
                          storeData.source === 'live_api'
                            ? 'Live API'
                            : 'Scraped'
                        }
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor:
                            storeData.source === 'live_api'
                              ? 'rgba(76,175,80,0.15)'
                              : 'rgba(33,150,243,0.15)',
                          color:
                            storeData.source === 'live_api'
                              ? '#66BB6A'
                              : '#42A5F5',
                        }}
                      />

                      {isBest && (
                        <Chip
                          size="small"
                          label="Best"
                          icon={
                            <CheckCircle
                              sx={{ '&&': { color: '#4ECDC4', fontSize: 16 } }}
                            />
                          }
                          sx={{
                            height: 22,
                            bgcolor: 'rgba(78,205,196,0.2)',
                            color: '#4ECDC4',
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Box>

                    {/* Costs row */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 1.5,
                        mt: 0.5,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ color: isBest ? '#4ECDC4' : textPrimary }}
                      >
                        ${storeData.totalWithDeals.toFixed(2)}
                      </Typography>

                      {storeData.savings > 0 && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#4ECDC4',
                            fontWeight: 600,
                          }}
                        >
                          Save ${storeData.savings.toFixed(2)} (
                          {storeData.savingsPercent.toFixed(1)}%)
                        </Typography>
                      )}

                      {storeData.totalRegular !== storeData.totalWithDeals && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: textSecondary,
                            textDecoration: 'line-through',
                          }}
                        >
                          ${storeData.totalRegular.toFixed(2)}
                        </Typography>
                      )}
                    </Box>

                    {/* Items found + last updated */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mt: 0.5,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: textSecondary }}>
                        {storeData.itemsFound}/{storeData.itemsTotal} items found
                      </Typography>

                      {storeData.lastUpdated && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: stale ? '#FF6B6B' : textSecondary,
                            fontWeight: stale ? 600 : 400,
                          }}
                        >
                          {stale ? 'Stale -- ' : ''}Updated{' '}
                          {formatDate(storeData.lastUpdated)}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Expand toggle */}
                  <IconButton
                    size="small"
                    sx={{ color: textSecondary, ml: 1 }}
                    aria-label={expanded ? 'Collapse items' : 'Expand items'}
                  >
                    {expanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>

                {/* Expandable item details */}
                <Collapse in={expanded} unmountOnExit>
                  <Box
                    sx={{
                      px: 2.5,
                      pb: 2.5,
                      borderTop: `1px solid ${borderColor}`,
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        color: textSecondary,
                        letterSpacing: 1.5,
                        display: 'block',
                        mt: 1.5,
                        mb: 1,
                      }}
                    >
                      Item Details
                    </Typography>

                    {storeData.items.map((item, idx) => (
                      <Box
                        key={`${item.itemName}-${idx}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          py: 1,
                          borderBottom:
                            idx < storeData.items.length - 1
                              ? `1px solid ${borderColor}`
                              : 'none',
                        }}
                      >
                        {/* Item image thumbnail */}
                        {item.imageUrl && (
                          <Box
                            component="img"
                            src={item.imageUrl}
                            alt={item.productName || item.itemName}
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '8px',
                              objectFit: 'cover',
                              flexShrink: 0,
                              bgcolor: isDark
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(0,0,0,0.03)',
                            }}
                          />
                        )}

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                              color: item.found ? textPrimary : textSecondary,
                              opacity: item.found ? 1 : 0.6,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.productName || item.itemName}
                            {!item.found && ' (not found)'}
                          </Typography>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {item.brand && (
                              <Typography
                                variant="caption"
                                sx={{ color: textSecondary }}
                              >
                                {item.brand}
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              sx={{ color: textSecondary }}
                            >
                              Qty: {item.quantity}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Price column */}
                        <Box
                          sx={{
                            textAlign: 'right',
                            flexShrink: 0,
                          }}
                        >
                          {item.found ? (
                            <>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{
                                  color:
                                    item.onSale || item.promoPrice
                                      ? '#4ECDC4'
                                      : textPrimary,
                                }}
                              >
                                ${item.totalPrice.toFixed(2)}
                              </Typography>

                              {(item.onSale || item.promoPrice) &&
                                item.regularPrice != null && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: textSecondary,
                                      textDecoration: 'line-through',
                                    }}
                                  >
                                    $
                                    {(
                                      item.regularPrice * item.quantity
                                    ).toFixed(2)}
                                  </Typography>
                                )}
                            </>
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{ color: textSecondary, fontStyle: 'italic' }}
                            >
                              --
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </GlassCard>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </Box>
  );
};

export default PriceComparison;
