import axios, { AxiosInstance } from 'axios';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import priceCacheService from './priceCacheService.js';

interface KrogerAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expiresAt: number; // Timestamp when token expires
}

interface KrogerProduct {
  productId: string;
  upc: string;
  description: string;
  brand: string;
  categories: string[];
  items: KrogerItem[];
  images?: KrogerImage[];
}

interface KrogerItem {
  itemId: string;
  size: string;
  price?: {
    regular: number;
    promo?: number;
  };
}

interface KrogerImage {
  perspective: string;
  sizes: Array<{
    size: string;
    url: string;
  }>;
}

interface KrogerLocation {
  locationId: string;
  name: string;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  geolocation: {
    latitude: number;
    longitude: number;
  };
  chain: string;
  departments: string[];
  hours: any;
}

class KrogerService {
  private apiClient: AxiosInstance;
  private authToken: KrogerAuthToken | null = null;
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.baseUrl = config.kroger.baseUrl;
    this.clientId = config.kroger.clientId;
    this.clientSecret = config.kroger.clientSecret;

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate with Kroger API using OAuth2 client credentials flow
   */
  private async authenticate(): Promise<void> {
    try {
      // Check if we have a valid token
      if (this.authToken && this.authToken.expiresAt > Date.now()) {
        return; // Token is still valid
      }

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        'https://api.kroger.com/v1/connect/oauth2/token',
        'grant_type=client_credentials&scope=product.compact',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.authToken = {
        access_token: response.data.access_token,
        token_type: response.data.token_type,
        expires_in: response.data.expires_in,
        expiresAt: Date.now() + (response.data.expires_in * 1000) - 60000, // Subtract 1 minute for safety
      };

      logger.info('Kroger API authenticated successfully');
    } catch (error: any) {
      logger.error('Kroger authentication failed', error as Error, { metadata: { response: error.response?.data } });
      throw new Error('Failed to authenticate with Kroger API');
    }
  }

  /**
   * Ensure we have a valid auth token
   */
  private async ensureAuthenticated(): Promise<void> {
    await this.authenticate();
  }

  /**
   * Search for products by term (with caching)
   */
  async searchProducts(
    searchTerm: string,
    locationId?: string,
    limit: number = 10
  ): Promise<KrogerProduct[]> {
    try {
      // Check cache first
      const cached = priceCacheService.getCachedProductSearch(searchTerm, locationId);
      if (cached) {
        logger.debug('Using cached product search', { searchTerm, locationId });
        return cached;
      }

      await this.ensureAuthenticated();

      const params: any = {
        'filter.term': searchTerm,
        'filter.limit': limit,
      };

      if (locationId) {
        params['filter.locationId'] = locationId;
      }

      const response = await this.apiClient.get('/products', {
        params,
        headers: {
          'Authorization': `Bearer ${this.authToken!.access_token}`,
        },
      });

      const products = response.data.data || [];

      // Cache the results
      priceCacheService.cacheProductSearch(searchTerm, products, locationId);

      return products;
    } catch (error: any) {
      logger.error('Error searching Kroger products', error as Error, { metadata: { response: error.response?.data } });
      return [];
    }
  }

  /**
   * Get product details by product ID
   */
  async getProduct(productId: string, locationId?: string): Promise<KrogerProduct | null> {
    try {
      await this.ensureAuthenticated();

      const params: any = {};
      if (locationId) {
        params['filter.locationId'] = locationId;
      }

      const response = await this.apiClient.get(`/products/${productId}`, {
        params,
        headers: {
          'Authorization': `Bearer ${this.authToken!.access_token}`,
        },
      });

      return response.data.data || null;
    } catch (error: any) {
      logger.error('Error getting Kroger product', error as Error, { metadata: { response: error.response?.data } });
      return null;
    }
  }

