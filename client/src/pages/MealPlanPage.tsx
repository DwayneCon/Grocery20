/* client/src/pages/MealPlanPage.tsx */
import { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Button, CircularProgress, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Divider, Tabs, Tab } from '@mui/material';

import { AccessTime, LocalFireDepartment, Refresh, ArrowForward, Add, Restaurant, StarRate, ShoppingCartOutlined } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import { sanitizeText } from '../utils/sanitize';
import { mealPlanService, MealPlanMeal } from '../services/mealPlanService';
import { aiService } from '../services/aiService';
import recipeService, { RatingStats } from '../services/recipeService';
import RecipeRating from '../components/recipes/RecipeRating';
import RateRecipeDialog from '../components/recipes/RateRecipeDialog';
import RecipeReviews from '../components/recipes/RecipeReviews';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../features/store';
import ServingScaler from '../components/recipes/ServingScaler';
import IngredientSubstitutionPanel from '../components/recipes/IngredientSubstitutionPanel';
import { Substitution } from '../utils/ingredientSubstitutions';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { logger } from '../utils/logger';

interface ParsedMealNotes {
  name?: string;
  description?: string;
  ingredients?: any[];
  instructions?: string[];
  prepTime?: number;
  cookTime?: number;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  difficulty?: string;
  tags?: string[];
  tips?: string;
}

