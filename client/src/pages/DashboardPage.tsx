/* client/src/pages/DashboardPage.tsx */
import { useEffect } from 'react';
import { Box, Typography, Avatar, Chip, Grid } from '@mui/material';

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
import BudgetTracker from '../components/budget/BudgetTracker';
import { RootState, AppDispatch } from '../features/store';
import { fetchHouseholdSummary } from '../features/household/householdSlice';
import { sanitizeText } from '../utils/sanitize';
import { useTheme } from '../contexts/ThemeContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { summary } = useSelector((state: RootState) => state.household);
  const { mode } = useTheme();

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

  // Theme-aware aurora colors - Vibrant 5-color gradient
  const auroraColors = mode === 'dark'
    ? ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']
    : ['#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ff9a9e'];

  return (
    <AuroraBackground speed={30} colors={auroraColors}>
      <Box sx={{
        p: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
        maxWidth: { xs: '100%', sm: '100%', md: '95%', lg: '90%', xl: '1800px' },
        mx: 'auto',
        position: 'relative',
        zIndex: 2,
        width: '100%'
      }}>

        {/* Header: Editorial Style */}
        <Box sx={{
          mb: { xs: 3, md: 5 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                letterSpacing: 3,
                fontSize: { xs: '0.7rem', md: '0.75rem' }
              }}
            >
              OVERVIEW
            </Typography>
            <Typography
              variant="h2"
              fontWeight="900"
              sx={{
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                  : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem', lg: '4rem' },
                lineHeight: 1
              }}
            >
              Hello, {user?.name ? sanitizeText(user.name.split(' ')[0]) : 'Chef'}.
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: { xs: 48, md: 64 },
              height: { xs: 48, md: 64 },
              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: mode === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)',
              color: mode === 'dark' ? 'white' : '#000000',
              display: { xs: 'flex', sm: 'flex' }
            }}
          >
            {user?.name?.[0] || 'C'}
          </Avatar>
        </Box>

        {/* BENTO GRID LAYOUT */}
        <Grid container spacing={{ xs: 2, md: 3 }}>

          {/* 1. HERO: AI Chef (Large) */}
          <Grid size={{ xs: 12, md: 8 }}>
            <GlassCard
              intensity="ultra"
              onClick={() => navigate('/chat')}
              sx={{
                height: '100%',
                minHeight: { xs: 300, md: 350 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                p: { xs: 3, md: 4 }
              }}
            >
              <Box sx={{ position: 'absolute', top: { xs: 16, md: 20 }, right: { xs: 16, md: 20 } }}>
                <ArrowOutward sx={{
                  color: mode === 'dark' ? 'white' : '#000000',
                  opacity: 0.7
                }} />
              </Box>

              <Box>
                <Chip
                  icon={<AutoAwesome sx={{ "&&": { color: "#FFD700" } }} />}
                  label="AI Assistant"
                  sx={{
                    bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                    color: mode === 'dark' ? 'white' : '#000000',
                    backdropFilter: 'blur(10px)',
                    border: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    mb: 2,
                    fontSize: { xs: '0.75rem', md: '0.8125rem' }
                  }}
                />
                <Typography
                  variant="h3"
                  fontWeight="900"
                  sx={{
                    background: mode === 'dark'
                      ? 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)'
                      : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }
                  }}
                >
                  Plan your next meal
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    maxWidth: '500px',
                    fontSize: { xs: '1rem', md: '1.1rem' }
                  }}
                >
                  I can help you generate a meal plan based on your current inventory or cravings.
                </Typography>
              </Box>

              <Box sx={{
                mt: { xs: 3, md: 4 },
                p: 2,
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                backdropFilter: 'blur(10px)'
              }}>
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#4ECDC4',
                  boxShadow: '0 0 10px #4ECDC4'
                }} />
                <Typography sx={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : '#000000',
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }}>
                  "Suggest a high-protein dinner under $15..."
                </Typography>
              </Box>
            </GlassCard>
          </Grid>

          {/* 2. Budget Tracker - Full Width */}
          <Grid size={{ xs: 12 }}>
            <motion.div variants={item}>
              <BudgetTracker
                total={200}
                spent={144}
              />
            </motion.div>
          </Grid>

          {/* 3. QUICK ACTION: Shopping List (Square) */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <GlassCard
              intensity="ultra"
              component={motion.div}
              variants={item}
              onClick={() => navigate('/shopping-list')}
              sx={{
                height: { xs: 180, md: 200 },
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: { xs: 2.5, md: 3 }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <ShoppingCartOutlined sx={{
                  color: mode === 'dark' ? 'white' : '#000000',
                  fontSize: { xs: 28, md: 30 }
                }} />
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    color: mode === 'dark' ? 'white' : '#000000',
                    fontSize: { xs: '1.75rem', md: '2rem' }
                  }}
                >
                  12
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    color: mode === 'dark' ? 'white' : '#000000',
                    fontSize: { xs: '1.1rem', md: '1.25rem' }
                  }}
                >
                  Shopping List
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    fontSize: { xs: '0.85rem', md: '0.875rem' }
                  }}
                >
                  3 items urgent
                </Typography>
              </Box>
            </GlassCard>
          </Grid>

          {/* 4. QUICK ACTION: Meal Plan (Square) */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <GlassCard
              intensity="ultra"
              component={motion.div}
              variants={item}
              onClick={() => navigate('/meal-plan')}
              sx={{
                height: { xs: 180, md: 200 },
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: { xs: 2.5, md: 3 }
              }}
            >
               <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <RestaurantMenu sx={{
                  color: mode === 'dark' ? 'white' : '#000000',
                  fontSize: { xs: 28, md: 30 }
                }} />
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    color: mode === 'dark' ? 'white' : '#000000',
                    fontSize: { xs: '1.75rem', md: '2rem' }
                  }}
                >
                  3
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    color: mode === 'dark' ? 'white' : '#000000',
                    fontSize: { xs: '1.1rem', md: '1.25rem' }
                  }}
                >
                  Today's Menu
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    fontSize: { xs: '0.85rem', md: '0.875rem' }
                  }}
                >
                  Dinner not prepped
                </Typography>
              </Box>
            </GlassCard>
          </Grid>

          {/* 5. INSIGHT: Streak/Health (Rectangle) */}
          <Grid size={{ xs: 12, md: 4 }}>
             <GlassCard
              intensity="ultra"
              component={motion.div}
              variants={item}
              sx={{
                height: { xs: 180, md: 200 },
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 2, md: 3 },
                p: { xs: 2.5, md: 3 }
              }}
            >
               <Box sx={{
                 p: 2,
                 bgcolor: 'rgba(255,107,107,0.2)',
                 borderRadius: '50%'
               }}>
                 <TrendingUp sx={{ fontSize: { xs: 28, md: 32 }, color: '#FF6B6B' }} />
               </Box>
               <Box>
                 <Typography
                   variant="h5"
                   fontWeight="bold"
                   sx={{
                     color: mode === 'dark' ? 'white' : '#000000',
                     fontSize: { xs: '1.15rem', md: '1.5rem' }
                   }}
                 >
                   5 Day Streak
                 </Typography>
                 <Typography
                   variant="body2"
                   sx={{
                     color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                     fontSize: { xs: '0.85rem', md: '0.875rem' }
                   }}
                 >
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
