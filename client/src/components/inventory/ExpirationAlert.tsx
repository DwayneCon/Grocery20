import { useState } from 'react';
import { Alert, AlertTitle, Box, Button, Chip, IconButton } from '@mui/material';
import { Close, RestaurantMenu, Warning } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { InventoryItem } from '../../services/inventoryService';

interface ExpirationAlertProps {
  items: InventoryItem[];
}

type Severity = 'error' | 'warning' | 'info';

const ExpirationAlert = ({ items }: ExpirationAlertProps) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Filter items that are expiring within 7 days
  const expiringItems = items.filter((item) => {
    if (!item.expirationDate) return false;
    const daysLeft = item.daysUntilExpiration ?? Math.ceil(
      (new Date(item.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft >= 0 && daysLeft <= 7;
  });

  if (expiringItems.length === 0 || dismissed) return null;

  // Sort by soonest expiring
  const sorted = [...expiringItems].sort((a, b) => {
    const daysA = a.daysUntilExpiration ?? Math.ceil(
      (new Date(a.expirationDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const daysB = b.daysUntilExpiration ?? Math.ceil(
      (new Date(b.expirationDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysA - daysB;
  });

  const soonest = sorted[0];
  const soonestDays = soonest.daysUntilExpiration ?? Math.ceil(
    (new Date(soonest.expirationDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Determine severity based on soonest item
  let severity: Severity;
  let severityLabel: string;
  if (soonestDays <= 1) {
    severity = 'error';
    severityLabel = soonestDays === 0 ? 'Expires today' : 'Expires tomorrow';
  } else if (soonestDays <= 3) {
    severity = 'warning';
    severityLabel = `Expires in ${soonestDays} days`;
  } else {
    severity = 'info';
    severityLabel = `Expires in ${soonestDays} days`;
  }

  // Count items per urgency level
  const urgentCount = sorted.filter((item) => {
    const d = item.daysUntilExpiration ?? Math.ceil(
      (new Date(item.expirationDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return d <= 1;
  }).length;

  const warningCount = sorted.filter((item) => {
    const d = item.daysUntilExpiration ?? Math.ceil(
      (new Date(item.expirationDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return d > 1 && d <= 3;
  }).length;

  const handleSuggestRecipes = () => {
    const itemNames = sorted.slice(0, 5).map((i) => i.name).join(', ');
    navigate('/chat', {
      state: {
        prefillMessage: `I have these items expiring soon: ${itemNames}. Can you suggest recipes to use them up?`,
      },
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Alert
          severity={severity}
          icon={<Warning />}
          sx={{
            mb: 3,
            borderRadius: 'var(--radius-lg)',
            alignItems: 'flex-start',
            '& .MuiAlert-message': { width: '100%' },
          }}
          action={
            <IconButton
              size="small"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss expiration alert"
              sx={{ color: 'inherit' }}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          <AlertTitle sx={{ fontWeight: 700 }}>
            {expiringItems.length} item{expiringItems.length > 1 ? 's' : ''} expiring soon
          </AlertTitle>

          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            <Chip
              label={`${soonest.name} - ${severityLabel}`}
              size="small"
              color={severity}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            {urgentCount > 0 && (
              <Chip label={`${urgentCount} urgent`} size="small" color="error" sx={{ fontWeight: 600 }} />
            )}
            {warningCount > 0 && (
              <Chip label={`${warningCount} soon`} size="small" color="warning" sx={{ fontWeight: 600 }} />
            )}
          </Box>

          <Button
            size="small"
            variant="outlined"
            startIcon={<RestaurantMenu />}
            onClick={handleSuggestRecipes}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'currentColor',
              color: 'inherit',
              '&:hover': {
                borderColor: 'currentColor',
                bgcolor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Suggest Recipes
          </Button>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExpirationAlert;
