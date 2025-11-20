/* client/src/pages/MealPlanPage.tsx */
import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Chip, IconButton, Button, CircularProgress, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { AccessTime, LocalFireDepartment, Refresh, ArrowForward, Add, Restaurant } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import { sanitizeText } from '../utils/sanitize';
import { mealPlanService, MealPlanMeal } from '../services/mealPlanService';
import { aiService } from '../services/aiService';

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
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [meals, setMeals] = useState<MealPlanMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealPlanMeal | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Load current week's meal plan
  useEffect(() => {
    loadMealPlan();
  }, []);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's household ID from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const householdId = user.householdId;

      if (!householdId) {
        setError('No household found. Please set up your household first.');
        setLoading(false);
        return;
      }

      const response = await mealPlanService.getCurrentWeekPlan(householdId);

      if (response.success && response.mealPlan) {
        setMealPlan(response.mealPlan.mealPlan);
        setMeals(response.mealPlan.meals || []);
      } else {
        setMealPlan(null);
        setMeals([]);
      }
    } catch (err: any) {
      console.error('Error loading meal plan:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMealPlan = async () => {
    try {
      setGenerating(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const householdId = user.householdId;

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
      console.error('Error generating meal plan:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate meal plan');
    } finally {
      setGenerating(false);
    }
  };

  const getMealsByDay = (dayName: string) => {
    const dayIndex = days.indexOf(dayName);
    return meals.filter(meal => {
      const mealDate = new Date(meal.meal_date);
      return mealDate.getDay() === dayIndex;
    });
  };

  const getMealByDayAndType = (dayName: string, mealType: string) => {
    const dayMeals = getMealsByDay(dayName);
    return dayMeals.find(m => m.meal_type.toLowerCase() === mealType.toLowerCase());
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

  const handleMealClick = (meal: MealPlanMeal) => {
    setSelectedMeal(meal);
    setDetailsOpen(true);
  };

  const renderMealCard = (dayName: string, mealType: string, index: number) => {
    const meal = getMealByDayAndType(dayName, mealType);
    const mealData = meal ? parseMealNotes(meal.notes) : null;

    return (
      <Grid item xs={12} md={4} key={mealType}>
        <GlassCard
          intensity="medium"
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
            {meal && <ArrowForward sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 16 }} />}
          </Box>

          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', mb: 3 }}>
            {meal && mealData?.name ? sanitizeText(mealData.name) : 'No meal planned'}
          </Typography>

          {meal && mealData && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {mealData.prepTime && (
                <Chip
                  icon={<AccessTime sx={{ "&&": { color: 'white' } }} />}
                  label={`${mealData.prepTime}m`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
                />
              )}
              {mealData.nutrition?.calories && (
                <Chip
                  icon={<LocalFireDepartment sx={{ "&&": { color: '#FFE66D' } }} />}
                  label={`${mealData.nutrition.calories} kcal`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
                />
              )}
            </Box>
          )}
        </GlassCard>
      </Grid>
    );
  };

  if (loading) {
    return (
      <AuroraBackground colors={['#FF6B6B', '#556270', '#FF8E8E']} speed={30}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress size={60} sx={{ color: '#4ECDC4' }} />
          <Typography variant="h6" sx={{ color: 'white' }}>Loading meal plan...</Typography>
        </Box>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground colors={['#FF6B6B', '#556270', '#FF8E8E']} speed={30}>
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
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
          }
        }}
      >
        {selectedMeal && (() => {
          const mealData = parseMealNotes(selectedMeal.notes);
          return (
            <>
              <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h5" fontWeight="bold">{mealData.name || 'Meal Details'}</Typography>
                <Typography variant="caption" sx={{ color: '#4ECDC4' }}>
                  {selectedMeal.meal_type.toUpperCase()}
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                {mealData.description && (
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
                    {mealData.description}
                  </Typography>
                )}

                {mealData.ingredients && mealData.ingredients.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Ingredients</Typography>
                    <Grid container spacing={1}>
                      {mealData.ingredients.map((ing: any, idx: number) => (
                        <Grid item xs={12} sm={6} key={idx}>
                          <Chip
                            label={`${ing.amount} ${ing.unit} ${ing.name}`}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', mr: 1, mb: 1 }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {mealData.instructions && mealData.instructions.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Instructions</Typography>
                    {mealData.instructions.map((step: string, idx: number) => (
                      <Typography key={idx} variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                        {idx + 1}. {step}
                      </Typography>
                    ))}
                  </Box>
                )}

                {mealData.nutrition && (
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>Nutrition</Typography>
                    <Grid container spacing={2}>
                      {mealData.nutrition.calories && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Calories</Typography>
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {mealData.nutrition.calories}
                          </Typography>
                        </Grid>
                      )}
                      {mealData.nutrition.protein && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Protein</Typography>
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {mealData.nutrition.protein}g
                          </Typography>
                        </Grid>
                      )}
                      {mealData.nutrition.carbs && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Carbs</Typography>
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {mealData.nutrition.carbs}g
                          </Typography>
                        </Grid>
                      )}
                      {mealData.nutrition.fat && (
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Fat</Typography>
                          <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {mealData.nutrition.fat}g
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
                <Button onClick={() => setDetailsOpen(false)} sx={{ color: 'white' }}>
                  Close
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      <Box sx={{ p: { xs: 2, md: 6 }, position: 'relative', zIndex: 2, maxWidth: '100%', mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 2 }}>THIS WEEK</Typography>
            <Typography variant="h2" fontWeight="900" sx={{ color: 'white' }}>
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

        {!mealPlan && !generating ? (
          <GlassCard intensity="medium" sx={{ p: 6, textAlign: 'center' }}>
            <Restaurant sx={{ fontSize: 80, color: 'rgba(255,255,255,0.3)', mb: 3 }} />
            <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
              No Meal Plan Yet
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}>
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
        ) : (
          <Grid container spacing={4}>
            {days.map((day, i) => (
              <Grid item xs={12} key={day}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                    {day} <Box component="span" sx={{ height: 1, width: 40, bgcolor: 'rgba(255,255,255,0.2)' }} />
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  {['Breakfast', 'Lunch', 'Dinner'].map((type, j) =>
                    renderMealCard(day, type, i * 3 + j)
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
