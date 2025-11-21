import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Star, StarBorder, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import recipeService, { RecipeRating } from '../../services/recipeService';

interface RateRecipeDialogProps {
  open: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
  onRatingSubmitted?: () => void;
}

const RateRecipeDialog = ({ open, onClose, recipeId, recipeName, onRatingSubmitted }: RateRecipeDialogProps) => {
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRating, setExistingRating] = useState<RecipeRating | null>(null);

  // Load existing rating when dialog opens
  useEffect(() => {
    if (open && recipeId) {
      loadExistingRating();
    }
  }, [open, recipeId]);

  const loadExistingRating = async () => {
    try {
      setLoadingExisting(true);
      const response = await recipeService.getMyRating(recipeId);
      if (response.success && response.data) {
        setExistingRating(response.data);
        setRating(response.data.rating);
        setReview(response.data.review || '');
      } else {
        setExistingRating(null);
        setRating(0);
        setReview('');
      }
    } catch (err) {
      console.error('Error loading existing rating:', err);
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await recipeService.rateRecipe(recipeId, {
        rating,
        review: review.trim() || undefined,
      });

      // Call callback to refresh ratings
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }

      // Close dialog
      onClose();
    } catch (err: any) {
      console.error('Error submitting rating:', err);
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      await recipeService.deleteRating(recipeId);

      // Reset form
      setRating(0);
      setReview('');
      setExistingRating(null);

      // Call callback to refresh ratings
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }

      // Close dialog
      onClose();
    } catch (err: any) {
      console.error('Error deleting rating:', err);
      setError(err.response?.data?.message || 'Failed to delete rating');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRating(0);
      setReview('');
      setError(null);
      setExistingRating(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(30,30,50,0.95), rgba(50,50,70,0.95))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4,
        },
      }}
    >
      <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {existingRating ? 'Update Your Rating' : 'Rate This Recipe'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
            {recipeName}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={loading} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loadingExisting ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#4ECDC4' }} />
          </Box>
        ) : (
          <>
            {/* Rating Stars */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                How would you rate this recipe?
              </Typography>
              <Rating
                value={rating}
                onChange={(_, newValue) => setRating(newValue || 0)}
                size="large"
                icon={
                  <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                    <Star sx={{ fontSize: 48, color: '#FFD700' }} />
                  </motion.div>
                }
                emptyIcon={<StarBorder sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />}
              />
            </Box>

            {/* Review Text */}
            <TextField
              label="Write a review (optional)"
              multiline
              rows={4}
              fullWidth
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this recipe..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4ECDC4',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.6)',
                },
              }}
            />

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mt: 2, bgcolor: 'rgba(255,0,0,0.1)' }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {existingRating && (
          <Button
            onClick={handleDelete}
            disabled={loading || loadingExisting}
            sx={{
              color: '#FF6B6B',
              '&:hover': {
                bgcolor: 'rgba(255,107,107,0.1)',
              },
            }}
          >
            Delete Rating
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: 'rgba(255,255,255,0.6)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.05)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || loadingExisting || rating === 0}
          variant="contained"
          sx={{
            bgcolor: '#4ECDC4',
            color: 'white',
            '&:hover': {
              bgcolor: '#45b8b0',
            },
            '&:disabled': {
              bgcolor: 'rgba(78,205,196,0.3)',
            },
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : existingRating ? 'Update' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RateRecipeDialog;
