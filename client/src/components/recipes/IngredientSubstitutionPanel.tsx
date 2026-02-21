import { useMemo } from 'react';
import {
  Popover,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { SwapHoriz, AutoAwesome } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { Substitution, findSubstitutions } from '../../utils/ingredientSubstitutions';

interface IngredientSubstitutionPanelProps {
  ingredient: { name: string; amount: string; unit: string };
  onSubstitute: (original: string, substitute: Substitution) => void;
  onAskNora: (ingredientName: string) => void;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const dietaryColorMap: Record<string, string> = {
  'vegan': '#4CAF50',
  'vegetarian': '#66BB6A',
  'dairy-free': '#29B6F6',
  'gluten-free': '#FFA726',
  'egg-free': '#AB47BC',
  'soy-free': '#EF5350',
  'low-carb': '#EC407A',
  'low-fat': '#26C6DA',
  'low-sugar': '#7E57C2',
  'whole-grain': '#8D6E63',
};

const IngredientSubstitutionPanel = ({
  ingredient,
  onSubstitute,
  onAskNora,
  anchorEl,
  onClose,
}: IngredientSubstitutionPanelProps) => {
  const { mode } = useTheme();
  const open = Boolean(anchorEl);

  const substitutions = useMemo(
    () => findSubstitutions(ingredient.name),
    [ingredient.name]
  );

  const hasSubstitutions = substitutions.length > 0;

  const glassBackground =
    mode === 'dark'
      ? 'rgba(26, 31, 58, 0.92)'
      : 'rgba(255, 255, 255, 0.92)';

  const glassBorder =
    mode === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.08)';

  const subtleBackground =
    mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.03)';

  const textPrimary =
    mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)';

  const textSecondary =
    mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)';

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            borderRadius: 3,
            background: glassBackground,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${glassBorder}`,
            boxShadow:
              mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                : '0 8px 32px rgba(0, 0, 0, 0.12)',
            minWidth: 320,
            maxWidth: 400,
            maxHeight: 480,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <SwapHoriz sx={{ color: '#4ECDC4', fontSize: 20 }} />
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: textPrimary }}
          >
            Substitutions
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: textSecondary }}>
          for{' '}
          <Box component="span" sx={{ fontWeight: 600, color: '#4ECDC4' }}>
            {ingredient.amount} {ingredient.unit} {ingredient.name}
          </Box>
        </Typography>
      </Box>

      <Divider sx={{ borderColor: glassBorder }} />

      {/* Substitution list */}
      {hasSubstitutions ? (
        <List
          sx={{
            py: 0.5,
            overflowY: 'auto',
            flex: 1,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor:
                mode === 'dark'
                  ? 'rgba(255,255,255,0.15)'
                  : 'rgba(0,0,0,0.1)',
              borderRadius: 2,
            },
          }}
        >
          {substitutions.map((sub, index) => (
            <ListItem
              key={`${sub.substitute}-${index}`}
              sx={{
                flexDirection: 'column',
                alignItems: 'stretch',
                px: 2.5,
                py: 1.5,
                gap: 1,
                '&:hover': {
                  bgcolor: subtleBackground,
                },
                transition: 'background-color 0.15s ease',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <ListItemText
                  primary={sub.substitute}
                  secondary={sub.notes}
                  primaryTypographyProps={{
                    variant: 'body1',
                    fontWeight: 600,
                    color: textPrimary,
                    sx: { lineHeight: 1.3 },
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: textSecondary,
                    sx: { mt: 0.25 },
                  }}
                  sx={{ m: 0, flex: 1, minWidth: 0 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onSubstitute(ingredient.name, sub)}
                  sx={{
                    minWidth: 56,
                    height: 32,
                    borderRadius: 2,
                    borderColor: '#4ECDC4',
                    color: '#4ECDC4',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    '&:hover': {
                      borderColor: '#4ECDC4',
                      bgcolor: 'rgba(78, 205, 196, 0.12)',
                    },
                  }}
                >
                  Use
                </Button>
              </Box>

              {/* Ratio chip and dietary badges */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                <Chip
                  label={sub.ratio}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(78, 205, 196, 0.15)',
                    color: '#4ECDC4',
                    border: '1px solid rgba(78, 205, 196, 0.3)',
                  }}
                />
                {sub.dietary?.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      bgcolor: `${dietaryColorMap[tag] || '#9E9E9E'}20`,
                      color: dietaryColorMap[tag] || '#9E9E9E',
                      border: `1px solid ${dietaryColorMap[tag] || '#9E9E9E'}40`,
                    }}
                  />
                ))}
              </Box>
            </ListItem>
          ))}
        </List>
      ) : (
        /* No substitutions found state */
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            px: 3,
            textAlign: 'center',
          }}
        >
          <SwapHoriz
            sx={{
              fontSize: 40,
              color: textSecondary,
              opacity: 0.4,
              mb: 1.5,
            }}
          />
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: textPrimary, mb: 0.5 }}
          >
            No substitutions found
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: textSecondary, mb: 2.5, maxWidth: 240 }}
          >
            We don't have built-in substitutes for this ingredient yet. Ask Nora
            for a personalized suggestion!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AutoAwesome sx={{ fontSize: 18 }} />}
            onClick={() => {
              onAskNora(ingredient.name);
              onClose();
            }}
            sx={{
              bgcolor: '#4ECDC4',
              color: '#fff',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#3dbdb5',
              },
            }}
          >
            Ask Nora
          </Button>
        </Box>
      )}

      {/* Footer with Ask Nora button (only when substitutions exist) */}
      {hasSubstitutions && (
        <>
          <Divider sx={{ borderColor: glassBorder }} />
          <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'center' }}>
            <Button
              startIcon={<AutoAwesome sx={{ fontSize: 16 }} />}
              onClick={() => {
                onAskNora(ingredient.name);
                onClose();
              }}
              sx={{
                color: '#4ECDC4',
                fontWeight: 600,
                fontSize: '0.8rem',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(78, 205, 196, 0.1)',
                },
              }}
            >
              Ask Nora for more options
            </Button>
          </Box>
        </>
      )}
    </Popover>
  );
};

export default IngredientSubstitutionPanel;
