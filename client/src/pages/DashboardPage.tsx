/* client/src/pages/DashboardPage.tsx */
import { useState, useEffect } from 'react';
import { Box, Grid, Typography, Avatar, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AutoAwesome,
  RestaurantMenu,
  ShoppingCartOutlined,
  TrendingUp,
  ArrowOutward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import { RootState, AppDispatch } from '../features/store';
import { fetchHouseholdSummary } from '../features/household/householdSlice';
import { sanitizeText } from '../utils/sanitize';

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { summary } = useSelector((state: RootState) => state.household);

  // Fetch household summary on mount
  useEffect(() => {
    if (user?.householdId) {
      dispatch(fetchHouseholdSummary(user.householdId));
    }
  }, [dispatch, user?.householdId]);

  // Animation Stagger
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <AuroraBackground speed={30} colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}>
      <Box sx={{ p: { xs: 2, md: 4, lg: 6 }, maxWidth: '1800px', mx: 'auto', position: 'relative', zIndex: 2 }}>

        {/* Header: Editorial Style */}
        <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 3 }}>
              OVERVIEW
            </Typography>
            <Typography variant="h2" fontWeight="800" sx={{ color: 'white', fontSize: { xs: '2.5rem', md: '4rem' }, lineHeight: 1 }}>
              Hello, {user?.name ? sanitizeText(user.name.split(' ')[0]) : 'Chef'}.
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: { xs: 'none', md: 'flex' }
            }}
          >
            {user?.name?.[0] || 'C'}
          </Avatar>
        </Box>

        {/* BENTO GRID LAYOUT */}
        <Grid container spacing={3} component={motion.div} variants={container} initial="hidden" animate="show">

          {/* 1. HERO: AI Chef (Large) */}
          <Grid item xs={12} md={8}>
            <GlassCard
              intensity="ultra"
              component={motion.div}
              variants={item}
              onClick={() => navigate('/chat')}
              sx={{
                height: '100%',
                minHeight: 350,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
                <ArrowOutward sx={{ color: 'white', opacity: 0.7 }} />
              </Box>

              <Box>
                <Chip
                  icon={<AutoAwesome sx={{ "&&": { color: "#FFD700" } }} />}
                  label="AI Assistant"
                  sx={{ bgcolor: 'rgba(0,0,0,0.3)', color: 'white', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', mb: 2 }}
                />
                <Typography variant="h3" fontWeight="700" sx={{ color: 'white', mb: 1 }}>
                  Plan your next meal
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: '500px', fontSize: '1.1rem' }}>
                  I can help you generate a meal plan based on your current inventory or cravings.
                </Typography>
              </Box>

              <Box sx={{
                mt: 4,
                p: 2,
                bgcolor: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                backdropFilter: 'blur(10px)'
              }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4ECDC4', boxShadow: '0 0 10px #4ECDC4' }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  "Suggest a high-protein dinner under $15..."
                </Typography>
              </Box>
            </GlassCard>
          </Grid>

          {/* 2. STATS: Budget (Tall) */}
          <Grid item xs={12} sm={6} md={4}>
            <GlassCard
              intensity="strong"
              component={motion.div}
              variants={item}
              sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}
            >
              <Box sx={{ position: 'relative', width: 150, height: 150, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="75" cy="75" r="60" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="75"
                    cy="75"
                    r="60"
                    stroke="#4ECDC4"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="377"
                    strokeDashoffset="100"
                    strokeLinecap="round"
                    component={motion.circle}
                    initial={{ strokeDashoffset: 377 }}
                    animate={{ strokeDashoffset: 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="white">72%</Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.6)">SPENT</Typography>
                </Box>
              </Box>
              <Typography variant="h6" color="white">Weekly Budget</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                ${summary?.stats?.weeklyBudget ? 144 : 144} / ${summary?.stats?.weeklyBudget || 200}
              </Typography>
            </GlassCard>
          </Grid>

          {/* 3. QUICK ACTION: Shopping List (Square) */}
          <Grid item xs={12} sm={6} md={4}>
            <GlassCard
              intensity="medium"
              component={motion.div}
              variants={item}
              onClick={() => navigate('/shopping-list')}
              sx={{ height: 200, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <ShoppingCartOutlined sx={{ color: 'white', fontSize: 30 }} />
                <Typography variant="h4" fontWeight="bold" color="white">12</Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" color="white">Shopping List</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>3 items urgent</Typography>
              </Box>
            </GlassCard>
          </Grid>

          {/* 4. QUICK ACTION: Meal Plan (Square) */}
          <Grid item xs={12} sm={6} md={4}>
            <GlassCard
              intensity="medium"
              component={motion.div}
              variants={item}
              onClick={() => navigate('/meal-plan')}
              sx={{ height: 200, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
               <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <RestaurantMenu sx={{ color: 'white', fontSize: 30 }} />
                <Typography variant="h4" fontWeight="bold" color="white">3</Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" color="white">Today's Menu</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Dinner not prepped</Typography>
              </Box>
            </GlassCard>
          </Grid>

          {/* 5. INSIGHT: Streak/Health (Rectangle) */}
          <Grid item xs={12} md={4}>
             <GlassCard
              intensity="light"
              component={motion.div}
              variants={item}
              sx={{ height: 200, display: 'flex', alignItems: 'center', gap: 3 }}
            >
               <Box sx={{ p: 2, bgcolor: 'rgba(255,107,107,0.2)', borderRadius: '50%' }}>
                 <TrendingUp sx={{ fontSize: 32, color: '#FF6B6B' }} />
               </Box>
               <Box>
                 <Typography variant="h5" fontWeight="bold" color="white">5 Day Streak</Typography>
                 <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                   You stayed under budget for 5 days in a row!
                 </Typography>
               </Box>
            </GlassCard>
          </Grid>

        </Grid>
      </Box>
    </AuroraBackground>
  );
};

export default DashboardPage;
