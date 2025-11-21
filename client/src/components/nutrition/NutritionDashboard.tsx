import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Grid, LinearProgress } from '@mui/material';
import { LocalFireDepartment, FitnessCenter, RiceBowl, Opacity } from '@mui/icons-material';
import { motion } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import nutritionService, { NutritionData } from '../../services/nutritionService';

interface NutritionDashboardProps {
  mealPlanId: string;
}

const NutritionDashboard = ({ mealPlanId }: NutritionDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [weeklyAverages, setWeeklyAverages] = useState<NutritionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNutrition();
  }, [mealPlanId]);

  const loadNutrition = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await nutritionService.getMealPlanNutrition(mealPlanId);
      if (response.success) {
        setWeeklyAverages(response.data.weeklyAverages);
      }
    } catch (err) {
      console.error('Error loading nutrition:', err);
      setError('Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassCard intensity="strong" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress sx={{ color: '#4ECDC4' }} />
      </GlassCard>
    );
  }

  if (error || !weeklyAverages) {
    return (
      <GlassCard intensity="strong" sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
          {error || 'No nutrition data available'}
        </Typography>
      </GlassCard>
    );
  }

  const macros = [
    {
      name: 'Calories',
      value: weeklyAverages.calories || 0,
      unit: 'kcal',
      icon: LocalFireDepartment,
      color: '#FFE66D',
      goal: 2000,
    },
    {
      name: 'Protein',
      value: weeklyAverages.protein || 0,
      unit: 'g',
      icon: FitnessCenter,
      color: '#FF6B6B',
      goal: 50,
    },
    {
      name: 'Carbs',
      value: weeklyAverages.carbs || 0,
      unit: 'g',
      icon: RiceBowl,
      color: '#4ECDC4',
      goal: 250,
    },
    {
      name: 'Fat',
      value: weeklyAverages.fat || 0,
      unit: 'g',
      icon: Opacity,
      color: '#A8E6CF',
      goal: 70,
    },
  ];

  return (
    <Box>
      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 2, mb: 2, display: 'block' }}>
        DAILY AVERAGES
      </Typography>

      <Grid container spacing={2}>
        {macros.map((macro, index) => {
          const percentage = Math.min(100, (macro.value / macro.goal) * 100);
          const Icon = macro.icon;

          return (
            <Grid size={{ xs: 6, md: 3 }} key={macro.name}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard intensity="ultra" sx={{ height: '100%' }}>
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: `${macro.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <Icon sx={{ color: macro.color, fontSize: 24 }} />
                  </Box>

                  {/* Label */}
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 1 }}>
                    {macro.name}
                  </Typography>

                  {/* Value */}
                  <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
                    {Math.round(macro.value)}
                    <Typography component="span" variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', ml: 0.5 }}>
                      {macro.unit}
                    </Typography>
                  </Typography>

                  {/* Progress Bar */}
                  <Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: macro.color,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5, display: 'block' }}>
                      {Math.round(percentage)}% of {macro.goal}{macro.unit}
                    </Typography>
                  </Box>
                </GlassCard>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Additional Micronutrients */}
      {(weeklyAverages.fiber || weeklyAverages.sugar || weeklyAverages.sodium) && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 2, mb: 2, display: 'block' }}>
            MICRONUTRIENTS
          </Typography>
          <GlassCard intensity="light">
            <Grid container spacing={2}>
              {weeklyAverages.fiber && (
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Fiber</Typography>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {Math.round(weeklyAverages.fiber)}g
                  </Typography>
                </Grid>
              )}
              {weeklyAverages.sugar && (
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Sugar</Typography>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {Math.round(weeklyAverages.sugar)}g
                  </Typography>
                </Grid>
              )}
              {weeklyAverages.sodium && (
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Sodium</Typography>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {Math.round(weeklyAverages.sodium)}mg
                  </Typography>
                </Grid>
              )}
            </Grid>
          </GlassCard>
        </Box>
      )}
    </Box>
  );
};

export default NutritionDashboard;
