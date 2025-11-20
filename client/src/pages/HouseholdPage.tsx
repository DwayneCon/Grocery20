import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  Warning as WarningIcon,
  FavoriteBorder as FavoriteIcon,
  ThumbDown as ThumbDownIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import GlassCard from '../components/common/GlassCard';
import NeuroCard from '../components/common/NeuroCard';
import { RootState, AppDispatch } from '../features/store';
import {
  fetchHouseholdSummary,
  addHouseholdMember,
  removeHouseholdMember,
} from '../features/household/householdSlice';
import { sanitizeText, sanitizeInput } from '../utils/sanitize';

const HouseholdPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { summary, loading, error } = useSelector((state: RootState) => state.household);
  const { user } = useSelector((state: RootState) => state.auth);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    age: '',
    allergies: '',
    dislikes: '',
    likes: '',
  });

  useEffect(() => {
    if (user?.householdId) {
      dispatch(fetchHouseholdSummary(user.householdId));
    }
  }, [dispatch, user?.householdId]);

  const handleAddMember = async () => {
    if (!user?.householdId || !newMember.name) return;

    // Sanitize all user inputs
    const memberData = {
      name: sanitizeInput(newMember.name),
      age: newMember.age ? parseInt(newMember.age) : undefined,
      dietaryRestrictions: newMember.allergies
        .split(',')
        .map((a) => ({ type: 'allergy', item: sanitizeInput(a.trim()) }))
        .filter((a) => a.item),
      preferences: {
        dislikes: newMember.dislikes.split(',').map((d) => sanitizeInput(d.trim())).filter(Boolean),
        likes: newMember.likes.split(',').map((l) => sanitizeInput(l.trim())).filter(Boolean),
      },
    };

    await dispatch(addHouseholdMember({ householdId: user.householdId, memberData }));

    // Refetch the summary to show the new member
    await dispatch(fetchHouseholdSummary(user.householdId));

    setAddMemberOpen(false);
    setNewMember({ name: '', age: '', allergies: '', dislikes: '', likes: '' });
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user?.householdId) return;
    if (window.confirm('Are you sure you want to remove this member?')) {
      await dispatch(removeHouseholdMember({ householdId: user.householdId, memberId }));

      // Refetch the summary to update the list
      await dispatch(fetchHouseholdSummary(user.householdId));
    }
  };

  if (loading && !summary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user?.householdId) {
    return (
      <Box>
        <Alert severity="info">
          You need to create a household first. Go to Dashboard to create one.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          🏠 {summary?.household?.name ? sanitizeText(summary.household.name) : 'My Household'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your household members, preferences, and dietary restrictions
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <GlassCard intensity="medium">
              <Box sx={{ textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {summary.stats.totalMembers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Members
                </Typography>
              </Box>
            </GlassCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <GlassCard intensity="medium">
              <Box sx={{ textAlign: 'center' }}>
                <WarningIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {summary.stats.totalAllergies}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Allergies
                </Typography>
              </Box>
            </GlassCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <GlassCard intensity="medium">
              <Box sx={{ textAlign: 'center' }}>
                <RestaurantIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {summary.stats.totalRestrictions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Restrictions
                </Typography>
              </Box>
            </GlassCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <GlassCard intensity="medium">
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  ${summary.stats.weeklyBudget}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Weekly Budget
                </Typography>
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      {/* Aggregated Preferences */}
      {summary?.aggregated && (
        <GlassCard intensity="strong" sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            🎯 Household Summary
          </Typography>

          {summary.aggregated.allergies.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                ⚠️ Allergies (Must Avoid):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {summary.aggregated.allergies.map((allergy, index) => (
                  <Chip
                    key={index}
                    label={sanitizeText(allergy)}
                    color="error"
                    size="small"
                    icon={<WarningIcon />}
                  />
                ))}
              </Box>
            </Box>
          )}

          {summary.aggregated.dislikes.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                👎 Dislikes:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {summary.aggregated.dislikes.map((dislike, index) => (
                  <Chip
                    key={index}
                    label={sanitizeText(dislike)}
                    size="small"
                    icon={<ThumbDownIcon />}
                  />
                ))}
              </Box>
            </Box>
          )}

          {summary.aggregated.preferences.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                👍 Preferences:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {summary.aggregated.preferences.map((pref, index) => (
                  <Chip
                    key={index}
                    label={sanitizeText(pref)}
                    color="success"
                    size="small"
                    icon={<FavoriteIcon />}
                  />
                ))}
              </Box>
            </Box>
          )}
        </GlassCard>
      )}

      {/* Members Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          👥 Household Members
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddMemberOpen(true)}
          sx={{ borderRadius: 3 }}
        >
          Add Member
        </Button>
      </Box>

      {/* Member Cards */}
      <Grid container spacing={3}>
        {summary?.members.map((member, index) => (
          <Grid item xs={12} sm={6} md={4} key={member.id}>
            <NeuroCard
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {sanitizeText(member.name)}
                  </Typography>
                  {member.age && (
                    <Typography variant="body2" color="text.secondary">
                      Age: {member.age}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <IconButton size="small" color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleRemoveMember(member.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Allergies */}
              {member.dietary_restrictions && member.dietary_restrictions.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="error" display="block" gutterBottom>
                    Allergies:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {member.dietary_restrictions.map((restriction, idx) => {
                      const item = typeof restriction === 'string' ? restriction : restriction.item;
                      return (
                        <Chip key={idx} label={sanitizeText(item)} size="small" color="error" variant="outlined" />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Dislikes */}
              {member.preferences?.dislikes && member.preferences.dislikes.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Dislikes:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {member.preferences.dislikes.map((dislike: string, idx: number) => (
                      <Chip key={idx} label={sanitizeText(dislike)} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Likes */}
              {member.preferences?.likes && member.preferences.likes.length > 0 && (
                <Box>
                  <Typography variant="caption" color="success.main" display="block" gutterBottom>
                    Likes:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {member.preferences.likes.map((like: string, idx: number) => (
                      <Chip key={idx} label={sanitizeText(like)} size="small" color="success" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </NeuroCard>
          </Grid>
        ))}
      </Grid>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Household Member</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Age (optional)"
            type="number"
            value={newMember.age}
            onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Allergies (comma-separated)"
            value={newMember.allergies}
            onChange={(e) => setNewMember({ ...newMember, allergies: e.target.value })}
            margin="normal"
            placeholder="peanuts, shellfish, dairy"
            helperText="Critical: These will be strictly avoided"
          />
          <TextField
            fullWidth
            label="Dislikes (comma-separated)"
            value={newMember.dislikes}
            onChange={(e) => setNewMember({ ...newMember, dislikes: e.target.value })}
            margin="normal"
            placeholder="mushrooms, olives, cilantro"
          />
          <TextField
            fullWidth
            label="Likes (comma-separated)"
            value={newMember.likes}
            onChange={(e) => setNewMember({ ...newMember, likes: e.target.value })}
            margin="normal"
            placeholder="chicken, pasta, vegetables"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberOpen(false)}>Cancel</Button>
          <Button onClick={handleAddMember} variant="contained" disabled={!newMember.name}>
            Add Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HouseholdPage;
