import express from 'express';
import {
  createRecipe,
  getRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  getMyRecipes,
  saveRecipeFromMeal,
} from './recipes.controller.js';
import {
  rateRecipe,
  getRecipeRatings,
  getMyRating,
  deleteRating,
  getTopRatedRecipes,
} from './ratings.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate, createRecipeSchema, updateRecipeSchema, rateRecipeSchema } from '../../middleware/validators.js';

const router = express.Router();

// All recipe routes require authentication
router.use(authenticateToken);

// Get all recipes (with optional filters)
router.get('/', getRecipes);

// Get user's own recipes
router.get('/my-recipes', getMyRecipes);

// Get top-rated recipes
router.get('/top-rated', getTopRatedRecipes);

// Save AI-generated recipe from meal to library
router.post('/save-from-meal/:mealId', saveRecipeFromMeal);

// Get single recipe
router.get('/:recipeId', getRecipe);

// Create recipe
router.post('/', validate(createRecipeSchema), createRecipe);

// Update recipe
router.put('/:recipeId', validate(updateRecipeSchema), updateRecipe);

// Delete recipe
router.delete('/:recipeId', deleteRecipe);

// Recipe rating routes
router.post('/:recipeId/ratings', validate(rateRecipeSchema), rateRecipe);
router.get('/:recipeId/ratings', getRecipeRatings);
router.get('/:recipeId/ratings/my-rating', getMyRating);
router.delete('/:recipeId/ratings', deleteRating);

export default router;
