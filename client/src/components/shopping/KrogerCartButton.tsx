import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material';
import {
  ShoppingCart,
  CheckCircle,
  Error as ErrorIcon,
  HelpOutline,
  Link as LinkIcon,
  OpenInNew,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import krogerService from '../../services/krogerService';

interface KrogerCartButtonProps {
  items: Array<{ name: string; quantity: number; unit?: string }>;
}

const KrogerCartButton = ({ items }: KrogerCartButtonProps) => {
  const { mode } = useTheme();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [results, setResults] = useState<Array<{ itemName: string; status: string; krogerProduct?: string }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const status = await krogerService.getCartStatus();
      setConnected(status.connected);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { authUrl } = await krogerService.connectKrogerAccount();
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect to Kroger');
    }
  };

  const handleSendToCart = async () => {
    try {
      setSending(true);
      setError(null);
      const cartItems = items.map(item => ({ name: item.name, quantity: item.quantity || 1 }));
      const response = await krogerService.addToCart(cartItems);
      setResults(response.results);
      setDialogOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send items to Kroger cart');
    } finally {
      setSending(false);
    }
  };

  if (loading) return null;

  const addedCount = results?.filter(r => r.status === 'added').length || 0;
  const failedCount = results?.filter(r => r.status !== 'added').length || 0;

  return (
    <>
      {!connected ? (
        <Button
          variant="outlined"
          size="small"
          startIcon={<LinkIcon />}
          onClick={handleConnect}
          sx={{
            color: '#0071CE',
            borderColor: '#0071CE',
            '&:hover': { borderColor: '#005BA1', bgcolor: 'rgba(0,113,206,0.05)' },
          }}
        >
          Connect Kroger
        </Button>
      ) : (
        <Button
          variant="contained"
          size="small"
          startIcon={sending ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <ShoppingCart />}
          onClick={handleSendToCart}
          disabled={sending || items.length === 0}
          sx={{
            bgcolor: '#0071CE',
            color: 'white',
            '&:hover': { bgcolor: '#005BA1' },
            '&:disabled': { bgcolor: 'rgba(0,113,206,0.4)' },
          }}
        >
          {sending ? 'Sending...' : 'Send to Kroger Cart'}
        </Button>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      {/* Results Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: mode === 'dark' ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: mode === 'dark' ? 'white' : '#000' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart sx={{ color: '#0071CE' }} />
            Kroger Cart Results
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Chip
              icon={<CheckCircle sx={{ '&&': { color: '#4CAF50' } }} />}
              label={`${addedCount} added`}
              sx={{ bgcolor: 'rgba(76,175,80,0.15)', color: '#4CAF50', fontWeight: 'bold' }}
            />
            {failedCount > 0 && (
              <Chip
                icon={<ErrorIcon sx={{ '&&': { color: '#F44336' } }} />}
                label={`${failedCount} not found`}
                sx={{ bgcolor: 'rgba(244,67,54,0.15)', color: '#F44336', fontWeight: 'bold' }}
              />
            )}
          </Box>

          <List dense>
            {results?.map((result, idx) => (
              <ListItem key={idx} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {result.status === 'added' ? (
                    <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />
                  ) : result.status === 'not_found' ? (
                    <HelpOutline sx={{ color: '#FF9800', fontSize: 20 }} />
                  ) : (
                    <ErrorIcon sx={{ color: '#F44336', fontSize: 20 }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ color: mode === 'dark' ? 'white' : '#000' }}>
                      {result.itemName}
                    </Typography>
                  }
                  secondary={
                    result.status === 'added' && result.krogerProduct
                      ? `Matched: ${result.krogerProduct}`
                      : result.status === 'not_found'
                      ? 'No matching product found'
                      : 'Error adding item'
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<OpenInNew />}
            href="https://www.kroger.com/cart"
            target="_blank"
            sx={{ color: '#0071CE', borderColor: '#0071CE' }}
          >
            View Cart on Kroger
          </Button>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: mode === 'dark' ? 'white' : '#000' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default KrogerCartButton;
