import { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, useTheme, IconButton } from '@mui/material';
import {
  Restaurant,
  ShoppingCart,
  AutoAwesome,
  TrendingUp,
  People as PeopleIcon,
  ArrowForward,
  Settings
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RootState, AppDispatch } from '../features/store';
import { fetchHouseholdSummary } from '../features/household/householdSlice';
import CreateHouseholdDialog from '../components/household/CreateHouseholdDialog';
import GlassCard from '../components/common/GlassCard';
import NeuroCard from '../components/common/NeuroCard';
import AuroraBackground from '../components/common/AuroraBackground';
import { sanitizeText } from '../utils/sanitize';

// Animation Variants
const containerVar = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVar = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const { summary } = useSelector((state: RootState) => state.household);
  const [createHouseholdOpen, setCreateHouseholdOpen] = useState(false);

  // Fetch household summary on mount
  useEffect(() => {
    if (user?.householdId) {
      dispatch(fetchHouseholdSummary(user.householdId));
    }
  }, [dispatch, user?.householdId]);

  // Dynamic Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <AuroraBackground speed={20} colors={['#4ECDC4', '#556270', '#C7F464']}>
      <Box sx={{ p: { xs: 2, md: 4 }, position: 'relative', zIndex: 2, maxWidth: '1600px', mx: 'auto' }}>

        {/* Header Section */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}
        >
          <Box>
            <Typography variant="h2" fontWeight="800" sx={{
              background: 'linear-gradient(45deg, #FFFFFF 30%, #E0E0E0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 10px 20px rgba(0,0,0,0.1)'
            }}>
              {getGreeting()}, {user?.name ? sanitizeText(user.name.split(' ')[0]) : 'Chef'}
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1, fontWeight: 300 }}>
              Your culinary command center is ready.
            </Typography>
          </Box>
          <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <Settings sx={{ color: 'white' }} />
          </IconButton>
        </Box>

        {/* Main Content Grid */}
        <Grid container spacing={4} component={motion.div} variants={containerVar} initial="hidden" animate="show">

          {/* Primary Action - AI Chat */}
          <Grid item xs={12} md={8}>
            <GlassCard
              intensity="strong"
              component={motion.div}
              variants={itemVar}
              sx={{
                height: '100%',
                minHeight: 280,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                p: 6,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
              }}
              onClick={() => navigate('/chat')}
            >
              <Box sx={{
                p: 2,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.2)',
                mb: 3,
                boxShadow: '0 0 20px rgba(132, 94, 194, 0.3)'
              }}>
                <AutoAwesome sx={{ fontSize: 40, color: '#fff' }} />
              </Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: '#fff', mb: 1 }}>
                Plan with AI
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, maxWidth: 500 }}>
                Tell me what you're craving or let me optimize your weekly budget.
              </Typography>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  borderRadius: 4,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                }}
              >
                Start Conversation
              </Button>
            </GlassCard>
          </Grid>

          {/* Secondary Actions */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>

              {/* Meal Plan Card */}
              <NeuroCard
                component={motion.div}
                variants={itemVar}
                sx={{ flex: 1, cursor: 'pointer', bgcolor: 'rgba(255,255,255,0.9)' }}
                onClick={() => navigate('/meal-plan')}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="primary.dark">Weekly Menu</Typography>
                    <Typography variant="body2" color="text.secondary">3 meals planned today</Typography>
                  </Box>
                  <Restaurant sx={{ fontSize: 32, color: 'primary.main' }} />
                </Box>
              </NeuroCard>

              {/* Shopping List Card */}
              <NeuroCard
                component={motion.div}
                variants={itemVar}
                sx={{ flex: 1, cursor: 'pointer', bgcolor: 'rgba(255,255,255,0.9)' }}
                onClick={() => navigate('/shopping-list')}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="success.dark">Shopping List</Typography>
                    <Typography variant="body2" color="text.secondary">12 items pending</Typography>
                  </Box>
                  <ShoppingCart sx={{ fontSize: 32, color: 'success.main' }} />
                </Box>
              </NeuroCard>

              {/* Budget/Stats */}
              <GlassCard intensity="light" component={motion.div} variants={itemVar} sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp sx={{ color: 'white' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Weekly Spend</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                      ${summary?.stats?.weeklyBudget ? 124 : 0} / ${summary?.stats?.weeklyBudget || 200}
                    </Typography>
                  </Box>
                </Box>
              </GlassCard>

            </Box>
          </Grid>

          {/* Household Status Bar */}
          <Grid item xs={12}>
             {!user?.householdId ? (
              <GlassCard intensity="medium" sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,107,107,0.2)', borderRadius: '50%' }}>
                  <PeopleIcon sx={{ fontSize: 32, color: '#FF6B6B' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>Setup Your Household</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Add family members and preferences to unlock the full power of AI planning.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => setCreateHouseholdOpen(true)}
                  sx={{ borderColor: 'white', color: 'white', borderRadius: 3, px: 4 }}
                >
                  Get Started
                </Button>
              </GlassCard>
            ) : (
              <GlassCard intensity="light" sx={{ px: 4, py: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  🏠 {summary?.household?.name ? sanitizeText(summary.household.name) : 'My Household'}
                </Typography>
                <Box sx={{ width: 1, height: 24, bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {summary?.stats?.totalMembers || 0} Members
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {summary?.stats?.totalAllergies || 0} Allergies Tracked
                </Typography>
                <Button
                  size="small"
                  sx={{ ml: 'auto', color: 'white' }}
                  onClick={() => navigate('/household')}
                >
                  Manage
                </Button>
              </GlassCard>
            )}
          </Grid>
        </Grid>

        <CreateHouseholdDialog
          open={createHouseholdOpen}
          onClose={() => setCreateHouseholdOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      </Box>
    </AuroraBackground>
  );
};

export default DashboardPage;
