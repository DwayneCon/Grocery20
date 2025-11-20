import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Alert } from '@mui/material';
import { Restaurant, ShoppingCart, Chat, TrendingUp, People as PeopleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../features/store';
import CreateHouseholdDialog from '../components/household/CreateHouseholdDialog';
import GlassCard from '../components/common/GlassCard';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [createHouseholdOpen, setCreateHouseholdOpen] = useState(false);
  const [showHouseholdPrompt, setShowHouseholdPrompt] = useState(false);

  useEffect(() => {
    // Show household creation prompt if user doesn't have one
    if (user && !user.householdId) {
      setShowHouseholdPrompt(true);
    }
  }, [user]);

  const cards = [
    {
      title: 'Start Planning',
      description: 'Chat with AI to create your meal plan',
      icon: <Chat sx={{ fontSize: 48, color: 'primary.main' }} />,
      action: () => navigate('/chat'),
      buttonText: 'Start Chat',
    },
    {
      title: 'Meal Plan',
      description: 'View and manage your weekly meal plan',
      icon: <Restaurant sx={{ fontSize: 48, color: 'secondary.main' }} />,
      action: () => navigate('/meal-plan'),
      buttonText: 'View Meals',
    },
    {
      title: 'Shopping List',
      description: 'Check your optimized shopping list',
      icon: <ShoppingCart sx={{ fontSize: 48, color: 'success.main' }} />,
      action: () => navigate('/shopping-list'),
      buttonText: 'View List',
    },
    {
      title: 'Budget Tracker',
      description: 'Monitor your grocery spending',
      icon: <TrendingUp sx={{ fontSize: 48, color: 'info.main' }} />,
      action: () => {},
      buttonText: 'View Budget',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back! Here's your meal planning overview.
      </Typography>

      {/* Household Setup Prompt */}
      {showHouseholdPrompt && (
        <GlassCard intensity="strong" sx={{ mb: 4, background: 'linear-gradient(135deg, rgba(132, 94, 194, 0.1), rgba(255, 107, 107, 0.1))' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🎉 Set Up Your Household
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create your household to add family members, set preferences, and get personalized meal plans!
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              onClick={() => setCreateHouseholdOpen(true)}
              sx={{ minWidth: 150 }}
            >
              Get Started
            </Button>
          </Box>
        </GlassCard>
      )}

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>{card.icon}</Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {card.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={card.action}
                >
                  {card.buttonText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Household Dialog */}
      <CreateHouseholdDialog
        open={createHouseholdOpen}
        onClose={() => setCreateHouseholdOpen(false)}
        onSuccess={() => {
          setShowHouseholdPrompt(false);
          // Optionally refresh user data
          window.location.reload();
        }}
      />
    </Box>
  );
};

export default DashboardPage;
