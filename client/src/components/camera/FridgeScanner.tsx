import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  Grid,
  Chip,
  Alert,
  Stack,
  Tooltip,
  Skeleton,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloseIcon from '@mui/icons-material/Close';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';
import KitchenIcon from '@mui/icons-material/Kitchen';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import ChatIcon from '@mui/icons-material/Chat';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useCamera } from '../../hooks/useCamera';
import apiClient from '../../utils/apiClient';

// ---- Types ----

interface FridgeIngredient {
  name: string;
  quantity: string;
  condition: 'fresh' | 'aging' | 'expired';
}

interface MealSuggestion {
  name: string;
  ingredients: string[];
  cookTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

interface FridgeScanData {
  ingredients: FridgeIngredient[];
  mealSuggestions: MealSuggestion[];
}

type ScannerState = 'camera' | 'scanning' | 'results';

interface FridgeScannerProps {
  open: boolean;
  onClose: () => void;
  onSendToChat?: (ingredients: FridgeIngredient[]) => void;
  onAddToInventory?: (ingredients: FridgeIngredient[]) => void;
}

// ---- Condition styling maps ----

const conditionConfig: Record<
  FridgeIngredient['condition'],
  { color: string; bgColor: string; label: string; icon: React.ReactNode }
> = {
  fresh: {
    color: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.15)',
    label: 'Fresh',
    icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
  },
  aging: {
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.15)',
    label: 'Aging',
    icon: <WarningAmberIcon sx={{ fontSize: 14 }} />,
  },
  expired: {
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.15)',
    label: 'Expired',
    icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} />,
  },
};

const difficultyColors: Record<string, string> = {
  easy: '#4caf50',
  medium: '#ff9800',
  hard: '#f44336',
};

// ---- Animated Scan Line Component ----

