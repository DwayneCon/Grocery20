import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, IconButton, Tooltip, useTheme, useMediaQuery } from '@mui/material';
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

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', overflowX: 'hidden', position: 'relative' }}>

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

      {/* Responsive Floating Dock */}
      <Box
        component={motion.div}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
        sx={{
          position: 'fixed',
          bottom: { xs: 24, md: 40 },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: 'auto',
          maxWidth: { xs: '95vw', md: '800px' },
        }}
        style={{ x: "-50%" }}
      >
        <GlassCard
          intensity="strong"
          sx={{
            p: 1.5,
            borderRadius: 50,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, md: 2 },
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(25px)',
            background: 'rgba(15, 23, 42, 0.6)'
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

          <Tooltip title="Logout" placement="top" arrow>
            <Box component={motion.div} whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
              <IconButton onClick={handleLogout} color="error">
                <LogoutIcon />
              </IconButton>
            </Box>
          </Tooltip>
        </GlassCard>
      </Box>
    </Box>
  );
};

export default MainLayout;
