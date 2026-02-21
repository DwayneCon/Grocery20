import apiClient from '../utils/apiClient';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  instructions: any;
  nutrition: any;
  tags: string[];
  image_url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GetRecipesParams {
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  maxTime?: number;
  search?: string;
}

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
  // Get all recipes with optional filters
  getRecipes: async (params?: GetRecipesParams): Promise<{ success: boolean; count: number; recipes: Recipe[] }> => {
    const response = await apiClient.get('/recipes', { params });
    return response.data;
  },

  // Get single recipe
  getRecipe: async (recipeId: string): Promise<{ success: boolean; recipe: Recipe & { ingredients: any[] } }> => {
    const response = await apiClient.get(`/recipes/${recipeId}`);
    return response.data;
  },

  // Rate or update recipe rating
  rateRecipe: async (recipeId: string, data: RateRecipeData): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/recipes/${recipeId}/ratings`, data);
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
    const response = await apiClient.get(`/recipes/${recipeId}/ratings`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // Get current user's rating for a recipe
  getMyRating: async (recipeId: string): Promise<{ success: boolean; data: RecipeRating | null }> => {
    const response = await apiClient.get(`/recipes/${recipeId}/ratings/my-rating`);
    return response.data;
  },

  // Delete rating
  deleteRating: async (recipeId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/recipes/${recipeId}/ratings`);
    return response.data;
  },

  // Get top rated recipes
  getTopRatedRecipes: async (limit = 10): Promise<{ success: boolean; data: any[] }> => {
    const response = await apiClient.get('/recipes/top-rated', {
      params: { limit },
    });
    return response.data;
  },

  // Create a new recipe
  createRecipe: async (data: {
    name: string;
    description?: string;
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    difficulty?: string;
    cuisine?: string;
    ingredients?: Array<{ name: string; amount: string; unit: string; notes?: string }>;
    instructions?: string[];
    nutritionInfo?: { calories?: number; protein?: number; carbs?: number; fat?: number };
    imageUrl?: string;
    sourceRecipeId?: string;
  }) => {
    const response = await apiClient.post('/recipes', data);
    return response.data;
  },

  // Update an existing recipe
  updateRecipe: async (recipeId: string, data: any) => {
    const response = await apiClient.put(`/recipes/${recipeId}`, data);
    return response.data;
  },

  // Delete a recipe
  deleteRecipe: async (recipeId: string) => {
    const response = await apiClient.delete(`/recipes/${recipeId}`);
    return response.data;
  },

  // Get user's own recipes
  getMyRecipes: async () => {
    const response = await apiClient.get('/recipes/my-recipes');
    return response.data;
  },
};

export default recipeService;
