import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import { query } from '../../config/database.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Recipe extends RowDataPacket {
  id: string;
  name: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  instructions: any;
  nutrition_info: any;
  image_url: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

interface RecipeIngredient extends RowDataPacket {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  amount: number;
  unit: string;
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

// Create recipe
export const createRecipe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    name,
    description,
    prepTime,
    cookTime,
    servings,
    difficulty,
    cuisine,
    ingredients,
    instructions,
    nutritionInfo,
    tags,
    imageUrl,
  } = req.body;

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const recipeId = uuidv4();

  // Insert recipe
  await query(
    `INSERT INTO recipes
    (id, name, description, prep_time, cook_time, servings, difficulty, cuisine, instructions, nutrition_info, image_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recipeId,
      name,
      description || null,
      prepTime,
      cookTime,
      servings,
      difficulty || 'medium',
      cuisine || null,
      JSON.stringify(instructions),
      JSON.stringify(nutritionInfo || {}),
      imageUrl || null,
      userId,
    ]
  );

  // Insert ingredients
  if (ingredients && ingredients.length > 0) {
    for (const ingredient of ingredients) {
      // First, get or create ingredient
      let [existingIngredients] = await query<RowDataPacket[]>(
        'SELECT id FROM ingredients WHERE LOWER(name) = LOWER(?)',
        [ingredient.name]
      );

      let ingredientId: string;
      if (existingIngredients.length > 0) {
        ingredientId = existingIngredients[0].id;
      } else {
        ingredientId = uuidv4();
        await query(
          'INSERT INTO ingredients (id, name, category) VALUES (?, ?, ?)',
          [ingredientId, ingredient.name, null]
        );
      }

      // Link ingredient to recipe
      await query(
        'INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), recipeId, ingredientId, ingredient.amount, ingredient.unit, ingredient.notes || null]
      );
    }
  }

  res.status(201).json({
    success: true,
    recipe: {
      id: recipeId,
      name,
      description,
      prepTime,
      cookTime,
      servings,
      difficulty: difficulty || 'medium',
      cuisine,
      ingredients,
      instructions,
      nutritionInfo,
      imageUrl,
    },
  });
});

// Get all recipes (with optional filters)
export const getRecipes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cuisine, difficulty, maxTime, search } = req.query;

  let sql = 'SELECT * FROM recipes WHERE 1=1';
  const params: any[] = [];

  if (cuisine) {
    sql += ' AND cuisine = ?';
    params.push(cuisine);
  }

  if (difficulty) {
    sql += ' AND difficulty = ?';
    params.push(difficulty);
  }

  if (maxTime) {
    sql += ' AND (prep_time + cook_time) <= ?';
    params.push(parseInt(maxTime as string));
  }

  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  sql += ' ORDER BY created_at DESC';

  const recipes = await query<Recipe[]>(sql, params);

  // Parse JSON fields
  const parsedRecipes = recipes.map((recipe) => ({
    ...recipe,
    instructions: parseJsonField(recipe.instructions, []),
    nutrition_info: parseJsonField(recipe.nutrition_info, {}),
  }));

  res.json({
    success: true,
    count: parsedRecipes.length,
    recipes: parsedRecipes,
  });
});

// Get single recipe with ingredients
export const getRecipe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { recipeId } = req.params;

  const recipes = await query<Recipe[]>('SELECT * FROM recipes WHERE id = ?', [recipeId]);

  if (recipes.length === 0) {
    throw new AppError('Recipe not found', 404);
  }

  const recipe = recipes[0];

  // Get ingredients
  const ingredients = await query<RowDataPacket[]>(
    `SELECT
      ri.id,
      ri.amount,
      ri.unit,
      ri.notes,
      i.name,
      i.category
    FROM recipe_ingredients ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.recipe_id = ?`,
    [recipeId]
  );

  res.json({
    success: true,
    recipe: {
      ...recipe,
      instructions: parseJsonField(recipe.instructions, []),
      nutrition_info: parseJsonField(recipe.nutrition_info, {}),
      ingredients: ingredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        notes: ing.notes,
        category: ing.category,
      })),
    },
  });
});

// Update recipe
export const updateRecipe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { recipeId } = req.params;
  const userId = req.user?.id;

  // Verify recipe exists and user owns it
  const recipes = await query<Recipe[]>('SELECT * FROM recipes WHERE id = ?', [recipeId]);

  if (recipes.length === 0) {
    throw new AppError('Recipe not found', 404);
  }

  if (recipes[0].created_by !== userId) {
    throw new AppError('Not authorized to update this recipe', 403);
  }

  const {
    name,
    description,
    prepTime,
    cookTime,
    servings,
    difficulty,
    cuisine,
    instructions,
    nutritionInfo,
    imageUrl,
    ingredients,
  } = req.body;

  // Build update query dynamically
  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (prepTime !== undefined) {
    updates.push('prep_time = ?');
    params.push(prepTime);
  }
  if (cookTime !== undefined) {
    updates.push('cook_time = ?');
    params.push(cookTime);
  }
  if (servings !== undefined) {
    updates.push('servings = ?');
    params.push(servings);
  }
  if (difficulty !== undefined) {
    updates.push('difficulty = ?');
    params.push(difficulty);
  }
  if (cuisine !== undefined) {
    updates.push('cuisine = ?');
    params.push(cuisine);
  }
  if (instructions !== undefined) {
    updates.push('instructions = ?');
    params.push(JSON.stringify(instructions));
  }
  if (nutritionInfo !== undefined) {
    updates.push('nutrition_info = ?');
    params.push(JSON.stringify(nutritionInfo));
  }
  if (imageUrl !== undefined) {
    updates.push('image_url = ?');
    params.push(imageUrl);
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    params.push(recipeId);

    await query(`UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  // Update ingredients if provided
  if (ingredients !== undefined) {
    // Delete existing ingredients
    await query('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [recipeId]);

    // Insert new ingredients
    for (const ingredient of ingredients) {
      let [existingIngredients] = await query<RowDataPacket[]>(
        'SELECT id FROM ingredients WHERE LOWER(name) = LOWER(?)',
        [ingredient.name]
      );

      let ingredientId: string;
      if (existingIngredients.length > 0) {
        ingredientId = existingIngredients[0].id;
      } else {
        ingredientId = uuidv4();
        await query('INSERT INTO ingredients (id, name, category) VALUES (?, ?, ?)', [
          ingredientId,
          ingredient.name,
          null,
        ]);
      }

      await query(
        'INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, amount, unit, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), recipeId, ingredientId, ingredient.amount, ingredient.unit, ingredient.notes || null]
      );
    }
  }

  res.json({
    success: true,
    message: 'Recipe updated successfully',
  });
});

