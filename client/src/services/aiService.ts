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

// Conversation message interface
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Chat request/response interfaces
export interface ChatRequest {
  message: string;
  conversationHistory?: ConversationMessage[];
}

export interface ChatResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  fallback?: boolean;
}

// Meal plan generation interfaces
export interface MealPlanRequest {
  householdId?: string;
  householdSize?: number;
  budget?: number;
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  days?: number;
}

export interface Ingredient {
  name: string;
  amount: string | number;
  unit: string;
  category?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Meal {
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cost: number;
  nutrition: NutritionInfo;
  tags?: string[];
  tips?: string;
}

export interface DayMeals {
  day: string;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
  };
}

export interface ShoppingListItem {
  item: string;
  quantity: string;
  unit: string;
  estimatedCost: number;
  category: string;
}

export interface MealPlanData {
  mealPlan: DayMeals[];
  shoppingList: ShoppingListItem[];
  totalEstimatedCost: number;
  nutritionSummary: {
    averageCaloriesPerDay: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
  };
  notes?: string;
}

export interface MealPlanResponse {
  success: boolean;
  data: MealPlanData;
  mealPlanId?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  saved?: boolean;
  warning?: string;
  message?: string;
}

export const aiService = {
  // Chat with NutriAI
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post('/ai/chat', request);
    return response.data;
  },

  // Generate structured meal plan
  generateMealPlan: async (request: MealPlanRequest): Promise<MealPlanResponse> => {
    const response = await api.post('/ai/generate-meal-plan', request);
    return response.data;
  },
};

export default aiService;
