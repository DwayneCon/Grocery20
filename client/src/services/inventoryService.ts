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

export interface InventoryItem {
  id: string;
  householdId: string;
  ingredientId?: string;
  name: string;
  quantity: number;
  unit: string;
  purchaseDate?: string;
  expirationDate?: string;
  location?: 'Fridge' | 'Pantry' | 'Freezer';
  status: 'fresh' | 'expiring_soon' | 'expired';
  daysUntilExpiration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStats {
  totalItems: number;
  expiringItems: number;
  expiredItems: number;
  byLocation: {
    [key: string]: number;
  };
}

export const inventoryService = {
  // Add inventory item
  addItem: async (householdId: string, data: {
    name: string;
    quantity: number;
    unit: string;
    ingredientId?: string;
    purchaseDate?: string;
    expirationDate?: string;
    location?: 'Fridge' | 'Pantry' | 'Freezer';
  }): Promise<{ success: boolean; message: string; itemId: string }> => {
    const response = await api.post('/inventory', { householdId, ...data });
    return response.data;
  },

  // Get household inventory
  getHouseholdInventory: async (householdId: string, location?: string): Promise<{
    success: boolean;
    data: InventoryItem[];
  }> => {
    const response = await api.get(`/inventory/household/${householdId}`, {
      params: location ? { location } : undefined,
    });
    return response.data;
  },

  // Get expiring items
  getExpiringSoon: async (householdId: string, days = 3): Promise<{
    success: boolean;
    data: InventoryItem[];
  }> => {
    const response = await api.get(`/inventory/household/${householdId}/expiring`, {
      params: { days },
    });
    return response.data;
  },

  // Update inventory item
  updateItem: async (itemId: string, data: {
    quantity?: number;
    unit?: string;
    expirationDate?: string;
    location?: 'Fridge' | 'Pantry' | 'Freezer';
    status?: 'fresh' | 'expiring_soon' | 'expired';
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/inventory/${itemId}`, data);
    return response.data;
  },

  // Delete inventory item
  deleteItem: async (itemId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/inventory/${itemId}`);
    return response.data;
  },

  // Get inventory statistics
  getInventoryStats: async (householdId: string): Promise<{
    success: boolean;
    data: InventoryStats;
  }> => {
    const response = await api.get(`/inventory/household/${householdId}/stats`);
    return response.data;
  },

  // Mark expired items (automatic cleanup)
  markExpiredItems: async (householdId: string): Promise<{
    success: boolean;
    message: string;
    markedCount: number;
  }> => {
    const response = await api.patch(`/inventory/household/${householdId}/mark-expired`);
    return response.data;
  },
};

export default inventoryService;
