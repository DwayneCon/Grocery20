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

export interface Budget {
  id: string;
  weekStart: string;
  weekEnd: string;
  budgetAllocated: number;
  amountSpent: number;
  amountSaved: number;
  dealsUsed: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  remaining: number;
  percentageUsed: number;
}

export interface CreateBudgetData {
  householdId: string;
  weekStart: string;
  weekEnd: string;
  budgetAllocated: number;
  notes?: string;
}

export interface UpdateSpendingData {
  amountSpent?: number;
  amountSaved?: number;
  dealsUsed?: number;
}

export interface BudgetStats {
  summary: {
    totalWeeks: number;
    totalAllocated: number;
    totalSpent: number;
    totalSaved: number;
    totalDeals: number;
    avgBudget: number;
    avgSpent: number;
    avgSaved: number;
    avgPercentageUsed: number;
    periodStart: string | null;
    periodEnd: string | null;
  };
  weeklyBreakdown: Budget[];
}

export const budgetService = {
  // Create or update budget
  createBudget: async (data: CreateBudgetData): Promise<{ success: boolean; message: string; budgetId: string }> => {
    const response = await api.post('/budget', data);
    return response.data;
  },

  // Get all household budgets
  getHouseholdBudgets: async (householdId: string, limit = 10, offset = 0): Promise<{ success: boolean; data: Budget[] }> => {
    const response = await api.get(`/budget/household/${householdId}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // Get current week's budget
  getCurrentBudget: async (householdId: string): Promise<{ success: boolean; data: Budget | null; message?: string }> => {
    const response = await api.get(`/budget/household/${householdId}/current`);
    return response.data;
  },

  // Get budget statistics
  getBudgetStats: async (householdId: string, months = 3): Promise<{ success: boolean; data: BudgetStats }> => {
    const response = await api.get(`/budget/household/${householdId}/stats`, {
      params: { months },
    });
    return response.data;
  },

  // Update spending
  updateSpending: async (budgetId: string, data: UpdateSpendingData): Promise<{ success: boolean; message: string; data: Budget }> => {
    const response = await api.patch(`/budget/${budgetId}/spending`, data);
    return response.data;
  },

  // Delete budget
  deleteBudget: async (budgetId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/budget/${budgetId}`);
    return response.data;
  },
};

export default budgetService;
