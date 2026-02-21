/* client/src/components/recipes/RecipeGrid.tsx */
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { LocalDining, ExpandMore } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import GlassCard from '../common/GlassCard';
import type { Recipe } from '../../services/recipeService';

interface RecipeGridProps {
  recipes: Recipe[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

const difficultyColors: Record<string, string> = {
  easy: 'var(--basil-green)',
  medium: 'var(--honey-gold)',
  hard: 'var(--error)',
};

const RecipeGrid = ({ recipes, loading, hasMore, onLoadMore }: RecipeGridProps) => {
  const { mode } = useTheme();

  // Empty state
  if (!loading && recipes.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          py: 8,
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--honey-gold), var(--chef-orange))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              boxShadow: '0 8px 32px rgba(244, 164, 96, 0.3)',
            }}
          >
            <LocalDining sx={{ fontSize: 56, color: 'white' }} />
          </Box>
        </motion.div>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, var(--honey-gold), var(--chef-orange))',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          No recipes found
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
            maxWidth: 360,
          }}
        >
          Try adjusting your filters or search terms to discover more recipes.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        {recipes.map((recipe) => {
          const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

          return (
            <GlassCard
              key={recipe.id}
              intensity="medium"
              variants={itemVariants}
              sx={{
                p: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Recipe Image */}
              <Box
                sx={{
                  position: 'relative',
                  height: 180,
                  overflow: 'hidden',
                  bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                }}
              >
                {recipe.image_url ? (
                  <Box
                    component="img"
                    src={recipe.image_url}
                    alt={recipe.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform var(--transition-normal)',
                      '&:hover': { transform: 'scale(1.05)' },
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background:
                        mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(106,76,147,0.15))'
                          : 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(106,76,147,0.08))',
                    }}
                  >
                    <LocalDining
                      sx={{
                        fontSize: 48,
                        color: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                      }}
                    />
                  </Box>
                )}

                {/* Difficulty badge */}
                {recipe.difficulty && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 'var(--radius-sm)',
                      bgcolor: difficultyColors[recipe.difficulty] || 'var(--chef-orange)',
                      color: recipe.difficulty === 'easy' ? 'white' : recipe.difficulty === 'hard' ? 'white' : '#000',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                      letterSpacing: 0.5,
                    }}
                  >
                    {recipe.difficulty}
                  </Box>
                )}
              </Box>

              {/* Content */}
              <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{
                    color: mode === 'dark' ? 'white' : '#000',
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.3,
                  }}
                >
                  {recipe.name}
                </Typography>

                {recipe.description && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                      mb: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontSize: '0.8rem',
                    }}
                  >
                    {recipe.description}
                  </Typography>
                )}

                <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {totalTime > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      {totalTime} min
                    </Typography>
                  )}
                  {totalTime > 0 && recipe.cuisine && (
                    <Box
                      sx={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
                      }}
                    />
                  )}
                  {recipe.cuisine && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                      }}
                    >
                      {recipe.cuisine}
                    </Typography>
                  )}
                  {recipe.servings && (
                    <>
                      <Box
                        sx={{
                          width: 3,
                          height: 3,
                          borderRadius: '50%',
                          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        }}
                      >
                        {recipe.servings} servings
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </GlassCard>
          );
        })}
      </Box>

      {/* Load More */}
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variant="outlined"
            onClick={onLoadMore}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : <ExpandMore />}
            sx={{
              color: 'var(--chef-orange)',
              borderColor: 'var(--chef-orange)',
              fontWeight: 'bold',
              px: 4,
              py: 1.5,
              borderRadius: 'var(--radius-md)',
              '&:hover': {
                borderColor: 'var(--chef-orange)',
                bgcolor: 'rgba(255, 107, 53, 0.08)',
              },
            }}
          >
            {loading ? 'Loading...' : 'Load More Recipes'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default RecipeGrid;
