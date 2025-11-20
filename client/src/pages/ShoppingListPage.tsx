import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Paper,
  Divider,
  Button,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useState } from 'react';
import { sanitizeText } from '../utils/sanitize';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

const ShoppingListPage = () => {
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: '1', name: 'Chicken Breast', quantity: '2 lbs', category: 'Meat', checked: false },
    { id: '2', name: 'Fresh Salmon', quantity: '1 lb', category: 'Seafood', checked: false },
    { id: '3', name: 'Romaine Lettuce', quantity: '1 head', category: 'Produce', checked: false },
    { id: '4', name: 'Rolled Oats', quantity: '1 lb', category: 'Grains', checked: false },
    { id: '5', name: 'Mixed Berries', quantity: '12 oz', category: 'Produce', checked: false },
  ]);

  const handleToggle = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const categories = Array.from(new Set(items.map(item => item.category)));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Shopping List
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {items.filter(i => i.checked).length} of {items.length} items checked
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Download />}>
          Export List
        </Button>
      </Box>

      {categories.map((category, index) => (
        <Paper key={index} elevation={2} sx={{ mb: 2, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
            {sanitizeText(category)}
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <List>
            {items
              .filter(item => item.category === category)
              .map((item) => (
                <ListItem
                  key={item.id}
                  dense
                  sx={{
                    bgcolor: item.checked ? 'action.hover' : 'transparent',
                    borderRadius: 1,
                  }}
                >
                  <Checkbox
                    checked={item.checked}
                    onChange={() => handleToggle(item.id)}
                    edge="start"
                  />
                  <ListItemText
                    primary={sanitizeText(item.name)}
                    secondary={sanitizeText(item.quantity)}
                    sx={{
                      textDecoration: item.checked ? 'line-through' : 'none',
                    }}
                  />
                </ListItem>
              ))}
          </List>
        </Paper>
      ))}
    </Box>
  );
};

export default ShoppingListPage;
