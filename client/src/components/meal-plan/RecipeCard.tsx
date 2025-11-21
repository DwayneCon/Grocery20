/* client/src/components/meal-plan/RecipeCard.tsx */
import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Divider,
} from '@mui/material';
import {
  AccessTime,
  LocalFireDepartment,
  Share,
  Favorite,
  FavoriteBorder,
  Timer,
  ChevronLeft,
  ChevronRight,
  Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../common/GlassCard';

interface Recipe {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  ingredients?: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions?: string[];
  tags?: string[];
}

interface RecipeCardProps {
  recipe: Recipe;
  onShare?: () => void;
}

const RecipeCard = ({ recipe, onShare }: RecipeCardProps) => {
  const [liked, setLiked] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = recipe.images || [
    'https://via.placeholder.com/400x300?text=Recipe+Image',
  ];

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const startTimer = () => {
    // You can implement actual timer functionality here
    console.log('Starting timer for', recipe.name);
  };

  const difficultyColors = {
    easy: '#4ECDC4',
    medium: '#FFE66D',
    hard: '#FF6B6B',
  };

  return (
    <>
      <GlassCard
        intensity="medium"
        component={motion.div}
        whileHover={{ y: -8 }}
        sx={{ height: '100%', p: 0, overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => setDetailsOpen(true)}
      >
        {/* Image Carousel */}
        <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={images[currentImageIndex]}
              alt={recipe.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </AnimatePresence>

          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <ChevronRight />
              </IconButton>

              {/* Image Indicators */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 1,
                }}
              >
                {images.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.3s',
                    }}
                  />
                ))}
              </Box>
            </>
          )}

          {/* Favorite Button */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: liked ? '#FF6B6B' : 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            {liked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
            {recipe.name}
          </Typography>

          {recipe.description && (
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {recipe.description}
            </Typography>
          )}

          {/* Chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {recipe.prepTime && (
              <Chip
                icon={<AccessTime sx={{ "&&": { color: 'white' } }} />}
                label={`${recipe.prepTime}m prep`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
              />
            )}
            {recipe.nutrition?.calories && (
              <Chip
                icon={<LocalFireDepartment sx={{ "&&": { color: '#FFE66D' } }} />}
                label={`${recipe.nutrition.calories} cal`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
              />
            )}
            {recipe.difficulty && (
              <Chip
                label={recipe.difficulty}
                size="small"
                sx={{
                  bgcolor: difficultyColors[recipe.difficulty],
                  color: 'black',
                  fontWeight: 'bold',
                }}
              />
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Timer />}
              onClick={(e) => {
                e.stopPropagation();
                startTimer();
              }}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'white' },
              }}
            >
              Timer
            </Button>
            {onShare && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Share />}
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': { borderColor: 'white' },
                }}
              >
                Share
              </Button>
            )}
          </Box>
        </Box>
      </GlassCard>

      {/* Full Recipe Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>
            {recipe.name}
          </Typography>
          <IconButton onClick={() => setDetailsOpen(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {recipe.description && (
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
              {recipe.description}
            </Typography>
          )}

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Ingredients
              </Typography>
              <Grid container spacing={1} sx={{ mb: 3 }}>
                {recipe.ingredients.map((ing, idx) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                    <Chip
                      label={`${ing.amount} ${ing.unit} ${ing.name}`}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', width: '100%', justifyContent: 'flex-start' }}
                    />
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          {recipe.instructions && recipe.instructions.length > 0 && (
            <>
              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Instructions
              </Typography>
              {recipe.instructions.map((step, idx) => (
                <Box key={idx} sx={{ mb: 2, display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: '#4ECDC4',
                      color: 'black',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', pt: 0.5 }}>
                    {step}
                  </Typography>
                </Box>
              ))}
            </>
          )}

          {recipe.nutrition && (
            <>
              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Nutrition Facts
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(recipe.nutrition).map(([key, value]) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={key}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.05)',
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                        {value}{key === 'calories' ? '' : 'g'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>
                        {key}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button onClick={startTimer} startIcon={<Timer />} sx={{ color: 'white' }}>
            Start Timer
          </Button>
          <Button onClick={() => setDetailsOpen(false)} sx={{ color: 'white' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecipeCard;
