import { Box, Typography, Grid, Card, CardContent, CardMedia, Chip } from '@mui/material';
import { sanitizeText } from '../utils/sanitize';

const MealPlanPage = () => {
  const mockMeals = [
    {
      day: 'Monday',
      meals: [
        { type: 'Breakfast', name: 'Oatmeal with Berries', image: '', time: '15 min' },
        { type: 'Lunch', name: 'Chicken Caesar Salad', image: '', time: '20 min' },
        { type: 'Dinner', name: 'Baked Salmon with Vegetables', image: '', time: '35 min' },
      ],
    },
    // Add more days as needed
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Weekly Meal Plan
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Your AI-generated meal plan for this week
      </Typography>

      {mockMeals.map((day, index) => (
        <Box key={index} sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
            {sanitizeText(day.day)}
          </Typography>
          <Grid container spacing={2}>
            {day.meals.map((meal, mealIndex) => (
              <Grid item xs={12} md={4} key={mealIndex}>
                <Card>
                  <CardMedia
                    component="div"
                    sx={{
                      height: 140,
                      bgcolor: 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      {sanitizeText(meal.type)}
                    </Typography>
                  </CardMedia>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {sanitizeText(meal.name)}
                    </Typography>
                    <Chip label={meal.time} size="small" color="primary" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default MealPlanPage;
