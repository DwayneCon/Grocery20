/* client/src/components/shopping/StoreSelector.tsx */
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
  Chip,
  Avatar,
} from '@mui/material';
import { Store, ExpandMore, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import GlassCard from '../common/GlassCard';

interface Store {
  id: string;
  name: string;
  logo?: string;
  distance?: string;
}

interface StoreSelectorProps {
  selectedStore: string | null;
  onStoreSelect: (storeId: string) => void;
}

const StoreSelector = ({ selectedStore, onStoreSelect }: StoreSelectorProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const stores: Store[] = [
    { id: 'kroger', name: 'Kroger', distance: '2.3 mi' },
    { id: 'walmart', name: 'Walmart', distance: '3.1 mi' },
    { id: 'target', name: 'Target', distance: '1.8 mi' },
    { id: 'whole-foods', name: 'Whole Foods', distance: '4.5 mi' },
    { id: 'traders-joes', name: "Trader Joe's", distance: '3.7 mi' },
  ];

  const currentStore = stores.find((s) => s.id === selectedStore);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (storeId: string) => {
    onStoreSelect(storeId);
    handleClose();
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        endIcon={<ExpandMore />}
        startIcon={<Store />}
        sx={{
          bgcolor: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 4,
          px: 3,
          fontWeight: 'bold',
          textTransform: 'none',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
          },
        }}
        aria-label="Select store"
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl)}
      >
        {currentStore ? currentStore.name : 'Select Store'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
            minWidth: 280,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            Choose Your Store
          </Typography>
        </Box>

        {stores.map((store, index) => (
          <MenuItem
            key={store.id}
            onClick={() => handleSelect(store.id)}
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            sx={{
              py: 1.5,
              px: 2,
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(78, 205, 196, 0.1)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Avatar
                sx={{
                  bgcolor: selectedStore === store.id ? '#4ECDC4' : 'rgba(255,255,255,0.1)',
                  width: 32,
                  height: 32,
                }}
              >
                {selectedStore === store.id ? (
                  <CheckCircle sx={{ fontSize: 20 }} />
                ) : (
                  <Store sx={{ fontSize: 20 }} />
                )}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight="600">
                  {store.name}
                </Typography>
                {store.distance && (
                  <Typography variant="caption" color="rgba(255,255,255,0.5)">
                    {store.distance} away
                  </Typography>
                )}
              </Box>

              {selectedStore === store.id && (
                <Chip
                  label="Selected"
                  size="small"
                  sx={{
                    bgcolor: '#4ECDC4',
                    color: 'black',
                    fontWeight: 'bold',
                  }}
                />
              )}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default StoreSelector;
