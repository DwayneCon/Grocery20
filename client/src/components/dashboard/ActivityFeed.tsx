/* client/src/components/dashboard/ActivityFeed.tsx */
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import {
  RestaurantMenu,
  CheckCircle,
  BookmarkAdded,
  Inbox,
} from '@mui/icons-material';
import GlassCard from '../common/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { springs } from '../../utils/springConfig';

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  text: string;
  timestamp: string;
  color: string;
}

// Sample/placeholder data -- will be replaced with real-time Socket.IO data in Task 24
const sampleActivities: ActivityItem[] = [
  {
    id: '1',
    icon: <RestaurantMenu sx={{ fontSize: 18 }} />,
    text: 'Meal plan updated',
    timestamp: '2 hours ago',
    color: 'var(--basil-green)',
  },
  {
    id: '2',
    icon: <CheckCircle sx={{ fontSize: 18 }} />,
    text: 'Shopping list completed',
    timestamp: 'Yesterday',
    color: 'var(--chef-orange)',
  },
  {
    id: '3',
    icon: <BookmarkAdded sx={{ fontSize: 18 }} />,
    text: 'New recipe saved',
    timestamp: '2 days ago',
    color: '#667eea',
  },
];

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.gentle,
  },
};

const ActivityFeed = () => {
  const { mode } = useTheme();
  const activities = sampleActivities; // Replace with real data when Socket.IO is wired up

  return (
    <GlassCard
      intensity="strong"
      hover={false}
      sx={{
        height: '100%',
        p: { xs: 2.5, md: 3 },
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
          letterSpacing: 2,
          fontWeight: 'bold',
          fontSize: '0.7rem',
          mb: 2,
          display: 'block',
        }}
      >
        RECENT ACTIVITY
      </Typography>

      {activities.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            py: 4,
          }}
        >
          <Inbox
            sx={{
              fontSize: 40,
              color: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
              fontFamily: 'var(--font-body)',
            }}
          >
            No recent activity
          </Typography>
        </Box>
      ) : (
        <Box
          component={motion.div}
          variants={listVariants}
          initial="hidden"
          animate="visible"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          {activities.map((activity) => (
            <Box
              key={activity.id}
              component={motion.div}
              variants={itemVariants}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 'var(--radius-md)',
                transition: 'background 0.15s ease',
                '&:hover': {
                  background: mode === 'dark'
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.02)',
                },
              }}
            >
              {/* Icon */}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: activity.color,
                  background: mode === 'dark'
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                  flexShrink: 0,
                }}
              >
                {activity.icon}
              </Box>

              {/* Text */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.3,
                  }}
                >
                  {activity.text}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: mode === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {activity.timestamp}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </GlassCard>
  );
};

export default ActivityFeed;
