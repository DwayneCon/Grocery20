import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  ingredientId?: string;
  purchased: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingList {
  id: string;
  householdId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

export const shoppingListService = {
  // Create shopping list from meal plan
  createFromMealPlan: async (mealPlanId: string, householdId: string): Promise<{
    success: boolean;
    message: string;
    shoppingList: ShoppingList;
  }> => {
    const response = await api.post('/shopping/from-meal-plan', {
      mealPlanId,
      householdId,
    });
    return response.data;
  },

  // Create shopping list
  createShoppingList: async (data: {
    householdId: string;
    name: string;
    description?: string;
  }): Promise<{
    success: boolean;
    message: string;
    shoppingList: ShoppingList;
  }> => {
    const response = await api.post('/shopping', data);
    return response.data;
  },

  // Get household shopping lists
  getShoppingLists: async (householdId: string): Promise<{
    success: boolean;
    data: ShoppingList[];
  }> => {
    const response = await api.get(`/shopping/household/${householdId}`);
    return response.data;
  },

  // Get shopping list by ID
  getShoppingList: async (shoppingListId: string): Promise<{
    success: boolean;
    data: ShoppingList;
  }> => {
    const response = await api.get(`/shopping/${shoppingListId}`);
    return response.data;
  },

  // Update shopping list
  updateShoppingList: async (shoppingListId: string, data: {
    name?: string;
    description?: string;
    status?: 'active' | 'completed' | 'archived';
  }): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await api.put(`/shopping/${shoppingListId}`, data);
    return response.data;
  },

  // Delete shopping list
  deleteShoppingList: async (shoppingListId: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await api.delete(`/shopping/${shoppingListId}`);
    return response.data;
  },

  // Add item to shopping list
  addItem: async (shoppingListId: string, data: {
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    ingredientId?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    itemId: string;
  }> => {
    const response = await api.post(`/shopping/${shoppingListId}/items`, data);
    return response.data;
  },

  // Update item
  updateItem: async (itemId: string, data: {
    name?: string;
    quantity?: number;
    unit?: string;
    category?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await api.put(`/shopping/items/${itemId}`, data);
    return response.data;
  },

  // Delete item
  deleteItem: async (itemId: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await api.delete(`/shopping/items/${itemId}`);
    return response.data;
  },

  // Toggle item purchased status
  toggleItemPurchased: async (itemId: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await api.patch(`/shopping/items/${itemId}/toggle`);
    return response.data;
  },
};

export default shoppingListService;
