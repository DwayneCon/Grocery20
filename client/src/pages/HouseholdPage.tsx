/* client/src/pages/HouseholdPage.tsx */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Grid, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Avatar } from '@mui/material';
import { Add, Edit, Delete, Restaurant, Warning, Favorite, Person } from '@mui/icons-material';
import { motion } from 'framer-motion';
import GlassCard from '../components/common/GlassCard';
import NeuroCard from '../components/common/NeuroCard';
import AuroraBackground from '../components/common/AuroraBackground';
import { RootState, AppDispatch } from '../features/store';
import { fetchHouseholdSummary, addHouseholdMember, removeHouseholdMember } from '../features/household/householdSlice';
import { sanitizeText, sanitizeInput } from '../utils/sanitize';

const HouseholdPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { summary, loading } = useSelector((state: RootState) => state.household);
  const { user } = useSelector((state: RootState) => state.auth);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', age: '', allergies: '', dislikes: '', likes: '' });

  useEffect(() => {
    if (user?.householdId) dispatch(fetchHouseholdSummary(user.householdId));
  }, [dispatch, user?.householdId]);

  const handleAddMember = async () => {
    if (!user?.householdId || !newMember.name) return;
    const memberData = {
      name: sanitizeInput(newMember.name),
      age: newMember.age ? parseInt(newMember.age) : undefined,
      dietaryRestrictions: newMember.allergies.split(',').map(a => ({ type: 'allergy', item: sanitizeInput(a.trim()) })).filter(a => a.item),
      preferences: {
        dislikes: newMember.dislikes.split(',').map(d => sanitizeInput(d.trim())).filter(Boolean),
        likes: newMember.likes.split(',').map(l => sanitizeInput(l.trim())).filter(Boolean),
      },
    };
    await dispatch(addHouseholdMember({ householdId: user.householdId, memberData }));
    await dispatch(fetchHouseholdSummary(user.householdId));
    setAddMemberOpen(false);
    setNewMember({ name: '', age: '', allergies: '', dislikes: '', likes: '' });
  };

  if (loading && !summary) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#1a1a1a' }}><CircularProgress /></Box>;

  return (
    <AuroraBackground colors={['#845EC2', '#D65DB1', '#FF9671']} speed={20}>
       <Box sx={{ p: { xs: 2, md: 6 }, position: 'relative', zIndex: 2, maxWidth: '100%', mx: 'auto' }}>

        {/* Header */}
        <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
             <Typography variant="h2" fontWeight="800" sx={{ color: 'white' }}>Household</Typography>
             <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
               Managing preferences for {summary?.household?.name || 'your family'}
             </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddMemberOpen(true)}
            sx={{ bgcolor: 'white', color: 'primary.main', borderRadius: 4, px: 3, fontWeight: 'bold' }}
          >
            Add Member
          </Button>
        </Box>

        {/* Stats Row */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[
            { label: 'Members', val: summary?.stats.totalMembers || 0, icon: <Person sx={{ color: '#4ECDC4' }} /> },
            { label: 'Allergies', val: summary?.stats.totalAllergies || 0, icon: <Warning sx={{ color: '#FF6B6B' }} /> },
            { label: 'Budget', val: `${summary?.stats.weeklyBudget || 0}`, icon: <Restaurant sx={{ color: '#FFE66D' }} /> }
          ].map((stat, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <GlassCard intensity="medium" sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>{stat.icon}</Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>{stat.val}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{stat.label}</Typography>
                </Box>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* Members Grid */}
        <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 3 }}>Family Members</Typography>
        <Grid container spacing={4}>
          {summary?.members.map((member, index) => (
            <Grid item xs={12} sm={6} lg={4} key={member.id}>
              <NeuroCard
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                sx={{ bgcolor: 'white', height: '100%' }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: '#845EC2', width: 50, height: 50 }}>{member.name[0]}</Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="text.primary">{sanitizeText(member.name)}</Typography>
                      {member.age && <Typography variant="body2" color="text.secondary">{member.age} years old</Typography>}
                    </Box>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => { if(window.confirm('Remove member?')) dispatch(removeHouseholdMember({ householdId: user!.householdId!, memberId: member.id })); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" fontWeight="bold" sx={{ color: '#FF6B6B', display: 'block', mb: 1 }}>ALLERGIES</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {member.dietary_restrictions?.length ? member.dietary_restrictions.map((r: any, i: number) => (
                      <Chip key={i} label={r.item || r} size="small" sx={{ bgcolor: '#FF6B6B', color: 'white' }} />
                    )) : <Typography variant="caption" color="text.secondary">None</Typography>}
                  </Box>

                  <Typography variant="caption" fontWeight="bold" sx={{ color: '#4ECDC4', display: 'block', mb: 1 }}>LOVES</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {member.preferences?.likes?.length ? member.preferences.likes.map((l: string, i: number) => (
                      <Chip key={i} label={l} size="small" sx={{ bgcolor: '#4ECDC4', color: 'white' }} />
                    )) : <Typography variant="caption" color="text.secondary">None</Typography>}
                  </Box>
                </Box>
              </NeuroCard>
            </Grid>
          ))}
        </Grid>

        {/* Add Member Dialog - Keep basic Material for dialogs but clean it up */}
        <Dialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} margin="normal" />
            <TextField fullWidth label="Age" type="number" value={newMember.age} onChange={(e) => setNewMember({ ...newMember, age: e.target.value })} margin="normal" />
            <TextField fullWidth label="Allergies" placeholder="Peanuts, Shellfish" value={newMember.allergies} onChange={(e) => setNewMember({ ...newMember, allergies: e.target.value })} margin="normal" />
            <TextField fullWidth label="Likes" placeholder="Pizza, Sushi" value={newMember.likes} onChange={(e) => setNewMember({ ...newMember, likes: e.target.value })} margin="normal" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddMember}>Add</Button>
          </DialogActions>
        </Dialog>

       </Box>
    </AuroraBackground>
  );
};

export default HouseholdPage;
