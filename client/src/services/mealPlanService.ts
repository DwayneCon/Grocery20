import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Meal plan interfaces
export interface MealPlan {
  id: string;
  household_id: string;
  week_start: string;
  week_end: string;
  status: 'draft' | 'active' | 'archived';
  total_cost: number;
  ai_generated: boolean;
  preferences: any;
  created_at: string;
  updated_at: string;
}

export interface MealPlanMeal {
  id: string;
  meal_plan_id: string;
  recipe_id: string | null;
  meal_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  notes: string | any;
  estimated_cost: number;
  completed: boolean;
}

export interface MealPlanWithMeals {
  mealPlan: MealPlan;
  meals: MealPlanMeal[];
}

export interface CreateMealPlanRequest {
  householdId: string;
  weekStart: string;
  weekEnd: string;
  status?: 'draft' | 'active' | 'archived';
  totalCost?: number;
  aiGenerated?: boolean;
  preferences?: any;
}

export interface AddMealRequest {
  recipeId?: string;
  mealDate: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  notes?: any;
  estimatedCost?: number;
}

export interface UpdateMealRequest {
  recipeId?: string;
  mealDate?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings?: number;
  notes?: any;
  estimatedCost?: number;
  completed?: boolean;
}

export const mealPlanService = {
  // Get all meal plans for household
  getMealPlans: async (householdId: string) => {
    const response = await api.get(`/meal-plans/household/${householdId}`);
    return response.data;
  },

  // Get current week's meal plan
  getCurrentWeekPlan: async (householdId: string): Promise<{ success: boolean; mealPlan: MealPlanWithMeals | null }> => {
    const response = await api.get(`/meal-plans/household/${householdId}/current`);
    return response.data;
  },

  // Get specific meal plan with meals
  getMealPlan: async (mealPlanId: string): Promise<{ success: boolean; mealPlan: MealPlanWithMeals }> => {
    const response = await api.get(`/meal-plans/${mealPlanId}`);
    return response.data;
  },

  // Create new meal plan
  createMealPlan: async (data: CreateMealPlanRequest) => {
    const response = await api.post('/meal-plans', data);
    return response.data;
  },

  // Update meal plan
  updateMealPlan: async (mealPlanId: string, data: Partial<CreateMealPlanRequest>) => {
    const response = await api.put(`/meal-plans/${mealPlanId}`, data);
    return response.data;
  },

  // Delete meal plan
  deleteMealPlan: async (mealPlanId: string) => {
    const response = await api.delete(`/meal-plans/${mealPlanId}`);
    return response.data;
  },

  // Add meal to plan
  addMeal: async (mealPlanId: string, data: AddMealRequest) => {
    const response = await api.post(`/meal-plans/${mealPlanId}/meals`, data);
    return response.data;
  },

  // Update meal
  updateMeal: async (mealId: string, data: UpdateMealRequest) => {
    const response = await api.put(`/meal-plans/meals/${mealId}`, data);
    return response.data;
  },

  // Delete meal
  deleteMeal: async (mealId: string) => {
    const response = await api.delete(`/meal-plans/meals/${mealId}`);
    return response.data;
  },
};

export default mealPlanService;
