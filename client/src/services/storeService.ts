import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Store {
  id: string;
  name: string;
  logo?: string;
  hasAPI: boolean;
  hasScraping: boolean;
  features: string[];
}

export interface ProductPrice {
  id: string;
  storeName: string;
  productName: string;
  brand?: string;
  price: number;
  salePrice?: number;
  onSale: boolean;
  unit: string;
  quantity: number;
  lastScraped: string;
  url?: string;
}

export interface PriceComparison {
  item: string;
  requestedQuantity: number;
  requestedUnit: string;
  prices: ProductPrice[];
  bestPrice: ProductPrice | null;
  savings: number;
}

export interface StoreTotals {
  storeName: string;
  total: number;
  itemsAvailable: number;
}

export const storeService = {
  // Get available stores
  getStores: async (): Promise<{ success: boolean; data: Store[] }> => {
    const response = await api.get('/stores');
    return response.data;
  },

  // Search products
  searchProducts: async (query: string, storeId?: string): Promise<{
    success: boolean;
    data: ProductPrice[];
    count: number;
    message?: string;
  }> => {
    const response = await api.get('/stores/search', {
      params: { query, storeId },
    });
    return response.data;
  },

  // Get ingredient prices
  getIngredientPrices: async (ingredientId: string): Promise<{
    success: boolean;
    data: {
      allPrices: ProductPrice[];
      byStore: { [storeName: string]: ProductPrice[] };
      bestPrice: ProductPrice | null;
    };
  }> => {
    const response = await api.get(`/stores/prices/${ingredientId}`);
    return response.data;
  },

  // Get store deals
  getStoreDeals: async (storeId: string): Promise<{
    success: boolean;
    data: ProductPrice[];
    count: number;
    message?: string;
  }> => {
    const response = await api.get(`/stores/${storeId}/deals`);
    return response.data;
  },

  // Compare prices for shopping list
  comparePrices: async (items: Array<{
    ingredientId?: string;
    name: string;
    quantity: number;
    unit: string;
  }>): Promise<{
    success: boolean;
    data: {
      itemComparison: PriceComparison[];
      storeTotals: StoreTotals[];
      bestStore: StoreTotals | null;
      potentialSavings: number;
    };
  }> => {
    const response = await api.post('/stores/compare-prices', { items });
    return response.data;
  },

  // Add store product (for manual entry)
  addStoreProduct: async (data: {
    ingredientId?: string;
    storeName: string;
    productName: string;
    brand?: string;
    price: number;
    unit: string;
    quantity: number;
    onSale?: boolean;
    salePrice?: number;
    url?: string;
  }): Promise<{ success: boolean; message: string; productId: string }> => {
    const response = await api.post('/stores/products', data);
    return response.data;
  },
};

export default storeService;
