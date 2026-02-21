/* client/src/components/common/EmptyState.tsx */

import { Box, Typography, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import {
  RestaurantMenu,
  ShoppingCart,
  LocalDining,
  CheckCircleOutline,
  EventNote,
  Inventory2,
} from '@mui/icons-material';

export interface EmptyStateProps {
  variant:
    | 'no-meals'
    | 'no-shopping-list'
    | 'no-recipes'
    | 'no-achievements'
    | 'empty-week'
    | 'empty-inventory';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const emptyStateConfig = {
  'no-meals': {
    icon: RestaurantMenu,
    defaultTitle: 'No meals planned yet',
    defaultDescription: 'Start a conversation with Nora to create your personalized meal plan!',
    actionLabel: 'Start Planning',
    color: '#FF6B35', // Chef Orange
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #F4A460 100%)',
  },
  'no-shopping-list': {
    icon: ShoppingCart,
    defaultTitle: 'Your shopping list is empty',
    defaultDescription:
      'Add some meals to your plan and we\'ll automatically create a shopping list for you.',
    actionLabel: 'Plan Meals',
    color: '#05AF5C', // Basil Green
    gradient: 'linear-gradient(135deg, #05AF5C 0%, #FFD93D 100%)',
  },
  'no-recipes': {
    icon: LocalDining,
    defaultTitle: 'No recipes saved yet',
    defaultDescription:
      'Discover delicious recipes by chatting with Nora or browsing your meal plans.',
    actionLabel: 'Discover Recipes',
    color: '#F4A460', // Honey Gold
    gradient: 'linear-gradient(135deg, #F4A460 0%, #FFD93D 100%)',
  },
  'no-achievements': {
    icon: CheckCircleOutline,
    defaultTitle: 'Your journey begins here!',
    defaultDescription:
      'Complete your first meal plan to unlock achievements and track your progress.',
    actionLabel: 'Get Started',
    color: '#6A4C93', // Plum Wine
    gradient: 'linear-gradient(135deg, #6A4C93 0%, #FF6B35 100%)',
  },
  'empty-week': {
    icon: EventNote,
    defaultTitle: 'Your week is wide open!',
    defaultDescription:
      'Let\'s fill it with delicious meals your family will love. Start by telling Nora about your preferences.',
    actionLabel: 'Start Planning',
    color: '#FFD93D', // Citrus Yellow
    gradient: 'linear-gradient(135deg, #FFD93D 0%, #F4A460 100%)',
  },
  'empty-inventory': {
    icon: Inventory2,
    defaultTitle: 'Your pantry is empty',
    defaultDescription:
      'Track what you have at home to get personalized meal suggestions using your existing ingredients.',
    actionLabel: 'Add Items',
    color: '#05AF5C', // Basil Green
    gradient: 'linear-gradient(135deg, #05AF5C 0%, #FFD93D 100%)',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const config = emptyStateConfig[variant];
  const IconComponent = config.icon;

  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;
  const displayActionLabel = actionLabel || config.actionLabel;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        py: 8,
        px: 4,
        textAlign: 'center',
      }}
    >
      <Stack spacing={4} alignItems="center" maxWidth="500px">
        {/* Animated Icon with Gradient Background */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            duration: 0.6,
          }}
        >
          <Box
            sx={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: config.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 32px ${config.color}40`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '50%',
              },
            }}
          >
            <IconComponent
              sx={{
                fontSize: 80,
                color: 'white',
                position: 'relative',
                zIndex: 1,
              }}
            />
          </Box>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontFamily: '"Clash Display", sans-serif',
              background: config.gradient,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            {displayTitle}
          </Typography>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: '1.1rem',
              lineHeight: 1.7,
              maxWidth: '400px',
            }}
          >
            {displayDescription}
          </Typography>
        </motion.div>

        {/* Action Button */}
        {onAction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={onAction}
              sx={{
                background: config.gradient,
                color: 'white',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: `0 4px 20px ${config.color}40`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: config.gradient,
                  boxShadow: `0 6px 28px ${config.color}60`,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {displayActionLabel}
            </Button>
          </motion.div>
        )}

        {/* Decorative Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            opacity: 0.03,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <IconComponent sx={{ fontSize: 600, color: config.color }} />
          </motion.div>
        </Box>
      </Stack>
    </Box>
  );
};

export default EmptyState;
