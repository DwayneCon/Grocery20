import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import inventoryService from '../../services/inventoryService';
import { logger } from '../../utils/logger';
import type { InventoryLocation } from './InventoryTabs';

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  householdId: string;
  defaultLocation?: InventoryLocation;
}

const UNITS = ['pieces', 'lbs', 'oz', 'cups', 'gallons', 'liters', 'ml', 'kg', 'g', 'dozen', 'bags', 'cans', 'boxes', 'bottles'];
const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Grains', 'Beverages', 'Snacks', 'Condiments', 'Frozen', 'Bakery', 'Canned Goods', 'Other'];
const LOCATIONS: InventoryLocation[] = ['Fridge', 'Pantry', 'Freezer'];

const AddItemDialog = ({ open, onClose, onSuccess, householdId, defaultLocation = 'Fridge' }: AddItemDialogProps) => {
  const { mode } = useTheme();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pieces');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState<InventoryLocation>(defaultLocation);
  const [expirationDate, setExpirationDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setQuantity('1');
    setUnit('pieces');
    setCategory('');
    setLocation(defaultLocation);
    setExpirationDate('');
    setError(null);
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await inventoryService.addItem(householdId, {
        name: name.trim(),
        quantity: qty,
        unit,
        location,
        expirationDate: expirationDate || undefined,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      logger.error('Error adding inventory item:', err);
      setError(err.response?.data?.error || 'Failed to add item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputSx = {
    '& .MuiInputLabel-root': {
      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
      '&.Mui-focused': { color: 'var(--chef-orange)' },
    },
    '& .MuiOutlinedInput-root': {
      color: mode === 'dark' ? 'white' : '#000000',
      borderRadius: 'var(--radius-md)',
      '& fieldset': { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--chef-orange)', borderWidth: 2 },
    },
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, scale: 0.9, y: 30 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.9, y: 30 },
            transition: { duration: 0.25, ease: 'easeOut' },
            sx: {
              background: mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              borderRadius: 'var(--radius-xl)',
            },
          } as any}
        >
          <DialogTitle
            sx={{
              color: mode === 'dark' ? 'white' : '#000000',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            Add Inventory Item
            <Button
              size="small"
              onClick={handleClose}
              disabled={submitting}
              sx={{ minWidth: 'auto', color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
            >
              <Close />
            </Button>
          </DialogTitle>

          <DialogContent>
            {error && (
              <Box
                sx={{
                  p: 1.5,
                  mb: 2,
                  borderRadius: 'var(--radius-md)',
                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                  color: '#f44336',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {error}
              </Box>
            )}

            <TextField
              autoFocus
              margin="dense"
              label="Item Name"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chicken breast"
              sx={{ ...inputSx, mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Quantity"
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                inputProps={{ min: 0.1, step: 0.1 }}
                sx={{ ...inputSx, flex: 1 }}
              />
              <TextField
                select
                label="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                sx={{ ...inputSx, flex: 1 }}
              >
                {UNITS.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={{ ...inputSx, flex: 1 }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value as InventoryLocation)}
                sx={{ ...inputSx, flex: 1 }}
              >
                {LOCATIONS.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <TextField
              label="Expiration Date"
              type="date"
              fullWidth
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
              }}
              sx={inputSx}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={handleClose}
              disabled={submitting}
              sx={{
                color: mode === 'dark' ? 'white' : '#000000',
                fontWeight: 'bold',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitting || !name.trim()}
              startIcon={submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <Add />}
              sx={{
                background: 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)',
                color: 'var(--pure-white)',
                fontWeight: 'bold',
                borderRadius: 'var(--radius-md)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FF8C5A 0%, var(--chef-orange) 100%)',
                },
                '&:disabled': {
                  background: 'rgba(255, 107, 53, 0.5)',
                  color: 'rgba(255,255,255,0.7)',
                },
              }}
            >
              {submitting ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default AddItemDialog;
