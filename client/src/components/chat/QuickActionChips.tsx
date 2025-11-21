/* client/src/components/chat/QuickActionChips.tsx */
import { Box, Chip } from '@mui/material';
import { Restaurant, ShoppingCart, CalendarMonth, AttachMoney } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface QuickActionChipsProps {
  onActionClick: (action: string) => void;
}

const QuickActionChips = ({ onActionClick }: QuickActionChipsProps) => {
  const quickActions = [
    {
      icon: <Restaurant />,
      label: 'Plan Meals',
      action: 'Plan a week of healthy meals for my family',
    },
    {
      icon: <CalendarMonth />,
      label: 'Weekly Plan',
      action: 'Create a 7-day meal plan',
    },
    {
      icon: <ShoppingCart />,
      label: 'Shopping List',
      action: 'Generate a shopping list from my meal plan',
    },
    {
      icon: <AttachMoney />,
      label: 'Budget Friendly',
      action: 'Suggest budget-friendly meals under $50 per week',
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
        mb: 3,
        justifyContent: 'center',
      }}
    >
      {quickActions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Chip
            icon={action.icon}
            label={action.label}
            onClick={() => onActionClick(action.action)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.9rem',
              py: 2.5,
              px: 1,
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: 'rgba(78, 205, 196, 0.3)',
                border: '1px solid rgba(78, 205, 196, 0.5)',
                transform: 'translateY(-2px)',
              },
              '& .MuiChip-icon': {
                color: '#4ECDC4',
              },
            }}
          />
        </motion.div>
      ))}
    </Box>
  );
};

export default QuickActionChips;
