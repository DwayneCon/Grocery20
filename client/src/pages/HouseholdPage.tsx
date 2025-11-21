/* client/src/pages/HouseholdPage.tsx */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Avatar, Grid, Divider } from '@mui/material';
import { Add, Edit, Delete, Restaurant, Warning, Favorite, Person, FavoriteBorder, Close, TrendingUp, AutoAwesome } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/common/GlassCard';
import AuroraBackground from '../components/common/AuroraBackground';
import { RootState, AppDispatch } from '../features/store';
import { fetchHouseholdSummary, addHouseholdMember, removeHouseholdMember, updateHouseholdMember } from '../features/household/householdSlice';
import { sanitizeText, sanitizeInput } from '../utils/sanitize';
import { useTheme } from '../contexts/ThemeContext';

interface MemberForm {
  name: string;
  age: string;
  allergies: string;
  dislikes: string;
  likes: string;
}

const HouseholdPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { summary, loading } = useSelector((state: RootState) => state.household);
  const { user } = useSelector((state: RootState) => state.auth);
  const { mode } = useTheme();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [memberForm, setMemberForm] = useState<MemberForm>({
    name: '',
    age: '',
    allergies: '',
    dislikes: '',
    likes: ''
  });

  useEffect(() => {
    if (user?.householdId) dispatch(fetchHouseholdSummary(user.householdId));
  }, [dispatch, user?.householdId]);

  const handleAddMember = async () => {
    if (!user?.householdId || !memberForm.name) return;
    const memberData = {
      name: sanitizeInput(memberForm.name),
      age: memberForm.age ? parseInt(memberForm.age) : undefined,
      dietaryRestrictions: memberForm.allergies.split(',').map(a => ({
        type: 'allergy',
        item: sanitizeInput(a.trim())
      })).filter(a => a.item),
      preferences: {
        dislikes: memberForm.dislikes.split(',').map(d => sanitizeInput(d.trim())).filter(Boolean),
        likes: memberForm.likes.split(',').map(l => sanitizeInput(l.trim())).filter(Boolean),
      },
    };
    await dispatch(addHouseholdMember({ householdId: user.householdId, memberData }));
    await dispatch(fetchHouseholdSummary(user.householdId));
    setAddMemberOpen(false);
    setMemberForm({ name: '', age: '', allergies: '', dislikes: '', likes: '' });
  };

  const handleEditClick = (member: any) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      age: member.age?.toString() || '',
      allergies: member.dietary_restrictions?.map((r: any) => r.item || r).join(', ') || '',
      dislikes: member.preferences?.dislikes?.join(', ') || '',
      likes: member.preferences?.likes?.join(', ') || '',
    });
    setEditMemberOpen(true);
  };

  const handleUpdateMember = async () => {
    if (!user?.householdId || !editingMember || !memberForm.name) return;
    const memberData = {
      name: sanitizeInput(memberForm.name),
      age: memberForm.age ? parseInt(memberForm.age) : undefined,
      dietaryRestrictions: memberForm.allergies.split(',').map(a => ({
        type: 'allergy',
        item: sanitizeInput(a.trim())
      })).filter(a => a.item),
      preferences: {
        dislikes: memberForm.dislikes.split(',').map(d => sanitizeInput(d.trim())).filter(Boolean),
        likes: memberForm.likes.split(',').map(l => sanitizeInput(l.trim())).filter(Boolean),
      },
    };
    await dispatch(updateHouseholdMember({
      householdId: user.householdId,
      memberId: editingMember.id,
      memberData
    }));
    await dispatch(fetchHouseholdSummary(user.householdId));
    setEditMemberOpen(false);
    setEditingMember(null);
    setMemberForm({ name: '', age: '', allergies: '', dislikes: '', likes: '' });
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!user?.householdId) return;
    if (window.confirm('Are you sure you want to remove this member?')) {
      await dispatch(removeHouseholdMember({ householdId: user.householdId, memberId }));
      await dispatch(fetchHouseholdSummary(user.householdId));
    }
  };

  const handleCloseDialog = () => {
    setAddMemberOpen(false);
    setEditMemberOpen(false);
    setEditingMember(null);
    setMemberForm({ name: '', age: '', allergies: '', dislikes: '', likes: '' });
  };

  // Vibrant aurora colors for premium feel
  const auroraColors = mode === 'dark'
    ? ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']
    : ['#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ff9a9e'];

  if (loading && !summary) return (
    <AuroraBackground colors={auroraColors} speed={25}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <CircularProgress sx={{ color: '#4ECDC4' }} size={60} thickness={4} />
      </Box>
    </AuroraBackground>
  );

  return (
    <AuroraBackground colors={auroraColors} speed={25}>
       <Box sx={{
         p: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
         position: 'relative',
         zIndex: 2,
         maxWidth: { xs: '100%', sm: '100%', md: '95%', lg: '90%', xl: '1800px' },
         mx: 'auto',
         width: '100%'
       }}>

        {/* Premium Header with Gradient Text */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          sx={{
            mb: { xs: 4, md: 6 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 3
          }}
        >
          <Box>
             <Typography
               variant="overline"
               sx={{
                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 letterSpacing: 3,
                 fontWeight: 'bold',
                 mb: 1,
                 fontSize: { xs: '0.7rem', md: '0.8rem' }
               }}
             >
               FAMILY MANAGEMENT
             </Typography>
             <Typography
               variant="h1"
               fontWeight="900"
               sx={{
                 background: mode === 'dark'
                   ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                   : 'linear-gradient(135deg, #2D3436 0%, #000000 100%)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                 lineHeight: 1,
                 mb: 1
               }}
             >
               Household
             </Typography>
             <Typography
               variant="h6"
               sx={{
                 color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                 fontSize: { xs: '1rem', md: '1.25rem' },
                 fontWeight: 500
               }}
             >
               Managing preferences for {summary?.household?.name || 'your family'}
             </Typography>
          </Box>
          <Button
            component={motion.button}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddMemberOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 4,
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              border: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 12px 40px rgba(102, 126, 234, 0.6)'
              }
            }}
          >
            Add Member
          </Button>
        </Box>

        {/* Premium Stats Row with Glass Morphism */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 4, md: 6 } }}>
          {[
            { label: 'Members', val: summary?.stats.totalMembers || 0, icon: <Person sx={{ fontSize: 32 }} />, gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)', shadow: 'rgba(78, 205, 196, 0.4)' },
            { label: 'Allergies', val: summary?.stats.totalAllergies || 0, icon: <Warning sx={{ fontSize: 32 }} />, gradient: 'linear-gradient(135deg, #FF6B6B 0%, #C44569 100%)', shadow: 'rgba(255, 107, 107, 0.4)' },
            { label: 'Weekly Budget', val: `$${summary?.stats.weeklyBudget || 150}`, icon: <Restaurant sx={{ fontSize: 32 }} />, gradient: 'linear-gradient(135deg, #FFE66D 0%, #FFAF40 100%)', shadow: 'rgba(255, 230, 109, 0.4)' }
          ].map((stat, i) => (
            <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
              <GlassCard
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                intensity="ultra"
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '24px',
                  border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: `0 20px 60px ${stat.shadow}`
                  }
                }}
              >
                {/* Gradient Background Orb */}
                <Box sx={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: stat.gradient,
                  opacity: 0.1,
                  filter: 'blur(40px)'
                }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                  <Box sx={{
                    background: stat.gradient,
                    borderRadius: '16px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: `0 8px 24px ${stat.shadow}`
                  }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{
                      color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 1
                    }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h3" fontWeight="900" sx={{
                      background: stat.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: '2rem'
                    }}>
                      {stat.val}
                    </Typography>
                  </Box>
                </Box>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* Section Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <AutoAwesome sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: 32
          }} />
          <Typography variant="h4" fontWeight="800" sx={{
            color: mode === 'dark' ? 'white' : '#000000',
            fontSize: { xs: '1.5rem', md: '2rem' }
          }}>
            Family Members
          </Typography>
        </Box>

        {/* Member Cards Grid */}
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <AnimatePresence mode="popLayout">
            {summary?.members?.map((member: any, i: number) => (
              <Grid key={member.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <GlassCard
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  layout
                  intensity="ultra"
                  sx={{
                    height: '100%',
                    p: 0,
                    borderRadius: '32px',
                    overflow: 'hidden',
                    border: `2px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: mode === 'dark'
                        ? '0 32px 80px rgba(102, 126, 234, 0.3)'
                        : '0 32px 80px rgba(0, 0, 0, 0.12)'
                    }
                  }}
                >
                  {/* Gradient Top Bar */}
                  <Box sx={{
                    height: 8,
                    background: `linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)`,
                    backgroundSize: '200% 100%',
                    animation: 'gradientShift 3s ease infinite',
                    '@keyframes gradientShift': {
                      '0%, 100%': { backgroundPosition: '0% 50%' },
                      '50%': { backgroundPosition: '100% 50%' }
                    }
                  }} />

                  <Box sx={{ p: 3 }}>
                    {/* Member Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar
                          component={motion.div}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          sx={{
                            width: 64,
                            height: 64,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontSize: '1.8rem',
                            fontWeight: 'bold',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
                          }}
                        >
                          {member.name?.[0]?.toUpperCase() || 'M'}
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight="800" sx={{
                            color: mode === 'dark' ? 'white' : '#000000',
                            mb: 0.5
                          }}>
                            {sanitizeText(member.name)}
                          </Typography>
                          {member.age && (
                            <Chip
                              label={`${member.age} years old`}
                              size="small"
                              sx={{
                                background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          component={motion.button}
                          whileHover={{ scale: 1.2, rotate: 10 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEditClick(member)}
                          size="small"
                          sx={{
                            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
                          }}
                        >
                          <Edit sx={{ fontSize: 18, color: '#667eea' }} />
                        </IconButton>
                        <IconButton
                          component={motion.button}
                          whileHover={{ scale: 1.2, rotate: -10 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteMember(member.id)}
                          size="small"
                          sx={{
                            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            '&:hover': { bgcolor: 'rgba(255, 107, 107, 0.2)' }
                          }}
                        >
                          <Delete sx={{ fontSize: 18, color: '#FF6B6B' }} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Divider sx={{
                      mb: 2.5,
                      background: mode === 'dark'
                        ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
                        : 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)'
                    }} />

                    {/* Allergies */}
                    <Box sx={{ mb: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Warning sx={{ fontSize: 18, color: '#FF6B6B' }} />
                        <Typography variant="caption" fontWeight="800" sx={{
                          color: '#FF6B6B',
                          textTransform: 'uppercase',
                          letterSpacing: 1.5
                        }}>
                          Allergies
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {member.dietary_restrictions?.length ? member.dietary_restrictions.map((r: any, idx: number) => (
                          <Chip
                            component={motion.div}
                            whileHover={{ scale: 1.1, y: -2 }}
                            key={idx}
                            label={r.item || r}
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #FF6B6B 0%, #C44569 100%)',
                              color: 'white',
                              fontWeight: 'bold',
                              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
                            }}
                          />
                        )) : (
                          <Typography variant="caption" sx={{
                            fontStyle: 'italic',
                            color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                          }}>
                            No allergies
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Dislikes */}
                    <Box sx={{ mb: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Close sx={{ fontSize: 18, color: '#FF9671' }} />
                        <Typography variant="caption" fontWeight="800" sx={{
                          color: '#FF9671',
                          textTransform: 'uppercase',
                          letterSpacing: 1.5
                        }}>
                          Dislikes
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {member.preferences?.dislikes?.length ? member.preferences.dislikes.map((d: string, idx: number) => (
                          <Chip
                            component={motion.div}
                            whileHover={{ scale: 1.1, y: -2 }}
                            key={idx}
                            label={d}
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #FF9671 0%, #FFC75F 100%)',
                              color: 'white',
                              fontWeight: 'bold',
                              boxShadow: '0 4px 12px rgba(255, 150, 113, 0.3)'
                            }}
                          />
                        )) : (
                          <Typography variant="caption" sx={{
                            fontStyle: 'italic',
                            color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                          }}>
                            No dislikes
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Loves */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Favorite sx={{ fontSize: 18, color: '#4ECDC4' }} />
                        <Typography variant="caption" fontWeight="800" sx={{
                          color: '#4ECDC4',
                          textTransform: 'uppercase',
                          letterSpacing: 1.5
                        }}>
                          Loves
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {member.preferences?.likes?.length ? member.preferences.likes.map((l: string, idx: number) => (
                          <Chip
                            component={motion.div}
                            whileHover={{ scale: 1.1, y: -2 }}
                            key={idx}
                            label={l}
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                              color: 'white',
                              fontWeight: 'bold',
                              boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)'
                            }}
                          />
                        )) : (
                          <Typography variant="caption" sx={{
                            fontStyle: 'italic',
                            color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                          }}>
                            No preferences yet
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </GlassCard>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>

        {/* Dialogs remain the same but styled */}
        <Dialog
          open={addMemberOpen || editMemberOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: mode === 'dark'
                ? 'rgba(20, 20, 25, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(40px)',
              borderRadius: '24px',
              border: `2px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              boxShadow: '0 32px 64px rgba(0,0,0,0.3)'
            }
          }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            fontSize: '1.5rem'
          }}>
            {editMemberOpen ? 'Edit Member' : 'Add New Member'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              fullWidth
              label="Name"
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={memberForm.age}
              onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Allergies (comma separated)"
              value={memberForm.allergies}
              onChange={(e) => setMemberForm({ ...memberForm, allergies: e.target.value })}
              placeholder="peanuts, shellfish, dairy"
              helperText="Enter allergies separated by commas"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Dislikes (comma separated)"
              value={memberForm.dislikes}
              onChange={(e) => setMemberForm({ ...memberForm, dislikes: e.target.value })}
              placeholder="mushrooms, tomatoes, seafood"
              helperText="Enter dislikes separated by commas"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Loves (comma separated)"
              value={memberForm.likes}
              onChange={(e) => setMemberForm({ ...memberForm, likes: e.target.value })}
              placeholder="Chinese, Italian, Indian, American, BBQ"
              helperText="Enter favorite cuisines/foods separated by commas"
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              onClick={handleCloseDialog}
              sx={{
                borderRadius: 3,
                px: 3,
                color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={editMemberOpen ? handleUpdateMember : handleAddMember}
              disabled={!memberForm.name}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 3,
                px: 4,
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                }
              }}
            >
              {editMemberOpen ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AuroraBackground>
  );
};

export default HouseholdPage;
