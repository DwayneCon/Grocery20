/* client/src/hooks/useFoodImage.ts */

import { useState, useEffect } from 'react';
import { searchFoodImage, ImageSearchResult } from '../services/imageService';
import { ParsedMeal } from '../utils/mealParser';
import { logger } from '../utils/logger';

interface UseFoodImageResult {
  imageData: ImageSearchResult | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch and manage food images for meals
 * Handles loading states, caching, and error handling
 */
export const useFoodImage = (meal: ParsedMeal): UseFoodImageResult => {
  const [imageData, setImageData] = useState<ImageSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await searchFoodImage(meal.name);

        if (isMounted) {
          setImageData(result);
          setLoading(false);
        }
      } catch (err) {
        logger.error(`Error fetching image for ${meal.name}`, err as Error);

        if (isMounted) {
          setError(err as Error);
          setLoading(false);

          // Set fallback placeholder even on error
          setImageData({
            url: `https://picsum.photos/seed/${meal.name}/800/600`,
            thumbnail: `https://picsum.photos/seed/${meal.name}/400/300`,
            photographer: 'Placeholder',
            source: 'placeholder',
          });
        }
      }
    };

    fetchImage();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [meal.name]); // Re-fetch if meal name changes

  return { imageData, loading, error };
};
