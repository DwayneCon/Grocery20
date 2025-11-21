/* client/src/pages/ShoppingListPage.tsx */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Share,
  Add,
  CheckCircle,
  RadioButtonUnchecked,
  Delete,
  Edit,
  ShoppingCart,
  CompareArrows,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AuroraBackground from '../components/common/AuroraBackground';
import GlassCard from '../components/common/GlassCard';
import { sanitizeText } from '../utils/sanitize';
import { useTheme } from '../contexts/ThemeContext';
import shoppingListService, { ShoppingList, ShoppingListItem } from '../services/shoppingListService';
import { useSelector } from 'react-redux';
import { RootState } from '../features/store';
import PriceComparison from '../components/shopping/PriceComparison';

const ShoppingListPage = () => {
  const { mode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newListDialogOpen, setNewListDialogOpen] = useState(false);

  // Form states
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnit, setItemUnit] = useState('unit');
  const [itemCategory, setItemCategory] = useState('');
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [newListName, setNewListName] = useState('');

  // Tab state for price comparison
  const [activeTab, setActiveTab] = useState(0);

  // Load shopping lists on mount
  useEffect(() => {
    if (user?.householdId) {
      loadShoppingLists();
    }
  }, [user?.householdId]);

  // Handle incoming ingredients from meal plan
  useEffect(() => {
    if (location.state?.addIngredients && currentList) {
      const ingredients = location.state.addIngredients;
      const mealName = location.state.mealName;

      // Add each ingredient to the shopping list
      Promise.all(
        ingredients.map((ing: any) =>
          shoppingListService.addItem(currentList.id, {
            name: ing.name,
            quantity: parseFloat(ing.amount) || 1,
            unit: ing.unit || 'unit',
            category: 'From Meal Plan',
            notes: `From ${mealName}`,
          })
        )
      )
        .then(() => {
          setSuccess(`Added ${ingredients.length} items from ${mealName}`);
          loadShoppingLists();
          // Clear navigation state
          navigate(location.pathname, { replace: true });
        })
        .catch((err) => {
          console.error('Error adding ingredients:', err);
          setError('Failed to add some ingredients');
        });
    }
  }, [location.state, currentList]);

  const loadShoppingLists = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.householdId) {
        setError('No household found. Please set up your household first.');
        setLoading(false);
        return;
      }

      const response = await shoppingListService.getShoppingLists(user.householdId);

      if (response.success) {
        const activeLists = response.data.filter((list) => list.status === 'active');
        setShoppingLists(activeLists);

        // Set current list to first active list if none selected
        if (!currentList && activeLists.length > 0) {
          setCurrentList(activeLists[0]);
        } else if (currentList) {
          // Refresh current list data
          const updated = activeLists.find((l) => l.id === currentList.id);
          if (updated) setCurrentList(updated);
        }
      }
    } catch (err: any) {
      console.error('Error loading shopping lists:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load shopping lists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    try {
      if (!user?.householdId) return;

      const response = await shoppingListService.createShoppingList({
        householdId: user.householdId,
        name: newListName || 'New Shopping List',
      });

      if (response.success) {
        setSuccess('Shopping list created successfully');
        setNewListName('');
        setNewListDialogOpen(false);
        await loadShoppingLists();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create shopping list');
    }
  };

  const handleAddItem = async () => {
    try {
      if (!currentList) return;

      await shoppingListService.addItem(currentList.id, {
        name: itemName,
        quantity: parseFloat(itemQuantity),
        unit: itemUnit,
        category: itemCategory || undefined,
      });

      setSuccess('Item added successfully');
      setItemName('');
      setItemQuantity('1');
      setItemUnit('unit');
      setItemCategory('');
      setAddDialogOpen(false);
      await loadShoppingLists();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add item');
    }
  };

  const handleUpdateItem = async () => {
    try {
      if (!editingItem) return;

      await shoppingListService.updateItem(editingItem.id, {
        name: itemName,
        quantity: parseFloat(itemQuantity),
        unit: itemUnit,
        category: itemCategory || undefined,
      });

      setSuccess('Item updated successfully');
      setEditingItem(null);
      setEditDialogOpen(false);
      await loadShoppingLists();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await shoppingListService.deleteItem(itemId);
      setSuccess('Item deleted successfully');
      await loadShoppingLists();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete item');
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      await shoppingListService.toggleItemPurchased(itemId);
      await loadShoppingLists();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle item');
    }
  };

  const openEditDialog = (item: ShoppingListItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemQuantity(item.quantity.toString());
    setItemUnit(item.unit);
    setItemCategory(item.category || '');
    setEditDialogOpen(true);
  };

  const categories = currentList
    ? Array.from(new Set(currentList.items.map((item) => item.category || 'Uncategorized')))
    : [];

  // Theme-aware aurora colors
  const auroraColors = mode === 'dark'
    ? ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe']
    : ['#a8edea', '#fed6e3', '#ffecd2', '#fcb69f', '#ff9a9e'];

  if (loading) {
    return (
      <AuroraBackground colors={auroraColors} speed={20}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <CircularProgress size={60} sx={{ color: '#4ECDC4' }} />
          <Typography variant="h6" sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
            Loading shopping lists...
          </Typography>
        </Box>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground colors={auroraColors} speed={20}>
      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      {/* Add Item Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>Add Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiInputLabel-root': { color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' },
              '& .MuiOutlinedInput-root': {
                color: mode === 'dark' ? 'white' : '#000000',
                '& fieldset': { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Quantity"
              type="number"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              sx={{
                flex: 1,
                '& .MuiInputLabel-root': { color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' },
                '& .MuiOutlinedInput-root': {
                  color: mode === 'dark' ? 'white' : '#000000',
                  '& fieldset': { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
                },
              }}
            />
            <TextField
              label="Unit"
              value={itemUnit}
              onChange={(e) => setItemUnit(e.target.value)}
              sx={{
                flex: 1,
                '& .MuiInputLabel-root': { color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' },
                '& .MuiOutlinedInput-root': {
                  color: mode === 'dark' ? 'white' : '#000000',
                  '& fieldset': { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
                },
              }}
            />
          </Box>
          <TextField
            label="Category (optional)"
            fullWidth
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
            sx={{
              '& .MuiInputLabel-root': { color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' },
              '& .MuiOutlinedInput-root': {
                color: mode === 'dark' ? 'white' : '#000000',
                '& fieldset': { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddItem}
            variant="contained"
            disabled={!itemName.trim()}
            sx={{
              bgcolor: '#4ECDC4',
              color: 'black',
              '&:hover': { bgcolor: '#45b7af' },
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>Edit Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiInputLabel-root': { color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' },
              '& .MuiOutlinedInput-root': {
                color: mode === 'dark' ? 'white' : '#000000',
                '& fieldset': { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Quantity"
              type="number"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              sx={{
                flex: 1,
                '& .MuiInputLabel-root': { color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' },
                '& .MuiOutlinedInput-root': {
                  color: mode === 'dark' ? 'white' : '#000000',
                  '& fieldset': { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
                },
              }}
            />
            <TextField
              label="Unit"
              value={itemUnit}
              onChange={(e) => setItemUnit(e.target.value)}
              sx={{
                flex: 1,
                '& .MuiInputLabel-root': { color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' },
                '& .MuiOutlinedInput-root': {
                  color: mode === 'dark' ? 'white' : '#000000',
                  '& fieldset': { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
                },
              }}
            />
          </Box>
          <TextField
            label="Category (optional)"
            fullWidth
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
            sx={{
              '& .MuiInputLabel-root': { color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' },
              '& .MuiOutlinedInput-root': {
                color: mode === 'dark' ? 'white' : '#000000',
                '& fieldset': { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateItem}
            variant="contained"
            disabled={!itemName.trim()}
            sx={{
              bgcolor: '#4ECDC4',
              color: 'black',
              '&:hover': { bgcolor: '#45b7af' },
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* New List Dialog */}
      <Dialog
        open={newListDialogOpen}
        onClose={() => setNewListDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>Create Shopping List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="List Name"
            fullWidth
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="e.g., Weekly Groceries"
            sx={{
              '& .MuiInputLabel-root': { color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' },
              '& .MuiOutlinedInput-root': {
                color: mode === 'dark' ? 'white' : '#000000',
                '& fieldset': { borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewListDialogOpen(false)} sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateList}
            variant="contained"
            sx={{
              bgcolor: '#4ECDC4',
              color: 'black',
              '&:hover': { bgcolor: '#45b7af' },
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ p: { xs: 2, md: 6 }, maxWidth: '1400px', mx: 'auto', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <GlassCard
          intensity="medium"
          sx={{
            mb: 4,
            p: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" fontWeight="800" sx={{ color: mode === 'dark' ? 'white' : '#000000', mb: 1 }}>
              Shopping Lists
            </Typography>
            {currentList && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                    Current List
                  </InputLabel>
                  <Select
                    value={currentList.id}
                    onChange={(e) => {
                      const selected = shoppingLists.find((l) => l.id === e.target.value);
                      if (selected) setCurrentList(selected);
                    }}
                    sx={{
                      color: mode === 'dark' ? 'white' : '#000000',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      },
                    }}
                  >
                    {shoppingLists.map((list) => (
                      <MenuItem key={list.id} value={list.id}>
                        {list.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body1" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                  {currentList.items.filter((i) => !i.purchased).length} items remaining
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setNewListDialogOpen(true)}
              sx={{
                color: mode === 'dark' ? 'white' : '#000000',
                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                '&:hover': {
                  borderColor: '#4ECDC4',
                  bgcolor: 'rgba(78,205,196,0.1)',
                },
              }}
            >
              New List
            </Button>
          </Box>
        </GlassCard>

        {/* Tabs for Shopping List and Price Comparison */}
        {currentList && (
          <GlassCard intensity="light" sx={{ mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                  '&.Mui-selected': {
                    color: '#4ECDC4',
                  },
                },
                '& .MuiTabs-indicator': {
                  bgcolor: '#4ECDC4',
                },
              }}
            >
              <Tab icon={<ShoppingCart />} label="Shopping List" iconPosition="start" />
              <Tab icon={<CompareArrows />} label="Price Comparison" iconPosition="start" />
            </Tabs>
          </GlassCard>
        )}

        {!currentList ? (
          /* Empty State */
          <GlassCard intensity="ultra" sx={{ p: 6, textAlign: 'center' }}>
            <ShoppingCart sx={{ fontSize: 80, color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', mb: 3 }} />
            <Typography variant="h5" sx={{ color: mode === 'dark' ? 'white' : '#000000', mb: 2, fontWeight: 'bold' }}>
              No Shopping Lists Yet
            </Typography>
            <Typography variant="body1" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', mb: 4 }}>
              Create your first shopping list to start organizing your groceries!
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => setNewListDialogOpen(true)}
              sx={{
                bgcolor: '#4ECDC4',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#45b7af' },
                px: 4,
                py: 1.5,
              }}
            >
              Create Shopping List
            </Button>
          </GlassCard>
        ) : activeTab === 0 ? (
          /* Shopping List Tab */
          <Grid container spacing={4}>
            {categories.map((category) => (
              <Grid size={{ xs: 12, md: 6 }} key={category}>
                <GlassCard intensity="light" sx={{ p: 0, overflow: 'hidden', height: '100%' }}>
                  <Box
                    sx={{
                      p: 3,
                      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#4ECDC4' }}>
                      {sanitizeText(category)}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2 }}>
                    <AnimatePresence>
                      {currentList.items
                        .filter((item) => (item.category || 'Uncategorized') === category)
                        .map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <Box
                              sx={{
                                p: 2,
                                mb: 1,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                bgcolor: item.purchased
                                  ? mode === 'dark'
                                    ? 'rgba(255,255,255,0.02)'
                                    : 'rgba(0,0,0,0.02)'
                                  : mode === 'dark'
                                  ? 'rgba(255,255,255,0.1)'
                                  : 'rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleToggleItem(item.id)}
                                sx={{ color: item.purchased ? '#4ECDC4' : mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                              >
                                {item.purchased ? <CheckCircle /> : <RadioButtonUnchecked />}
                              </IconButton>
                              <Box
                                sx={{
                                  flex: 1,
                                  opacity: item.purchased ? 0.5 : 1,
                                  textDecoration: item.purchased ? 'line-through' : 'none',
                                }}
                              >
                                <Typography variant="body1" fontWeight="500" sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
                                  {sanitizeText(item.name)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                                  {item.quantity} {item.unit}
                                </Typography>
                              </Box>
                              <IconButton size="small" onClick={() => openEditDialog(item)} sx={{ color: mode === 'dark' ? 'white' : '#000000' }}>
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteItem(item.id)} sx={{ color: '#FF6B6B' }}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </Box>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        ) : (
          /* Price Comparison Tab */
          <PriceComparison
            items={currentList.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              ingredientId: item.ingredientId,
            }))}
          />
        )}

        {/* Floating Add Button */}
        {currentList && activeTab === 0 && (
          <IconButton
            onClick={() => setAddDialogOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 100,
              right: 32,
              width: 64,
              height: 64,
              bgcolor: '#4ECDC4',
              color: 'white',
              boxShadow: '0 10px 30px rgba(78, 205, 196, 0.4)',
              '&:hover': { bgcolor: '#3dbdb6', transform: 'scale(1.1)' },
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              zIndex: 100,
            }}
          >
            <Add sx={{ fontSize: 32 }} />
          </IconButton>
        )}
      </Box>
    </AuroraBackground>
  );
};

export default ShoppingListPage;
