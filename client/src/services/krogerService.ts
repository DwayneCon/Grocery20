import apiClient from '../utils/apiClient';

export interface KrogerStore {
  locationId: string;
  name: string;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  chain: string;
}

export interface KrogerPriceResult {
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
}

export interface BulkPriceResponse {
  success: boolean;
  count: number;
  data: KrogerPriceResult[];
  summary: {
    totalRegular: number;
    totalPromo: number;
    savings: number;
    savingsPercent: number;
  };
}

const krogerService = {
  checkConfig: async (): Promise<{ configured: boolean }> => {
    const response = await apiClient.get('/kroger/config');
    return response.data;
  },

  findStores: async (zipCode: string, radiusMiles = 10): Promise<KrogerStore[]> => {
    const response = await apiClient.get('/kroger/stores', {
      params: { zipCode, radiusMiles },
    });
    return response.data.data;
  },

  searchProducts: async (searchTerm: string, locationId?: string, limit = 10) => {
    const response = await apiClient.get('/kroger/products/search', {
      params: { searchTerm, locationId, limit },
    });
    return response.data;
  },

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

  getItemPrice: async (itemName: string, locationId?: string) => {
    const response = await apiClient.get('/kroger/price', {
      params: { itemName, locationId },
    });
    return response.data;
  },

  // Cart operations
  getCartStatus: async (): Promise<{ connected: boolean; locationId?: string }> => {
    const response = await apiClient.get('/kroger/cart/status');
    return response.data;
  },

  connectKrogerAccount: async (): Promise<{ authUrl: string }> => {
    const response = await apiClient.get('/kroger/auth');
    return response.data;
  },

  addToCart: async (items: Array<{ name: string; quantity: number }>): Promise<{
    success: boolean;
    added: number;
    failed: number;
    results: Array<{ itemName: string; status: 'added' | 'not_found' | 'error'; krogerProduct?: string }>;
  }> => {
    const response = await apiClient.post('/kroger/cart/add', { items });
    return response.data;
  },
};

export default krogerService;
