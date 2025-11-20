import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import { query } from '../../config/database.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface MealPlan extends RowDataPacket {
  id: string;
  household_id: string;
  week_start: Date;
  week_end: Date;
  budget: number;
  status: 'active' | 'completed' | 'archived';
  created_by: string;
  created_at: Date;
}

interface MealPlanMeal extends RowDataPacket {
  id: string;
  meal_plan_id: string;
  recipe_id: string;
  day_of_week: number;
  meal_type: string;
  servings: number;
  notes: string;
}

// Helper to parse JSON fields
const parseJsonField = (field: any, defaultValue: any): any => {
  if (typeof field === 'object' && field !== null) return field;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
};

// Create meal plan
export const createMealPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId, weekStart, weekEnd, budget, meals } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Verify user has access to this household
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== householdId) {
    throw new AppError('Access denied to this household', 403);
  }

  const mealPlanId = uuidv4();

  // Create meal plan
  await query(
    'INSERT INTO meal_plans (id, household_id, week_start, week_end, budget, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [mealPlanId, householdId, weekStart, weekEnd || null, budget || null, 'active', userId]
  );

  // Add meals if provided
  if (meals && meals.length > 0) {
    for (const meal of meals) {
      await query(
        'INSERT INTO meal_plan_meals (id, meal_plan_id, recipe_id, day_of_week, meal_type, servings, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          mealPlanId,
          meal.recipeId || null,
          meal.dayOfWeek,
          meal.mealType,
          meal.servings || null,
          meal.notes || null,
        ]
      );
    }
  }

  res.status(201).json({
    success: true,
    mealPlan: {
      id: mealPlanId,
      householdId,
      weekStart,
      weekEnd,
      budget,
      mealCount: meals?.length || 0,
    },
  });
});

// Get meal plans for household
export const getMealPlans = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const { status, limit } = req.query;
  const userId = req.user?.id;

  // Verify user has access to this household
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== householdId) {
    throw new AppError('Access denied to this household', 403);
  }

  let sql = 'SELECT * FROM meal_plans WHERE household_id = ?';
  const params: any[] = [householdId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY week_start DESC';

  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit as string));
  }

  const plans = await query<MealPlan[]>(sql, params);

  // Get meal counts for each plan
  const plansWithCounts = await Promise.all(
    plans.map(async (plan) => {
      const meals = await query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM meal_plan_meals WHERE meal_plan_id = ?',
        [plan.id]
      );

      return {
        ...plan,
        mealCount: meals[0]?.count || 0,
      };
    })
  );

  res.json({
    success: true,
    count: plansWithCounts.length,
    mealPlans: plansWithCounts,
  });
});

// Get single meal plan with meals
export const getMealPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealPlanId } = req.params;
  const userId = req.user?.id;

  const plans = await query<MealPlan[]>('SELECT * FROM meal_plans WHERE id = ?', [mealPlanId]);

  if (plans.length === 0) {
    throw new AppError('Meal plan not found', 404);
  }

  const plan = plans[0];

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== plan.household_id) {
    throw new AppError('Access denied to this meal plan', 403);
  }

  // Get meals with recipe details
  const meals = await query<RowDataPacket[]>(
    `SELECT
      mpm.*,
      r.name as recipe_name,
      r.prep_time,
      r.cook_time,
      r.difficulty,
      r.image_url
    FROM meal_plan_meals mpm
    LEFT JOIN recipes r ON mpm.recipe_id = r.id
    WHERE mpm.meal_plan_id = ?
    ORDER BY mpm.day_of_week, mpm.meal_type`,
    [mealPlanId]
  );

  // Group meals by day
  const groupedMeals: { [key: number]: any[] } = {};
  meals.forEach((meal) => {
    if (!groupedMeals[meal.day_of_week]) {
      groupedMeals[meal.day_of_week] = [];
    }
    groupedMeals[meal.day_of_week].push(meal);
  });

  res.json({
    success: true,
    mealPlan: {
      ...plan,
      meals,
      groupedMeals,
      totalMeals: meals.length,
    },
  });
});

