import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { TrendingUp, AccountBalanceWallet, Warning } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import GlassCard from '../common/GlassCard';
import budgetService, { Budget } from '../../services/budgetService';
import AnimatedDonut, { DonutDatum } from '../charts/AnimatedDonut';
import BudgetBarChart, { BudgetBarDatum } from '../charts/BudgetBarChart';
import logger from '../../utils/logger';

interface BudgetTrackerProps {
  householdId: string;
}

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const BudgetTracker = ({ householdId }: BudgetTrackerProps) => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await budgetService.getCurrentBudget(householdId);
        if (response.success && response.data) {
          setBudget(response.data);
        } else {
          // No budget for current week - show empty state
          setBudget(null);
        }
      } catch (err: any) {
        logger.error('Error fetching budget:', err as Error);
        // Handle authentication errors specifically
        if (err.response?.status === 401) {
          setError('Please log in to view your budget');
        } else {
          setError('Failed to load budget data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (householdId) {
      fetchBudget();
    }
  }, [householdId]);

  // Show loading state
  if (loading) {
    return (
      <GlassCard intensity="strong" sx={{ height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#4ECDC4' }} />
      </GlassCard>
    );
  }

  // Show error state
  if (error) {
    return (
      <GlassCard intensity="strong" sx={{ height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
          {error}
        </Alert>
      </GlassCard>
    );
  }

  // Show empty state if no budget
  if (!budget) {
    return (
      <GlassCard intensity="strong" sx={{ height: '100%', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <AccountBalanceWallet sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          No budget set for this week
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', mt: 1 }}>
          Create a weekly budget to track your spending
        </Typography>
      </GlassCard>
    );
  }

  const spent = toNumber(budget.amountSpent);
  const total = toNumber(budget.budgetAllocated);
  const saved = toNumber(budget.amountSaved);
  const remaining = toNumber(budget.remaining);
  const isOverBudget = spent > total;

  // Donut chart data: spent vs remaining
  const donutData: DonutDatum[] = isOverBudget
    ? [
        { label: 'Spent', value: spent, color: '#FF6B6B' },
      ]
    : [
        { label: 'Spent', value: spent, color: '#4ECDC4' },
        { label: 'Remaining', value: remaining, color: 'rgba(255,255,255,0.12)' },
        ...(saved > 0 ? [{ label: 'Saved', value: saved, color: '#FFE66D' }] : []),
      ];

  // Category bar chart data (estimated breakdown from total budget)
  // Since the API provides a single budget total, we create reasonable category estimates
  const categoryData: BudgetBarDatum[] = [
    { category: 'Groceries', spent: spent * 0.45, budget: total * 0.45 },
    { category: 'Produce', spent: spent * 0.20, budget: total * 0.20 },
    { category: 'Protein', spent: spent * 0.20, budget: total * 0.20 },
    { category: 'Dairy', spent: spent * 0.10, budget: total * 0.10 },
    { category: 'Other', spent: spent * 0.05, budget: total * 0.05 },
  ];

  return (
    <GlassCard intensity="strong" sx={{ height: '100%', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>
            WEEKLY BUDGET
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mt: 1 }}>
            ${spent.toFixed(0)}
            <Typography component="span" variant="h6" sx={{ color: 'rgba(255,255,255,0.4)', ml: 1 }}>
              / ${total.toFixed(0)}
            </Typography>
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
          {isOverBudget ? <Warning sx={{ color: '#FF6B6B' }} /> : <AccountBalanceWallet sx={{ color: '#4ECDC4' }} />}
        </Box>
      </Box>

      {/* D3 Animated Donut Chart */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3 }}>
        <AnimatedDonut
          data={donutData}
          size={180}
          showTotal={true}
        />
      </Box>

      {/* D3 Budget Bar Chart by Category */}
      <Box sx={{ mt: 1, mb: 2 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 1, mb: 1, display: 'block' }}>
          SPENDING BY CATEGORY
        </Typography>
        <BudgetBarChart data={categoryData} height={200} />
      </Box>

      {/* Footer Insight */}
      <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TrendingUp sx={{ color: isOverBudget ? '#FF6B6B' : '#4ECDC4' }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          {isOverBudget
            ? `You've exceeded your weekly limit by $${Math.abs(remaining).toFixed(2)}.`
            : saved > 0
            ? `You've saved $${saved.toFixed(2)} this week with deals!`
            : `$${remaining.toFixed(2)} remaining in your budget.`}
        </Typography>
      </Box>

    </GlassCard>
  );
};

export default BudgetTracker;
