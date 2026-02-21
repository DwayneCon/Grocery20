import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
  Stack,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloseIcon from '@mui/icons-material/Close';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useCamera } from '../../hooks/useCamera';
import apiClient from '../../utils/apiClient';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
}

interface ReceiptData {
  storeName: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
}

type ScannerState = 'camera' | 'processing' | 'results';

interface ReceiptScannerProps {
  open: boolean;
  onClose: () => void;
  onAddToBudget?: (data: ReceiptData) => void;
  onAddToInventory?: (items: ReceiptItem[]) => void;
}

const categoryColors: Record<string, string> = {
  Produce: '#4caf50',
  Dairy: '#2196f3',
  Meat: '#f44336',
  Bakery: '#ff9800',
  Frozen: '#00bcd4',
  Beverages: '#9c27b0',
  Snacks: '#ff5722',
  'Canned Goods': '#795548',
  Condiments: '#ffc107',
  Household: '#607d8b',
  Health: '#e91e63',
  Other: '#9e9e9e',
};

export default function ReceiptScanner({
  open,
  onClose,
  onAddToBudget,
  onAddToInventory,
}: ReceiptScannerProps) {
  const { videoRef, canvasRef, startCamera, capturePhoto, stopCamera, isActive } = useCamera();
  const [state, setState] = useState<ScannerState>('camera');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

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

  const handleCapture = useCallback(async () => {
    const photo = capturePhoto();
    if (!photo) {
      setError('Failed to capture photo. Please try again.');
      return;
    }

    setCapturedImage(photo);
    stopCamera();
    setState('processing');
    setError(null);

    try {
      const response = await apiClient.post('/vision/receipt', { image: photo });

      if (response.data.success) {
        setReceiptData(response.data.data);
        setState('results');
      } else {
        throw new Error(response.data.message || 'Failed to scan receipt');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to scan receipt. Please try again with a clearer image.';
      setError(message);
      setState('camera');
      setCapturedImage(null);
      // Restart camera for retry
      startCamera(facingMode).catch(() => {});
    }
  }, [capturePhoto, stopCamera, startCamera, facingMode]);

  const handleRetake = useCallback(() => {
    setReceiptData(null);
    setCapturedImage(null);
    setError(null);
    setState('camera');
    startCamera(facingMode).catch(() => {
      setError('Unable to access camera.');
    });
  }, [startCamera, facingMode]);

  const handleFlipCamera = useCallback(() => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    stopCamera();
    startCamera(newMode).catch(() => {
      setError('Unable to switch camera.');
    });
  }, [facingMode, stopCamera, startCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    setState('camera');
    setReceiptData(null);
    setCapturedImage(null);
    setError(null);
    onClose();
  }, [stopCamera, onClose]);

  const handleAddToBudget = useCallback(() => {
    if (receiptData && onAddToBudget) {
      onAddToBudget(receiptData);
      handleClose();
    }
  }, [receiptData, onAddToBudget, handleClose]);

  const handleAddToInventory = useCallback(() => {
    if (receiptData && onAddToInventory) {
      onAddToInventory(receiptData.items);
      handleClose();
    }
  }, [receiptData, onAddToInventory, handleClose]);

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
        {/* Header */}
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
            <ReceiptLongIcon sx={{ color: '#fff' }} />
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
              Scan Receipt
            </Typography>
          </Stack>
          <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Camera View */}
        <AnimatePresence mode="wait">
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

                {/* Viewfinder Overlay - Receipt outline guide */}
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
                      width: '85%',
                      maxWidth: 360,
                      height: '70%',
                      maxHeight: 560,
                      border: '2px solid rgba(255,255,255,0.6)',
                      borderRadius: 2,
                      position: 'relative',
                      '&::before, &::after': {
                        content: '""',
                        position: 'absolute',
                        width: 24,
                        height: 24,
                        borderColor: '#4caf50',
                        borderStyle: 'solid',
                      },
                      // Top-left corner
                      '&::before': {
                        top: -2,
                        left: -2,
                        borderWidth: '3px 0 0 3px',
                        borderRadius: '4px 0 0 0',
                      },
                      // Top-right corner
                      '&::after': {
                        top: -2,
                        right: -2,
                        borderWidth: '3px 3px 0 0',
                        borderRadius: '0 4px 0 0',
                      },
                    }}
                  >
                    {/* Bottom corners */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -2,
                        left: -2,
                        width: 24,
                        height: 24,
                        borderColor: '#4caf50',
                        borderStyle: 'solid',
                        borderWidth: '0 0 3px 3px',
                        borderRadius: '0 0 0 4px',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 24,
                        height: 24,
                        borderColor: '#4caf50',
                        borderStyle: 'solid',
                        borderWidth: '0 3px 3px 0',
                        borderRadius: '0 0 4px 0',
                      }}
                    />
                    {/* Guide text */}
                    <Typography
                      sx={{
                        position: 'absolute',
                        bottom: -36,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Align receipt within the frame
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
                {/* Flip Camera Button */}
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

                {/* Capture Button */}
                <IconButton
                  onClick={handleCapture}
                  disabled={!isActive}
                  sx={{
                    width: 72,
                    height: 72,
                    backgroundColor: '#fff',
                    border: '4px solid rgba(255,255,255,0.4)',
                    '&:hover': { backgroundColor: '#e0e0e0' },
                    '&:disabled': { backgroundColor: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 32, color: '#333' }} />
                </IconButton>

                {/* Placeholder for symmetry */}
                <Box sx={{ width: 40, height: 40 }} />
              </Box>
            </motion.div>
          )}

          {/* Processing State */}
          {state === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              {/* Show captured image as background */}
              {capturedImage && (
                <Box
                  component="img"
                  src={capturedImage}
                  alt="Captured receipt"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.2,
                    filter: 'blur(4px)',
                  }}
                />
              )}
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <CircularProgress size={64} sx={{ color: '#4caf50', mb: 3 }} />
                </motion.div>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                  Scanning Receipt...
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Extracting items and prices with AI
                </Typography>
              </Box>
            </motion.div>
          )}

          {/* Results State */}
          {state === 'results' && receiptData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              style={{ flex: 1, overflow: 'auto', backgroundColor: '#121212' }}
            >
              <Box sx={{ p: 2, pb: 12 }}>
                {/* Store Info */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 2,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <CheckCircleIcon sx={{ color: '#4caf50' }} />
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                      Receipt Scanned
                    </Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {receiptData.storeName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {receiptData.date}
                  </Typography>
                </Paper>

                {/* Items List */}
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      px: 2,
                      py: 1.5,
                      color: 'rgba(255,255,255,0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    Items ({receiptData.items.length})
                  </Typography>
                  <List disablePadding>
                    {receiptData.items.map((item, index) => (
                      <React.Fragment key={index}>
                        <ListItem
                          sx={{
                            py: 1.5,
                            px: 2,
                          }}
                        >
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography sx={{ color: '#fff', flex: 1 }}>
                                  {item.name}
                                </Typography>
                                <Chip
                                  label={item.category}
                                  size="small"
                                  sx={{
                                    backgroundColor:
                                      categoryColors[item.category] || categoryColors.Other,
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    height: 22,
                                  }}
                                />
                              </Stack>
                            }
                            secondary={
                              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                                <Typography
                                  variant="body2"
                                  sx={{ color: 'rgba(255,255,255,0.5)' }}
                                >
                                  Qty: {item.quantity}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#4caf50', fontWeight: 600 }}
                                >
                                  ${item.price.toFixed(2)}
                                </Typography>
                              </Stack>
                            }
                          />
                        </ListItem>
                        {index < receiptData.items.length - 1 && (
                          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>

                {/* Totals */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 2,
                    mb: 2,
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>Subtotal</Typography>
                      <Typography sx={{ color: '#fff' }}>
                        ${receiptData.subtotal.toFixed(2)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>Tax</Typography>
                      <Typography sx={{ color: '#fff' }}>
                        ${receiptData.tax.toFixed(2)}
                      </Typography>
                    </Stack>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                        Total
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 700 }}>
                        ${receiptData.total.toFixed(2)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Action Buttons */}
                <Stack spacing={1.5}>
                  {onAddToBudget && (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<AddShoppingCartIcon />}
                      onClick={handleAddToBudget}
                      sx={{
                        backgroundColor: '#4caf50',
                        color: '#fff',
                        borderRadius: 2,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': { backgroundColor: '#388e3c' },
                      }}
                    >
                      Add to Budget
                    </Button>
                  )}

                  {onAddToInventory && (
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<InventoryIcon />}
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
                  )}

                  <Button
                    variant="text"
                    size="large"
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
                    Scan Another Receipt
                  </Button>
                </Stack>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
