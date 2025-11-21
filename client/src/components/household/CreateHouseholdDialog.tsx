import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../features/store';
import { createHousehold } from '../../features/household/householdSlice';
import { updateUser } from '../../features/auth/authSlice';
import { sanitizeInput } from '../../utils/sanitize';

interface CreateHouseholdDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateHouseholdDialog = ({ open, onClose, onSuccess }: CreateHouseholdDialogProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [householdName, setHouseholdName] = useState('');
  const [budget, setBudget] = useState('150');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!householdName.trim()) {
      setError('Please enter a household name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Sanitize household name before sending to API
      const sanitizedName = sanitizeInput(householdName);

      const result = await dispatch(
        createHousehold({
          name: sanitizedName,
          budgetWeekly: budget ? parseFloat(budget) : undefined,
        })
      ).unwrap();

      // Update user's householdId in auth state
      dispatch(updateUser({ householdId: result.household.id }));

      // Success
      setHouseholdName('');
      setBudget('150');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HomeIcon sx={{ color: '#4ECDC4' }} />
          <Typography variant="h6">Create Your Household</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', mb: 3 }}>
          Set up your household to start planning meals for your family. You can add members and
          their preferences after creation.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Household Name"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          placeholder="The Smith Family"
          margin="normal"
          required
          autoFocus
        />

        <TextField
          fullWidth
          label="Weekly Budget (optional)"
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="150"
          margin="normal"
          helperText="Your target weekly grocery budget in dollars"
          InputProps={{
            startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleCreate} variant="contained" disabled={loading || !householdName.trim()}>
          {loading ? 'Creating...' : 'Create Household'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateHouseholdDialog;
