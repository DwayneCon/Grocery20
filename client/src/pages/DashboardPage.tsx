/* client/src/pages/DashboardPage.tsx */
import { useEffect, useState } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import PageTransition from '../components/common/PageTransition';
import BentoGrid, { bentoItemVariants } from '../components/dashboard/BentoGrid';
import WeatherGreeting from '../components/dashboard/WeatherGreeting';
import QuickActions from '../components/dashboard/QuickActions';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import StreakCounter from '../components/dashboard/StreakCounter';
import BudgetTracker from '../components/budget/BudgetTracker';
import NutritionDashboard from '../components/nutrition/NutritionDashboard';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import { RootState, AppDispatch } from '../features/store';
import { fetchHouseholdSummary } from '../features/household/householdSlice';
import { updateUser } from '../features/auth/authSlice';
import { useTheme } from '../contexts/ThemeContext';
import { mealPlanService } from '../services/mealPlanService';
import { streakService, StreakData } from '../services/streakService';
import householdService from '../services/householdService';
import { logger } from '../utils/logger';

const DashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { mode } = useTheme();

  // Real data state
  const [currentMealPlanId, setCurrentMealPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [_household, setHousehold] = useState<any>(null);

  // Check if user has household, trigger onboarding if not
  useEffect(() => {
    const checkHousehold = async () => {
      if (!user) return;

      if (user.householdId) {
        try {
          const householdData = await householdService.getHousehold(user.householdId);
          setHousehold(householdData);
          setShowOnboarding(false);
        } catch (err) {
          logger.error('Error fetching household', err as Error);
          setShowOnboarding(true);
        }
      } else {
        setShowOnboarding(true);
      }
    };

    checkHousehold();
  }, [user?.householdId]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.householdId) return;

      try {
        dispatch(fetchHouseholdSummary(user.householdId));

        // Load current meal plan
        const mealPlanResponse = await mealPlanService.getCurrentWeekPlan(user.householdId);
        if (mealPlanResponse.success && mealPlanResponse.mealPlan) {
          setCurrentMealPlanId(mealPlanResponse.mealPlan.mealPlan.id);
        }

        // Load streak data
        const streakDataResponse = await streakService.getStreakData();
        setStreakData(streakDataResponse);
      } catch (err) {
        logger.error('Error loading dashboard data', err as Error);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      }
    };

    if (user?.householdId) {
      loadDashboardData();
    }
  }, [dispatch, user?.householdId]);

  // Handle onboarding completion
  const handleOnboardingComplete = async (data: any) => {
    try {
      const newHousehold = await householdService.createHousehold({
        name: data.householdName,
        budgetWeekly: data.weeklyBudget,
      });

      if (data.memberCount > 0) {
        for (let i = 0; i < data.memberCount; i++) {
          await householdService.addMember(newHousehold.id, {
            name: i === 0 ? user?.name || 'Member 1' : `Member ${i + 1}`,
            age: undefined,
            dietaryRestrictions: data.dietaryRestrictions || [],
            preferences: {
              cuisines: data.cuisinePreferences || [],
              cookingSkill: data.cookingSkill,
              equipment: data.hasKitchenEquipment || [],
            },
          });
        }
      }

      dispatch(updateUser({ householdId: newHousehold.id }));
      setHousehold(newHousehold);
      setShowOnboarding(false);
      logger.info('Onboarding completed successfully', { metadata: { householdId: newHousehold.id } });
    } catch (err) {
      logger.error('Error completing onboarding', err as Error);
      setError('Failed to complete onboarding. Please try again.');
    }
  };

  // Culinary Spectrum aurora colors
  const auroraColors = mode === 'dark'
    ? ['#FF6B35', '#F4A460', '#6A4C93', '#05AF5C', '#FFD93D']
    : ['#FFDDC1', '#FFEDBC', '#E8D5F2', '#C1F7DC', '#FFF9D6'];

  // Show onboarding wizard if user has no household
  if (showOnboarding) {
    return (
      <AuroraBackground speed={20} colors={auroraColors}>
        <Box sx={{
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: '800px',
          mx: 'auto',
          position: 'relative',
          zIndex: 2,
        }}>
          <OnboardingWizard
            onComplete={handleOnboardingComplete}
            onSkip={() => setShowOnboarding(false)}
          />
        </Box>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground speed={20} colors={auroraColors}>
      <PageTransition type="fade">
        <Box sx={{
          p: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
          maxWidth: { xs: '100%', sm: '100%', md: '95%', lg: '90%', xl: '1800px' },
          mx: 'auto',
          position: 'relative',
          zIndex: 2,
          width: '100%',
        }}>

          {/* Bento Grid Layout */}
          <BentoGrid>

            {/* 1. GREETING - spans greeting area */}
            <Box
              component={motion.div}
              variants={bentoItemVariants}
              sx={{ gridArea: 'greeting' }}
            >
              <WeatherGreeting userName={user?.name || ''} />
            </Box>

            {/* 2. STREAK COUNTER - spans streak area */}
            <Box
              component={motion.div}
              variants={bentoItemVariants}
              sx={{ gridArea: 'streak' }}
            >
              {streakData ? (
                <StreakCounter
                  streak={streakData.currentStreak}
                  longestStreak={streakData.longestStreak}
                />
              ) : (
                <GlassCard
                  intensity="strong"
                  hover={false}
                  sx={{
                    height: '100%',
                    minHeight: { xs: 200, md: 220 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    borderRadius: 'var(--radius-xl)',
                  }}
                >
                  <Typography
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Loading streak data...
                  </Typography>
                </GlassCard>
              )}
            </Box>

            {/* 3. BUDGET TRACKER - spans budget area */}
            <Box
              component={motion.div}
              variants={bentoItemVariants}
              sx={{ gridArea: 'budget' }}
            >
              {user?.householdId ? (
                <BudgetTracker householdId={user.householdId} />
              ) : (
                <GlassCard
                  intensity="strong"
                  hover={false}
                  sx={{
                    height: '100%',
                    minHeight: { xs: 200, md: 220 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    borderRadius: 'var(--radius-xl)',
                  }}
                >
                  <Typography
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                      fontFamily: 'var(--font-body)',
                      textAlign: 'center',
                    }}
                  >
                    Join or create a household to track your budget
                  </Typography>
                </GlassCard>
              )}
            </Box>

            {/* 4. NUTRITION DASHBOARD - spans nutrition area */}
            <Box
              component={motion.div}
              variants={bentoItemVariants}
              sx={{ gridArea: 'nutrition' }}
            >
              {currentMealPlanId ? (
                <NutritionDashboard mealPlanId={currentMealPlanId} />
              ) : (
                <GlassCard
                  intensity="strong"
                  hover={false}
                  sx={{
                    height: '100%',
                    minHeight: { xs: 180, md: 200 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    borderRadius: 'var(--radius-xl)',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
                      letterSpacing: 2,
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                    }}
                  >
                    NUTRITION
                  </Typography>
                  <Typography
                    sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                      fontFamily: 'var(--font-body)',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                    }}
                  >
                    Create a meal plan to see nutrition insights
                  </Typography>
                </GlassCard>
              )}
            </Box>

            {/* 5. ACTIVITY FEED - spans activity area */}
            <Box
              component={motion.div}
              variants={bentoItemVariants}
              sx={{ gridArea: 'activity' }}
            >
              <ActivityFeed />
            </Box>

            {/* 6. QUICK ACTIONS - spans actions area */}
            <Box
              component={motion.div}
              variants={bentoItemVariants}
              sx={{ gridArea: 'actions' }}
            >
              <QuickActions />
            </Box>

          </BentoGrid>
        </Box>
      </PageTransition>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{
            width: '100%',
            borderRadius: 'var(--radius-md)',
            bgcolor: 'rgba(211, 47, 47, 0.1)',
            border: '1px solid rgba(211, 47, 47, 0.3)',
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </AuroraBackground>
  );
};

export default DashboardPage;
