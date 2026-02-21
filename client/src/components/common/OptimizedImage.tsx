/* client/src/components/common/OptimizedImage.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  borderRadius?: string | number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  sx?: any;
}

/**
 * Optimized image component with lazy loading, placeholders, and intersection observer
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  aspectRatio,
  objectFit = 'cover',
  borderRadius = 0,
  loading = 'lazy',
  priority = false,
  placeholder = 'skeleton',
  onLoad,
  onError,
  className,
  sx = {},
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Fallback image for errors
  const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18"%3EImage not found%3C/text%3E%3C/svg%3E';

  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{
        position: 'relative',
        width,
        height,
        aspectRatio,
        borderRadius,
        overflow: 'hidden',
        bgcolor: 'var(--surface)',
        ...sx,
      }}
    >
      {/* Loading placeholder */}
      {!isLoaded && !hasError && placeholder === 'skeleton' && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius,
          }}
        />
      )}

      {/* Actual image */}
      {isInView && (
        <Box
          component={motion.img}
          ref={imgRef}
          src={hasError ? fallbackImage : src}
          alt={alt}
          loading={loading}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          onLoad={handleLoad}
          onError={handleError}
          sx={{
            width: '100%',
            height: '100%',
            objectFit,
            borderRadius,
            display: 'block',
          }}
        />
      )}

      {/* Blur placeholder (low-quality image placeholder) */}
      {!isLoaded && !hasError && placeholder === 'blur' && (
        <Box
          component="div"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
    </Box>
  );
};

export default OptimizedImage;
