import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../../middleware/auth.js';
import { query } from '../../config/database.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import preferenceLearningEngine from '../../services/ai/preferenceLearningEngine.js';
import { logger } from '../../utils/logger.js';

/**
 * Log a meal interaction (accepted, rejected, modified)
 * POST /api/meals/log-interaction
 */
export const logMealInteraction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    householdId,
    mealName,
    mealType,
    cuisineType,
    mainProtein,
    ingredients,
    action,
    notes
  } = req.body;

  // Validation
  if (!householdId || !mealName || !action) {
    res.status(400).json({
      success: false,
      message: 'householdId, mealName, and action are required'
    });
    return;
  }

  if (!['accepted', 'rejected', 'modified'].includes(action)) {
    res.status(400).json({
      success: false,
      message: 'action must be one of: accepted, rejected, modified'
    });
    return;
  }

  // Insert interaction
  const interactionId = uuidv4();
  await query(
    `INSERT INTO meal_interactions
     (id, household_id, meal_name, meal_type, cuisine_type, main_protein, ingredients, action, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      interactionId,
      householdId,
      mealName,
      mealType || null,
      cuisineType || null,
      mainProtein || null,
      ingredients ? JSON.stringify(ingredients) : null,
      action,
      notes || null
    ]
  );

  // Automatically learn from this interaction using AI preference learning
  try {
    await preferenceLearningEngine.recordInteraction({
      id: interactionId,
      household_id: householdId,
      meal_name: mealName,
      action: action as 'accepted' | 'rejected' | 'modified' | 'saved' | 'rated',
      cuisine_type: cuisineType,
      main_protein: mainProtein,
      cooking_method: req.body.cookingMethod,
      flavor_profile: req.body.flavorProfile,
      prep_time: req.body.prepTime,
      rating: req.body.rating,
      interaction_date: new Date()
    });

    logger.info('Preference learning updated', { householdId, mealName, action });
  } catch (error) {
    // Don't fail the request if preference learning fails
    logger.error('Failed to update preference learning', error as Error);
  }

  res.status(201).json({
    success: true,
    message: `Meal interaction logged: ${action}`,
    data: {
      interactionId,
      mealName,
      action
    }
  });
});

/**
 * Get learned preferences for a household
 * GET /api/meals/learned-preferences/:householdId
 */
export const getLearnedPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;

  if (!householdId) {
    res.status(400).json({
      success: false,
      message: 'householdId is required'
    });
    return;
  }

  // Get all interactions for this household
  const interactions = await query(
    `SELECT * FROM meal_interactions
     WHERE household_id = ?
     ORDER BY interaction_date DESC`,
    [householdId]
  );

  // Analyze patterns
  const accepted = interactions.filter((i: any) => i.action === 'accepted');
  const rejected = interactions.filter((i: any) => i.action === 'rejected');

  // Extract popular cuisines from accepted meals
  const cuisineCount: Record<string, number> = {};
  accepted.forEach((meal: any) => {
    if (meal.cuisine_type) {
      cuisineCount[meal.cuisine_type] = (cuisineCount[meal.cuisine_type] || 0) + 1;
    }
  });

  // Extract popular proteins from accepted meals
  const proteinCount: Record<string, number> = {};
  accepted.forEach((meal: any) => {
    if (meal.main_protein) {
      proteinCount[meal.main_protein] = (proteinCount[meal.main_protein] || 0) + 1;
    }
  });

  // Extract common ingredients from accepted meals
  const ingredientCount: Record<string, number> = {};
  accepted.forEach((meal: any) => {
    if (meal.ingredients) {
      const ingredients = typeof meal.ingredients === 'string'
        ? JSON.parse(meal.ingredients)
        : meal.ingredients;

      ingredients.forEach((ing: string) => {
        const normalized = ing.toLowerCase().trim();
        ingredientCount[normalized] = (ingredientCount[normalized] || 0) + 1;
      });
    }
  });

  // Extract disliked ingredients from rejected meals
  const dislikedIngredients: Record<string, number> = {};
  rejected.forEach((meal: any) => {
    if (meal.ingredients) {
      const ingredients = typeof meal.ingredients === 'string'
        ? JSON.parse(meal.ingredients)
        : meal.ingredients;

      ingredients.forEach((ing: string) => {
        const normalized = ing.toLowerCase().trim();
        dislikedIngredients[normalized] = (dislikedIngredients[normalized] || 0) + 1;
      });
    }
  });

  // Sort and get top preferences
  const topCuisines = Object.entries(cuisineCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cuisine, count]) => ({ cuisine, count }));

  const topProteins = Object.entries(proteinCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([protein, count]) => ({ protein, count }));

  const topIngredients = Object.entries(ingredientCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ingredient, count]) => ({ ingredient, count }));

  const topDislikes = Object.entries(dislikedIngredients)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ingredient, count]) => ({ ingredient, count }));

  res.json({
    success: true,
    data: {
      totalAccepted: accepted.length,
      totalRejected: rejected.length,
      learnedPreferences: {
        favoriteCuisines: topCuisines,
        favoriteProteins: topProteins,
        popularIngredients: topIngredients,
        dislikedIngredients: topDislikes
      },
      recentInteractions: interactions.slice(0, 10)
    }
  });
});

/**
 * Update household preferences based on learned data
 * POST /api/meals/update-preferences/:householdId
 */
export const updateLearnedPreferences = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;

  if (!householdId) {
    res.status(400).json({
      success: false,
      message: 'householdId is required'
    });
    return;
  }

  // Get learned preferences
  const interactions = await query(
    `SELECT * FROM meal_interactions
     WHERE household_id = ?
     ORDER BY interaction_date DESC`,
    [householdId]
  );

  const accepted = interactions.filter((i: any) => i.action === 'accepted');
  const rejected = interactions.filter((i: any) => i.action === 'rejected');

  // Build learned preferences object
  const cuisines = new Set<string>();
  const proteins = new Set<string>();
  const likedIngredients = new Set<string>();
  const dislikedIngredients = new Set<string>();

  accepted.forEach((meal: any) => {
    if (meal.cuisine_type) cuisines.add(meal.cuisine_type);
    if (meal.main_protein) proteins.add(meal.main_protein);
    if (meal.ingredients) {
      const ingredients = typeof meal.ingredients === 'string'
        ? JSON.parse(meal.ingredients)
        : meal.ingredients;
      ingredients.forEach((ing: string) => likedIngredients.add(ing.toLowerCase().trim()));
    }
  });

  rejected.forEach((meal: any) => {
    if (meal.ingredients) {
      const ingredients = typeof meal.ingredients === 'string'
        ? JSON.parse(meal.ingredients)
        : meal.ingredients;
      ingredients.forEach((ing: string) => dislikedIngredients.add(ing.toLowerCase().trim()));
    }
  });

  // Store as JSON in dietary_preferences table or household preferences field
  const learnedData = {
    favoriteCuisines: Array.from(cuisines),
    favoriteProteins: Array.from(proteins),
    likedIngredients: Array.from(likedIngredients).slice(0, 20),
    dislikedIngredients: Array.from(dislikedIngredients).slice(0, 20),
    lastUpdated: new Date().toISOString()
  };

  // You could store this in a new column in households table or a separate preferences table
  // For now, let's return it
  res.json({
    success: true,
    message: 'Learned preferences compiled',
    data: learnedData
  });
});
