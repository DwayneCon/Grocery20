/* client/src/components/gamification/AchievementGrid.tsx */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { EmojiEvents, Whatshot, AttachMoney, LocalDining, Explore } from '@mui/icons-material';
import AchievementCard from './AchievementCard';
import { Achievement, achievementService } from '../../services/achievementService';

const categoryIcons: Record<string, React.ReactNode> = {
  all: <EmojiEvents />,
  streak: <Whatshot />,
  budget: <AttachMoney />,
  nutrition: <LocalDining />,
  exploration: <Explore />,
};

const AchievementGrid: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const data = await achievementService.getAchievements();
      setAchievements(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: '200px',
              p: 2,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {unlockedCount}/{achievements.length}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Achievements Unlocked
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: '200px',
              p: 2,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {totalPoints}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Total Points Earned
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Category Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={(_, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            },
            '& .Mui-selected': {
              color: 'var(--primary) !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'var(--primary)',
            },
          }}
        >
          <Tab
            value="all"
            label="All Achievements"
            icon={categoryIcons.all}
            iconPosition="start"
          />
          <Tab
            value="streak"
            label="Streak"
            icon={categoryIcons.streak}
            iconPosition="start"
          />
          <Tab
            value="budget"
            label="Budget"
            icon={categoryIcons.budget}
            iconPosition="start"
          />
          <Tab
            value="nutrition"
            label="Nutrition"
            icon={categoryIcons.nutrition}
            iconPosition="start"
          />
          <Tab
            value="exploration"
            label="Exploration"
            icon={categoryIcons.exploration}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Achievement Grid */}
      {filteredAchievements.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
            No achievements in this category yet.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredAchievements.map((achievement, index) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
              <AchievementCard achievement={achievement} index={index} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AchievementGrid;
