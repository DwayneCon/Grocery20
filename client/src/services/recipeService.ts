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

export interface RecipeRating {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  rating: number;
  review?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  distribution: {
    [key: number]: number;
  };
}

export interface RateRecipeData {
  rating: number;
  review?: string;
  images?: string[];
}

export const recipeService = {
  // Rate or update recipe rating
  rateRecipe: async (recipeId: string, data: RateRecipeData): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/recipes/${recipeId}/rate`, data);
    return response.data;
  },

  // Get all ratings for a recipe
  getRecipeRatings: async (recipeId: string, limit = 10, offset = 0): Promise<{
    success: boolean;
    data: {
      ratings: RecipeRating[];
      stats: RatingStats;
    }
  }> => {
    const response = await api.get(`/recipes/${recipeId}/ratings`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // Get current user's rating for a recipe
  getMyRating: async (recipeId: string): Promise<{ success: boolean; data: RecipeRating | null }> => {
    const response = await api.get(`/recipes/${recipeId}/ratings/me`);
    return response.data;
  },

  // Delete rating
  deleteRating: async (recipeId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/recipes/${recipeId}/ratings/me`);
    return response.data;
  },

  // Get top rated recipes
  getTopRatedRecipes: async (limit = 10): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get('/recipes/top-rated', {
      params: { limit },
    });
    return response.data;
  },
};

export default recipeService;