// Delete recipe
export const deleteRecipe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { recipeId } = req.params;
  const userId = req.user?.id;

  // Verify recipe exists and user owns it
  const recipes = await query<Recipe[]>('SELECT * FROM recipes WHERE id = ?', [recipeId]);

  if (recipes.length === 0) {
    throw new AppError('Recipe not found', 404);
  }

  if (recipes[0].created_by !== userId) {
    throw new AppError('Not authorized to delete this recipe', 403);
  }

  // Delete recipe (cascade will handle ingredients)
  await query('DELETE FROM recipes WHERE id = ?', [recipeId]);

  res.json({
    success: true,
    message: 'Recipe deleted successfully',
  });
});

// Get user's recipes
export const getMyRecipes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  const recipes = await query<Recipe[]>('SELECT * FROM recipes WHERE created_by = ? ORDER BY created_at DESC', [
    userId,
  ]);

  const parsedRecipes = recipes.map((recipe) => ({
    ...recipe,
    instructions: parseJsonField(recipe.instructions, []),
    nutrition_info: parseJsonField(recipe.nutrition_info, {}),
    tags: parseJsonField(recipe.tags, []),
  }));

  res.json({
    success: true,
    count: parsedRecipes.length,
    recipes: parsedRecipes,
  });
});

// Save AI-generated recipe from meal plan to user's library
export const saveRecipeFromMeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Get the meal with its recipe data
  const meals = await query<RowDataPacket[]>(
    `SELECT mpm.notes, mp.household_id
     FROM meal_plan_meals mpm
     JOIN meal_plans mp ON mpm.meal_plan_id = mp.id
     WHERE mpm.id = ?`,
    [mealId]
  );

  if (meals.length === 0) {
    throw new AppError('Meal not found', 404);
  }

  const meal = meals[0];

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== meal.household_id) {
    throw new AppError('Access denied to this meal', 403);
  }

  // Parse the recipe data from notes
  const recipeData = parseJsonField(meal.notes, {});

  if (!recipeData.name || !recipeData.ingredients) {
    throw new AppError('Invalid recipe data in meal', 400);
  }

  const recipeId = uuidv4();

  // Create recipe
  await query(
    `INSERT INTO recipes
    (id, name, description, prep_time, cook_time, servings, difficulty, instructions, nutrition, tags, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recipeId,
      recipeData.name,
      recipeData.description || null,
      recipeData.prepTime || null,
      recipeData.cookTime || null,
      recipeData.servings || 4,
      recipeData.difficulty || 'medium',
      JSON.stringify(recipeData.instructions || []),
      JSON.stringify(recipeData.nutrition || {}),
      JSON.stringify(recipeData.tags || []),
      userId,
    ]
  );

  // Add ingredients
  if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
    for (const ingredient of recipeData.ingredients) {
      // Get or create ingredient
      let existingIngredients = await query<RowDataPacket[]>(
        'SELECT id FROM ingredients WHERE LOWER(name) = LOWER(?)',
        [ingredient.name]
      );

      let ingredientId: string;
      if (existingIngredients.length > 0) {
        ingredientId = existingIngredients[0].id;
      } else {
        ingredientId = uuidv4();
        await query(
          'INSERT INTO ingredients (id, name, category) VALUES (?, ?, ?)',
          [ingredientId, ingredient.name, ingredient.category || null]
        );
      }

      // Link ingredient to recipe
      await query(
        'INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), recipeId, ingredientId, ingredient.amount || 1, ingredient.unit || 'piece']
      );
    }
  }

  res.status(201).json({
    success: true,
    message: 'Recipe saved to your library',
    recipe: {
      id: recipeId,
      name: recipeData.name,
    },
  });
});