// Update meal plan
export const updateMealPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealPlanId } = req.params;
  const { weekStart, weekEnd, budget, status } = req.body;
  const userId = req.user?.id;

  const plans = await query<MealPlan[]>('SELECT * FROM meal_plans WHERE id = ?', [mealPlanId]);

  if (plans.length === 0) {
    throw new AppError('Meal plan not found', 404);
  }

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== plans[0].household_id) {
    throw new AppError('Access denied to this meal plan', 403);
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (weekStart !== undefined) {
    updates.push('week_start = ?');
    params.push(weekStart);
  }

  if (weekEnd !== undefined) {
    updates.push('week_end = ?');
    params.push(weekEnd);
  }

  if (budget !== undefined) {
    updates.push('budget = ?');
    params.push(budget);
  }

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }

  if (updates.length > 0) {
    params.push(mealPlanId);
    await query(`UPDATE meal_plans SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  res.json({
    success: true,
    message: 'Meal plan updated successfully',
  });
});

// Delete meal plan
export const deleteMealPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealPlanId } = req.params;
  const userId = req.user?.id;

  const plans = await query<MealPlan[]>('SELECT * FROM meal_plans WHERE id = ?', [mealPlanId]);

  if (plans.length === 0) {
    throw new AppError('Meal plan not found', 404);
  }

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== plans[0].household_id) {
    throw new AppError('Access denied to this meal plan', 403);
  }

  // Check if user created this plan
  if (plans[0].created_by !== userId) {
    throw new AppError('Only the creator can delete this meal plan', 403);
  }

  await query('DELETE FROM meal_plans WHERE id = ?', [mealPlanId]);

  res.json({
    success: true,
    message: 'Meal plan deleted successfully',
  });
});

// Add meal to plan
export const addMeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealPlanId } = req.params;
  const { recipeId, dayOfWeek, mealType, servings, notes } = req.body;
  const userId = req.user?.id;

  const plans = await query<MealPlan[]>('SELECT * FROM meal_plans WHERE id = ?', [mealPlanId]);

  if (plans.length === 0) {
    throw new AppError('Meal plan not found', 404);
  }

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== plans[0].household_id) {
    throw new AppError('Access denied to this meal plan', 403);
  }

  // Verify recipe exists if provided
  if (recipeId) {
    const recipes = await query<RowDataPacket[]>('SELECT id FROM recipes WHERE id = ?', [recipeId]);
    if (recipes.length === 0) {
      throw new AppError('Recipe not found', 404);
    }
  }

  const mealId = uuidv4();

  await query(
    'INSERT INTO meal_plan_meals (id, meal_plan_id, recipe_id, day_of_week, meal_type, servings, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [mealId, mealPlanId, recipeId || null, dayOfWeek, mealType, servings || null, notes || null]
  );

  res.status(201).json({
    success: true,
    meal: {
      id: mealId,
      mealPlanId,
      recipeId,
      dayOfWeek,
      mealType,
      servings,
      notes,
    },
  });
});

// Update meal
export const updateMeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealId } = req.params;
  const { recipeId, dayOfWeek, mealType, servings, notes } = req.body;
  const userId = req.user?.id;

  const meals = await query<RowDataPacket[]>(
    'SELECT mpm.*, mp.household_id FROM meal_plan_meals mpm JOIN meal_plans mp ON mpm.meal_plan_id = mp.id WHERE mpm.id = ?',
    [mealId]
  );

  if (meals.length === 0) {
    throw new AppError('Meal not found', 404);
  }

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== meals[0].household_id) {
    throw new AppError('Access denied to this meal', 403);
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (recipeId !== undefined) {
    updates.push('recipe_id = ?');
    params.push(recipeId);
  }

  if (dayOfWeek !== undefined) {
    updates.push('day_of_week = ?');
    params.push(dayOfWeek);
  }

  if (mealType !== undefined) {
    updates.push('meal_type = ?');
    params.push(mealType);
  }

  if (servings !== undefined) {
    updates.push('servings = ?');
    params.push(servings);
  }

  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }

  if (updates.length > 0) {
    params.push(mealId);
    await query(`UPDATE meal_plan_meals SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  res.json({
    success: true,
    message: 'Meal updated successfully',
  });
});

// Delete meal from plan
export const deleteMeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealId } = req.params;
  const userId = req.user?.id;

  const meals = await query<RowDataPacket[]>(
    'SELECT mpm.*, mp.household_id FROM meal_plan_meals mpm JOIN meal_plans mp ON mpm.meal_plan_id = mp.id WHERE mpm.id = ?',
    [mealId]
  );

  if (meals.length === 0) {
    throw new AppError('Meal not found', 404);
  }

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== meals[0].household_id) {
    throw new AppError('Access denied to this meal', 403);
  }

  await query('DELETE FROM meal_plan_meals WHERE id = ?', [mealId]);

  res.json({
    success: true,
    message: 'Meal removed from plan successfully',
  });
});

// Get current week's meal plan
export const getCurrentWeekPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const userId = req.user?.id;

  // Verify user has access to this household
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== householdId) {
    throw new AppError('Access denied to this household', 403);
  }

  // Get current week's plan
  const plans = await query<MealPlan[]>(
    `SELECT * FROM meal_plans
    WHERE household_id = ?
    AND week_start <= CURDATE()
    AND (week_end >= CURDATE() OR week_end IS NULL)
    AND status = 'active'
    ORDER BY week_start DESC
    LIMIT 1`,
    [householdId]
  );

  if (plans.length === 0) {
    return res.json({
      success: true,
      mealPlan: null,
      message: 'No active meal plan for current week',
    });
  }

  const plan = plans[0];

  // Get meals with recipe details
  const meals = await query<RowDataPacket[]>(
    `SELECT
      mpm.*,
      r.name as recipe_name,
      r.prep_time,
      r.cook_time,
      r.difficulty,
      r.image_url
    FROM meal_plan_meals mpm
    LEFT JOIN recipes r ON mpm.recipe_id = r.id
    WHERE mpm.meal_plan_id = ?
    ORDER BY mpm.day_of_week, mpm.meal_type`,
    [plan.id]
  );

  // Group meals by day
  const groupedMeals: { [key: number]: any[] } = {};
  meals.forEach((meal) => {
    if (!groupedMeals[meal.day_of_week]) {
      groupedMeals[meal.day_of_week] = [];
    }
    groupedMeals[meal.day_of_week].push(meal);
  });

  res.json({
    success: true,
    mealPlan: {
      ...plan,
      meals,
      groupedMeals,
      totalMeals: meals.length,
    },
  });
});
