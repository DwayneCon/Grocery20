import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  CalendarToday,
  BarChart,
  History,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useTheme } from '../contexts/ThemeContext';
import GlassCard from '../components/common/GlassCard';
import budgetService, { Budget, BudgetStats } from '../services/budgetService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const BudgetPage = () => {
  const { mode } = useTheme();
  const household = useSelector((state: RootState) => state.household.currentHousehold);
  const [activeTab, setActiveTab] = useState(0);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [budgetHistory, setBudgetHistory] = useState<Budget[]>([]);
  const [budgetStats, setBudgetStats] = useState<BudgetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    weekStart: '',
    weekEnd: '',
    budgetAllocated: '',
    notes: '',
  });

  useEffect(() => {
    if (household?.id) {
      fetchAllData();
    }
  }, [household?.id]);

  const fetchAllData = async () => {
    if (!household?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch current budget
      const currentResponse = await budgetService.getCurrentBudget(household.id);
      if (currentResponse.success && currentResponse.data) {
        setCurrentBudget(currentResponse.data);
      }

      // Fetch budget history
      const historyResponse = await budgetService.getHouseholdBudgets(household.id, 10);
      if (historyResponse.success) {
        setBudgetHistory(historyResponse.data);
      }

      // Fetch budget stats
      const statsResponse = await budgetService.getBudgetStats(household.id, 3);
      if (statsResponse.success) {
        setBudgetStats(statsResponse.data);
      }
    } catch (err: any) {
      console.error('Error fetching budget data:', err);
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        weekStart: budget.weekStart.split('T')[0],
        weekEnd: budget.weekEnd.split('T')[0],
        budgetAllocated: budget.budgetAllocated.toString(),
        notes: budget.notes || '',
      });
    } else {
      setEditingBudget(null);
      // Set default to current week
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      setFormData({
        weekStart: monday.toISOString().split('T')[0],
        weekEnd: sunday.toISOString().split('T')[0],
        budgetAllocated: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBudget(null);
    setFormData({ weekStart: '', weekEnd: '', budgetAllocated: '', notes: '' });
  };

  const handleSubmit = async () => {
    if (!household?.id || !formData.weekStart || !formData.weekEnd || !formData.budgetAllocated) {
      return;
    }

    try {
      setLoading(true);
      const response = await budgetService.createBudget({
        householdId: household.id,
        weekStart: formData.weekStart,
        weekEnd: formData.weekEnd,
        budgetAllocated: parseFloat(formData.budgetAllocated),
        notes: formData.notes || undefined,
      });

      if (response.success) {
        handleCloseDialog();
        await fetchAllData();
      }
    } catch (err: any) {
      console.error('Error saving budget:', err);
      setError('Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  if (!household) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Please set up your household first</Alert>
      </Box>
    );
  }

  if (loading && !currentBudget && budgetHistory.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: '#4ECDC4' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ color: mode === 'dark' ? 'white' : '#000000', mb: 1 }}
            >
              Budget Management
            </Typography>
            <Typography variant="body1" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              Track and manage your weekly grocery budget
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              px: 3,
              py: 1.5,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 30px rgba(102, 126, 234, 0.6)',
              },
            }}
          >
            Create Budget
          </Button>
        </Box>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Current Week Budget Card */}
      {currentBudget && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard intensity="strong" sx={{ mb: 4, p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>
                  CURRENT WEEK
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ color: 'white', mt: 1 }}>
                  ${toNumber(currentBudget.amountSpent).toFixed(2)}
                  <Typography component="span" variant="h5" sx={{ color: 'rgba(255,255,255,0.4)', ml: 1 }}>
                    / ${toNumber(currentBudget.budgetAllocated).toFixed(2)}
                  </Typography>
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                  {new Date(currentBudget.weekStart).toLocaleDateString()} - {new Date(currentBudget.weekEnd).toLocaleDateString()}
                </Typography>
              </Box>
              <IconButton
                onClick={() => handleOpenDialog(currentBudget)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                }}
              >
                <Edit sx={{ color: 'white' }} />
              </IconButton>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Remaining
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: toNumber(currentBudget.remaining) >= 0 ? '#4ECDC4' : '#FF6B6B' }}>
                    ${Math.abs(toNumber(currentBudget.remaining)).toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Saved
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#A8E6CF' }}>
                    ${toNumber(currentBudget.amountSaved).toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Usage
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>
                    {toNumber(currentBudget.percentageUsed).toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </GlassCard>
        </motion.div>
      )}

      {/* Tabs */}
      <GlassCard intensity="medium" sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            },
            '& .Mui-selected': {
              color: mode === 'dark' ? 'white' : '#000000',
            },
          }}
        >
          <Tab icon={<History />} label="History" iconPosition="start" />
          <Tab icon={<BarChart />} label="Statistics" iconPosition="start" />
        </Tabs>
      </GlassCard>

      {/* History Tab */}
      <TabPanel value={activeTab} index={0}>
        <GlassCard intensity="medium">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>Week</TableCell>
                  <TableCell sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>Allocated</TableCell>
                  <TableCell sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>Spent</TableCell>
                  <TableCell sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>Saved</TableCell>
                  <TableCell sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>Status</TableCell>
                  <TableCell sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {budgetHistory.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                        <Typography variant="body2">
                          {new Date(budget.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)' }}>
                      ${toNumber(budget.budgetAllocated).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)' }}>
                      ${toNumber(budget.amountSpent).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: '#A8E6CF' }}>
                      ${toNumber(budget.amountSaved).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={toNumber(budget.remaining) >= 0 ? <TrendingDown /> : <TrendingUp />}
                        label={toNumber(budget.remaining) >= 0 ? 'Under Budget' : 'Over Budget'}
                        size="small"
                        sx={{
                          bgcolor: toNumber(budget.remaining) >= 0 ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                          color: toNumber(budget.remaining) >= 0 ? '#4ECDC4' : '#FF6B6B',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(budget)}
                        sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {budgetHistory.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <AccountBalanceWallet sx={{ fontSize: 64, color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', mb: 2 }} />
              <Typography variant="body1" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                No budget history yet
              </Typography>
            </Box>
          )}
        </GlassCard>
      </TabPanel>

      {/* Statistics Tab */}
      <TabPanel value={activeTab} index={1}>
        {budgetStats && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <GlassCard intensity="medium" sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: mode === 'dark' ? 'white' : '#000000', mb: 3 }}>
                  Last 3 Months Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        Total Allocated
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
                        ${toNumber(budgetStats.summary.totalAllocated).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        Total Spent
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
                        ${toNumber(budgetStats.summary.totalSpent).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        Total Saved
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: '#A8E6CF' }}>
                        ${toNumber(budgetStats.summary.totalSaved).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        Avg. Usage
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
                        {toNumber(budgetStats.summary.avgPercentageUsed).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </GlassCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <GlassCard intensity="medium" sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: mode === 'dark' ? 'white' : '#000000', mb: 3 }}>
                  Weekly Averages
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        Avg. Budget
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
                        ${toNumber(budgetStats.summary.avgBudget).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        Avg. Spent
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
                        ${toNumber(budgetStats.summary.avgSpent).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        Avg. Saved
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: '#A8E6CF' }}>
                        ${toNumber(budgetStats.summary.avgSaved).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        Total Weeks
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
                        {budgetStats.summary.totalWeeks}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </GlassCard>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Create/Edit Budget Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: mode === 'dark'
              ? 'rgba(18, 18, 18, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
          {editingBudget ? 'Edit Budget' : 'Create New Budget'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Week Start"
              type="date"
              value={formData.weekStart}
              onChange={(e) => setFormData({ ...formData, weekStart: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Week End"
              type="date"
              value={formData.weekEnd}
              onChange={(e) => setFormData({ ...formData, weekEnd: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Budget Amount"
              type="number"
              value={formData.budgetAllocated}
              onChange={(e) => setFormData({ ...formData, budgetAllocated: e.target.value })}
              InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
              fullWidth
            />
            <TextField
              label="Notes (optional)"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.weekStart || !formData.weekEnd || !formData.budgetAllocated}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            {editingBudget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetPage;
