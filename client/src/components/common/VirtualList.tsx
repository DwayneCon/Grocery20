import { useCallback, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';

export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  overscan?: number;
  containerHeight?: number | string;
  /** @deprecated Use containerHeight instead. Kept for backwards compatibility. */
  height?: number;
  className?: string;
  getKey?: (item: T, index: number) => string | number;
}

/**
 * Lightweight virtual scrolling component.
 * Only renders items within the visible range plus an overscan buffer,
 * providing smooth performance even for very long lists.
 */
export const VirtualList = <T,>({
  items,
  renderItem,
  itemHeight,
  overscan = 5,
  containerHeight,
  height,
  className,
  getKey,
}: VirtualListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Resolve the effective height: containerHeight takes precedence over height
  const resolvedHeight = containerHeight ?? height ?? 400;

  const totalHeight = items.length * itemHeight;

  // Parse numeric height for calculations (needed when containerHeight is a string like '100%')
  const numericHeight = useMemo(() => {
    if (typeof resolvedHeight === 'number') return resolvedHeight;
    // For string heights, use the container's actual clientHeight if available
    return containerRef.current?.clientHeight ?? 400;
  }, [resolvedHeight, scrollTop]); // scrollTop dependency ensures recalc on scroll

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + numericHeight) / itemHeight) + overscan
    );
    return { startIndex: start, endIndex: end };
  }, [scrollTop, itemHeight, overscan, items.length, numericHeight]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <Box
      ref={containerRef}
      className={className}
      onScroll={handleScroll}
      sx={{
        position: 'relative',
        height: resolvedHeight,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Box sx={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => {
          const itemIndex = startIndex + index;
          return (
            <Box
              key={getKey ? getKey(item, itemIndex) : itemIndex}
              sx={{
                position: 'absolute',
                top: itemIndex * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, itemIndex)}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default VirtualList;
