/* client/src/components/dashboard/ActivityFeed.tsx */
import { Box, Typography, Avatar } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RestaurantMenu,
  CheckCircle,
  BookmarkAdded,
  Inbox,
  ShoppingCart,
  Update,
  EmojiEvents,
  AccountBalanceWallet,
} from '@mui/icons-material';
import GlassCard from '../common/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { springs } from '../../utils/springConfig';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSocketContext } from '../../contexts/SocketContext';

interface ActivityItem {
  id: string;
  icon: ReactNode;
  userName: string;
  actionText: string;
  timestamp: string;
  color: string;
}

interface ActivityEntry {
  type: string;
  userName: string;
  description: string;
  timestamp: string;
}

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
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

const ActivityFeed = () => {
  const { mode } = useTheme();
  const { emit, on, isConnected } = useSocketContext();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    const unsubRecent = on('activity:recent', (data: any) => {
      if (Array.isArray(data)) {
        setEntries(data);
      }
    });

    const unsubNew = on('activity:new', (entry: any) => {
      if (!entry) return;
      setEntries((prev) => {
        const next = [entry, ...prev];
        return next.slice(0, 50);
      });
    });

    emit('activity:get-recent');

    return () => {
      unsubRecent();
      unsubNew();
    };
  }, [emit, on]);

  const activities: ActivityItem[] = useMemo(() => {
    const formatRelativeTime = (iso: string) => {
      const timestamp = new Date(iso).getTime();
      const now = Date.now();
      const diffSeconds = Math.round((timestamp - now) / 1000);
      const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
        ['second', 1],
      ];

      for (const [unit, secondsInUnit] of divisions) {
        const value = Math.round(diffSeconds / secondsInUnit);
        if (Math.abs(value) >= 1) {
          return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(value, unit);
        }
      }
      return 'just now';
    };

    const iconForType = (type: string) => {
      switch (type) {
        case 'meal_accepted':
          return { icon: <RestaurantMenu sx={{ fontSize: 18 }} />, color: 'var(--basil-green)' };
        case 'shopping_item_toggled':
        case 'shopping_item_added':
        case 'shopping_item_removed':
        case 'shopping_completed':
          return { icon: <ShoppingCart sx={{ fontSize: 18 }} />, color: 'var(--chef-orange)' };
        case 'budget_updated':
          return { icon: <AccountBalanceWallet sx={{ fontSize: 18 }} />, color: '#10b981' };
        case 'plan_approved':
          return { icon: <CheckCircle sx={{ fontSize: 18 }} />, color: 'var(--basil-green)' };
        case 'meal_modified':
          return { icon: <Update sx={{ fontSize: 18 }} />, color: '#4c8bf5' };
        case 'meal_rejected':
          return { icon: <BookmarkAdded sx={{ fontSize: 18 }} />, color: '#7c3aed' };
        case 'achievement_unlocked':
          return { icon: <EmojiEvents sx={{ fontSize: 18 }} />, color: '#f59e0b' };
        default:
          return { icon: <RestaurantMenu sx={{ fontSize: 18 }} />, color: 'var(--basil-green)' };
      }
    };

    return entries.map((entry) => {
      const { icon, color } = iconForType(entry.type);
      const description = entry.description || '';
      const userName = entry.userName || 'Someone';
      const actionText = description.startsWith(userName)
        ? description.replace(userName, '').trim()
        : description;

      return {
        id: `${entry.type}-${entry.timestamp}-${entry.userName}`,
        icon,
        userName,
        actionText: actionText || 'did something great',
        timestamp: formatRelativeTime(entry.timestamp || new Date().toISOString()),
        color,
      };
    });
  }, [entries]);

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="overline"
          sx={{
            color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
            letterSpacing: 2,
            fontWeight: 'bold',
            fontSize: '0.7rem',
            display: 'block',
          }}
        >
          RECENT ACTIVITY
        </Typography>
        {isConnected && (
          <Box
            component={motion.div}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#22c55e',
              boxShadow: '0 0 6px rgba(34,197,94,0.5)',
            }}
            title="Live"
          />
        )}
      </Box>

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
          <AnimatePresence initial={false}>
          {activities.map((activity) => (
            <Box
              key={activity.id}
              component={motion.div}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
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
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '0.85rem',
                    bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
                  }}
                >
                  {activity.userName.slice(0, 1).toUpperCase()}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: mode === 'dark' ? '#111827' : '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    color: activity.color,
                  }}
                >
                  {activity.icon}
                </Box>
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
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {activity.userName}
                  </Box>{' '}
                  {activity.actionText}
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
          </AnimatePresence>
        </Box>
      )}
    </GlassCard>
  );
};

export default ActivityFeed;
