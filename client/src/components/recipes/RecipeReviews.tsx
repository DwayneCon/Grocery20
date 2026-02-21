import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Rating,
  Paper,
  CircularProgress,
  Button,
  Divider,
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import recipeService, { RecipeRating } from '../../services/recipeService';
import GlassCard from '../common/GlassCard';
import { logger } from '../../utils/logger';

interface RecipeReviewsProps {
  recipeId: string;
}

const RecipeReviews = ({ recipeId }: RecipeReviewsProps) => {
  const [reviews, setReviews] = useState<RecipeRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 5;

  useEffect(() => {
    loadReviews(0);
  }, [recipeId]);

  const loadReviews = async (newOffset: number) => {
    try {
      setLoading(true);
      const response = await recipeService.getRecipeRatings(recipeId, limit, newOffset);

      if (response.success) {
        const newReviews = response.data.ratings;

        if (newOffset === 0) {
          setReviews(newReviews);
        } else {
          setReviews(prev => [...prev, ...newReviews]);
        }

        setHasMore(newReviews.length === limit);
        setOffset(newOffset);
      }
    } catch (err) {
      logger.error('Error loading reviews', err instanceof Error ? err : undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadReviews(offset + limit);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading && offset === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress sx={{ color: '#4ECDC4' }} />
      </Box>
    );
  }

  if (reviews.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
          No reviews yet. Be the first to rate this recipe!
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <AnimatePresence>
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard
              intensity="light"
              sx={{
                mb: 2,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              }}
            >
              {/* Review Header */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: '#4ECDC4',
                    width: 40,
                    height: 40,
                  }}
                >
                  {review.userName.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'white' }}>
                    {review.userName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating
                      value={review.rating}
                      readOnly
                      size="small"
                      icon={<Star sx={{ fontSize: 16, color: '#FFD700' }} />}
                      emptyIcon={<StarBorder sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {formatDate(review.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Review Text */}
              {review.review && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: 1.6,
                  }}
                >
                  {review.review}
                </Typography>
              )}

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  {review.images.map((imageUrl, idx) => (
                    <Box
                      key={idx}
                      component="img"
                      src={imageUrl}
                      alt={`Review image ${idx + 1}`}
                      sx={{
                        width: 80,
                        height: 80,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </Box>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load More Button */}
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            onClick={handleLoadMore}
            disabled={loading}
            sx={{
              color: '#4ECDC4',
              '&:hover': {
                bgcolor: 'rgba(78,205,196,0.1)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#4ECDC4' }} /> : 'Load More Reviews'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default RecipeReviews;
