/* client/src/components/recipes/RecipeCollections.tsx */
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import type { RecipeFiltersState } from './RecipeFilters';

interface Collection {
  id: string;
  title: string;
  emoji: string;
  recipeCount: number;
  gradient: string;
  filterPreset: Partial<RecipeFiltersState>;
}

interface RecipeCollectionsProps {
  onSelectCollection: (filters: Partial<RecipeFiltersState>) => void;
  activeCollectionId?: string;
}

const collections: Collection[] = [
  {
    id: 'quick-weeknight',
    title: 'Quick Weeknight Dinners',
    emoji: '\u23F0',
    recipeCount: 24,
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #F4A460 100%)',
    filterPreset: {
      times: ['Under 30 min'],
      cuisines: [],
      difficulties: ['Easy'],
      dietary: [],
      sort: 'quickest',
    },
  },
  {
    id: 'budget-friendly',
    title: 'Budget-Friendly',
    emoji: '\uD83D\uDCB0',
    recipeCount: 18,
    gradient: 'linear-gradient(135deg, #05AF5C 0%, #FFD93D 100%)',
    filterPreset: {
      cuisines: [],
      times: [],
      difficulties: [],
      dietary: [],
      sort: 'cheapest',
    },
  },
  {
    id: 'kid-approved',
    title: 'Kid-Approved',
    emoji: '\uD83D\uDE0B',
    recipeCount: 15,
    gradient: 'linear-gradient(135deg, #FFD93D 0%, #FF6B35 100%)',
    filterPreset: {
      cuisines: ['American'],
      times: [],
      difficulties: ['Easy'],
      dietary: [],
      sort: 'popular',
    },
  },
  {
    id: 'trending',
    title: 'Trending This Week',
    emoji: '\uD83D\uDD25',
    recipeCount: 12,
    gradient: 'linear-gradient(135deg, #6A4C93 0%, #FF6B35 100%)',
    filterPreset: {
      cuisines: [],
      times: [],
      difficulties: [],
      dietary: [],
      sort: 'popular',
    },
  },
  {
    id: 'healthy',
    title: 'Healthy & Light',
    emoji: '\uD83E\uDD57',
    recipeCount: 20,
    gradient: 'linear-gradient(135deg, #05AF5C 0%, #4ECDC4 100%)',
    filterPreset: {
      cuisines: ['Mediterranean'],
      times: [],
      difficulties: [],
      dietary: ['Vegetarian'],
      sort: 'popular',
    },
  },
  {
    id: 'comfort-food',
    title: 'Comfort Food',
    emoji: '\uD83C\uDF72',
    recipeCount: 16,
    gradient: 'linear-gradient(135deg, #F4A460 0%, #6A4C93 100%)',
    filterPreset: {
      cuisines: ['American', 'Italian'],
      times: [],
      difficulties: [],
      dietary: [],
      sort: 'popular',
    },
  },
];

const RecipeCollections = ({ onSelectCollection, activeCollectionId }: RecipeCollectionsProps) => {
  const { mode } = useTheme();

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 'bold',
          fontFamily: 'var(--font-display)',
          color: mode === 'dark' ? 'white' : '#000',
          mb: 2,
        }}
      >
        Collections
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            height: 4,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            borderRadius: 'var(--radius-full)',
          },
        }}
      >
        {collections.map((collection, index) => {
          const isActive = activeCollectionId === collection.id;

          return (
            <Box
              key={collection.id}
              component={motion.div}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectCollection(collection.filterPreset)}
              sx={{
                scrollSnapAlign: 'start',
                flexShrink: 0,
                width: { xs: 160, sm: 180 },
                height: 120,
                borderRadius: 'var(--radius-lg)',
                background: collection.gradient,
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                p: 2,
                boxShadow: isActive
                  ? '0 8px 32px rgba(255, 107, 53, 0.4), inset 0 0 0 2px rgba(255,255,255,0.4)'
                  : '0 4px 16px rgba(0,0,0,0.15)',
                transition: 'box-shadow var(--transition-normal)',
              }}
            >
              {/* Glass overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.45) 100%)',
                  zIndex: 1,
                }}
              />

              {/* Emoji */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  fontSize: '2rem',
                  zIndex: 2,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              >
                {collection.emoji}
              </Box>

              {/* Content */}
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    lineHeight: 1.2,
                    mb: 0.5,
                    textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {collection.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.7rem',
                  }}
                >
                  {collection.recipeCount} recipes
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default RecipeCollections;
