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

export interface NutritionData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface DailyNutrition {
  date: string;
  meals: any[];
  totals: NutritionData;
}

export interface NutritionGoals {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface GoalComparison {
  nutrient: string;
  actual: number;
  goal: number;
  percentage: number;
  status: 'under' | 'met' | 'over';
}

export const nutritionService = {
  // Get nutrition summary for entire meal plan
  getMealPlanNutrition: async (mealPlanId: string): Promise<{
    success: boolean;
    data: {
      dailyNutrition: DailyNutrition[];
      weeklyTotals: NutritionData;
      weeklyAverages: NutritionData;
    };
  }> => {
    const response = await api.get(`/nutrition/meal-plan/${mealPlanId}`);
    return response.data;
  },

  // Get nutrition for a specific day
  getDayNutrition: async (mealPlanId: string, date: string): Promise<{
    success: boolean;
    data: DailyNutrition;
  }> => {
    const response = await api.get(`/nutrition/meal-plan/${mealPlanId}/day`, {
      params: { date },
    });
    return response.data;
  },

  // Compare nutrition with goals
  compareWithGoals: async (mealPlanId: string, goals: NutritionGoals): Promise<{
    success: boolean;
    data: {
      comparison: GoalComparison[];
      overallScore: number;
    };
  }> => {
    const response = await api.post(`/nutrition/meal-plan/${mealPlanId}/compare`, { goals });
    return response.data;
  },

  // Get nutrition by meal type
  getNutritionByMealType: async (mealPlanId: string): Promise<{
    success: boolean;
    data: {
      [mealType: string]: NutritionData;
    };
  }> => {
    const response = await api.get(`/nutrition/meal-plan/${mealPlanId}/by-meal-type`);
    return response.data;
  },
};

export default nutritionService;
