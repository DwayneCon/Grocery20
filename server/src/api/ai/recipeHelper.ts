import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export interface AIGeneratedMeal {
  name: string;
  description?: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
    category?: string;
  }>;
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cost?: number;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  tags?: string[];
  tips?: string;
}

/**
 * Save an AI-generated meal as a proper recipe in the database
 * @param meal - The meal data from AI
 * @param createdBy - User ID who created/generated the recipe
 * @returns Recipe ID
 */
export async function saveAIGeneratedRecipe(
  meal: AIGeneratedMeal,
  createdBy: string
): Promise<string> {
  const recipeId = uuidv4();

  try {
    // Create recipe record
    await query(
      `INSERT INTO recipes
       (id, name, description, prep_time, cook_time, servings, difficulty, instructions, nutrition, tags, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recipeId,
        meal.name,
        meal.description || `Delicious ${meal.name}`,
        meal.prepTime || 0,
        meal.cookTime || 0,
        meal.servings,
        meal.difficulty || 'medium',
        JSON.stringify(meal.instructions.map((step, idx) => ({ step: idx + 1, instruction: step }))),
        JSON.stringify(meal.nutrition || {}),
        JSON.stringify(meal.tags || []),
        createdBy,
      ]
    );

    // Process and save ingredients
    if (meal.ingredients && Array.isArray(meal.ingredients)) {
      for (const ingredient of meal.ingredients) {
        // Check if ingredient exists
        let ingredientId: string;
        const existing: any[] = await query(
          'SELECT id FROM ingredients WHERE LOWER(name) = LOWER(?)',
          [ingredient.name]
        );

        if (existing.length > 0) {
          ingredientId = existing[0].id;
        } else {
          // Create new ingredient
          ingredientId = uuidv4();
          await query(
            `INSERT INTO ingredients (id, name, category, unit)
             VALUES (?, ?, ?, ?)`,
            [
              ingredientId,
              ingredient.name,
              ingredient.category || 'Other',
              ingredient.unit || 'unit',
            ]
          );
        }

        // Link ingredient to recipe
        await query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
           VALUES (?, ?, ?, ?)`,
          [
            recipeId,
            ingredientId,
            parseFloat(ingredient.amount) || 1,
            ingredient.unit || 'unit',
          ]
        );
      }
    }

    return recipeId;
  } catch (error) {
    logger.error('Error saving AI-generated recipe:', error);
    throw error;
  }
}

/**
 * Get or create an ingredient by name
 * @param name - Ingredient name
 * @param category - Optional category
 * @param unit - Optional default unit
 * @returns Ingredient ID
 */
export async function getOrCreateIngredient(
  name: string,
  category?: string,
  unit?: string
): Promise<string> {
  // Check if exists
  const existing: any[] = await query(
    'SELECT id FROM ingredients WHERE LOWER(name) = LOWER(?)',
    [name]
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new
  const ingredientId = uuidv4();
  await query(
    `INSERT INTO ingredients (id, name, category, unit)
     VALUES (?, ?, ?, ?)`,
    [ingredientId, name, category || 'Other', unit || 'unit']
  );

  return ingredientId;
}

/**
 * Bulk save all meals from an AI-generated meal plan
 * @param mealPlanData - Full meal plan from AI
 * @param mealPlanId - The meal plan ID
 * @param householdId - Household ID
 * @param createdBy - User ID
 * @param weekStart - Start date of the meal plan
 * @param householdSize - Number of people
 * @returns Array of created meal IDs with their recipe IDs
 */
export async function saveMealPlanWithRecipes(
  mealPlanData: any,
  mealPlanId: string,
  _householdId: string,
  createdBy: string,
  weekStart: Date,
  householdSize: number
): Promise<Array<{ mealId: string; recipeId: string; mealType: string; date: string }>> {
  const savedMeals: Array<{ mealId: string; recipeId: string; mealType: string; date: string }> = [];

  const dayMapping: { [key: string]: number } = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 0,
  };

  if (!mealPlanData.mealPlan || !Array.isArray(mealPlanData.mealPlan)) {
    return savedMeals;
  }

  for (const dayPlan of mealPlanData.mealPlan) {
    const dayNumber = dayMapping[dayPlan.day] ?? 1;
    const mealDate = new Date(weekStart);
    mealDate.setDate(weekStart.getDate() + dayNumber);
    const dateString = mealDate.toISOString().split('T')[0];

    // Process breakfast, lunch, dinner
    for (const [mealType, mealData] of Object.entries(dayPlan.meals || {})) {
      if (mealData && typeof mealData === 'object') {
        const meal: any = mealData;

        try {
          // Save recipe to database
          const recipeId = await saveAIGeneratedRecipe(
            {
              name: meal.name,
              description: meal.description,
              ingredients: meal.ingredients || [],
              instructions: meal.instructions || [],
              prepTime: meal.prepTime,
              cookTime: meal.cookTime,
              servings: meal.servings || householdSize,
              difficulty: meal.difficulty,
              cost: meal.cost,
              nutrition: meal.nutrition,
              tags: meal.tags,
              tips: meal.tips,
            },
            createdBy
          );

          // Create meal plan meal entry
          const mealId = uuidv4();
          await query(
            `INSERT INTO meal_plan_meals
             (id, meal_plan_id, recipe_id, meal_date, meal_type, servings, notes, estimated_cost)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              mealId,
              mealPlanId,
              recipeId,
              dateString,
              mealType,
              meal.servings || householdSize,
              meal.tips || null,
              meal.cost || 0,
            ]
          );

          savedMeals.push({
            mealId,
            recipeId,
            mealType,
            date: dateString,
          });
        } catch (error) {
          logger.error(`Error saving meal ${meal.name}:`, error);
          // Continue with other meals even if one fails
        }
      }
    }
  }

  return savedMeals;
}
