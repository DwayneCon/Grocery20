/* client/src/components/chat/MealPlanDisplay.tsx */
import { useState } from 'react';
import { Box, Typography, Alert, Chip, Snackbar } from '@mui/material';
import { FreeBreakfast, LunchDining, DinnerDining } from '@mui/icons-material';
import MealCard from './MealCard';
import { ParsedMeal, ParsedMealPlan } from '../../utils/mealParser';
import { useTheme } from '../../contexts/ThemeContext';

interface MealPlanDisplayProps {
  mealPlan: ParsedMealPlan;
}

const MealPlanDisplay = ({ mealPlan }: MealPlanDisplayProps) => {
  const { mode } = useTheme();
  const [acceptedMeals, setAcceptedMeals] = useState<ParsedMeal[]>([]);
  const [rejectedMeals, setRejectedMeals] = useState<ParsedMeal[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  if (!mealPlan.hasMeals) {
    return null;
  }

  const handleAccept = (meal: ParsedMeal) => {
    setAcceptedMeals(prev => [...prev, meal]);
    setSnackbarMessage(`✓ Added "${meal.name}" to your meal plan`);
    console.log('Accepted meal:', meal);
    // TODO: Save to database
  };

  const handleReject = (meal: ParsedMeal) => {
    setRejectedMeals(prev => [...prev, meal]);
    setSnackbarMessage(`✗ Removed "${meal.name}"`);
    console.log('Rejected meal:', meal);
  };

  // Group meals by meal type
  const groupMealsByType = (meals: ParsedMeal[]) => {
    const breakfast: ParsedMeal[] = [];
    const lunch: ParsedMeal[] = [];
    const dinner: ParsedMeal[] = [];
    const other: ParsedMeal[] = [];

    meals.forEach(meal => {
      const type = meal.mealType?.toLowerCase();
      if (type === 'breakfast') {
        breakfast.push(meal);
      } else if (type === 'lunch') {
        lunch.push(meal);
      } else if (type === 'dinner') {
        dinner.push(meal);
      } else {
        other.push(meal);
      }
    });

    return { breakfast, lunch, dinner, other };
  };

  const { breakfast, lunch, dinner, other } = groupMealsByType(mealPlan.meals);

  const renderMealCategory = (
    title: string,
    icon: React.ReactNode,
    meals: ParsedMeal[],
    color: string,
    startIndex: number
  ) => {
    if (meals.length === 0) return null;

    return (
      <Box sx={{ mb: 4 }}>
        {/* Category Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2,
          pb: 1,
          borderBottom: `2px solid ${color}20`
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '12px',
            bgcolor: `${color}20`,
            color: color
          }}>
            {icon}
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: mode === 'dark' ? '#fff' : '#000',
              flex: 1
            }}
          >
            {title}
          </Typography>
          <Chip
            label={`${meals.length} ${meals.length === 1 ? 'meal' : 'meals'}`}
            size="small"
            sx={{
              bgcolor: `${color}20`,
              color: color,
              fontWeight: 600
            }}
          />
        </Box>

        {/* Meal Cards in this category */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {meals.map((meal, idx) => (
            <MealCard
              key={startIndex + idx}
              meal={meal}
              index={startIndex + idx}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Intro Text */}
      {mealPlan.introText && (
        <Typography
          variant="body1"
          sx={{
            color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
            mb: 3,
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
            mb: 3,
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

      {/* Meal Categories */}
      {renderMealCategory('Breakfast', <FreeBreakfast />, breakfast, '#FF9800', 0)}
      {renderMealCategory('Lunch', <LunchDining />, lunch, '#4CAF50', breakfast.length)}
      {renderMealCategory('Dinner', <DinnerDining />, dinner, '#9C27B0', breakfast.length + lunch.length)}

      {/* Other meals without specific type */}
      {other.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {other.map((meal, idx) => (
            <MealCard
              key={breakfast.length + lunch.length + dinner.length + idx}
              meal={meal}
              index={breakfast.length + lunch.length + dinner.length + idx}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </Box>
      )}

      {/* Closing Text */}
      {mealPlan.closingText && (
        <Typography
          variant="body2"
          sx={{
            color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
            fontStyle: 'italic',
            mt: 3,
            lineHeight: 1.6
          }}
        >
          {mealPlan.closingText}
        </Typography>
      )}

      {/* Snackbar for feedback */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={2000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            fontWeight: 600,
          }
        }}
      />
    </Box>
  );
};

export default MealPlanDisplay;
