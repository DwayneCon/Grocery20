/* client/src/components/chat/MealCard.tsx */
import { useState } from 'react';
import { Box, Typography, Chip, Collapse, IconButton, Divider } from '@mui/material';
import { ExpandMore, Timer, AttachMoney, Restaurant, LocalDining, TipsAndUpdates, Storage, CheckCircle, Cancel } from '@mui/icons-material';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import { ParsedMeal } from '../../utils/mealParser';
import { useTheme } from '../../contexts/ThemeContext';

interface MealCardProps {
  meal: ParsedMeal;
  index: number;
  onAccept?: (meal: ParsedMeal) => void;
  onReject?: (meal: ParsedMeal) => void;
}

const MealCard = ({ meal, index, onAccept, onReject }: MealCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const { mode } = useTheme();

  // Motion values for swipe
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-20, 0, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Indicator opacity
  const acceptOpacity = useTransform(x, [0, 100], [0, 1]);
  const rejectOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 150;

    if (info.offset.x > threshold) {
      // Swiped right - Accept
      setSwiped(true);
      if (onAccept) {
        setTimeout(() => onAccept(meal), 300);
      }
    } else if (info.offset.x < -threshold) {
      // Swiped left - Reject
      setSwiped(true);
      if (onReject) {
        setTimeout(() => onReject(meal), 300);
      }
    } else {
      // Snap back
      x.set(0);
    }
  };

  if (swiped) {
    return null;
  }

  return (
    <Box sx={{ position: 'relative', mb: 2 }}>
      {/* Accept Indicator - Right side */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          right: 20,
          transform: 'translateY(-50%)',
          opacity: acceptOpacity,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'rgba(76, 175, 80, 0.2)',
          color: '#4CAF50',
          px: 2,
          py: 1,
          borderRadius: '12px',
          border: '2px solid #4CAF50',
        }}>
          <CheckCircle sx={{ fontSize: '2rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            YES
          </Typography>
        </Box>
      </motion.div>

      {/* Reject Indicator - Left side */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: 20,
          transform: 'translateY(-50%)',
          opacity: rejectOpacity,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'rgba(244, 67, 54, 0.2)',
          color: '#F44336',
          px: 2,
          py: 1,
          borderRadius: '12px',
          border: '2px solid #F44336',
        }}>
          <Cancel sx={{ fontSize: '2rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            NO
          </Typography>
        </Box>
      </motion.div>

      {/* Swipeable Card */}
      <motion.div
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
        transition={{ delay: index * 0.1 }}
      >
        <GlassCard
          intensity="medium"
          hover={false}
          sx={{
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            '&:active': {
              cursor: 'grabbing',
            },
          }}
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
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ExpandMore />
          </IconButton>
        </Box>

        {/* Swipe Hint */}
        {!expanded && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            mt: 1,
            opacity: 0.5,
          }}>
            <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              ← Swipe to decide →
            </Typography>
          </Box>
        )}

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
    </Box>
  );
};

export default MealCard;
