import { useState } from 'react';
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
  const [dockVisible] = useState(true);

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


  return (
    <Box sx={{ minHeight: '100vh', width: '100%', overflowX: 'hidden', position: 'relative', bgcolor: 'var(--bg-primary)' }}>

      {/* Content Area - Now Full Width */}
      <Box component="main" sx={{ pb: { xs: 9, md: 10 }, width: '100%', px: 'var(--space-3)' }}>
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

      {/* Floating Dock Navigation */}
      <Box
        component={motion.div}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springs.snappy}
        sx={{
          position: 'fixed',
          bottom: { xs: 12, md: 16 },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: { xs: 0.5, md: 1.5 },
          px: { xs: 1.5, md: 2.5 },
          py: { xs: 1, md: 1.5 },
          borderRadius: '999px',
          background: 'rgba(20, 22, 35, 0.85)',
          backdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip key={item.text} title={item.text} placement="top" arrow>
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <IconButton
                  onClick={() => navigate(item.path)}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    color: isActive ? 'var(--chef-orange)' : 'rgba(255,255,255,0.5)',
                    bgcolor: isActive ? 'rgba(255, 107, 53, 0.15)' : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: 'var(--chef-orange)',
                      bgcolor: 'rgba(255, 107, 53, 0.1)',
                    }
                  }}
                  aria-label={item.text}
                >
                  {item.icon}
                </IconButton>

                {isActive && (
                  <Box
                    component={motion.div}
                    layoutId="activeNav"
                    transition={springs.bouncy}
                    sx={{
                      position: 'absolute',
                      bottom: -2,
                      left: '50%',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      bgcolor: 'var(--chef-orange)',
                      boxShadow: '0 0 8px var(--chef-orange)',
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          );
        })}

        <Box sx={{ width: '1px', height: 24, bgcolor: 'rgba(255,255,255,0.12)', mx: { xs: 0.25, md: 0.5 }, flexShrink: 0 }} />

        <AccessibilityMenu />

        <Tooltip title="Logout" placement="top" arrow>
          <IconButton
            onClick={handleLogout}
            size={isMobile ? "small" : "medium"}
            sx={{
              color: 'var(--error)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'var(--error-bg)',
              }
            }}
            aria-label="Logout"
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default MainLayout;
