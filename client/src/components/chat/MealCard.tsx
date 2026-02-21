/* client/src/components/chat/MealCard.tsx */
import { useState } from 'react';
import { Box, Typography, Chip, Collapse, IconButton, Divider } from '@mui/material';
import { ExpandMore, Timer, AttachMoney, Restaurant, LocalDining, TipsAndUpdates, Storage, CheckCircle, Cancel, SwipeRight } from '@mui/icons-material';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { ParsedMeal } from '../../utils/mealParser';
import { useTheme } from '../../contexts/ThemeContext';

interface MealCardProps {
  meal: ParsedMeal;
  index: number;
  onAccept?: (meal: ParsedMeal) => void;
  onReject?: (meal: ParsedMeal) => void;
  accentColor?: string;
}

const MealCard = ({ meal, index, onAccept, onReject, accentColor = '#4ECDC4' }: MealCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const { mode } = useTheme();

  // Motion values for swipe
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Indicator opacity
  const acceptOpacity = useTransform(x, [0, 100], [0, 1]);
  const rejectOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 150;

    if (info.offset.x > threshold) {
      setSwiped(true);
      if (onAccept) setTimeout(() => onAccept(meal), 300);
    } else if (info.offset.x < -threshold) {
      setSwiped(true);
      if (onReject) setTimeout(() => onReject(meal), 300);
    } else {
      x.set(0);
    }
  };

  if (swiped) return null;

  // Card background based on mode and accent color
  const cardBg = mode === 'dark'
    ? `linear-gradient(135deg, rgba(20, 20, 30, 0.85) 0%, rgba(30, 30, 45, 0.9) 100%)`
    : `linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 250, 255, 0.95) 100%)`;

  const cardBorder = mode === 'dark'
    ? `1px solid ${accentColor}30`
    : `1px solid ${accentColor}25`;

  return (
    <Box sx={{ position: 'relative', mb: 1 }}>
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
          px: 2, py: 1,
          borderRadius: '12px',
          border: '2px solid #4CAF50',
        }}>
          <CheckCircle sx={{ fontSize: '2rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>YES</Typography>
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
          px: 2, py: 1,
          borderRadius: '12px',
          border: '2px solid #F44336',
        }}>
          <Cancel sx={{ fontSize: '2rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>NO</Typography>
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
        <Box
          sx={{
            background: cardBg,
            backdropFilter: 'blur(24px) saturate(180%)',
            border: cardBorder,
            borderRadius: '20px',
            p: 2.5,
            position: 'relative',
            overflow: 'visible',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            boxShadow: mode === 'dark'
              ? `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 ${accentColor}15`
              : `0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 ${accentColor}20`,
            transition: 'box-shadow 0.3s ease',
            '&:active': { cursor: 'grabbing' },
            '&:hover': {
              boxShadow: mode === 'dark'
                ? `0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px ${accentColor}40`
                : `0 8px 28px rgba(0, 0, 0, 0.12), 0 0 0 1px ${accentColor}30`,
            },
            // Subtle accent stripe at top
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '20px',
              right: '20px',
              height: '3px',
              borderRadius: '0 0 3px 3px',
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
            },
          }}
        >
          {/* Header Section */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Emoji */}
            <Typography sx={{ fontSize: '2.2rem', lineHeight: 1, mt: 0.5 }}>
              {meal.emoji || '🍽️'}
            </Typography>

            {/* Meal Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Meal Type Label */}
              {meal.mealType && (
                <Typography
                  variant="caption"
                  sx={{
                    color: accentColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                  }}
                >
                  {meal.mealType}
                </Typography>
              )}

              {/* Meal Name */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: mode === 'dark' ? '#fff' : '#1a1a2e',
                  mb: 0.5,
                  fontSize: '1rem',
                  lineHeight: 1.3,
                }}
              >
                {meal.name}
              </Typography>

              {/* Description / Why It Works */}
              {(meal.description || meal.whyItWorks) && (
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)',
                    mb: 1.5,
                    lineHeight: 1.5,
                    fontSize: '0.85rem',
                  }}
                >
                  {meal.whyItWorks || meal.description}
                </Typography>
              )}

              {/* Quick Stats - Chips */}
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {meal.prepTime && (
                  <Chip
                    icon={<Timer sx={{ fontSize: '0.85rem !important' }} />}
                    label={`Prep: ${meal.prepTime}`}
                    size="small"
                    sx={{
                      height: 26,
                      bgcolor: mode === 'dark' ? 'rgba(78, 205, 196, 0.15)' : 'rgba(78, 205, 196, 0.12)',
                      color: mode === 'dark' ? '#4ECDC4' : '#2a8d86',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      '& .MuiChip-icon': { color: 'inherit' },
                    }}
                  />
                )}
                {meal.cookTime && (
                  <Chip
                    icon={<Timer sx={{ fontSize: '0.85rem !important' }} />}
                    label={`Cook: ${meal.cookTime}`}
                    size="small"
                    sx={{
                      height: 26,
                      bgcolor: mode === 'dark' ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255, 107, 107, 0.12)',
                      color: mode === 'dark' ? '#FF6B6B' : '#d63333',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      '& .MuiChip-icon': { color: 'inherit' },
                    }}
                  />
                )}
                {meal.cost && (
                  <Chip
                    icon={<AttachMoney sx={{ fontSize: '0.85rem !important' }} />}
                    label={`$${meal.cost}`}
                    size="small"
                    sx={{
                      height: 26,
                      bgcolor: mode === 'dark' ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.12)',
                      color: mode === 'dark' ? '#667eea' : '#4451c2',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      '& .MuiChip-icon': { color: 'inherit' },
                    }}
                  />
                )}
                {meal.difficulty && (
                  <Chip
                    label={meal.difficulty}
                    size="small"
                    sx={{
                      height: 26,
                      bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      textTransform: 'capitalize',
                    }}
                  />
                )}
                {meal.servings && (
                  <Chip
                    icon={<Restaurant sx={{ fontSize: '0.85rem !important' }} />}
                    label={`Serves ${meal.servings}`}
                    size="small"
                    sx={{
                      height: 26,
                      bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      '& .MuiChip-icon': { color: 'inherit' },
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
                color: accentColor,
                flexShrink: 0,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              size="small"
            >
              <ExpandMore />
            </IconButton>
          </Box>

          {/* Swipe Hint */}
          {!expanded && (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
                mt: 1.5,
                pt: 1,
                borderTop: mode === 'dark'
                  ? '1px solid rgba(255,255,255,0.06)'
                  : '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <SwipeRight sx={{
                fontSize: '0.9rem',
                color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
              }} />
              <Typography
                variant="caption"
                sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              >
                Swipe right to accept, left to skip
              </Typography>
            </Box>
          )}

          {/* Expanded Content */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{
              my: 2,
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            }} />

            {/* Ingredients */}
            {meal.ingredients && meal.ingredients.length > 0 && (
              <Box sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocalDining sx={{ color: '#4ECDC4', fontSize: '1.1rem' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#fff' : '#1a1a2e' }}>
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
                        color: mode === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)',
                        mb: 0.3,
                        lineHeight: 1.5,
                        fontSize: '0.85rem',
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
              <Box sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Restaurant sx={{ color: '#FF6B6B', fontSize: '1.1rem' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#fff' : '#1a1a2e' }}>
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
                        color: mode === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)',
                        mb: 0.5,
                        lineHeight: 1.5,
                        fontSize: '0.85rem',
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TipsAndUpdates sx={{ color: '#667eea', fontSize: '1.1rem' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#fff' : '#1a1a2e' }}>
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
                        color: mode === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)',
                        mb: 0.3,
                        lineHeight: 1.5,
                        fontSize: '0.85rem',
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Storage sx={{ color: '#4ECDC4', fontSize: '1.1rem' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#fff' : '#1a1a2e' }}>
                    Storage
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)',
                    lineHeight: 1.5,
                    fontSize: '0.85rem',
                  }}
                >
                  {meal.storage}
                </Typography>
              </Box>
            )}

            {/* Nutrition */}
            {meal.nutrition && (
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  fontStyle: 'italic',
                  fontSize: '0.8rem',
                }}
              >
                {meal.nutrition}
              </Typography>
            )}
          </Collapse>
        </Box>
      </motion.div>
    </Box>
  );
};

export default MealCard;
