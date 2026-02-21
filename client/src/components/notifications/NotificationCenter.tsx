import { Box, Button, IconButton, Typography } from '@mui/material';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
  Close,
  DoneAll,
  CheckCircleOutline,
  Restaurant,
  LocalOffer,
  Warning,
  EmojiEvents,
  People,
  NotificationsNone,
} from '@mui/icons-material';
import { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import GlassCard from '../common/GlassCard';
import type { NotificationItem, NotificationType } from '../../hooks/useNotifications';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onMarkAllRead: () => void;
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return a human-friendly date group label.
 */
const formatGroupLabel = (dateKey: string): string => {
  const date = new Date(dateKey);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((todayStart - dateStart) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Format a timestamp as a relative time string.
 */
const formatRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Return an icon element based on the notification type.
 */
const getNotificationIcon = (type: NotificationType) => {
  const iconSx = { fontSize: 22 };

  switch (type) {
    case 'meal_reminder':
      return <Restaurant sx={{ ...iconSx, color: 'var(--chef-orange)' }} />;
    case 'deal_alert':
      return <LocalOffer sx={{ ...iconSx, color: '#4caf50' }} />;
    case 'expiration_warning':
      return <Warning sx={{ ...iconSx, color: '#ff9800' }} />;
    case 'achievement_unlocked':
      return <EmojiEvents sx={{ ...iconSx, color: '#ffd700' }} />;
    case 'household_update':
      return <People sx={{ ...iconSx, color: '#2196f3' }} />;
    default:
      return <NotificationsNone sx={{ ...iconSx, color: 'var(--chef-orange)' }} />;
  }
};

// Framer Motion variants for staggered list animation
const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NotificationCenter = ({
  open,
  onClose,
  notifications,
  onMarkRead,
  onDismiss,
  onMarkAllRead,
  loading,
}: NotificationCenterProps) => {
  const { mode } = useTheme();

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {};
    notifications.forEach((notification) => {
      const dateKey = notification.createdAt
        ? new Date(notification.createdAt).toISOString().split('T')[0]
        : 'unknown';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });
    // Sort groups newest first
    return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [notifications]);

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10, 10, 10, 0.45)',
              zIndex: 1200,
            }}
          />

          {/* Slide-in Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '90vw',
              maxWidth: '420px',
              zIndex: 1300,
              padding: '24px 20px',
              pointerEvents: 'auto',
            }}
          >
            <GlassCard
              intensity="strong"
              hover={false}
              sx={{
                height: '100%',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                p: 0,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom:
                    mode === 'dark'
                      ? '1px solid rgba(255,255,255,0.08)'
                      : '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    color: mode === 'dark' ? 'white' : '#111827',
                  }}
                >
                  Notifications
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {hasUnread && (
                    <Button
                      onClick={onMarkAllRead}
                      size="small"
                      startIcon={<DoneAll />}
                      sx={{
                        textTransform: 'none',
                        color:
                          mode === 'dark'
                            ? 'rgba(255,255,255,0.7)'
                            : 'rgba(0,0,0,0.6)',
                        '&:hover': {
                          color: 'var(--chef-orange)',
                        },
                      }}
                    >
                      Mark all read
                    </Button>
                  )}
                  <IconButton onClick={onClose} aria-label="Close notifications">
                    <Close sx={{ color: mode === 'dark' ? 'white' : '#111827' }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Notification List */}
              <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
                {loading ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography
                      sx={{
                        color:
                          mode === 'dark'
                            ? 'rgba(255,255,255,0.6)'
                            : 'rgba(0,0,0,0.6)',
                      }}
                    >
                      Loading notifications...
                    </Typography>
                  </Box>
                ) : groupedNotifications.length === 0 ? (
                  /* Empty State */
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 8,
                      gap: 2,
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <CheckCircleOutline
                        sx={{
                          fontSize: 56,
                          color: 'var(--chef-orange)',
                          opacity: 0.6,
                        }}
                      />
                    </motion.div>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color:
                          mode === 'dark'
                            ? 'rgba(255,255,255,0.7)'
                            : 'rgba(0,0,0,0.6)',
                      }}
                    >
                      All caught up!
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          mode === 'dark'
                            ? 'rgba(255,255,255,0.45)'
                            : 'rgba(0,0,0,0.4)',
                        textAlign: 'center',
                      }}
                    >
                      No new notifications right now.
                    </Typography>
                  </Box>
                ) : (
                  /* Grouped Notifications */
                  <motion.div variants={listVariants} initial="hidden" animate="visible">
                    {groupedNotifications.map(([dateKey, items]) => (
                      <Box key={dateKey} sx={{ mb: 2.5 }}>
                        <Typography
                          variant="overline"
                          sx={{
                            color:
                              mode === 'dark'
                                ? 'rgba(255,255,255,0.5)'
                                : 'rgba(0,0,0,0.4)',
                            letterSpacing: 1.5,
                            fontWeight: 700,
                          }}
                        >
                          {formatGroupLabel(dateKey)}
                        </Typography>
                        <Box
                          sx={{
                            mt: 1.5,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.2,
                          }}
                        >
                          {items.map((notification) => (
                            <motion.div
                              key={notification.id}
                              variants={itemVariants}
                              drag="x"
                              dragConstraints={{ left: -120, right: 0 }}
                              onDragEnd={(_event, info) => {
                                if (info.offset.x < -80) {
                                  onDismiss(notification.id);
                                }
                              }}
                            >
                              <GlassCard
                                intensity="light"
                                hover={false}
                                onClick={() => {
                                  if (!notification.read) {
                                    onMarkRead(notification.id);
                                  }
                                }}
                                sx={{
                                  p: 2,
                                  borderRadius: 'var(--radius-lg)',
                                  cursor: notification.read ? 'default' : 'pointer',
                                  border: notification.read
                                    ? '1px solid transparent'
                                    : '1px solid rgba(255, 107, 53, 0.35)',
                                  background: notification.read
                                    ? mode === 'dark'
                                      ? 'rgba(255,255,255,0.04)'
                                      : 'rgba(0,0,0,0.03)'
                                    : mode === 'dark'
                                      ? 'rgba(255,255,255,0.08)'
                                      : 'rgba(255, 107, 53, 0.08)',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    background: notification.read
                                      ? mode === 'dark'
                                        ? 'rgba(255,255,255,0.06)'
                                        : 'rgba(0,0,0,0.05)'
                                      : mode === 'dark'
                                        ? 'rgba(255,255,255,0.12)'
                                        : 'rgba(255, 107, 53, 0.12)',
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    gap: 1.5,
                                    alignItems: 'flex-start',
                                  }}
                                >
                                  {/* Type Icon */}
                                  <Box
                                    sx={{
                                      mt: 0.25,
                                      flexShrink: 0,
                                      width: 36,
                                      height: 36,
                                      borderRadius: 'var(--radius-md)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor:
                                        mode === 'dark'
                                          ? 'rgba(255,255,255,0.06)'
                                          : 'rgba(0,0,0,0.05)',
                                    }}
                                  >
                                    {getNotificationIcon(notification.type)}
                                  </Box>

                                  {/* Content */}
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: 1,
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle2"
                                        sx={{
                                          fontWeight: 700,
                                          color:
                                            mode === 'dark' ? 'white' : '#111827',
                                          lineHeight: 1.3,
                                        }}
                                      >
                                        {notification.title}
                                      </Typography>

                                      {/* Unread indicator dot */}
                                      {!notification.read && (
                                        <Box
                                          sx={{
                                            flexShrink: 0,
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            bgcolor: 'var(--chef-orange)',
                                            mt: 0.5,
                                          }}
                                        />
                                      )}
                                    </Box>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color:
                                          mode === 'dark'
                                            ? 'rgba(255,255,255,0.7)'
                                            : 'rgba(0,0,0,0.65)',
                                        mt: 0.25,
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      {notification.message}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color:
                                          mode === 'dark'
                                            ? 'rgba(255,255,255,0.4)'
                                            : 'rgba(0,0,0,0.4)',
                                        mt: 0.5,
                                        display: 'block',
                                      }}
                                    >
                                      {formatRelativeTime(notification.createdAt)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </GlassCard>
                            </motion.div>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </motion.div>
                )}
              </Box>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
