/* client/src/pages/RecipesPage.tsx */
import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import RecipeCollections from '../components/recipes/RecipeCollections';
import RecipeFilters, { RecipeFiltersState } from '../components/recipes/RecipeFilters';
import RecipeGrid from '../components/recipes/RecipeGrid';
import { RoundedSkeleton, TextSkeleton } from '../components/common/Skeleton';
import AuroraBackground from '../components/common/AuroraBackground';
import { recipeService, Recipe, GetRecipesParams } from '../services/recipeService';
import { logger } from '../utils/logger';

const PAGE_SIZE = 12;

const defaultFilters: RecipeFiltersState = {
  search: '',
  cuisines: [],
  times: [],
  difficulties: [],
  dietary: [],
  sort: 'popular',
};

const RecipesPage = () => {
  const { mode } = useTheme();

  const [filters, setFilters] = useState<RecipeFiltersState>(defaultFilters);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeCollectionId, setActiveCollectionId] = useState<string | undefined>();

  // Build API params from filter state
  const buildParams = useCallback(
    (currentFilters: RecipeFiltersState): GetRecipesParams => {
      const params: GetRecipesParams = {};

      if (currentFilters.search) {
        params.search = currentFilters.search;
      }

      // Use first selected cuisine if any
      if (currentFilters.cuisines.length > 0) {
        params.cuisine = currentFilters.cuisines[0];
      }

      // Map difficulty filter
      if (currentFilters.difficulties.length > 0) {
        const diffMap: Record<string, 'easy' | 'medium' | 'hard'> = {
          Easy: 'easy',
          Medium: 'medium',
          Hard: 'hard',
        };
        const first = currentFilters.difficulties[0];
        if (diffMap[first]) {
          params.difficulty = diffMap[first];
        }
      }

      // Map time filter to maxTime
      if (currentFilters.times.length > 0) {
        const first = currentFilters.times[0];
        if (first === 'Under 30 min') params.maxTime = 30;
        else if (first === '30-60 min') params.maxTime = 60;
        // '1+ hour' has no maxTime limit
      }

      return params;
    },
    []
  );

  // Fetch recipes
  const fetchRecipes = useCallback(
    async (currentFilters: RecipeFiltersState, pageNum: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const params = buildParams(currentFilters);
        const response = await recipeService.getRecipes(params);

        if (response.success) {
          const allRecipes = response.recipes || [];

          // Client-side pagination since the API returns all results
          const startIdx = pageNum * PAGE_SIZE;
          const endIdx = startIdx + PAGE_SIZE;
          const pageRecipes = allRecipes.slice(startIdx, endIdx);

          if (append) {
            setRecipes((prev) => [...prev, ...pageRecipes]);
          } else {
            setRecipes(allRecipes.slice(0, PAGE_SIZE));
          }

          setHasMore(endIdx < allRecipes.length);
        } else {
          if (!append) setRecipes([]);
          setHasMore(false);
        }
      } catch (err) {
        logger.error('Failed to fetch recipes', err as Error);
        if (!append) setRecipes([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildParams]
  );

  // Fetch on mount and when filters change
  useEffect(() => {
    setPage(0);
    fetchRecipes(filters, 0, false);
  }, [filters, fetchRecipes]);

  // Handle load more
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecipes(filters, nextPage, true);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: RecipeFiltersState) => {
    setActiveCollectionId(undefined);
    setFilters(newFilters);
  };

  // Handle collection selection
  const handleSelectCollection = (preset: Partial<RecipeFiltersState>) => {
    const newFilters: RecipeFiltersState = {
      ...defaultFilters,
      ...preset,
      search: '',
    };
    setFilters(newFilters);
    // Find matching collection for active state
    // We set it based on the preset sort + filters combo
    // This is a simple approach; could also pass the collection id
    setActiveCollectionId(undefined);
  };

  // Aurora colors
  const auroraColors =
    mode === 'dark'
      ? ['#FF6B35', '#F4A460', '#6A4C93', '#05AF5C', '#FFD93D']
      : ['#FFDDC1', '#FFEDBC', '#E8D5F2', '#C1F7DC', '#FFF9D6'];

  // Loading skeleton
  if (loading && recipes.length === 0) {
    return (
      <AuroraBackground colors={auroraColors} speed={30}>
        <Box sx={{ p: { xs: 2, md: 6 }, maxWidth: '100%', mx: 'auto' }}>
          {/* Header skeleton */}
          <Box sx={{ mb: 4 }}>
            <TextSkeleton
              width="120px"
              height="16px"
              sx={{ mb: 1 }}
            />
            <TextSkeleton
              width="280px"
              height="48px"
            />
          </Box>

          {/* Collections skeleton */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4, overflowX: 'hidden' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <RoundedSkeleton
                key={i}
                width="180px"
                height="120px"
                sx={{ flexShrink: 0, borderRadius: 'var(--radius-lg)' }}
              />
            ))}
          </Box>

          {/* Filters skeleton */}
          <RoundedSkeleton
            height="200px"
            sx={{ mb: 4, borderRadius: 'var(--radius-xl)' }}
          />

          {/* Grid skeleton */}
          <Grid container spacing={3}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                <RoundedSkeleton
                  height="280px"
                  sx={{ borderRadius: 'var(--radius-xl)' }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground colors={auroraColors} speed={30}>
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        sx={{
          p: { xs: 2, md: 6 },
          position: 'relative',
          zIndex: 2,
          maxWidth: '100%',
          mx: 'auto',
        }}
      >
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="overline"
            component={motion.div}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            sx={{
              color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              letterSpacing: 2,
              fontWeight: 'bold',
            }}
          >
            DISCOVER
          </Typography>
          <Typography
            variant="h2"
            component={motion.div}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            fontWeight="900"
            sx={{
              fontFamily: 'var(--font-display)',
              background:
                mode === 'dark'
                  ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                  : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Recipes
          </Typography>
        </Box>

        {/* Collections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RecipeCollections
            onSelectCollection={handleSelectCollection}
            activeCollectionId={activeCollectionId}
          />
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <RecipeFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </motion.div>

        {/* Recipe Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RecipeGrid
            recipes={recipes}
            loading={loadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        </motion.div>
      </Box>
    </AuroraBackground>
  );
};

export default RecipesPage;
