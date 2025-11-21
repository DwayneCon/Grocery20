/* client/src/components/chat/MealPlanDisplay.tsx */
import { Box, Typography, Alert } from '@mui/material';
import MealCard from './MealCard';
import { ParsedMealPlan } from '../../utils/mealParser';
import { useTheme } from '../../contexts/ThemeContext';

interface MealPlanDisplayProps {
  mealPlan: ParsedMealPlan;
}

const MealPlanDisplay = ({ mealPlan }: MealPlanDisplayProps) => {
  const { mode } = useTheme();

  if (!mealPlan.hasMeals) {
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Intro Text */}
      {mealPlan.introText && (
        <Typography
          variant="body1"
          sx={{
            color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
            mb: 2,
            lineHeight: 1.7
          }}
        >
          {mealPlan.introText}
        </Typography>
      )}

      {/* Budget Info */}
      {mealPlan.budgetInfo && (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            bgcolor: mode === 'dark' ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)',
            color: mode === 'dark' ? '#fff' : '#000',
            '& .MuiAlert-icon': {
              color: '#667eea'
            }
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {mealPlan.budgetInfo}
          </Typography>
        </Alert>
      )}

      {/* Meal Cards */}
      <Box sx={{ mb: 2 }}>
        {mealPlan.meals.map((meal, index) => (
          <MealCard key={index} meal={meal} index={index} />
        ))}
      </Box>

      {/* Closing Text */}
      {mealPlan.closingText && (
        <Typography
          variant="body2"
          sx={{
            color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
            fontStyle: 'italic',
            mt: 2,
            lineHeight: 1.6
          }}
        >
          {mealPlan.closingText}
        </Typography>
      )}
    </Box>
  );
};

export default MealPlanDisplay;