function ScanLine() {
  return (
    <motion.div
      initial={{ top: '0%' }}
      animate={{ top: '100%' }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 3,
        background: 'linear-gradient(90deg, transparent 0%, #4caf50 20%, #81c784 50%, #4caf50 80%, transparent 100%)',
        boxShadow: '0 0 15px rgba(76, 175, 80, 0.6), 0 0 30px rgba(76, 175, 80, 0.3)',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
}

// ---- Ingredient Card Component ----

interface IngredientCardProps {
  ingredient: FridgeIngredient;
  index: number;
}

function IngredientCard({ ingredient, index }: IngredientCardProps) {
  const cfg = conditionConfig[ingredient.condition];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          border: `1px solid ${cfg.color}22`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 4px 20px ${cfg.color}20`,
          },
        }}
      >
        {/* Condition badge */}
        <Chip
          icon={cfg.icon as React.ReactElement}
          label={cfg.label}
          size="small"
          sx={{
            mb: 1,
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 600,
            color: cfg.color,
            backgroundColor: cfg.bgColor,
            border: `1px solid ${cfg.color}33`,
            '& .MuiChip-icon': { color: cfg.color },
          }}
        />

        {/* Name */}
        <Typography
          variant="body2"
          sx={{
            color: '#fff',
            fontWeight: 600,
            mb: 0.5,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {ingredient.name}
        </Typography>

        {/* Quantity */}
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255,255,255,0.5)',
            display: 'block',
            lineHeight: 1.3,
          }}
        >
          {ingredient.quantity}
        </Typography>
      </Paper>
    </motion.div>
  );
}

// ---- Meal Suggestion Card Component ----

interface MealCardProps {
  meal: MealSuggestion;
  index: number;
}

function MealCard({ meal, index }: MealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const diffColor = difficultyColors[meal.difficulty] || '#9e9e9e';

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.12 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.09)',
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Header row */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ flex: 1, mr: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: '#fff',
                fontWeight: 700,
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {meal.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}
            >
              {meal.description}
            </Typography>
          </Box>
          <IconButton
            size="small"
            sx={{ color: 'rgba(255,255,255,0.5)', mt: -0.5 }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>

        {/* Tags row */}
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Chip
            icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
            label={meal.cookTime}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.7)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              '& .MuiChip-icon': { color: 'rgba(255,255,255,0.5)' },
            }}
          />
          <Chip
            icon={<LocalDiningIcon sx={{ fontSize: 14 }} />}
            label={meal.difficulty.charAt(0).toUpperCase() + meal.difficulty.slice(1)}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 600,
              color: diffColor,
              backgroundColor: `${diffColor}18`,
              border: `1px solid ${diffColor}33`,
              '& .MuiChip-icon': { color: diffColor },
            }}
          />
        </Stack>

        {/* Expanded ingredients list */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    fontWeight: 600,
                    mb: 0.5,
                    display: 'block',
                  }}
                >
                  Ingredients
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5}>
                  {meal.ingredients.map((ing, i) => (
                    <Chip
                      key={i}
                      label={ing}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.68rem',
                        color: '#fff',
                        backgroundColor: 'rgba(76, 175, 80, 0.15)',
                        border: '1px solid rgba(76, 175, 80, 0.25)',
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>
    </motion.div>
  );
}

// ---- Scanning Overlay (shown over captured image) ----

interface ScanningOverlayProps {
  capturedImage: string | null;
}

function ScanningOverlay({ capturedImage }: ScanningOverlayProps) {
  return (
    <motion.div
      key="scanning"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background blurred image */}
      {capturedImage && (
        <Box
          component="img"
          src={capturedImage}
          alt="Captured fridge"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.35,
          }}
        />
      )}

      {/* Scan line animation over the image */}
      {capturedImage && <ScanLine />}

      {/* Dark overlay for text readability */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 3,
        }}
      />

      {/* Scanning text */}
      <Box sx={{ position: 'relative', zIndex: 10, textAlign: 'center', px: 3 }}>
        {/* Pulsing icon */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <KitchenIcon sx={{ fontSize: 56, color: '#4caf50', mb: 2 }} />
        </motion.div>

        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
          Scanning Your Fridge...
        </Typography>

        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
          Identifying ingredients and checking freshness
        </Typography>

        {/* Animated dots */}
        <Stack direction="row" spacing={1} justifyContent="center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#4caf50',
                }}
              />
            </motion.div>
          ))}
        </Stack>
      </Box>
    </motion.div>
  );
}

// ---- Loading Skeleton for Results ----

function ResultsSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="rounded" width="60%" height={28} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.08)' }} />
      <Grid container spacing={1.5}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid item xs={4} key={i}>
            <Skeleton
              variant="rounded"
              height={100}
              sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}
            />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" width="50%" height={24} sx={{ mt: 3, mb: 1.5, bgcolor: 'rgba(255,255,255,0.08)' }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={90}
          sx={{ mb: 1.5, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}
        />
      ))}
    </Box>
  );
}

// ---- Main FridgeScanner Component ----

export default function FridgeScanner({
  open,
  onClose,
  onSendToChat,
  onAddToInventory,
}: FridgeScannerProps) {
  const { videoRef, canvasRef, startCamera, capturePhoto, stopCamera, isActive } = useCamera();
  const [state, setState] = useState<ScannerState>('camera');
  const [scanData, setScanData] = useState<FridgeScanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Derived counts
  const ingredientCounts = useMemo(() => {
    if (!scanData) return { fresh: 0, aging: 0, expired: 0, total: 0 };
    const fresh = scanData.ingredients.filter((i) => i.condition === 'fresh').length;
    const aging = scanData.ingredients.filter((i) => i.condition === 'aging').length;
    const expired = scanData.ingredients.filter((i) => i.condition === 'expired').length;
    return { fresh, aging, expired, total: scanData.ingredients.length };
  }, [scanData]);

  // Start camera when component opens
  useEffect(() => {
    if (open && state === 'camera') {
      startCamera(facingMode).catch(() => {
        setError('Unable to access camera. Please check your permissions.');
      });
    }

    return () => {
      if (!open) {
        stopCamera();
      }
    };
  }, [open, state, facingMode, startCamera, stopCamera]);

  // Capture photo and send to API
  const handleCapture = useCallback(async () => {
    const photo = capturePhoto();
    if (!photo) {
      setError('Failed to capture photo. Please try again.');
      return;
    }

    setCapturedImage(photo);
    stopCamera();
    setState('scanning');
    setError(null);

    try {
      const response = await apiClient.post('/vision/fridge', { image: photo });

      if (response.data.success) {
        setScanData(response.data.data);
        setState('results');
      } else {
        throw new Error(response.data.message || 'Failed to scan fridge');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to scan fridge. Please try again with a clearer image.';
      setError(message);
      setState('camera');
      setCapturedImage(null);
      startCamera(facingMode).catch(() => {});
    }
  }, [capturePhoto, stopCamera, startCamera, facingMode]);

  // Retake photo
  const handleRetake = useCallback(() => {
    setScanData(null);
    setCapturedImage(null);
    setError(null);
    setState('camera');
    startCamera(facingMode).catch(() => {
      setError('Unable to access camera.');
    });
  }, [startCamera, facingMode]);

  // Flip camera
  const handleFlipCamera = useCallback(() => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    stopCamera();
    startCamera(newMode).catch(() => {
      setError('Unable to switch camera.');
    });
  }, [facingMode, stopCamera, startCamera]);

  // Close scanner
  const handleClose = useCallback(() => {
    stopCamera();
    setState('camera');
    setScanData(null);
    setCapturedImage(null);
    setError(null);
    onClose();
  }, [stopCamera, onClose]);

  // Send ingredients to chat
  const handleSendToChat = useCallback(() => {
    if (scanData && onSendToChat) {
      const usable = scanData.ingredients.filter((i) => i.condition !== 'expired');
      onSendToChat(usable);
      handleClose();
    }
  }, [scanData, onSendToChat, handleClose]);

  // Add to inventory
  const handleAddToInventory = useCallback(() => {
    if (scanData && onAddToInventory) {
      onAddToInventory(scanData.ingredients);
      handleClose();
    }
  }, [scanData, onAddToInventory, handleClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          backgroundColor: '#000',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ======== Header ======== */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            zIndex: 10,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <KitchenIcon sx={{ color: '#4caf50' }} />
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
              Scan Your Fridge
            </Typography>
          </Stack>
          <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* ======== State Views ======== */}
        <AnimatePresence mode="wait">
          {/* ---- Camera View ---- */}
          {state === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
            >
              {/* Video Feed */}
              <Box
                sx={{
                  flex: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Viewfinder Overlay - Fridge-shaped guide */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Box
                    sx={{
                      width: '90%',
                      maxWidth: 400,
                      height: '65%',
                      maxHeight: 500,
                      border: '2px solid rgba(255,255,255,0.5)',
                      borderRadius: 3,
                      position: 'relative',
                      // Corner accents
                      '&::before, &::after': {
                        content: '""',
                        position: 'absolute',
                        width: 28,
                        height: 28,
                        borderColor: '#4caf50',
                        borderStyle: 'solid',
                      },
                      '&::before': {
                        top: -2,
                        left: -2,
                        borderWidth: '3px 0 0 3px',
                        borderRadius: '6px 0 0 0',
                      },
                      '&::after': {
                        top: -2,
                        right: -2,
                        borderWidth: '3px 3px 0 0',
                        borderRadius: '0 6px 0 0',
                      },
                    }}
                  >
                    {/* Bottom corners */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -2,
                        left: -2,
                        width: 28,
                        height: 28,
                        borderColor: '#4caf50',
                        borderStyle: 'solid',
                        borderWidth: '0 0 3px 3px',
                        borderRadius: '0 0 0 6px',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 28,
                        height: 28,
                        borderColor: '#4caf50',
                        borderStyle: 'solid',
                        borderWidth: '0 3px 3px 0',
                        borderRadius: '0 0 6px 0',
                      }}
                    />

                    {/* Guide text */}
                    <Typography
                      sx={{
                        position: 'absolute',
                        bottom: -40,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                      }}
                    >
                      Point camera at your fridge or pantry
                    </Typography>
                  </Box>
                </Box>

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Box>

              {/* Error display */}
              {error && (
                <Alert severity="error" sx={{ mx: 2, my: 1 }}>
                  {error}
                </Alert>
              )}

              {/* Camera Controls */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  py: 3,
                  px: 2,
                  backgroundColor: 'rgba(0,0,0,0.8)',
                }}
              >
                {/* Flip Camera */}
                <Tooltip title="Flip Camera">
                  <IconButton
                    onClick={handleFlipCamera}
                    sx={{
                      color: '#fff',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
                    }}
                  >
                    <FlipCameraIosIcon />
                  </IconButton>
                </Tooltip>

                {/* Capture Button */}
                <IconButton
                  onClick={handleCapture}
                  disabled={!isActive}
                  sx={{
                    width: 72,
                    height: 72,
                    backgroundColor: '#4caf50',
                    border: '4px solid rgba(76, 175, 80, 0.4)',
                    '&:hover': { backgroundColor: '#388e3c' },
                    '&:disabled': { backgroundColor: 'rgba(76, 175, 80, 0.3)' },
                    transition: 'transform 0.15s',
                    '&:active': { transform: 'scale(0.92)' },
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 32, color: '#fff' }} />
                </IconButton>

                {/* Spacer for symmetry */}
                <Box sx={{ width: 40, height: 40 }} />
              </Box>
            </motion.div>
          )}

          {/* ---- Scanning / Processing State ---- */}
          {state === 'scanning' && <ScanningOverlay capturedImage={capturedImage} />}

          {/* ---- Results State ---- */}
          {state === 'results' && scanData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              style={{ flex: 1, overflow: 'auto', backgroundColor: '#0a0a0a' }}
            >
              <Box sx={{ p: 2, pb: 14 }}>
                {/* ---- Summary Header ---- */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2.5,
                      background: 'linear-gradient(135deg, rgba(76,175,80,0.12) 0%, rgba(33,150,243,0.08) 100%)',
                      borderRadius: 2.5,
                      border: '1px solid rgba(76,175,80,0.2)',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                      <CheckCircleIcon sx={{ color: '#4caf50' }} />
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                        Fridge Scanned!
                      </Typography>
                    </Stack>

                    {/* Condition summary chips */}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={`${ingredientCounts.total} items found`}
                        size="small"
                        sx={{
                          color: '#fff',
                          backgroundColor: 'rgba(255,255,255,0.12)',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                      {ingredientCounts.fresh > 0 && (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                          label={`${ingredientCounts.fresh} fresh`}
                          size="small"
                          sx={{
                            color: '#4caf50',
                            backgroundColor: 'rgba(76,175,80,0.12)',
                            fontSize: '0.72rem',
                            '& .MuiChip-icon': { color: '#4caf50' },
                          }}
                        />
                      )}
                      {ingredientCounts.aging > 0 && (
                        <Chip
                          icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                          label={`${ingredientCounts.aging} aging`}
                          size="small"
                          sx={{
                            color: '#ff9800',
                            backgroundColor: 'rgba(255,152,0,0.12)',
                            fontSize: '0.72rem',
                            '& .MuiChip-icon': { color: '#ff9800' },
                          }}
                        />
                      )}
                      {ingredientCounts.expired > 0 && (
                        <Chip
                          icon={<ErrorOutlineIcon sx={{ fontSize: 14 }} />}
                          label={`${ingredientCounts.expired} expired`}
                          size="small"
                          sx={{
                            color: '#f44336',
                            backgroundColor: 'rgba(244,67,54,0.12)',
                            fontSize: '0.72rem',
                            '& .MuiChip-icon': { color: '#f44336' },
                          }}
                        />
                      )}
                    </Stack>
                  </Paper>
                </motion.div>

                {/* ---- Ingredients Grid ---- */}
                {scanData.ingredients.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        mb: 1.5,
                        fontSize: '0.72rem',
                      }}
                    >
                      Identified Ingredients
                    </Typography>

                    <Grid container spacing={1.5}>
                      {scanData.ingredients.map((ingredient, index) => (
                        <Grid item xs={4} sm={3} key={index}>
                          <IngredientCard ingredient={ingredient} index={index} />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* ---- Meal Suggestions ---- */}
                {scanData.mealSuggestions.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                      <RestaurantMenuIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: 'rgba(255,255,255,0.5)',
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                          fontSize: '0.72rem',
                        }}
                      >
                        What You Can Make
                      </Typography>
                    </Stack>

                    <Stack spacing={1.5}>
                      {scanData.mealSuggestions.map((meal, index) => (
                        <MealCard key={index} meal={meal} index={index} />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* ---- Empty State ---- */}
                {scanData.ingredients.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderRadius: 2,
                      }}
                    >
                      <KitchenIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                      <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                        No Ingredients Found
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        Try taking a clearer photo with better lighting, or open the fridge door wider.
                      </Typography>
                    </Paper>
                  </motion.div>
                )}

                {/* ---- Action Buttons ---- */}
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {/* Send to Chat */}
                  {onSendToChat && scanData.ingredients.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={<ChatIcon />}
                        onClick={handleSendToChat}
                        sx={{
                          backgroundColor: '#4caf50',
                          color: '#fff',
                          borderRadius: 2,
                          py: 1.5,
                          fontWeight: 600,
                          textTransform: 'none',
                          fontSize: '1rem',
                          '&:hover': { backgroundColor: '#388e3c' },
                        }}
                      >
                        What Can I Make?
                      </Button>
                    </motion.div>
                  )}

                  {/* Add to Inventory */}
                  {onAddToInventory && scanData.ingredients.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Button
                        variant="outlined"
                        size="large"
                        fullWidth
                        startIcon={<KitchenIcon />}
                        onClick={handleAddToInventory}
                        sx={{
                          borderColor: 'rgba(255,255,255,0.3)',
                          color: '#fff',
                          borderRadius: 2,
                          py: 1.5,
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: 'rgba(255,255,255,0.6)',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                          },
                        }}
                      >
                        Add to Inventory
                      </Button>
                    </motion.div>
                  )}

                  {/* Scan Again */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Button
                      variant="text"
                      size="large"
                      fullWidth
                      startIcon={<ReplayIcon />}
                      onClick={handleRetake}
                      sx={{
                        color: 'rgba(255,255,255,0.6)',
                        borderRadius: 2,
                        py: 1.5,
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#fff',
                        },
                      }}
                    >
                      Scan Again
                    </Button>
                  </motion.div>
                </Stack>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
