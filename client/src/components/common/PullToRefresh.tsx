/* client/src/components/common/PullToRefresh.tsx */
import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Refresh } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number; // Pixels to pull before triggering refresh (default: 80)
  disabled?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}) => {
  const { mode } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const y = useMotionValue(0);

  // Transform pull distance to rotation for the refresh icon
  const rotate = useTransform(y, [0, threshold], [0, 360]);
  const opacity = useTransform(y, [0, threshold], [0, 1]);
  const scale = useTransform(y, [0, threshold], [0.5, 1]);

  useEffect(() => {
    if (y.get() >= threshold && !isRefreshing) {
      setCanRefresh(true);
    } else if (y.get() < threshold) {
      setCanRefresh(false);
    }
  }, [y, threshold, isRefreshing]);

  const handlePanStart = (event: MouseEvent | TouchEvent | PointerEvent) => {
    // Only allow pull-to-refresh when scrolled to top
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      if (scrollTop === 0 && !disabled && !isRefreshing) {
        startY.current = 'touches' in event ? event.touches[0].clientY : event.clientY;
      }
    }
  };

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || isRefreshing) return;

    // Only pull down, not up
    if (info.offset.y > 0) {
      const scrollTop = containerRef.current?.scrollTop || 0;
      if (scrollTop === 0) {
        // Apply resistance to the pull
        const resistance = 0.5;
        y.set(Math.min(info.offset.y * resistance, threshold * 1.5));
      }
    }
  };

  const handlePanEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || isRefreshing) return;

    if (info.offset.y >= threshold) {
      // Trigger refresh
      setIsRefreshing(true);
      y.set(threshold); // Lock at threshold while refreshing

      try {
        await onRefresh();
      } catch (error) {
        logger.error('Refresh error', error instanceof Error ? error : undefined);
      } finally {
        setIsRefreshing(false);
        y.set(0); // Reset to top
      }
    } else {
      // Spring back to top
      y.set(0);
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        width: '100%',
        overflow: 'auto',
        position: 'relative',
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
      }}
    >
      {/* Pull indicator */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: threshold,
          transform: `translateY(${y.get() - threshold}px)`,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <motion.div
          style={{
            opacity,
            scale,
            rotate: isRefreshing ? 0 : rotate,
          }}
        >
          {isRefreshing ? (
            <CircularProgress size={32} sx={{ color: 'var(--primary)' }} />
          ) : (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                backdropFilter: 'blur(10px)',
                border: `2px solid ${canRefresh ? 'var(--primary)' : 'transparent'}`,
                transition: 'border-color 0.2s ease',
              }}
            >
              <Refresh
                sx={{
                  color: canRefresh ? 'var(--primary)' : 'var(--text-tertiary)',
                  fontSize: '1.5rem',
                }}
              />
            </Box>
          )}
        </motion.div>
      </motion.div>

      {/* Scrollable content */}
      <motion.div
        style={{
          y,
          width: '100%',
        }}
        drag="y"
        dragElastic={0}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragMomentum={false}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
      >
        {children}
      </motion.div>
    </Box>
  );
};

export default PullToRefresh;
