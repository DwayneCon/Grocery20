/* client/src/components/chat/MealCard.tsx */
import { useState } from 'react';
import { Box, Typography, Chip, Collapse, IconButton, Divider } from '@mui/material';
import { ExpandMore, Timer, AttachMoney, Restaurant, LocalDining, TipsAndUpdates, Storage } from '@mui/icons-material';
import { motion } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import { ParsedMeal } from '../../utils/mealParser';
import { useTheme } from '../../contexts/ThemeContext';

interface MealCardProps {
  meal: ParsedMeal;
  index: number;
}

const MealCard = ({ meal, index }: MealCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const { mode } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard
        intensity="medium"
        hover={false}
        sx={{
          mb: 2,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: mode === 'dark'
              ? '0 12px 40px rgba(78, 205, 196, 0.2)'
              : '0 12px 40px rgba(0, 0, 0, 0.15)',
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Header Section - Always Visible */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Emoji */}
          <Typography sx={{ fontSize: '2.5rem', lineHeight: 1 }}>
            {meal.emoji || '🍽️'}
          </Typography>

          {/* Meal Info */}
          <Box sx={{ flex: 1 }}>
            {/* Day & Meal Type */}
            {(meal.day || meal.mealType) && (
              <Typography
                variant="caption"
                sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 600
                }}
              >
                {meal.day && meal.mealType ? `${meal.day} ${meal.mealType}` : meal.day || meal.mealType}
              </Typography>
            )}

            {/* Meal Name */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: mode === 'dark' ? '#fff' : '#000',
                mb: 0.5
              }}
            >
              {meal.name}
            </Typography>

            {/* Description / Why It Works */}
            {(meal.description || meal.whyItWorks) && (
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                  mb: 1.5,
                  lineHeight: 1.5
                }}
              >
                {meal.whyItWorks || meal.description}
              </Typography>
            )}

            {/* Quick Stats */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {meal.prepTime && (
                <Chip
                  icon={<Timer sx={{ fontSize: '1rem' }} />}
                  label={`Prep: ${meal.prepTime}`}
                  size="small"
                  sx={{
                    bgcolor: mode === 'dark' ? 'rgba(78, 205, 196, 0.2)' : 'rgba(78, 205, 196, 0.3)',
                    color: mode === 'dark' ? '#4ECDC4' : '#2a8d86',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              )}
              {meal.cookTime && (
                <Chip
                  icon={<Timer sx={{ fontSize: '1rem' }} />}
                  label={`Cook: ${meal.cookTime}`}
                  size="small"
                  sx={{
                    bgcolor: mode === 'dark' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 107, 107, 0.3)',
                    color: mode === 'dark' ? '#FF6B6B' : '#d63333',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              )}
              {meal.cost && (
                <Chip
                  icon={<AttachMoney sx={{ fontSize: '1rem' }} />}
                  label={`$${meal.cost}`}
                  size="small"
                  sx={{
                    bgcolor: mode === 'dark' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.3)',
                    color: mode === 'dark' ? '#667eea' : '#4451c2',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              )}
              {meal.difficulty && (
                <Chip
                  label={meal.difficulty}
                  size="small"
                  sx={{
                    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'capitalize'
                  }}
                />
              )}
              {meal.servings && (
                <Chip
                  icon={<Restaurant sx={{ fontSize: '1rem' }} />}
                  label={`Serves ${meal.servings}`}
                  size="small"
                  sx={{
                    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Expand Icon */}
          <IconButton
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
              color: mode === 'dark' ? '#4ECDC4' : '#2a8d86'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <ExpandMore />
          </IconButton>
        </Box>

        {/* Expanded Content */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2, borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

          {/* Ingredients */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <LocalDining sx={{ color: '#4ECDC4', fontSize: '1.2rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: mode === 'dark' ? '#fff' : '#000' }}>
                  Ingredients
                </Typography>
              </Box>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {meal.ingredients.map((ingredient, idx) => (
                  <Typography
                    key={idx}
                    component="li"
                    variant="body2"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                      mb: 0.5,
                      lineHeight: 1.6
                    }}
                  >
                    {ingredient}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {/* Instructions */}
          {meal.instructions && meal.instructions.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Restaurant sx={{ color: '#FF6B6B', fontSize: '1.2rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: mode === 'dark' ? '#fff' : '#000' }}>
                  Instructions
                </Typography>
              </Box>
              <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
                {meal.instructions.map((instruction, idx) => (
                  <Typography
                    key={idx}
                    component="li"
                    variant="body2"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                      mb: 1,
                      lineHeight: 1.6
                    }}
                  >
                    {instruction}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {/* Pro Tips */}
          {meal.proTips && meal.proTips.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <TipsAndUpdates sx={{ color: '#667eea', fontSize: '1.2rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: mode === 'dark' ? '#fff' : '#000' }}>
                  Pro Tips
                </Typography>
              </Box>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {meal.proTips.map((tip, idx) => (
                  <Typography
                    key={idx}
                    component="li"
                    variant="body2"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                      mb: 0.5,
                      lineHeight: 1.6
                    }}
                  >
                    {tip}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {/* Storage Info */}
          {meal.storage && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Storage sx={{ color: '#4ECDC4', fontSize: '1.2rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: mode === 'dark' ? '#fff' : '#000' }}>
                  Storage
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                  lineHeight: 1.6
                }}
              >
                {meal.storage}
              </Typography>
            </Box>
          )}

          {/* Nutrition */}
          {meal.nutrition && (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                  fontStyle: 'italic'
                }}
              >
                {meal.nutrition}
              </Typography>
            </Box>
          )}
        </Collapse>
      </GlassCard>
    </motion.div>
  );
};

export default MealCard;
