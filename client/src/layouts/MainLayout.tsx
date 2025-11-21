import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, IconButton, Tooltip, useTheme as useMuiTheme, useMediaQuery } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Restaurant as RestaurantIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import GlassCard from '../components/common/GlassCard';
import AccessibilityMenu from '../components/common/AccessibilityMenu';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [dockVisible, setDockVisible] = useState(true);
  const [mouseNearBottom, setMouseNearBottom] = useState(false);
  const [hoveringDock, setHoveringDock] = useState(false);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'AI Chat', icon: <ChatIcon />, path: '/chat' },
    { text: 'Household', icon: <PeopleIcon />, path: '/household' },
    { text: 'Meal Plan', icon: <RestaurantIcon />, path: '/meal-plan' },
    { text: 'Shopping List', icon: <ShoppingCartIcon />, path: '/shopping-list' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Auto-hide dock behavior (macOS style)
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const triggerZone = 150; // pixels from bottom to trigger show

      // Check if mouse is near bottom of screen
      if (windowHeight - e.clientY < triggerZone) {
        setMouseNearBottom(true);
        setDockVisible(true);
        clearTimeout(hideTimeout);
      } else {
        setMouseNearBottom(false);
        // Only hide if not hovering over dock
        if (!hoveringDock) {
          hideTimeout = setTimeout(() => {
            setDockVisible(false);
          }, 2000);
        }
      }
    };

    // On mobile, keep dock always visible
    if (isMobile) {
      setDockVisible(true);
    } else {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimeout);
    };
  }, [isMobile, hoveringDock]);

  // Hide dock when mouse leaves dock and is not in trigger zone
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    if (!hoveringDock && !mouseNearBottom && !isMobile) {
      hideTimeout = setTimeout(() => {
        setDockVisible(false);
      }, 1000);
    }

    return () => {
      clearTimeout(hideTimeout);
    };
  }, [hoveringDock, mouseNearBottom, isMobile]);

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', overflowX: 'hidden', position: 'relative', bgcolor: '#0f172a' }}>

      {/* Content Area - Now Full Width */}
      <Box component="main" sx={{ pb: { xs: 12, md: 16 }, width: '100%' }}>
        <AnimatePresence mode='wait'>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Dock Indicator - Shows where dock is when hidden */}
      {!dockVisible && !isMobile && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          sx={{
            position: 'fixed',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            width: 40,
            height: 4,
            borderRadius: 2,
            bgcolor: 'rgba(78, 205, 196, 0.5)',
            boxShadow: '0 0 20px rgba(78, 205, 196, 0.3)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.5,
              },
            },
          }}
        />
      )}

      {/* Responsive Floating Dock - Auto-hide */}
      <AnimatePresence>
        {dockVisible && (
          <Box
            component={motion.div}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            sx={{
              position: 'fixed',
              bottom: { xs: 24, md: 40 },
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              width: 'auto',
              maxWidth: { xs: '95vw', md: '800px' },
            }}
          >
        <GlassCard
          intensity="strong"
          hover={false}
          onMouseEnter={() => setHoveringDock(true)}
          onMouseLeave={() => setHoveringDock(false)}
          sx={{
            p: 1.5,
            borderRadius: 50,
            display: 'flex !important',
            flexDirection: 'row !important',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 1, md: 2 },
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(25px)',
            background: 'rgba(15, 23, 42, 0.6)',
            '& > *': {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 'inherit'
            }
          }}
        >
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.text} title={item.text} placement="top" arrow>
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.15, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  sx={{ position: 'relative' }}
                >
                  <IconButton
                    onClick={() => navigate(item.path)}
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      color: isActive ? '#4ECDC4' : 'rgba(255,255,255,0.5)',
                      bgcolor: isActive ? 'rgba(78, 205, 196, 0.1)' : 'transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: '#4ECDC4',
                        bgcolor: 'rgba(255,255,255,0.05)',
                      }
                    }}
                  >
                    {item.icon}
                  </IconButton>

                  {/* Active Dot Indicator */}
                  {isActive && (
                    <Box
                      component={motion.div}
                      layoutId="activeDot"
                      sx={{
                        position: 'absolute',
                        bottom: -4,
                        left: '50%',
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        bgcolor: '#4ECDC4',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  )}
                </Box>
              </Tooltip>
            );
          })}

          <Box sx={{ width: 1, height: 32, bgcolor: 'rgba(255,255,255,0.1)', mx: { xs: 0.5, md: 1 } }} />

          {/* Accessibility Menu */}
          <AccessibilityMenu />

          <Tooltip title="Logout" placement="top" arrow>
            <Box component={motion.div} whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: '#FF6B6B',
                  '&:hover': { bgcolor: 'rgba(255, 107, 107, 0.1)' }
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          </Tooltip>
        </GlassCard>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default MainLayout;
