import { Box, Typography, Rating, LinearProgress } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { RatingStats } from '../../services/recipeService';

interface RecipeRatingProps {
  stats: RatingStats;
  size?: 'small' | 'medium' | 'large';
  showDistribution?: boolean;
}

const RecipeRating = ({ stats, size = 'medium', showDistribution = false }: RecipeRatingProps) => {
  const { averageRating, totalRatings, distribution } = stats;

  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { iconSize: 16, fontSize: '0.875rem', spacing: 1 };
      case 'large':
        return { iconSize: 32, fontSize: '1.5rem', spacing: 2 };
      default:
        return { iconSize: 24, fontSize: '1rem', spacing: 1.5 };
    }
  };

  const { iconSize, fontSize, spacing } = getSizeProps();

  return (
    <Box>
      {/* Average Rating Display */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ color: 'white', fontSize }}
        >
          {averageRating.toFixed(1)}
        </Typography>

        <Rating
          value={averageRating}
          readOnly
          precision={0.1}
          icon={<Star sx={{ fontSize: iconSize, color: '#FFD700' }} />}
          emptyIcon={<StarBorder sx={{ fontSize: iconSize, color: 'rgba(255,255,255,0.3)' }} />}
        />

        <Typography
          variant="body2"
          sx={{ color: 'rgba(255,255,255,0.6)', fontSize: fontSize === '1.5rem' ? '1rem' : '0.875rem' }}
        >
          ({totalRatings} {totalRatings === 1 ? 'review' : 'reviews'})
        </Typography>
      </Box>

      {/* Rating Distribution */}
      {showDistribution && totalRatings > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1, display: 'block' }}>
            Rating Distribution
          </Typography>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars] || 0;
            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

            return (
              <motion.div
                key={stars}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (6 - stars) * 0.05 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'white', minWidth: 30 }}>
                    {stars} <Star sx={{ fontSize: 12, verticalAlign: 'middle', color: '#FFD700' }} />
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#FFD700',
                        borderRadius: 3,
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 30, textAlign: 'right' }}>
                    {count}
                  </Typography>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default RecipeRating;
