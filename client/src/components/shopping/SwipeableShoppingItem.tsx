/* client/src/components/shopping/SwipeableShoppingItem.tsx */
import { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { CheckCircle, Delete, Edit } from '@mui/icons-material';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import NeuroCard from '../common/NeuroCard';
import { sanitizeText } from '../../utils/sanitize';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
  price?: number;
  store?: string;
}

interface SwipeableShoppingItemProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

const SwipeableShoppingItem = ({ item, onToggle, onDelete, onEdit }: SwipeableShoppingItemProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0], [0, 1]);
  const deleteButtonOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    // If swiped left more than 100px, delete the item
    if (info.offset.x < -100) {
      onDelete(item.id);
    } else {
      // Snap back to original position
      x.set(0);
    }
  };

  return (
    <Box sx={{ position: 'relative', mb: 2 }}>
      {/* Delete button background */}
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 100,
          bgcolor: '#FF6B6B',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: deleteButtonOpacity,
        }}
      >
        <Delete sx={{ color: 'white' }} />
      </Box>

      {/* Draggable item */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.2}
        style={{ x, opacity }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
      >
        <NeuroCard
          pressed={item.checked}
          onClick={() => !isDragging && onToggle(item.id)}
          sx={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: item.checked ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.9)',
            transition: 'all 0.3s ease',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Box
              sx={{
                color: item.checked ? '#4ECDC4' : 'rgba(0,0,0,0.3)',
                display: 'flex',
              }}
            >
              <CheckCircle />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body1"
                fontWeight="600"
                sx={{
                  textDecoration: item.checked ? 'line-through' : 'none',
                  color: item.checked ? 'rgba(0,0,0,0.38)' : '#000000',
                }}
              >
                {sanitizeText(item.name)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.6)', fontWeight: 'bold' }}>
                  {sanitizeText(item.quantity)}
                </Typography>
                {item.price && (
                  <>
                    <Box sx={{ width: 2, height: 2, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.6)' }} />
                    <Typography variant="caption" sx={{ color: '#4ECDC4', fontWeight: 'bold' }}>
                      ${item.price.toFixed(2)}
                    </Typography>
                  </>
                )}
                {item.store && (
                  <>
                    <Box sx={{ width: 2, height: 2, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.6)' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                      {item.store}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </Box>

          {onEdit && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item.id);
              }}
              sx={{
                opacity: 0.5,
                '&:hover': { opacity: 1 },
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          )}
        </NeuroCard>
      </motion.div>
    </Box>
  );
};

export default SwipeableShoppingItem;
