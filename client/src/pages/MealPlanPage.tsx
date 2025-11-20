/* client/src/pages/MealPlanPage.tsx */
import { Box, Typography, Grid, Chip, IconButton } from '@mui/material';
import { AccessTime, LocalFireDepartment, Refresh, ArrowForward } from '@mui/icons-material';
import { motion } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import { sanitizeText } from '../utils/sanitize';

const MealPlanPage = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <AuroraBackground colors={['#FF6B6B', '#556270', '#FF8E8E']} speed={30}>
      <Box sx={{ p: { xs: 2, md: 6 }, position: 'relative', zIndex: 2, maxWidth: '100%', mx: 'auto' }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 2 }}>THIS WEEK</Typography>
            <Typography variant="h2" fontWeight="900" sx={{ color: 'white' }}>
              Meal Timeline
            </Typography>
          </Box>
          <GlassCard intensity="light" hover={true} sx={{ borderRadius: '50%', p: 1.5 }}>
            <IconButton sx={{ color: 'white' }}><Refresh /></IconButton>
          </GlassCard>
        </Box>

        {/* Full Width Grid */}
        <Grid container spacing={4}>
          {days.map((day, i) => (
            <Grid item xs={12} key={day}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                  {day} <Box component="span" sx={{ height: 1, width: 40, bgcolor: 'rgba(255,255,255,0.2)' }} />
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {['Breakfast', 'Lunch', 'Dinner'].map((type, j) => (
                  <Grid item xs={12} md={4} key={type}>
                    <GlassCard
                      intensity="medium"
                      component={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (i * 0.05) + (j * 0.05) }}
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="caption" sx={{ color: '#4ECDC4', letterSpacing: 1, fontWeight: 'bold' }}>
                          {type.toUpperCase()}
                        </Typography>
                        <ArrowForward sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 16 }} />
                      </Box>

                      <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', mb: 3 }}>
                        {sanitizeText(type === 'Breakfast' ? 'Avocado Toast & Eggs' : type === 'Lunch' ? 'Grilled Chicken Salad' : 'Salmon with Asparagus')}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip icon={<AccessTime sx={{ "&&": { color: 'white' } }} />} label="15m" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }} />
                        <Chip icon={<LocalFireDepartment sx={{ "&&": { color: '#FFE66D' } }} />} label="450 kcal" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }} />
                      </Box>
                    </GlassCard>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          ))}
        </Grid>
      </Box>
    </AuroraBackground>
  );
};

export default MealPlanPage;
