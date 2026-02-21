/* client/src/components/pwa/InstallPrompt.tsx */
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, IconButton, Card } from '@mui/material';
import { Close, GetApp, PhoneAndroid, Laptop } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Prompt - Beautiful card prompting users to install the app
 * Shows after 3 days of use with smart timing
 */
const InstallPrompt: React.FC = () => {
  const { mode } = useTheme();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      return;
    }

    // Check first visit date
    const firstVisit = localStorage.getItem('first-visit');
    const now = new Date().getTime();

    if (!firstVisit) {
      localStorage.setItem('first-visit', now.toString());
      return;
    }

    // Show after 3 days (259200000 ms)
    const daysSinceFirstVisit = (now - parseInt(firstVisit)) / (1000 * 60 * 60 * 24);
    const shouldShow = daysSinceFirstVisit >= 3;

    // Check engagement score (visited at least 5 times)
    const visitCount = parseInt(localStorage.getItem('visit-count') || '0');
    const hasEngagement = visitCount >= 5;

    if (shouldShow && hasEngagement) {
      // Delay showing by 5 seconds to not interrupt initial page load
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    }

    // Track visit count
    localStorage.setItem('visit-count', (visitCount + 1).toString());

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      return;
    }

    if (isIOS) {
      // Show iOS instructions
      setShowPrompt(true);
      return;
    }

    // Trigger install prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        logger.info('User accepted PWA install');
        setShowPrompt(false);
      } else {
        logger.info('User dismissed PWA install');
      }

      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Reset first visit to show again in 3 days
    localStorage.setItem('first-visit', new Date().getTime().toString());
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
        onClick={handleDismiss}
      >
        <Card
          component={motion.div}
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          sx={{
            maxWidth: 450,
            width: '100%',
            p: 3,
            borderRadius: 'var(--radius-lg)',
            background: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(26, 29, 46, 0.95) 0%, rgba(30, 35, 55, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 247, 250, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 107, 53, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={handleDismiss}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'var(--text-tertiary)',
            }}
          >
            <Close />
          </IconButton>

          {/* Icon */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Box
              component={motion.div}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 107, 53, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GetApp sx={{ fontSize: 32, color: 'var(--chef-orange)' }} />
            </Box>
          </Box>

          {/* Content */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 1,
              background: 'linear-gradient(135deg, var(--chef-orange) 0%, #ff8a50 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Install Grocery20
          </Typography>

          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: 'var(--text-secondary)',
              mb: 3,
            }}
          >
            Get quick access to your meal plans, shopping lists, and AI assistant. Works offline!
          </Typography>

          {/* Benefits */}
          <Box sx={{ mb: 3 }}>
            {[
              { icon: <PhoneAndroid />, text: 'Works on all your devices' },
              { icon: <Laptop />, text: 'No app store required' },
              { icon: <GetApp />, text: 'Instant access from home screen' },
            ].map((benefit, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 1,
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 107, 53, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--chef-orange)',
                  }}
                >
                  {benefit.icon}
                </Box>
                <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                  {benefit.text}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* iOS-specific instructions */}
          {isIOS && (
            <Box
              sx={{
                p: 2,
                borderRadius: 'var(--radius-md)',
                bgcolor: 'rgba(255, 107, 53, 0.1)',
                mb: 3,
              }}
            >
              <Typography variant="body2" sx={{ color: 'var(--text-primary)', mb: 1 }}>
                <strong>To install on iOS:</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                1. Tap the Share button in Safari
                <br />
                2. Scroll down and tap "Add to Home Screen"
                <br />
                3. Tap "Add" in the top right
              </Typography>
            </Box>
          )}

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleRemindLater}
              sx={{
                borderColor: 'var(--text-tertiary)',
                color: 'var(--text-secondary)',
                '&:hover': {
                  borderColor: 'var(--text-secondary)',
                  bgcolor: 'rgba(255, 107, 53, 0.05)',
                },
              }}
            >
              Remind Me Later
            </Button>
            {!isIOS && (
              <Button
                fullWidth
                variant="contained"
                onClick={handleInstallClick}
                sx={{
                  bgcolor: 'var(--chef-orange)',
                  color: '#fff',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#ff8a50',
                  },
                }}
              >
                Install Now
              </Button>
            )}
          </Box>
        </Card>
      </Box>
    </AnimatePresence>
  );
};

export default InstallPrompt;