  /**
   * Find stores near a location (with caching)
   */
  async findStores(
    zipCode: string,
    radiusMiles: number = 10,
    limit: number = 5
  ): Promise<KrogerLocation[]> {
    try {
      // Check cache first (stores don't change frequently)
      const cached = priceCacheService.getCachedStores(zipCode);
      if (cached) {
        logger.debug('Using cached store locations', { zipCode });
        return cached;
      }

      await this.ensureAuthenticated();

      const response = await this.apiClient.get('/locations', {
        params: {
          'filter.zipCode.near': zipCode,
          'filter.radiusInMiles': radiusMiles,
          'filter.limit': limit,
        },
        headers: {
          'Authorization': `Bearer ${this.authToken!.access_token}`,
        },
      });

      const stores = response.data.data || [];

      // Cache store locations (24-hour TTL)
      priceCacheService.cacheStores(zipCode, stores);

      return stores;
    } catch (error: any) {
      logger.error('Error finding Kroger stores', error as Error, { metadata: { response: error.response?.data } });
      return [];
    }
  }

  /**
   * Get price for a shopping list item (with caching)
   * Returns the best matching product with price
   */
  async getItemPrice(
    itemName: string,
    locationId?: string
  ): Promise<{
    productId: string;
    name: string;
    brand: string;
    regularPrice: number;
    promoPrice?: number;
    size: string;
    upc: string;
    imageUrl?: string;
  } | null> {
    try {
      // Check cache first
      const cached = priceCacheService.getCachedPrice(itemName, locationId);
      if (cached) {
        logger.debug('Using cached price', { itemName, locationId });
        return cached;
      }

      const products = await this.searchProducts(itemName, locationId, 5);

      if (products.length === 0) {
        // Cache null result to avoid repeated API calls for missing items
        priceCacheService.cachePrice(itemName, null, locationId);
        return null;
      }

      // Get the first product with pricing
      for (const product of products) {
        if (product.items && product.items.length > 0) {
          const item = product.items[0];
          if (item.price) {
            const priceData = {
              productId: product.productId,
              name: product.description,
              brand: product.brand || 'Unknown',
              regularPrice: item.price.regular,
              promoPrice: item.price.promo,
              size: item.size,
              upc: product.upc,
              imageUrl: product.images?.[0]?.sizes[0]?.url,
            };

            // Cache the price data
            priceCacheService.cachePrice(itemName, priceData, locationId);

            return priceData;
          }
        }
      }

      // Cache null result
      priceCacheService.cachePrice(itemName, null, locationId);
      return null;
    } catch (error: any) {
      logger.error('Error getting Kroger item price', error as Error, { metadata: { response: error.response?.data } });
      return null;
    }
  }

  /**
   * Get prices for multiple items (bulk operation with caching)
   */
  async getBulkPrices(
    items: Array<{ name: string; quantity: number }>,
    locationId?: string
  ): Promise<
    Array<{
      itemName: string;
      quantity: number;
      krogerData: {
        productId: string;
        name: string;
        brand: string;
        regularPrice: number;
        promoPrice?: number;
        size: string;
        upc: string;
        imageUrl?: string;
      } | null;
      totalRegular: number;
      totalPromo?: number;
    }>
  > {
    // Check if all items are cached
    const cachedBulk = priceCacheService.getCachedBulkPrices(items, locationId);
    if (cachedBulk) {
      logger.info('Using fully cached bulk prices', { itemCount: items.length, locationId });
      return cachedBulk;
    }

    const results = [];

    for (const item of items) {
      // getItemPrice already checks cache individually
      const krogerData = await this.getItemPrice(item.name, locationId);

      results.push({
        itemName: item.name,
        quantity: item.quantity,
        krogerData,
        totalRegular: krogerData ? krogerData.regularPrice * item.quantity : 0,
        totalPromo: krogerData?.promoPrice
          ? krogerData.promoPrice * item.quantity
          : undefined,
      });

      // Add small delay to avoid rate limiting (only if we're making API calls)
      if (!priceCacheService.getCachedPrice(item.name, locationId)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Cache the bulk result for future requests
    priceCacheService.cacheBulkPrices(items, results, locationId);

    return results;
  }

  /**
   * Check if Kroger API is configured
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.clientId !== 'your-kroger-client-id');
  }
}

export const krogerService = new KrogerService();
export default krogerService;
