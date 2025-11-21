import { Response } from 'express';
import { AuthRequest } from '../../types/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { query } from '../../config/database.js';

interface NutritionData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

/**
 * Get nutritional summary for a meal plan
 * GET /api/nutrition/meal-plan/:mealPlanId
 */
export const getMealPlanNutrition = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealPlanId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify user has access to meal plan
    const mealPlans: any[] = await query(
      `SELECT mp.id, mp.household_id
       FROM meal_plans mp
       JOIN household_members hm ON mp.household_id = hm.household_id
       WHERE mp.id = ? AND hm.user_id = ?`,
      [mealPlanId, userId]
    );

    if (mealPlans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found or access denied',
      });
    }

    // Get all meals in the meal plan with their nutrition data
    const meals: any[] = await query(
      `SELECT
        mpm.id,
        mpm.meal_date as mealDate,
        mpm.meal_type as mealType,
        mpm.servings,
        r.name as recipeName,
        r.nutrition
      FROM meal_plan_meals mpm
      JOIN recipes r ON mpm.recipe_id = r.id
      WHERE mpm.meal_plan_id = ?
      ORDER BY mpm.meal_date, mpm.meal_type`,
      [mealPlanId]
    );

    // Parse nutrition data and aggregate by day
    const dailyNutrition: {[date: string]: {
      meals: any[];
      totals: NutritionData;
    }} = {};

    let overallTotals: NutritionData = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };

    for (const meal of meals) {
      const nutrition: NutritionData = meal.nutrition ? JSON.parse(meal.nutrition) : {};
      const date = meal.mealDate.toISOString().split('T')[0];

      if (!dailyNutrition[date]) {
        dailyNutrition[date] = {
          meals: [],
          totals: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
          },
        };
      }

      // Add meal to daily list
      dailyNutrition[date].meals.push({
        mealType: meal.mealType,
        recipeName: meal.recipeName,
        servings: meal.servings,
        nutrition,
      });

      // Aggregate nutrition
      for (const key of Object.keys(overallTotals)) {
        const nutrientKey = key as keyof NutritionData;
        const value = nutrition[nutrientKey] || 0;
        dailyNutrition[date].totals[nutrientKey] = (dailyNutrition[date].totals[nutrientKey] || 0) + value;
        overallTotals[nutrientKey] = (overallTotals[nutrientKey] || 0) + value;
      }
    }

    // Calculate averages
    const dayCount = Object.keys(dailyNutrition).length || 1;
    const averages: NutritionData = {};
    for (const key of Object.keys(overallTotals)) {
      const nutrientKey = key as keyof NutritionData;
      averages[nutrientKey] = Math.round((overallTotals[nutrientKey] || 0) / dayCount);
    }

    return res.json({
      success: true,
      data: {
        overallTotals,
        dailyAverage: averages,
        dailyBreakdown: dailyNutrition,
        totalDays: dayCount,
        totalMeals: meals.length,
      },
    });
  } catch (error) {
    console.error('Error getting meal plan nutrition:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get meal plan nutrition',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get nutritional summary for a specific day
 * GET /api/nutrition/meal-plan/:mealPlanId/day/:date
 */
export const getDayNutrition = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealPlanId, date } = req.params;
  const userId = req.user!.id;

  try {
    // Verify user has access to meal plan
    const mealPlans: any[] = await query(
      `SELECT mp.id, mp.household_id
       FROM meal_plans mp
       JOIN household_members hm ON mp.household_id = hm.household_id
       WHERE mp.id = ? AND hm.user_id = ?`,
      [mealPlanId, userId]
    );

    if (mealPlans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found or access denied',
      });
    }

    // Get meals for the specific day
    const meals: any[] = await query(
      `SELECT
        mpm.id,
        mpm.meal_type as mealType,
        mpm.servings,
        r.name as recipeName,
        r.nutrition
      FROM meal_plan_meals mpm
      JOIN recipes r ON mpm.recipe_id = r.id
      WHERE mpm.meal_plan_id = ? AND mpm.meal_date = ?
      ORDER BY
        CASE mpm.meal_type
          WHEN 'breakfast' THEN 1
          WHEN 'lunch' THEN 2
          WHEN 'dinner' THEN 3
          WHEN 'snack' THEN 4
        END`,
      [mealPlanId, date]
    );

    if (meals.length === 0) {
      return res.json({
        success: true,
        data: {
          date,
          meals: [],
          totals: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
          },
        },
        message: 'No meals found for this date',
      });
    }

    // Calculate totals
    const totals: NutritionData = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };

    const mealsList = meals.map(meal => {
      const nutrition: NutritionData = meal.nutrition ? JSON.parse(meal.nutrition) : {};

      // Add to totals
      for (const key of Object.keys(totals)) {
        const nutrientKey = key as keyof NutritionData;
        totals[nutrientKey] = (totals[nutrientKey] || 0) + (nutrition[nutrientKey] || 0);
      }

      return {
        mealType: meal.mealType,
        recipeName: meal.recipeName,
        servings: meal.servings,
        nutrition,
      };
    });

    return res.json({
      success: true,
      data: {
        date,
        meals: mealsList,
        totals,
        mealCount: meals.length,
      },
    });
  } catch (error) {
    console.error('Error getting day nutrition:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get day nutrition',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Compare nutrition against dietary goals
 * POST /api/nutrition/compare-goals
 */
export const compareWithGoals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealPlanId, goals } = req.body;
  const userId = req.user!.id;

  try {
    // Verify user has access to meal plan
    const mealPlans: any[] = await query(
      `SELECT mp.id, mp.household_id
       FROM meal_plans mp
       JOIN household_members hm ON mp.household_id = hm.household_id
       WHERE mp.id = ? AND hm.user_id = ?`,
      [mealPlanId, userId]
    );

    if (mealPlans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found or access denied',
      });
    }

    // Get meal plan nutrition totals
    const meals: any[] = await query(
      `SELECT r.nutrition
       FROM meal_plan_meals mpm
       JOIN recipes r ON mpm.recipe_id = r.id
       WHERE mpm.meal_plan_id = ?`,
      [mealPlanId]
    );

    // Calculate totals
    const totals: NutritionData = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };

    for (const meal of meals) {
      const nutrition: NutritionData = meal.nutrition ? JSON.parse(meal.nutrition) : {};
      for (const key of Object.keys(totals)) {
        const nutrientKey = key as keyof NutritionData;
        totals[nutrientKey] = (totals[nutrientKey] || 0) + (nutrition[nutrientKey] || 0);
      }
    }

    // Calculate daily average
    const dayCount = Math.max(1, new Set(meals.map(m => m.mealDate)).size);
    const dailyAverage: NutritionData = {};
    for (const key of Object.keys(totals)) {
      const nutrientKey = key as keyof NutritionData;
      dailyAverage[nutrientKey] = Math.round((totals[nutrientKey] || 0) / dayCount);
    }

    // Compare with goals
    const comparison: {[key: string]: {
      current: number;
      goal: number;
      percentage: number;
      status: 'under' | 'on_track' | 'over';
    }} = {};

    for (const [nutrient, goal] of Object.entries(goals)) {
      const current = dailyAverage[nutrient as keyof NutritionData] || 0;
      const percentage = goal > 0 ? Math.round((current / goal) * 100) : 0;

      let status: 'under' | 'on_track' | 'over' = 'on_track';
      if (percentage < 90) status = 'under';
      else if (percentage > 110) status = 'over';

      comparison[nutrient] = {
        current,
        goal,
        percentage,
        status,
      };
    }

    return res.json({
      success: true,
      data: {
        dailyAverage,
        goals,
        comparison,
      },
    });
  } catch (error) {
    console.error('Error comparing with goals:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compare with goals',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get nutrition breakdown by meal type
 * GET /api/nutrition/meal-plan/:mealPlanId/by-meal-type
 */
export const getNutritionByMealType = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealPlanId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify user has access to meal plan
    const mealPlans: any[] = await query(
      `SELECT mp.id, mp.household_id
       FROM meal_plans mp
       JOIN household_members hm ON mp.household_id = hm.household_id
       WHERE mp.id = ? AND hm.user_id = ?`,
      [mealPlanId, userId]
    );

    if (mealPlans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found or access denied',
      });
    }

    // Get meals grouped by type
    const meals: any[] = await query(
      `SELECT
        mpm.meal_type as mealType,
        r.nutrition
      FROM meal_plan_meals mpm
      JOIN recipes r ON mpm.recipe_id = r.id
      WHERE mpm.meal_plan_id = ?`,
      [mealPlanId]
    );

    // Aggregate by meal type
    const byMealType: {[mealType: string]: {
      count: number;
      totals: NutritionData;
      averages: NutritionData;
    }} = {};

    for (const meal of meals) {
      const mealType = meal.mealType;
      const nutrition: NutritionData = meal.nutrition ? JSON.parse(meal.nutrition) : {};

      if (!byMealType[mealType]) {
        byMealType[mealType] = {
          count: 0,
          totals: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
          },
          averages: {},
        };
      }

      byMealType[mealType].count++;

      for (const key of Object.keys(byMealType[mealType].totals)) {
        const nutrientKey = key as keyof NutritionData;
        byMealType[mealType].totals[nutrientKey] =
          (byMealType[mealType].totals[nutrientKey] || 0) + (nutrition[nutrientKey] || 0);
      }
    }

    // Calculate averages
    for (const mealType of Object.keys(byMealType)) {
      const count = byMealType[mealType].count;
      for (const key of Object.keys(byMealType[mealType].totals)) {
        const nutrientKey = key as keyof NutritionData;
        byMealType[mealType].averages[nutrientKey] =
          Math.round((byMealType[mealType].totals[nutrientKey] || 0) / count);
      }
    }

    return res.json({
      success: true,
      data: byMealType,
    });
  } catch (error) {
    console.error('Error getting nutrition by meal type:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get nutrition by meal type',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