const MealPlanPage = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [meals, setMeals] = useState<MealPlanMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealPlanMeal | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editServings, setEditServings] = useState(4);
  const [substitutions, setSubstitutions] = useState<Map<string, Substitution>>(new Map());
  const [substitutionAnchorEl, setSubstitutionAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<{ name: string; amount: string; unit: string } | null>(null);
  const [savingRecipe, setSavingRecipe] = useState(false);

  // Load current week's meal plan
  useEffect(() => {
    if (user?.householdId) {
      loadMealPlan();
    }
  }, [user?.householdId]);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      setError(null);

      const householdId = user?.householdId;

      if (!householdId) {
        setError('No household found. Please set up your household first.');
        setLoading(false);
        return;
      }

      const response = await mealPlanService.getCurrentWeekPlan(householdId);

      if (response.success && response.mealPlan) {
        setMealPlan(response.mealPlan);
        setMeals(response.mealPlan.meals || []);
      } else {
        setMealPlan(null);
        setMeals([]);
      }
    } catch (err: any) {
      logger.error('Error loading meal plan', err instanceof Error ? err : undefined);
      setError(err.response?.data?.error || err.message || 'Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMealPlan = async () => {
    try {
      setGenerating(true);
      setError(null);

      const householdId = user?.householdId;

      if (!householdId) {
        setError('No household found. Please set up your household first.');
        return;
      }

      // Generate meal plan using AI
      const response = await aiService.generateMealPlan({
        householdId,
        days: 7,
      });

      if (response.success) {
        // Reload the meal plan
        await loadMealPlan();
      }
    } catch (err: any) {
      logger.error('Error generating meal plan', err instanceof Error ? err : undefined);
      setError(err.response?.data?.error || err.message || 'Failed to generate meal plan');
    } finally {
      setGenerating(false);
    }
  };

  // Normalize any date value to a YYYY-MM-DD string
  const normalizeDateStr = (date: any): string => {
    if (!date) return '';
    const str = typeof date === 'string' ? date : new Date(date).toISOString();
    return str.split('T')[0];
  };

  // Compute the 7 days of the plan from week_start
  const getPlanDays = () => {
    if (!mealPlan?.week_start) return [];
    const startStr = normalizeDateStr(mealPlan.week_start);
    if (!startStr) return [];
    // Parse at noon to avoid timezone drift
    const start = new Date(startStr + 'T12:00:00');
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
  };

  // Match meals by date string (no timezone issues)
  const getMealsByDate = (dateStr: string) => {
    return meals.filter(meal => normalizeDateStr(meal.meal_date) === dateStr);
  };

  const getMealByDateAndType = (dateStr: string, mealType: string) => {
    return getMealsByDate(dateStr).find(
      m => m.meal_type.toLowerCase() === mealType.toLowerCase()
    );
  };

  const parseMealNotes = (notes: any): ParsedMealNotes => {
    if (typeof notes === 'string') {
      try {
        return JSON.parse(notes);
      } catch {
        return { name: notes };
      }
    }
    return notes || {};
  };

  const loadRecipeRatings = async (recipeId: string) => {
    try {
      setLoadingRatings(true);
      const response = await recipeService.getRecipeRatings(recipeId, 5, 0);
      if (response.success) {
        setRatingStats(response.data.stats);
      }
    } catch (err) {
      logger.error('Error loading ratings', err instanceof Error ? err : undefined);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleMealClick = (meal: MealPlanMeal) => {
    setSelectedMeal(meal);
    setDetailsOpen(true);
    setActiveTab(0);
    // Load ratings for this meal (using meal ID as recipe ID)
    if (meal.id) {
      loadRecipeRatings(meal.id);
    }
  };

  const handleRatingSubmitted = () => {
    // Reload ratings after submission
    if (selectedMeal?.id) {
      loadRecipeRatings(selectedMeal.id);
    }
  };

  const handleEditToggle = () => {
    if (!editMode && selectedMeal) {
      const mealData = parseMealNotes(selectedMeal.notes);
      setEditServings(mealData.cookTime ? (selectedMeal as any).servings || 4 : 4);
      setSubstitutions(new Map());
    }
    setEditMode(!editMode);
  };

  const handleIngredientClick = (event: React.MouseEvent<HTMLElement>, ingredient: { name: string; amount: string; unit: string }) => {
    if (!editMode) return;
    setSelectedIngredient(ingredient);
    setSubstitutionAnchorEl(event.currentTarget);
  };

  const handleSubstitute = (original: string, sub: Substitution) => {
    setSubstitutions(prev => new Map(prev).set(original, sub));
    setSubstitutionAnchorEl(null);
    setSelectedIngredient(null);
  };

  const handleAskNora = (ingredientName: string) => {
    setSubstitutionAnchorEl(null);
    setSelectedIngredient(null);
    setDetailsOpen(false);
    navigate('/chat', { state: { prefill: `Can you suggest a substitute for ${ingredientName}?` } });
  };

  const getScaledAmount = (amount: string, baseServings: number) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    const scaled = (num * editServings) / baseServings;
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
  };

  const handleSaveAsNewRecipe = async () => {
    if (!selectedMeal) return;
    const mealData = parseMealNotes(selectedMeal.notes);
    setSavingRecipe(true);
    try {
      const baseServings = (selectedMeal as any).servings || 4;
      const modifiedIngredients = (mealData.ingredients || []).map((ing: any) => {
        const sub = substitutions.get(ing.name);
        return {
          name: sub ? sub.substitute : ing.name,
          amount: getScaledAmount(ing.amount, baseServings),
          unit: ing.unit,
          notes: sub ? `Substituted from ${ing.name} (${sub.ratio})` : ing.notes,
        };
      });

      await recipeService.createRecipe({
        name: `${mealData.name || 'Recipe'} (Modified)`,
        description: mealData.description,
        prepTime: mealData.prepTime,
        cookTime: mealData.cookTime,
        servings: editServings,
        difficulty: mealData.difficulty,
        ingredients: modifiedIngredients,
        instructions: mealData.instructions,
        nutritionInfo: mealData.nutrition,
      });

      setEditMode(false);
      setError(null);
      // Show success - could use a snackbar
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save recipe');
    } finally {
      setSavingRecipe(false);
    }
  };

  const renderMealCard = (dateStr: string, mealType: string, index: number) => {
    const meal = getMealByDateAndType(dateStr, mealType);
    const mealData = meal ? parseMealNotes(meal.notes) : null;

    return (
      <Grid size={{ xs: 12, md: 4 }} key={mealType}>
        <GlassCard
          intensity="ultra"
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => meal && handleMealClick(meal)}
          sx={{
            height: '100%',
            cursor: meal ? 'pointer' : 'default',
            background: meal
              ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))'
              : 'linear-gradient(135deg, rgba(100,100,100,0.08), rgba(100,100,100,0.02))',
            opacity: meal ? 1 : 0.6,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#4ECDC4', letterSpacing: 1, fontWeight: 'bold' }}>
              {mealType.toUpperCase()}
            </Typography>
            {meal && <ArrowForward sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: 16 }} />}
          </Box>

          <Typography variant="h6" fontWeight="bold" sx={{ color: mode === 'dark' ? 'white' : '#000000', mb: 1 }}>
            {meal && (mealData?.name || meal.recipe_name)
              ? sanitizeText(mealData?.name || meal.recipe_name || '')
              : 'No meal planned'}
          </Typography>

          {meal && mealData?.description && (
            <Typography variant="body2" sx={{
              color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {mealData.description}
            </Typography>
          )}

          {meal && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(mealData?.prepTime || meal.prep_time) && (
                <Chip
                  icon={<AccessTime sx={{ "&&": { color: mode === 'dark' ? 'white' : '#000000' } }} />}
                  label={`${mealData?.prepTime || meal.prep_time}m prep`}
                  size="small"
                  sx={{ bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: mode === 'dark' ? 'white' : '#000000' }}
                />
              )}
              {mealData?.cookTime && (
                <Chip
                  icon={<AccessTime sx={{ "&&": { color: mode === 'dark' ? 'white' : '#000000' } }} />}
                  label={`${mealData.cookTime}m cook`}
                  size="small"
                  sx={{ bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: mode === 'dark' ? 'white' : '#000000' }}
                />
              )}
              {mealData?.nutrition?.calories && (
                <Chip
                  icon={<LocalFireDepartment sx={{ "&&": { color: '#FFE66D' } }} />}
                  label={`${mealData.nutrition.calories} kcal`}
                  size="small"
                  sx={{ bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: mode === 'dark' ? 'white' : '#000000' }}
                />
              )}
              {mealData?.difficulty && (
                <Chip
                  label={mealData.difficulty}
                  size="small"
                  sx={{
                    bgcolor: mealData.difficulty === 'easy' ? 'rgba(76,175,80,0.15)' :
                             mealData.difficulty === 'medium' ? 'rgba(255,152,0,0.15)' :
                             'rgba(244,67,54,0.15)',
                    color: mealData.difficulty === 'easy' ? '#4CAF50' :
                           mealData.difficulty === 'medium' ? '#FF9800' :
                           '#F44336',
                    textTransform: 'capitalize',
                  }}
                />
              )}
            </Box>
          )}
        </GlassCard>
      </Grid>
    );
  };

  // Theme-aware aurora colors
  const auroraColors = mode === 'dark'
    ? ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']
    : ['#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ff9a9e'];

  if (loading) {
    return (
      <AuroraBackground colors={auroraColors} speed={30}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress size={60} sx={{ color: '#4ECDC4' }} />
          <Typography variant="h6" sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>Loading meal plan...</Typography>
        </Box>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground colors={auroraColors} speed={30}>
      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Meal Detail Modal */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            borderRadius: 3,
          }
        }}
      >
        {selectedMeal && (() => {
          const mealData = parseMealNotes(selectedMeal.notes);
          return (
            <>
              <DialogTitle sx={{
                color: mode === 'dark' ? 'white' : '#000000',
                borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">{mealData.name || 'Meal Details'}</Typography>
                    <Typography variant="caption" sx={{ color: '#4ECDC4' }}>
                      {selectedMeal.meal_type.toUpperCase()}
                    </Typography>
                  </Box>
                  <Button
                    variant={editMode ? "contained" : "outlined"}
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={handleEditToggle}
                    sx={{
                      color: editMode ? 'black' : '#4ECDC4',
                      bgcolor: editMode ? '#4ECDC4' : 'transparent',
                      borderColor: '#4ECDC4',
                      mr: 1,
                      '&:hover': {
                        borderColor: '#4ECDC4',
                        bgcolor: editMode ? '#45b7af' : 'rgba(78,205,196,0.1)',
                      },
                    }}
                  >
                    {editMode ? 'Editing' : 'Edit'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<StarRate />}
                    onClick={() => setRatingDialogOpen(true)}
                    sx={{
                      color: '#FFD700',
                      borderColor: '#FFD700',
                      '&:hover': {
                        borderColor: '#FFD700',
                        bgcolor: 'rgba(255,215,0,0.1)',
                      },
                    }}
                  >
                    Rate
                  </Button>
                </Box>

                {/* Rating Display */}
                {ratingStats && !loadingRatings && (
                  <Box sx={{ mt: 2 }}>
                    <RecipeRating stats={ratingStats} size="medium" />
                  </Box>
                )}
                {loadingRatings && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <CircularProgress size={16} sx={{ color: '#4ECDC4' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Loading ratings...
                    </Typography>
                  </Box>
                )}

                {/* Tabs */}
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  sx={{
                    mt: 2,
                    '& .MuiTab-root': {
                      color: 'rgba(255,255,255,0.6)',
                      '&.Mui-selected': {
                        color: '#4ECDC4',
                      },
                    },
                    '& .MuiTabs-indicator': {
                      bgcolor: '#4ECDC4',
                    },
                  }}
                >
                  <Tab label="Details" />
                  <Tab label="Reviews" />
                </Tabs>
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                {/* Details Tab */}
                {activeTab === 0 && (
                  <Box>
                {editMode && (
                  <Box sx={{ mb: 3 }}>
                    <ServingScaler
                      baseServings={(selectedMeal as any).servings || 4}
                      currentServings={editServings}
                      onServingsChange={setEditServings}
                    />
                  </Box>
                )}
                {mealData.description && (
                  <Typography variant="body1" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)', mb: 3 }}>
                    {mealData.description}
                  </Typography>
                )}

                {mealData.ingredients && mealData.ingredients.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: mode === 'dark' ? 'white' : '#000000', mb: 2 }}>Ingredients</Typography>
                    <Grid container spacing={1}>
                      {mealData.ingredients.map((ing: any, idx: number) => {
                        const sub = substitutions.get(ing.name);
                        const baseServings = (selectedMeal as any).servings || 4;
                        const displayAmount = editMode ? getScaledAmount(ing.amount, baseServings) : ing.amount;
                        const displayName = sub ? sub.substitute : ing.name;
                        return (
                          <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                            <Chip
                              label={`${displayAmount} ${ing.unit} ${displayName}`}
                              size="small"
                              onClick={(e) => handleIngredientClick(e, ing)}
                              sx={{
                                bgcolor: sub ? 'rgba(78,205,196,0.2)' : 'rgba(255,255,255,0.1)',
                                color: sub ? '#4ECDC4' : (mode === 'dark' ? 'white' : '#000'),
                                mr: 1,
                                mb: 1,
                                cursor: editMode ? 'pointer' : 'default',
                                textDecoration: sub ? 'none' : 'none',
                                border: editMode ? '1px dashed rgba(78,205,196,0.4)' : 'none',
                                '&:hover': editMode ? {
                                  bgcolor: 'rgba(78,205,196,0.15)',
                                } : {},
                              }}
                            />
                            {sub && (
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', ml: 1, mt: -0.5, mb: 0.5 }}>
                                was: {ing.amount} {ing.unit} {ing.name}
                              </Typography>
                            )}
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                )}

                {mealData.instructions && mealData.instructions.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: mode === 'dark' ? 'white' : '#000000', mb: 2 }}>Instructions</Typography>
                    {mealData.instructions.map((step: string, idx: number) => (
                      <Typography key={idx} variant="body2" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)', mb: 1 }}>
                        {idx + 1}. {step}
                      </Typography>
                    ))}
                  </Box>
                )}

                {mealData.nutrition && (
                  <Box>
                    <Typography variant="h6" sx={{ color: mode === 'dark' ? 'white' : '#000000', mb: 2 }}>Nutrition</Typography>
                    <Grid container spacing={2}>
                      {mealData.nutrition.calories && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>Calories</Typography>
                          <Typography variant="body1" sx={{ color: mode === 'dark' ? 'white' : '#000000', fontWeight: 'bold' }}>
                            {mealData.nutrition.calories}
                          </Typography>
                        </Grid>
                      )}
                      {mealData.nutrition.protein && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>Protein</Typography>
                          <Typography variant="body1" sx={{ color: mode === 'dark' ? 'white' : '#000000', fontWeight: 'bold' }}>
                            {mealData.nutrition.protein}g
                          </Typography>
                        </Grid>
                      )}
                      {mealData.nutrition.carbs && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>Carbs</Typography>
                          <Typography variant="body1" sx={{ color: mode === 'dark' ? 'white' : '#000000', fontWeight: 'bold' }}>
                            {mealData.nutrition.carbs}g
                          </Typography>
                        </Grid>
                      )}
                      {mealData.nutrition.fat && (
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>Fat</Typography>
                          <Typography variant="body1" sx={{ color: mode === 'dark' ? 'white' : '#000000', fontWeight: 'bold' }}>
                            {mealData.nutrition.fat}g
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}
                  </Box>
                )}

                {/* Reviews Tab */}
                {activeTab === 1 && selectedMeal?.id && (
                  <Box>
                    {ratingStats && (
                      <Box sx={{ mb: 3 }}>
                        <RecipeRating stats={ratingStats} size="large" showDistribution />
                        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
                      </Box>
                    )}
                    <RecipeReviews recipeId={selectedMeal.id} />
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
                {mealData.ingredients && mealData.ingredients.length > 0 && (
                  <Button
                    startIcon={<ShoppingCartOutlined />}
                    onClick={() => {
                      // Navigate to shopping list with meal ingredients
                      navigate('/shopping-list', {
                        state: {
                          addIngredients: mealData.ingredients,
                          mealName: mealData.name
                        }
                      });
                    }}
                    sx={{
                      color: '#4ECDC4',
                      '&:hover': {
                        bgcolor: 'rgba(78,205,196,0.1)',
                      },
                    }}
                  >
                    Add to Shopping List
                  </Button>
                )}
                <Box sx={{ flex: 1 }} />
                {editMode && (substitutions.size > 0 || editServings !== ((selectedMeal as any)?.servings || 4)) && (
                  <Button
                    variant="contained"
                    startIcon={savingRecipe ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleSaveAsNewRecipe}
                    disabled={savingRecipe}
                    sx={{
                      bgcolor: '#4ECDC4',
                      color: 'black',
                      fontWeight: 'bold',
                      mr: 1,
                      '&:hover': { bgcolor: '#45b7af' },
                    }}
                  >
                    Save as New Recipe
                  </Button>
                )}
                <Button onClick={() => { setDetailsOpen(false); setEditMode(false); }} sx={{ color: mode === 'dark' ? 'white' : '#000' }}>
                  Close
                </Button>
              </DialogActions>
            </>
          );
        })()}

        {/* Ingredient Substitution Panel */}
        {selectedIngredient && (
          <IngredientSubstitutionPanel
            ingredient={selectedIngredient}
            onSubstitute={handleSubstitute}
            onAskNora={handleAskNora}
            anchorEl={substitutionAnchorEl}
            onClose={() => { setSubstitutionAnchorEl(null); setSelectedIngredient(null); }}
          />
        )}
      </Dialog>

      {/* Rate Recipe Dialog */}
      {selectedMeal && (
        <RateRecipeDialog
          open={ratingDialogOpen}
          onClose={() => setRatingDialogOpen(false)}
          recipeId={selectedMeal.id}
          recipeName={parseMealNotes(selectedMeal.notes).name || 'This Recipe'}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}

      <Box sx={{ p: { xs: 2, md: 6 }, position: 'relative', zIndex: 2, maxWidth: '100%', mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', letterSpacing: 2 }}>THIS WEEK</Typography>
            <Typography
              variant="h2"
              fontWeight="900"
              sx={{
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                  : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Meal Timeline
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!mealPlan && (
              <Button
                variant="contained"
                startIcon={generating ? <CircularProgress size={20} /> : <Add />}
                onClick={handleGenerateMealPlan}
                disabled={generating}
                sx={{
                  bgcolor: '#4ECDC4',
                  color: 'black',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#45b7af' },
                  px: 3,
                  py: 1.5,
                }}
              >
                {generating ? 'Generating...' : 'Generate Meal Plan'}
              </Button>
            )}
            <GlassCard intensity="light" hover={true} sx={{ borderRadius: '50%', p: 1.5 }}>
              <IconButton sx={{ color: 'white' }} onClick={loadMealPlan}>
                <Refresh />
              </IconButton>
            </GlassCard>
          </Box>
        </Box>

        {generating && (
          <GlassCard intensity="ultra" sx={{ p: 6, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#4ECDC4', mb: 3 }} />
            <Typography variant="h5" sx={{ color: mode === 'dark' ? 'white' : '#000000', mb: 2, fontWeight: 'bold' }}>
              Generating Your Meal Plan
            </Typography>
            <Typography variant="body1" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
              Nora is crafting a personalized 7-day meal plan for your household...
            </Typography>
          </GlassCard>
        )}

        {!mealPlan && !generating ? (
          <GlassCard intensity="ultra" sx={{ p: 6, textAlign: 'center' }}>
            <Restaurant sx={{ fontSize: 80, color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', mb: 3 }} />
            <Typography variant="h5" sx={{ color: mode === 'dark' ? 'white' : '#000000', mb: 2, fontWeight: 'bold' }}>
              No Meal Plan Yet
            </Typography>
            <Typography variant="body1" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', mb: 4 }}>
              Generate your first AI-powered meal plan based on your household preferences!
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={handleGenerateMealPlan}
              sx={{
                bgcolor: '#4ECDC4',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#45b7af' },
                px: 4,
                py: 1.5,
              }}
            >
              Generate Meal Plan
            </Button>
          </GlassCard>
        ) : mealPlan && (
          <Grid container spacing={4}>
            {getPlanDays().map((day, i) => (
              <Grid size={{ xs: 12 }} key={day.dateStr}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" sx={{ color: mode === 'dark' ? 'white' : '#000000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                    {day.dayName}
                    <Typography component="span" variant="body2" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                      {day.displayDate}
                    </Typography>
                    <Box component="span" sx={{ height: 1, flex: 1, maxWidth: 60, bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  {['Breakfast', 'Lunch', 'Dinner'].map((type, j) =>
                    renderMealCard(day.dateStr, type, i * 3 + j)
                  )}
                </Grid>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </AuroraBackground>
  );
};

export default MealPlanPage;
