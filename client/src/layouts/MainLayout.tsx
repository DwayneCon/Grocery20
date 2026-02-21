import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, IconButton, Tooltip, useTheme as useMuiTheme, useMediaQuery } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Restaurant as RestaurantIcon,
  MenuBook as MenuBookIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalanceWallet as BudgetIcon,
  People as PeopleIcon,
  Inventory2 as InventoryIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { RootState } from '../features/store';
import { authService } from '../services/authService';
import GlassCard from '../components/common/GlassCard';
import AccessibilityMenu from '../components/common/AccessibilityMenu';
import { springs } from '../utils/springConfig';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [dockVisible, setDockVisible] = useState(true);
  const [mouseNearBottom, setMouseNearBottom] = useState(false);
  const [hoveringDock, setHoveringDock] = useState(false);

  // Get token from Redux store
  const token = useSelector((state: RootState) => state.auth.token);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Chat with Nora', icon: <ChatIcon />, path: '/chat' },
    { text: 'Household', icon: <PeopleIcon />, path: '/household' },
    { text: 'Meal Plan', icon: <RestaurantIcon />, path: '/meal-plan' },
    { text: 'Recipes', icon: <MenuBookIcon />, path: '/recipes' },
    { text: 'Shopping List', icon: <ShoppingCartIcon />, path: '/shopping-list' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Budget', icon: <BudgetIcon />, path: '/budget' },
  ];

  const handleLogout = async () => {
    try {
      // Get refresh token from storage
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

      // Call backend logout endpoint to invalidate refresh token
      if (token && refreshToken) {
        await authService.logout(token);
      }
    } catch (error) {
      // Even if logout fails, still clear local state
    } finally {
      // Clear all authentication state
      dispatch(logout());

      // Clear tokens from storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('refreshToken');

      // Redirect to login
      navigate('/login');
    }
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
    <Box sx={{ minHeight: '100vh', width: '100%', overflowX: 'hidden', position: 'relative', bgcolor: 'var(--bg-primary)' }}>

      {/* Content Area - Now Full Width */}
      <Box component="main" sx={{ pb: { xs: 12, md: 16 }, width: '100%', px: 'var(--space-3)' }}>
        <AnimatePresence mode='wait'>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: springs.gentle,
            }}
            exit={{
              opacity: 0,
              x: -20,
              transition: springs.snappy,
            }}
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
            borderRadius: 'var(--radius-sm)',
            bgcolor: 'rgba(255, 107, 53, 0.6)',
            boxShadow: '0 0 20px rgba(255, 107, 53, 0.4)',
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
            transition={springs.snappy}
            sx={{
              position: 'fixed',
              bottom: { xs: 24, md: 40 },
              left: '50%',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
        <GlassCard
          intensity="strong"
          hover={false}
          onMouseEnter={() => setHoveringDock(true)}
          onMouseLeave={() => setHoveringDock(false)}
          sx={{
            p: 'var(--space-2)',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 1, md: 2 },
            boxShadow: 'var(--shadow-elevated)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(25px)',
            background: 'rgba(26, 29, 46, 0.7)',
            transform: 'translateX(-50%)',
            width: 'fit-content',
            maxWidth: { xs: '95vw', md: '800px' },
          }}
        >
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.text} title={item.text} placement="top" arrow>
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  transition={springs.bouncy}
                  sx={{ position: 'relative' }}
                >
                  <IconButton
                    onClick={() => navigate(item.path)}
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      color: isActive ? 'var(--chef-orange)' : 'rgba(255,255,255,0.5)',
                      bgcolor: isActive ? 'rgba(255, 107, 53, 0.15)' : 'transparent',
                      transition: 'all var(--transition-normal)',
                      '&:hover': {
                        color: 'var(--chef-orange)',
                        bgcolor: 'rgba(255, 107, 53, 0.1)',
                        transform: 'scale(1.05)',
                      }
                    }}
                    aria-label={item.text}
                  >
                    {item.icon}
                  </IconButton>

                  {/* Active Dot Indicator */}
                  {isActive && (
                    <Box
                      component={motion.div}
                      layoutId="activeNav"
                      transition={springs.bouncy}
                      sx={{
                        position: 'absolute',
                        bottom: -4,
                        left: '50%',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'var(--chef-orange)',
                        boxShadow: '0 0 8px var(--chef-orange)',
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
                  color: 'var(--error)',
                  transition: 'all var(--transition-normal)',
                  '&:hover': {
                    bgcolor: 'var(--error-bg)',
                    transform: 'scale(1.05)',
                  }
                }}
                aria-label="Logout"
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
