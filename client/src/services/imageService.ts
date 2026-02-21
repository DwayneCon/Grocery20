/* client/src/services/imageService.ts */

import { getImageFromCache, saveImageToCache, hashString } from '../utils/imageCache';
import { logger } from '../utils/logger';

export interface ImageSearchResult {
  url: string;
  thumbnail: string;
  photographer: string;
  source: 'unsplash' | 'pexels' | 'placeholder';
}

/**
 * Get Unsplash access key from environment
 */
const getUnsplashKey = (): string | null => {
  return import.meta.env.VITE_UNSPLASH_ACCESS_KEY || null;
};

/**
 * Optimize image URL with size and quality parameters
 */
export const optimizeImageUrl = (url: string, width: number = 800, quality: number = 80): string => {
  try {
    const baseUrl = new URL(url);

    // Unsplash specific optimization
    if (url.includes('unsplash.com')) {
      baseUrl.searchParams.set('w', width.toString());
      baseUrl.searchParams.set('q', quality.toString());
      baseUrl.searchParams.set('fm', 'webp');
      baseUrl.searchParams.set('fit', 'crop');
    }

    return baseUrl.toString();
  } catch (error) {
    // If URL parsing fails, return original
    return url;
  }
};

/**
 * Get fallback placeholder image
 */
const getFallbackImage = (mealName: string): ImageSearchResult => {
  const hash = hashString(mealName);

  // Use Lorem Picsum with food-related seed
  const seed = `food-${hash}`;
  const width = 800;
  const height = 600;

  return {
    url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
    thumbnail: `https://picsum.photos/seed/${seed}/400/300`,
    photographer: 'Placeholder',
    source: 'placeholder',
  };
};

/**
 * Optimize meal name for better image search results
 */
const optimizeMealNameForSearch = (mealName: string): string => {
  // Remove emojis and special characters
  let cleaned = mealName.replace(/[🍽️🥘🍲🥗🍜🍝🥙🌮🍕🍔🥪🍛🍱🥟🍳🥓🍗🍖🥩🍤🦐🦞🦀🐟🥚🧀🥐🥖🥨🥯🥞🧇]+/g, '').trim();

  // Add food photography keywords for better results
  const foodKeywords = 'food dish cuisine recipe plated';

  // For specific meal types, add context
  if (cleaned.toLowerCase().includes('breakfast')) {
    return `${cleaned} ${foodKeywords} breakfast`;
  } else if (cleaned.toLowerCase().includes('lunch')) {
    return `${cleaned} ${foodKeywords} lunch`;
  } else if (cleaned.toLowerCase().includes('dinner')) {
    return `${cleaned} ${foodKeywords} dinner gourmet`;
  }

  // Default: just add food keywords
  return `${cleaned} ${foodKeywords}`;
};

/**
 * Search for food image on Unsplash
 */
const searchUnsplash = async (mealName: string): Promise<ImageSearchResult | null> => {
  const accessKey = getUnsplashKey();

  if (!accessKey) {
    logger.warn('Unsplash access key not configured');
    return null;
  }

  try {
    const optimizedQuery = optimizeMealNameForSearch(mealName);
    const query = encodeURIComponent(optimizedQuery);
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&orientation=landscape&per_page=1&content_filter=high&color=orange`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        logger.error('Unsplash API rate limit exceeded');
      } else {
        logger.error(`Unsplash API error: ${response.status}`);
      }
      return null;
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const photo = data.results[0];
      return {
        url: optimizeImageUrl(photo.urls.regular, 800, 80),
        thumbnail: optimizeImageUrl(photo.urls.small, 400, 75),
        photographer: photo.user.name,
        source: 'unsplash',
      };
    }

    return null;
  } catch (error) {
    logger.error('Unsplash API fetch error', error as Error);
    return null;
  }
};

/**
 * Main function to search for food image
 * Implements caching and fallback strategies
 */
export const searchFoodImage = async (mealName: string): Promise<ImageSearchResult> => {
  // Step 1: Check cache first
  const cached = getImageFromCache(mealName);
  if (cached) {
    logger.info(`Using cached image for: ${mealName}`);
    return cached;
  }

  // Step 2: Try Unsplash API
  logger.info(`Fetching image from Unsplash for: ${mealName}`);
  const unsplashResult = await searchUnsplash(mealName);

  if (unsplashResult) {
    // Cache successful result
    saveImageToCache(mealName, unsplashResult);
    return unsplashResult;
  }

  // Step 3: Fallback to placeholder
  logger.info(`Using fallback placeholder for: ${mealName}`);
  const fallbackResult = getFallbackImage(mealName);

  // Cache fallback too (to avoid repeated API calls)
  saveImageToCache(mealName, fallbackResult);

  return fallbackResult;
};

/**
 * Prefetch images for multiple meals
 * Useful for preloading next cards in the stack
 */
export const prefetchMealImages = async (mealNames: string[]): Promise<void> => {
  const prefetchPromises = mealNames.slice(0, 3).map(async (name) => {
    try {
      await searchFoodImage(name);
    } catch (error) {
      logger.error(`Error prefetching image for ${name}`, error as Error);
    }
  });

  await Promise.all(prefetchPromises);
};
