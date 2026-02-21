/* client/src/components/dashboard/QuickActions.tsx */
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Chat, CalendarMonth, ShoppingCart, Inventory2 } from '@mui/icons-material';
import GlassCard from '../common/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { springs } from '../../utils/springConfig';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  emoji: string;
  path: string;
  gradient: string;
}

const actions: QuickAction[] = [
  {
    icon: <Chat />,
    label: 'Chat with Nora',
    emoji: '\uD83D\uDCAC',
    path: '/chat',
    gradient: 'linear-gradient(135deg, var(--chef-orange) 0%, #FF8C5A 100%)',
  },
  {
    icon: <CalendarMonth />,
    label: 'Meal Plan',
    emoji: '\uD83D\uDCCB',
    path: '/meal-plan',
    gradient: 'linear-gradient(135deg, var(--basil-green) 0%, #04885C 100%)',
  },
  {
    icon: <ShoppingCart />,
    label: 'Shopping List',
    emoji: '\uD83D\uDED2',
    path: '/shopping-list',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    icon: <Inventory2 />,
    label: 'Inventory',
    emoji: '\uD83D\uDCE6',
    path: '/inventory',
    gradient: 'linear-gradient(135deg, var(--honey-gold) 0%, #e6a817 100%)',
  },
];

const QuickActions = () => {
  const navigate = useNavigate();
  const { mode } = useTheme();

  return (
    <GlassCard
      intensity="strong"
      hover={false}
      sx={{
        height: '100%',
        p: { xs: 2.5, md: 3 },
        borderRadius: 'var(--radius-xl)',
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
        QUICK ACTIONS
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, md: 2 },
        }}
      >
        {actions.map((action) => (
          <Box
            key={action.label}
            component={motion.div}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.95 }}
            transition={springs.bouncy}
            onClick={() => navigate(action.path)}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              p: { xs: 2, md: 2.5 },
              borderRadius: 'var(--radius-lg)',
              background: mode === 'dark'
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0,0,0,0.02)',
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: mode === 'dark'
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.04)',
                borderColor: mode === 'dark'
                  ? 'rgba(255,255,255,0.15)'
                  : 'rgba(0,0,0,0.1)',
              },
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: action.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: `0 4px 14px ${mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.12)'}`,
                '& .MuiSvgIcon-root': {
                  fontSize: 22,
                },
              }}
            >
              {action.icon}
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: mode === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
                fontWeight: 600,
                fontSize: { xs: '0.75rem', md: '0.8125rem' },
                textAlign: 'center',
                lineHeight: 1.2,
                fontFamily: 'var(--font-body)',
              }}
            >
              {action.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </GlassCard>
  );
};

export default QuickActions;
