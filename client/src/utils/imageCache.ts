/* client/src/utils/imageCache.ts */

export interface CachedImage {
  url: string;
  thumbnail: string;
  photographer: string;
  source: 'unsplash' | 'pexels' | 'placeholder';
  cachedAt: number;
}

const CACHE_PREFIX = 'grocery20_meal_image_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Get image from localStorage cache
 */
export const getImageFromCache = (mealName: string): CachedImage | null => {
  try {
    const cacheKey = CACHE_PREFIX + mealName.toLowerCase().replace(/\s+/g, '_');
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const parsedCache: CachedImage = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - parsedCache.cachedAt > CACHE_TTL) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return parsedCache;
  } catch (error) {
    console.error('Error reading from image cache:', error);
    return null;
  }
};

/**
 * Save image to localStorage cache
 */
export const saveImageToCache = (mealName: string, imageData: Omit<CachedImage, 'cachedAt'>): void => {
  try {
    const cacheKey = CACHE_PREFIX + mealName.toLowerCase().replace(/\s+/g, '_');
    const cacheData: CachedImage = {
      ...imageData,
      cachedAt: Date.now(),
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    // If localStorage is full, clear old cached images
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearOldCachedImages();
      // Try again after clearing
      try {
        const cacheKey = CACHE_PREFIX + mealName.toLowerCase().replace(/\s+/g, '_');
        const cacheData: CachedImage = {
          ...imageData,
          cachedAt: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error('Error saving to image cache after cleanup:', retryError);
      }
    } else {
      console.error('Error saving to image cache:', error);
    }
  }
};

/**
 * Clear cached images older than 7 days
 */
export const clearOldCachedImages = (): void => {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    // Find all cached image keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const parsedCache: CachedImage = JSON.parse(cached);
            if (now - parsedCache.cachedAt > CACHE_TTL) {
              keysToRemove.push(key);
            }
          } catch (parseError) {
            // Invalid cache entry, remove it
            keysToRemove.push(key);
          }
        }
      }
    }

    // Remove old cache entries
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log(`Cleared ${keysToRemove.length} old cached images`);
  } catch (error) {
    console.error('Error clearing old cached images:', error);
  }
};

/**
 * Simple hash function for consistent placeholder images
 */
export const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};
