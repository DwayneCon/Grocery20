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

  const renderMealCategoryColumn = (
    title: string,
    icon: React.ReactNode,
    meals: ParsedMeal[],
    color: string,
    startIndex: number
  ) => {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0, // Allow flex item to shrink
      }}>
        {/* Fixed Category Header - NOT swipeable */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 3,
          pb: 2,
          borderBottom: `3px solid ${color}`,
          position: 'sticky',
          top: 0,
          bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          borderRadius: '12px',
          px: 2,
          py: 1.5,
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '14px',
            bgcolor: `${color}`,
            color: '#fff',
            boxShadow: `0 4px 12px ${color}40`,
          }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: mode === 'dark' ? '#fff' : '#000',
                letterSpacing: '-0.5px',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                fontWeight: 600,
              }}
            >
              {meals.length} {meals.length === 1 ? 'option' : 'options'}
            </Typography>
          </Box>
        </Box>

        {/* Meal Cards stacked in this column */}
        {meals.length > 0 ? (
          <Box sx={{ position: 'relative', minHeight: 250, mb: meals.length > 1 ? `${(meals.length - 1) * 15}px` : 0 }}>
            {meals.map((meal, idx) => (
              <Box
                key={startIndex + idx}
                sx={{
                  position: idx === 0 ? 'relative' : 'absolute',
                  top: idx === 0 ? 0 : `${idx * 15}px`,
                  left: 0,
                  right: 0,
                  zIndex: meals.length - idx,
                  transform: idx === 0 ? 'none' : `translateY(${idx * 3}px) scale(${1 - (idx * 0.015)})`,
                  transformOrigin: 'top center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(0) scale(1)',
                    zIndex: meals.length + 10,
                  }
                }}
              >
                <MealCard
                  meal={meal}
                  index={startIndex + idx}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{
            p: 4,
            textAlign: 'center',
            color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          }}>
            <Typography variant="body2">No meals in this category</Typography>
          </Box>
        )}
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

      {/* 3-Column Grid Layout */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 3,
        mb: 4,
      }}>
        {/* Breakfast Column */}
        {renderMealCategoryColumn('Breakfast', <FreeBreakfast />, breakfast, '#FF9800', 0)}

        {/* Lunch Column */}
        {renderMealCategoryColumn('Lunch', <LunchDining />, lunch, '#4CAF50', breakfast.length)}

        {/* Dinner Column */}
        {renderMealCategoryColumn('Dinner', <DinnerDining />, dinner, '#9C27B0', breakfast.length + lunch.length)}
      </Box>

      {/* Other meals without specific type - also stacked */}
      {other.length > 0 && (
        <Box sx={{ position: 'relative', minHeight: 200, mb: other.length > 1 ? `${(other.length - 1) * 20}px` : 2 }}>
          {other.map((meal, idx) => (
            <Box
              key={breakfast.length + lunch.length + dinner.length + idx}
              sx={{
                position: idx === 0 ? 'relative' : 'absolute',
                top: idx === 0 ? 0 : `${idx * 20}px`,
                left: 0,
                right: 0,
                zIndex: other.length - idx,
                transform: idx === 0 ? 'none' : `translateY(${idx * 4}px) scale(${1 - (idx * 0.02)})`,
                transformOrigin: 'top center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: idx === 0 ? 'none' : `translateY(${idx * 4}px) scale(1)`,
                  zIndex: other.length + 10,
                }
              }}
            >
              <MealCard
                meal={meal}
                index={breakfast.length + lunch.length + dinner.length + idx}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            </Box>
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
