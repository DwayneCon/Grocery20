import { logger } from '../../utils/logger.js';

/**
 * Price Caching Service
 *
 * Implements in-memory caching for Kroger API price lookups with TTL
 * - Reduces API calls and costs
 * - 4-6 hour cache duration (prices don't change frequently)
 * - Automatic cleanup of expired entries
 * - Optional Redis backend (if available)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // Unix timestamp in milliseconds
  createdAt: number;
}

interface PriceData {
  productId: string;
  name: string;
  brand: string;
  regularPrice: number;
  promoPrice?: number;
  size: string;
  upc: string;
  imageUrl?: string;
  locationId?: string;
}

export class PriceCacheService {
  private cache: Map<string, CacheEntry<any>>;
  private readonly DEFAULT_TTL_MS: number;
  private readonly CLEANUP_INTERVAL_MS: number;
  private cleanupTimer: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();

    // Cache TTL: 5 hours (in milliseconds)
    // Prices typically change once per day, so 5-hour cache is reasonable
    this.DEFAULT_TTL_MS = 5 * 60 * 60 * 1000;

    // Run cleanup every hour to remove expired entries
    this.CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

    // Start automatic cleanup
    this.startCleanup();

    logger.info('Price cache service initialized', {
      ttl: `${this.DEFAULT_TTL_MS / 1000 / 60} minutes`,
      cleanupInterval: `${this.CLEANUP_INTERVAL_MS / 1000 / 60} minutes`,
    });
  }

  /**
   * Generate cache key for a price lookup
   */
  private generateKey(itemName: string, locationId?: string): string {
    const normalizedName = itemName.toLowerCase().trim();
    return locationId ? `${normalizedName}:${locationId}` : normalizedName;
  }

  /**
   * Set a value in the cache with optional custom TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const now = Date.now();
    const ttl = ttlMs || this.DEFAULT_TTL_MS;

    this.cache.set(key, {
      data,
      expiresAt: now + ttl,
      createdAt: now,
    });

    logger.debug('Cache entry created', { key, ttlMs: ttl });
  }

  /**
   * Get a value from the cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.debug('Cache entry expired', { key });
      return null;
    }

    logger.debug('Cache hit', { key });
    return entry.data as T;
  }

  /**
   * Cache a price lookup result
   */
  cachePrice(itemName: string, priceData: PriceData | null, locationId?: string): void {
    const key = this.generateKey(itemName, locationId);
    this.set(key, priceData);
  }

  /**
   * Get cached price data
   */
  getCachedPrice(itemName: string, locationId?: string): PriceData | null {
    const key = this.generateKey(itemName, locationId);
    return this.get<PriceData>(key);
  }

  /**
   * Cache bulk price lookup results
   */
  cacheBulkPrices(
    items: Array<{ name: string; quantity: number }>,
    results: Array<{
      itemName: string;
      quantity: number;
      krogerData: PriceData | null;
      totalRegular: number;
      totalPromo?: number;
    }>,
    locationId?: string
  ): void {
    results.forEach((result) => {
      if (result.krogerData) {
        this.cachePrice(result.itemName, result.krogerData, locationId);
      }
    });

    logger.info('Bulk prices cached', { count: results.length, locationId });
  }

  /**
   * Get cached bulk prices
   * Returns null if any item is not cached or expired
   */
  getCachedBulkPrices(
    items: Array<{ name: string; quantity: number }>,
    locationId?: string
  ): Array<{
    itemName: string;
    quantity: number;
    krogerData: PriceData | null;
    totalRegular: number;
    totalPromo?: number;
  }> | null {
    const results = [];

    for (const item of items) {
      const cached = this.getCachedPrice(item.name, locationId);

      // If any item is not cached, return null (force fresh lookup)
      if (!cached) {
        logger.debug('Bulk cache miss', { item: item.name });
        return null;
      }

      results.push({
        itemName: item.name,
        quantity: item.quantity,
        krogerData: cached,
        totalRegular: cached.regularPrice * item.quantity,
        totalPromo: cached.promoPrice ? cached.promoPrice * item.quantity : undefined,
      });
    }

    logger.info('Bulk cache hit', { count: results.length });
    return results;
  }

  /**
   * Cache product search results (shorter TTL since search results can vary)
   */
  cacheProductSearch(searchTerm: string, products: any[], locationId?: string): void {
    const key = `search:${this.generateKey(searchTerm, locationId)}`;
    // Search results get 1-hour TTL (shorter than prices)
    this.set(key, products, 60 * 60 * 1000);
  }

  /**
   * Get cached product search results
   */
  getCachedProductSearch(searchTerm: string, locationId?: string): any[] | null {
    const key = `search:${this.generateKey(searchTerm, locationId)}`;
    return this.get<any[]>(key);
  }

  /**
   * Cache store locations (long TTL since stores rarely change)
   */
  cacheStores(zipCode: string, stores: any[]): void {
    const key = `stores:${zipCode}`;
    // Store locations get 24-hour TTL
    this.set(key, stores, 24 * 60 * 60 * 1000);
  }

  /**
   * Get cached store locations
   */
  getCachedStores(zipCode: string): any[] | null {
    const key = `stores:${zipCode}`;
    return this.get<any[]>(key);
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    logger.debug('Cache entry invalidated', { key });
  }

  /**
   * Invalidate all prices for a specific location
   */
  invalidateLocation(locationId: string): void {
    let count = 0;
    for (const [key] of this.cache) {
      if (key.endsWith(`:${locationId}`)) {
        this.cache.delete(key);
        count++;
      }
    }
    logger.info('Location cache invalidated', { locationId, count });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Cache cleanup completed', { removed, remaining: this.cache.size });
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);

    // Don't keep the process alive just for cleanup
    this.cleanupTimer.unref();
  }

  /**
   * Stop automatic cleanup (for graceful shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      logger.info('Price cache cleanup stopped');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    oldestEntry: number;
    newestEntry: number;
    hitRate?: number;
  } {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    const stats = {
      size: this.cache.size,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map((e) => now - e.createdAt)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map((e) => now - e.createdAt)) : 0,
    };

    return stats;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get time until expiration for a cache entry (in milliseconds)
   */
  getTTL(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const ttl = entry.expiresAt - Date.now();
    return ttl > 0 ? ttl : null;
  }
}

// Singleton instance
export const priceCacheService = new PriceCacheService();
export default priceCacheService;
