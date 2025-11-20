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
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Main Content Area */}
      <Box component="main" sx={{ pb: 12 }}>
        <AnimatePresence mode='wait'>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Floating Glass Navigation Dock */}
      <Box
        component={motion.div}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        sx={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: 'auto',
          maxWidth: '90vw',
        }}
      >
        <GlassCard
          intensity="strong"
          sx={{
            p: 1,
            borderRadius: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)',
            background: 'rgba(22, 22, 22, 0.6)'
          }}
        >
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.text} title={item.text} placement="top" arrow>
                <motion.div
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      color: isActive ? '#4ECDC4' : 'rgba(255,255,255,0.6)',
                      bgcolor: isActive ? 'rgba(78, 205, 196, 0.15)' : 'transparent',
                      p: 1.5,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: '#4ECDC4',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      }
                    }}
                  >
                    {item.icon}
                  </IconButton>
                </motion.div>
              </Tooltip>
            );
          })}

          <Box sx={{ width: 1, height: 24, bgcolor: 'rgba(255,255,255,0.1)', mx: 1 }} />

          <Tooltip title="Logout" placement="top" arrow>
             <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: '#FF6B6B',
                  p: 1.5,
                  '&:hover': { bgcolor: 'rgba(255, 107, 107, 0.1)' }
                }}
              >
                <LogoutIcon />
              </IconButton>
            </motion.div>
          </Tooltip>

        </GlassCard>
      </Box>
    </Box>
  );
};

export default MainLayout;
