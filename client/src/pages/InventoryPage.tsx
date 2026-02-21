import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Fab, Snackbar, Alert } from '@mui/material';
import { Add, Inventory2 } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../features/store';
import { useTheme } from '../contexts/ThemeContext';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import EmptyState from '../components/common/EmptyState';
import PullToRefresh from '../components/common/PullToRefresh';
import { ListItemSkeleton } from '../components/common/Skeleton';
import InventoryTabs, { InventoryLocation } from '../components/inventory/InventoryTabs';
import ExpirationAlert from '../components/inventory/ExpirationAlert';
import AddItemDialog from '../components/inventory/AddItemDialog';
import InventoryList from '../components/inventory/InventoryList';
import inventoryService, { InventoryItem } from '../services/inventoryService';
import { logger } from '../utils/logger';

const InventoryPage = () => {
  const { mode } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const householdId = user?.householdId || '';

  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<InventoryLocation>('Fridge');
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    if (!householdId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await inventoryService.getHouseholdInventory(householdId);
      if (response.success) {
        setAllItems(response.data);
      }
    } catch (err: any) {
      logger.error('Error loading inventory:', err);
      setError(err.response?.data?.error || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    if (householdId) {
      loadInventory();
    } else {
      setLoading(false);
    }
  }, [householdId, loadInventory]);

  const handleRefresh = async () => {
    await loadInventory();
  };

  const handleAddSuccess = () => {
    setSuccess('Item added to inventory');
    loadInventory();
  };

  // Count items per location
  const counts: Record<InventoryLocation, number> = {
    Fridge: allItems.filter((i) => i.location === 'Fridge').length,
    Pantry: allItems.filter((i) => i.location === 'Pantry').length,
    Freezer: allItems.filter((i) => i.location === 'Freezer').length,
  };

  // Filter items by active tab
  const filteredItems = allItems.filter((item) => item.location === activeTab);

  // Culinary Spectrum aurora colors
  const auroraColors =
    mode === 'dark'
      ? ['#FF6B35', '#F4A460', '#6A4C93', '#05AF5C', '#FFD93D']
      : ['#FFDDC1', '#FFEDBC', '#E8D5F2', '#C1F7DC', '#FFF9D6'];

  if (!householdId) {
    return (
      <AuroraBackground colors={auroraColors} speed={20}>
        <Box sx={{ p: { xs: 2, md: 6 }, maxWidth: '1400px', mx: 'auto' }}>
          <EmptyState
            variant="empty-inventory"
            title="Set up your household first"
            description="Create or join a household to start tracking your inventory."
            actionLabel="Go to Household"
          />
        </Box>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground colors={auroraColors} speed={20}>
      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)} role="alert" aria-live="assertive">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)} role="status" aria-live="polite">
          {success}
        </Alert>
      </Snackbar>

      <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
        <Box sx={{ p: { xs: 2, md: 6 }, maxWidth: '1400px', mx: 'auto', position: 'relative', zIndex: 2 }}>
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="overline"
                sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  letterSpacing: 2,
                  fontWeight: 'bold',
                }}
              >
                YOUR KITCHEN
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Inventory2
                  sx={{
                    fontSize: 36,
                    color: 'var(--chef-orange)',
                  }}
                />
                <Typography
                  variant="h2"
                  fontWeight="900"
                  sx={{
                    fontFamily: 'var(--font-display)',
                    background:
                      mode === 'dark'
                        ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                        : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Inventory
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{
                  mt: 1,
                  color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                }}
              >
                {allItems.length} item{allItems.length !== 1 ? 's' : ''} tracked across your kitchen
              </Typography>
            </Box>
          </motion.div>

          {/* Expiration Alert */}
          {!loading && <ExpirationAlert items={allItems} />}

          {/* Location Tabs */}
          <InventoryTabs activeTab={activeTab} onChange={setActiveTab} counts={counts} />

          {/* Content Area */}
          {loading ? (
            <GlassCard
              intensity="light"
              hover={false}
              sx={{ borderRadius: 'var(--radius-lg)' }}
            >
              <Box sx={{ p: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <ListItemSkeleton key={i} />
                ))}
              </Box>
            </GlassCard>
          ) : filteredItems.length === 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EmptyState
                variant="empty-inventory"
                title={`No items in your ${activeTab.toLowerCase()}`}
                description={`Tap the + button to add items to your ${activeTab.toLowerCase()}.`}
                actionLabel="Add Item"
                onAction={() => setAddDialogOpen(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <InventoryList householdId={householdId} />
            </motion.div>
          )}
        </Box>
      </PullToRefresh>

      {/* Floating Action Button */}
      <Fab
        component={motion.button}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setAddDialogOpen(true)}
        aria-label="Add inventory item"
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 32,
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)',
          color: 'white',
          boxShadow: '0 10px 30px rgba(255, 107, 53, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FF8C5A 0%, var(--chef-orange) 100%)',
            boxShadow: '0 15px 40px rgba(255, 107, 53, 0.5)',
          },
          zIndex: 100,
        }}
      >
        <Add sx={{ fontSize: 32 }} />
      </Fab>

      {/* Add Item Dialog */}
      <AddItemDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={handleAddSuccess}
        householdId={householdId}
        defaultLocation={activeTab}
      />
    </AuroraBackground>
  );
};

export default InventoryPage;
