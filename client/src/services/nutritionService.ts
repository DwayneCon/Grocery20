import apiClient from '../utils/apiClient';

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
    const response = await apiClient.get(`/nutrition/meal-plan/${mealPlanId}`);
    return response.data;
  },

  // Get nutrition for a specific day
  getDayNutrition: async (mealPlanId: string, date: string): Promise<{
    success: boolean;
    data: DailyNutrition;
  }> => {
    const response = await apiClient.get(`/nutrition/meal-plan/${mealPlanId}/day/${date}`);
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
    const response = await apiClient.post('/nutrition/compare-goals', { mealPlanId, goals });
    return response.data;
  },

  // Get nutrition by meal type
  getNutritionByMealType: async (mealPlanId: string): Promise<{
    success: boolean;
    data: {
      [mealType: string]: NutritionData;
    };
  }> => {
    const response = await apiClient.get(`/nutrition/meal-plan/${mealPlanId}/by-meal-type`);
    return response.data;
  },
};

export default nutritionService;
