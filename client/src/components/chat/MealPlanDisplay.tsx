/* client/src/components/chat/MealPlanDisplay.tsx */
import { useState } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { FreeBreakfast, LunchDining, DinnerDining } from '@mui/icons-material';
import MealCard from './MealCard';
import { ParsedMeal, ParsedMealPlan } from '../../utils/mealParser';
import { useTheme } from '../../contexts/ThemeContext';

// Category color palette
const CATEGORY_COLORS = {
  breakfast: { primary: '#FF9800', bg: 'rgba(255, 152, 0, 0.08)', border: 'rgba(255, 152, 0, 0.25)' },
  lunch:     { primary: '#4CAF50', bg: 'rgba(76, 175, 80, 0.08)',  border: 'rgba(76, 175, 80, 0.25)' },
  dinner:    { primary: '#9C27B0', bg: 'rgba(156, 39, 176, 0.08)', border: 'rgba(156, 39, 176, 0.25)' },
} as const;

interface MealPlanDisplayProps {
  mealPlan: ParsedMealPlan;
  onDayApproved?: (day: string, nextDay: string | null) => void;
  onMealAccepted?: (meal: ParsedMeal) => void;
}

const MealPlanDisplay = ({ mealPlan, onMealAccepted }: MealPlanDisplayProps) => {
  const { mode } = useTheme();
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  if (!mealPlan.hasMeals) {
    return null;
  }

  const handleAccept = (meal: ParsedMeal) => {
    setSnackbarMessage(`Added "${meal.name}" to your meal plan`);
    if (onMealAccepted) onMealAccepted(meal);
  };

  const handleReject = (meal: ParsedMeal) => {
    setSnackbarMessage(`Removed "${meal.name}"`);
  };

  // Group meals by meal type
  const groupMealsByType = (meals: ParsedMeal[]) => {
    const breakfast: ParsedMeal[] = [];
    const lunch: ParsedMeal[] = [];
    const dinner: ParsedMeal[] = [];
    const other: ParsedMeal[] = [];

    meals.forEach(meal => {
      const type = meal.mealType?.toLowerCase();
      if (type === 'breakfast') breakfast.push(meal);
      else if (type === 'lunch') lunch.push(meal);
      else if (type === 'dinner') dinner.push(meal);
      else other.push(meal);
    });

    return { breakfast, lunch, dinner, other };
  };

  const { breakfast, lunch, dinner, other } = groupMealsByType(mealPlan.meals);

  const renderMealCategoryColumn = (
    title: string,
    icon: React.ReactNode,
    meals: ParsedMeal[],
    categoryKey: 'breakfast' | 'lunch' | 'dinner',
    startIndex: number
  ) => {
    const colors = CATEGORY_COLORS[categoryKey];

    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        {/* Category Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2.5,
          pb: 1.5,
          borderBottom: `3px solid ${colors.primary}`,
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '12px',
            bgcolor: colors.primary,
            color: '#fff',
            boxShadow: `0 4px 12px ${colors.primary}40`,
          }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: mode === 'dark' ? '#fff' : '#1a1a2e',
                letterSpacing: '-0.3px',
                fontSize: '1.1rem',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                fontWeight: 600,
              }}
            >
              {meals.length} {meals.length === 1 ? 'option' : 'options'}
            </Typography>
          </Box>
        </Box>

        {/* Meal Cards */}
        {meals.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {meals.map((meal, idx) => (
              <MealCard
                key={startIndex + idx}
                meal={meal}
                index={startIndex + idx}
                onAccept={handleAccept}
                onReject={handleReject}
                accentColor={colors.primary}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{
            p: 4,
            textAlign: 'center',
            color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            border: `1px dashed ${colors.border}`,
            borderRadius: '16px',
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
            color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
            mb: 3,
            lineHeight: 1.7,
            fontSize: '0.95rem',
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
            bgcolor: mode === 'dark' ? 'rgba(102, 126, 234, 0.12)' : 'rgba(102, 126, 234, 0.08)',
            color: mode === 'dark' ? '#fff' : '#1a1a2e',
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            '& .MuiAlert-icon': { color: '#667eea' },
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
            {mealPlan.budgetInfo}
          </Typography>
        </Alert>
      )}

      {/* 3-Column Grid Layout */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 3,
        mb: 3,
      }}>
        {renderMealCategoryColumn('Breakfast', <FreeBreakfast />, breakfast, 'breakfast', 0)}
        {renderMealCategoryColumn('Lunch', <LunchDining />, lunch, 'lunch', breakfast.length)}
        {renderMealCategoryColumn('Dinner', <DinnerDining />, dinner, 'dinner', breakfast.length + lunch.length)}
      </Box>

      {/* Other meals without specific type */}
      {other.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
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
            color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
            fontStyle: 'italic',
            mt: 2,
            lineHeight: 1.6,
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
            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.85)',
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
