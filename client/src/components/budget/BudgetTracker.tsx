import { Box, Typography } from '@mui/material';
import { TrendingUp, AccountBalanceWallet, Warning } from '@mui/icons-material';
import { motion } from 'framer-motion';
import GlassCard from '../common/GlassCard';

interface BudgetTrackerProps {
  spent: number;
  total: number;
}

const BudgetTracker = ({ spent = 124, total = 200 }: BudgetTrackerProps) => {
  const percentage = Math.min(100, Math.max(0, (spent / total) * 100));
  const isOverBudget = spent > total;

  // Calculate stroke dash for circular progress
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <GlassCard intensity="strong" sx={{ height: '100%', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>
            WEEKLY BUDGET
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mt: 1 }}>
            ${spent}
            <Typography component="span" variant="h6" sx={{ color: 'rgba(255,255,255,0.4)', ml: 1 }}>
              / ${total}
            </Typography>
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
          {isOverBudget ? <Warning sx={{ color: '#FF6B6B' }} /> : <AccountBalanceWallet sx={{ color: '#4ECDC4' }} />}
        </Box>
      </Box>

      {/* Circular Progress Visualization */}
      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4 }}>
        <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Indicator */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="80"
            cy="80"
            r={radius}
            stroke={isOverBudget ? '#FF6B6B' : '#4ECDC4'}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </svg>
        <Box sx={{ position: 'absolute', textAlign: 'center' }}>
          <Typography variant="h3" fontWeight="900" sx={{ color: 'white' }}>
            {Math.round(percentage)}%
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>
            USED
          </Typography>
        </Box>
      </Box>

      {/* Footer Insight */}
      <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TrendingUp sx={{ color: isOverBudget ? '#FF6B6B' : '#4ECDC4' }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          {isOverBudget
            ? "You've exceeded your weekly limit."
            : "You're on track to save $20 this week."}
        </Typography>
      </Box>

    </GlassCard>
  );
};

export default BudgetTracker;
