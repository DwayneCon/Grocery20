import apiClient from '../utils/apiClient';

export interface KrogerProduct {
  productId: string;
  upc: string;
  description: string;
  brand: string;
  categories: string[];
  items: KrogerItem[];
  images?: KrogerImage[];
}

export interface KrogerItem {
  itemId: string;
  size: string;
  price?: {
    regular: number;
    promo?: number;
  };
}

export interface KrogerImage {
  perspective: string;
  sizes: Array<{
    size: string;
    url: string;
  }>;
}

export interface KrogerLocation {
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

export interface KrogerPriceData {
  productId: string;
  name: string;
  brand: string;
  regularPrice: number;
  promoPrice?: number;
  size: string;
  upc: string;
  imageUrl?: string;
}

export interface BulkPriceItem {
  itemName: string;
  quantity: number;
  krogerData: KrogerPriceData | null;
  totalRegular: number;
  totalPromo?: number;
}

export interface BulkPriceResponse {
  success: boolean;
  count: number;
  data: BulkPriceItem[];
  summary: {
    totalRegular: number;
    totalPromo: number;
    savings: number;
    savingsPercent: number;
  };
}

export const krogerService = {
  // Check if Kroger API is configured
  checkConfiguration: async (): Promise<{ success: boolean; configured: boolean }> => {
    const response = await apiClient.get('/kroger/config');
    return response.data;
  },

  // Search for products
  searchProducts: async (
    searchTerm: string,
    locationId?: string,
    limit?: number
  ): Promise<{ success: boolean; count: number; data: KrogerProduct[] }> => {
    const response = await apiClient.get('/kroger/products/search', {
      params: { searchTerm, locationId, limit },
    });
    return response.data;
  },

  // Get product by ID
  getProduct: async (
    productId: string,
    locationId?: string
  ): Promise<{ success: boolean; data: KrogerProduct }> => {
    const response = await apiClient.get(`/kroger/products/${productId}`, {
      params: { locationId },
    });
    return response.data;
  },

  // Find stores near location
  findStores: async (
    zipCode: string,
    radiusMiles?: number,
    limit?: number
  ): Promise<{ success: boolean; count: number; data: KrogerLocation[] }> => {
    const response = await apiClient.get('/kroger/stores', {
      params: { zipCode, radiusMiles, limit },
    });
    return response.data;
  },

  // Get price for single item
  getItemPrice: async (
    itemName: string,
    locationId?: string
  ): Promise<{ success: boolean; data: KrogerPriceData | null }> => {
    const response = await apiClient.get('/kroger/price', {
      params: { itemName, locationId },
    });
    return response.data;
  },

  // Get bulk prices for shopping list
  getBulkPrices: async (
    items: Array<{ name: string; quantity: number }>,
    locationId?: string
  ): Promise<BulkPriceResponse> => {
    const response = await apiClient.post('/kroger/prices/bulk', {
      items,
      locationId,
    });
    return response.data;
  },
};

export default krogerService;
