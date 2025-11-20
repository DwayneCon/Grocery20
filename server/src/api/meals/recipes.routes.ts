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
import { authenticateToken } from '../../middleware/auth.js';
import { validate, createRecipeSchema, updateRecipeSchema } from '../../middleware/validators.js';

const router = express.Router();

// All recipe routes require authentication
router.use(authenticateToken);

// Get all recipes (with optional filters)
router.get('/', getRecipes);

// Get user's own recipes
router.get('/my-recipes', getMyRecipes);

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

export default router;
