import { Box, Typography, Grid, Chip, IconButton } from '@mui/material';
import { AccessTime, LocalFireDepartment, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import { sanitizeText } from '../utils/sanitize';

const MealPlanPage = () => {
  // Mock data structure
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getMockMeal = (day: string, type: string) => {
    const meals = {
      Breakfast: ['Avocado Toast & Eggs', 'Greek Yogurt Parfait', 'Protein Pancakes'],
      Lunch: ['Grilled Chicken Salad', 'Turkey Wrap', 'Quinoa Bowl'],
      Dinner: ['Salmon with Asparagus', 'Pasta Primavera', 'Steak with Roasted Vegetables']
    };
    const mealType = type as keyof typeof meals;
    return meals[mealType][Math.floor(Math.random() * meals[mealType].length)];
  };

  return (
    <AuroraBackground colors={['#FF6B6B', '#556270', '#FF8E8E']} speed={30}>
      <Box sx={{ p: { xs: 2, md: 4 }, position: 'relative', zIndex: 2, maxWidth: '1600px', mx: 'auto' }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <Typography variant="h2" fontWeight="900" sx={{ color: 'white', textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            Weekly Menu
          </Typography>
          <GlassCard intensity="light" hover={true} sx={{ borderRadius: '50%', p: 1 }}>
            <IconButton sx={{ color: 'white' }}><Refresh /></IconButton>
          </GlassCard>
        </Box>

        {days.map((day, i) => (
          <Box key={day} sx={{ mb: 6 }}>
            <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2, fontWeight: 'bold', pl: 1 }}>
              {day}
            </Typography>

            <Grid container spacing={3}>
              {['Breakfast', 'Lunch', 'Dinner'].map((type, j) => (
                <Grid item xs={12} md={4} key={type}>
                  <GlassCard
                    intensity="medium"
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i * 0.1) + (j * 0.05) }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <Box>
                      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>
                        {type.toUpperCase()}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', mb: 2 }}>
                        {sanitizeText(getMockMeal(day, type))}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        icon={<AccessTime sx={{ "&&": { color: 'white' } }} />}
                        label="15m"
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}
                      />
                      <Chip
                        icon={<LocalFireDepartment sx={{ "&&": { color: '#FFE66D' } }} />}
                        label="450 kcal"
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}
                      />
                    </Box>
                  </GlassCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Box>
    </AuroraBackground>
  );
};

export default MealPlanPage;
