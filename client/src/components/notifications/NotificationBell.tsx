import { Badge, Box, IconButton } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';

const NotificationBell = () => {
  const { mode } = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    dismiss,
    requestPushPermission,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const prevUnread = useRef(unreadCount);
  const bounceControls = useAnimation();

  // Trigger a bounce + shake animation whenever the unread count increases
  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      bounceControls.start({
        scale: [1, 1.25, 0.95, 1.1, 1],
        rotate: [0, -12, 12, -6, 6, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      });
    }
    prevUnread.current = unreadCount;
  }, [unreadCount, bounceControls]);

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          zIndex: 1100,
        }}
      >
        <IconButton
          onClick={() => {
            requestPushPermission();
            setOpen(true);
          }}
          aria-label={`Open notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          sx={{
            width: 48,
            height: 48,
            bgcolor:
              mode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.05)',
            backdropFilter: 'blur(12px)',
            border:
              mode === 'dark'
                ? '1px solid rgba(255,255,255,0.12)'
                : '1px solid rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor:
                mode === 'dark'
                  ? 'rgba(255,255,255,0.14)'
                  : 'rgba(0,0,0,0.1)',
              boxShadow: '0 0 16px rgba(255, 107, 53, 0.25)',
            },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            overlap="circular"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontWeight: 700,
                fontSize: '0.7rem',
                minWidth: 20,
                height: 20,
                bgcolor: 'var(--chef-orange)',
                color: '#fff',
              },
            }}
          >
            <motion.div animate={bounceControls} style={{ display: 'flex' }}>
              <Notifications
                sx={{
                  color:
                    unreadCount > 0
                      ? 'var(--chef-orange)'
                      : mode === 'dark'
                        ? 'white'
                        : '#111827',
                  transition: 'color 0.2s ease',
                }}
              />
            </motion.div>
          </Badge>
        </IconButton>
      </Box>

      <NotificationCenter
        open={open}
        onClose={() => setOpen(false)}
        notifications={notifications}
        onMarkRead={markRead}
        onDismiss={dismiss}
        onMarkAllRead={markAllRead}
        loading={loading}
      />
    </>
  );
};

export default NotificationBell;
