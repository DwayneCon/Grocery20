import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import { query } from '../../config/database.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ShoppingList extends RowDataPacket {
  id: string;
  household_id: string;
  meal_plan_id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  created_at: Date;
  completed_at: Date;
}

interface ShoppingListItem extends RowDataPacket {
  id: string;
  shopping_list_id: string;
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  is_purchased: boolean;
  notes: string;
}

interface MealPlanMeal extends RowDataPacket {
  id: string;
  meal_plan_id: string;
  recipe_id: string;
  day_of_week: number;
  meal_type: string;
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

// Helper to consolidate ingredients
interface ConsolidatedIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string | null;
  ingredient_id: string | null;
}

const consolidateIngredients = (items: any[]): ConsolidatedIngredient[] => {
  const consolidated = new Map<string, ConsolidatedIngredient>();

  items.forEach((item) => {
    const key = `${item.name.toLowerCase()}-${item.unit}`;

    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      existing.quantity += item.quantity;
    } else {
      consolidated.set(key, {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category || null,
        ingredient_id: item.ingredient_id || null,
      });
    }
  });

  return Array.from(consolidated.values());
};

// Create shopping list from meal plan
export const createFromMealPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealPlanId, name } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Get meal plan and verify access
  const mealPlans = await query<RowDataPacket[]>('SELECT * FROM meal_plans WHERE id = ?', [mealPlanId]);

  if (mealPlans.length === 0) {
    throw new AppError('Meal plan not found', 404);
  }

  const mealPlan = mealPlans[0];

  // Verify user has access to this household
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== mealPlan.household_id) {
    throw new AppError('Access denied to this meal plan', 403);
  }

  // Get all meals in this meal plan
  const meals = await query<MealPlanMeal[]>('SELECT * FROM meal_plan_meals WHERE meal_plan_id = ?', [mealPlanId]);

  // Collect all ingredients from recipes
  const allIngredients: any[] = [];

  for (const meal of meals) {
    if (meal.recipe_id) {
      const ingredients = await query<RowDataPacket[]>(
        `SELECT
          ri.amount as quantity,
          ri.unit,
          i.id as ingredient_id,
          i.name,
          i.category
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = ?`,
        [meal.recipe_id]
      );

      allIngredients.push(...ingredients);
    }
  }

  // Consolidate ingredients
  const consolidatedIngredients = consolidateIngredients(allIngredients);

  // Create shopping list
  const shoppingListId = uuidv4();

  await query(
    'INSERT INTO shopping_lists (id, household_id, meal_plan_id, name, status) VALUES (?, ?, ?, ?, ?)',
    [shoppingListId, mealPlan.household_id, mealPlanId, name || `Shopping List - ${new Date().toLocaleDateString()}`, 'active']
  );

  // Add items to shopping list
  for (const ingredient of consolidatedIngredients) {
    await query(
      'INSERT INTO shopping_list_items (id, shopping_list_id, ingredient_id, name, quantity, unit, category, is_purchased) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        uuidv4(),
        shoppingListId,
        ingredient.ingredient_id,
        ingredient.name,
        ingredient.quantity,
        ingredient.unit,
        ingredient.category,
        false,
      ]
    );
  }

  res.status(201).json({
    success: true,
    shoppingList: {
      id: shoppingListId,
      householdId: mealPlan.household_id,
      mealPlanId,
      name: name || `Shopping List - ${new Date().toLocaleDateString()}`,
      itemCount: consolidatedIngredients.length,
    },
  });
});

// Create manual shopping list
export const createShoppingList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId, name, items } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Verify user has access to this household
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== householdId) {
    throw new AppError('Access denied to this household', 403);
  }

  const shoppingListId = uuidv4();

  await query(
    'INSERT INTO shopping_lists (id, household_id, meal_plan_id, name, status) VALUES (?, ?, ?, ?, ?)',
    [shoppingListId, householdId, null, name, 'active']
  );

  // Add items if provided
  if (items && items.length > 0) {
    for (const item of items) {
      // Try to find existing ingredient
      const existingIngredients = await query<RowDataPacket[]>(
        'SELECT id, category FROM ingredients WHERE LOWER(name) = LOWER(?)',
        [item.name]
      );

      let ingredientId = null;
      let category = item.category || null;

      if (existingIngredients.length > 0) {
        ingredientId = existingIngredients[0].id;
        category = category || existingIngredients[0].category;
      }

      await query(
        'INSERT INTO shopping_list_items (id, shopping_list_id, ingredient_id, name, quantity, unit, category, is_purchased, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), shoppingListId, ingredientId, item.name, item.quantity, item.unit, category, false, item.notes || null]
      );
    }
  }

  res.status(201).json({
    success: true,
    shoppingList: {
      id: shoppingListId,
      householdId,
      name,
      itemCount: items?.length || 0,
    },
  });
});

// Get shopping lists for household
export const getShoppingLists = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const { status } = req.query;
  const userId = req.user?.id;

  // Verify user has access to this household
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== householdId) {
    throw new AppError('Access denied to this household', 403);
  }

  let sql = 'SELECT * FROM shopping_lists WHERE household_id = ?';
  const params: any[] = [householdId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const lists = await query<ShoppingList[]>(sql, params);

  // Get item counts for each list
  const listsWithCounts = await Promise.all(
    lists.map(async (list) => {
      const items = await query<RowDataPacket[]>(
        'SELECT COUNT(*) as total, SUM(is_purchased) as purchased FROM shopping_list_items WHERE shopping_list_id = ?',
        [list.id]
      );

      return {
        ...list,
        totalItems: items[0]?.total || 0,
        purchasedItems: items[0]?.purchased || 0,
      };
    })
  );

  res.json({
    success: true,
    count: listsWithCounts.length,
    shoppingLists: listsWithCounts,
  });
});

// Get single shopping list with items
export const getShoppingList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shoppingListId } = req.params;
  const userId = req.user?.id;

  const lists = await query<ShoppingList[]>('SELECT * FROM shopping_lists WHERE id = ?', [shoppingListId]);

  if (lists.length === 0) {
    throw new AppError('Shopping list not found', 404);
  }

  const list = lists[0];

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== list.household_id) {
    throw new AppError('Access denied to this shopping list', 403);
  }

  // Get items
  const items = await query<ShoppingListItem[]>(
    'SELECT * FROM shopping_list_items WHERE shopping_list_id = ? ORDER BY category, name',
    [shoppingListId]
  );

  // Group items by category
  const groupedItems: { [key: string]: ShoppingListItem[] } = {};
  items.forEach((item) => {
    const category = item.category || 'Uncategorized';
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });

  res.json({
    success: true,
    shoppingList: {
      ...list,
      items,
      groupedItems,
      totalItems: items.length,
      purchasedItems: items.filter((item) => item.is_purchased).length,
    },
  });
});

// Update shopping list
export const updateShoppingList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shoppingListId } = req.params;
  const { name, status } = req.body;
  const userId = req.user?.id;

  const lists = await query<ShoppingList[]>('SELECT * FROM shopping_lists WHERE id = ?', [shoppingListId]);

  if (lists.length === 0) {
    throw new AppError('Shopping list not found', 404);
  }

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== lists[0].household_id) {
    throw new AppError('Access denied to this shopping list', 403);
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);

    if (status === 'completed') {
      updates.push('completed_at = NOW()');
    }
  }

  if (updates.length > 0) {
    params.push(shoppingListId);
    await query(`UPDATE shopping_lists SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  res.json({
    success: true,
    message: 'Shopping list updated successfully',
  });
});

// Delete shopping list
export const deleteShoppingList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shoppingListId } = req.params;
  const userId = req.user?.id;

  const lists = await query<ShoppingList[]>('SELECT * FROM shopping_lists WHERE id = ?', [shoppingListId]);

  if (lists.length === 0) {
    throw new AppError('Shopping list not found', 404);
  }

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== lists[0].household_id) {
    throw new AppError('Access denied to this shopping list', 403);
  }

  await query('DELETE FROM shopping_lists WHERE id = ?', [shoppingListId]);

  res.json({
    success: true,
    message: 'Shopping list deleted successfully',
  });
});

// Add item to shopping list
export const addItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shoppingListId } = req.params;
  const { name, quantity, unit, category, notes } = req.body;
  const userId = req.user?.id;

  const lists = await query<ShoppingList[]>('SELECT * FROM shopping_lists WHERE id = ?', [shoppingListId]);

  if (lists.length === 0) {
    throw new AppError('Shopping list not found', 404);
  }

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== lists[0].household_id) {
    throw new AppError('Access denied to this shopping list', 403);
  }

  // Try to find existing ingredient
  const existingIngredients = await query<RowDataPacket[]>(
    'SELECT id, category FROM ingredients WHERE LOWER(name) = LOWER(?)',
    [name]
  );

  let ingredientId = null;
  let finalCategory = category || null;

  if (existingIngredients.length > 0) {
    ingredientId = existingIngredients[0].id;
    finalCategory = finalCategory || existingIngredients[0].category;
  }

  const itemId = uuidv4();

  await query(
    'INSERT INTO shopping_list_items (id, shopping_list_id, ingredient_id, name, quantity, unit, category, is_purchased, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [itemId, shoppingListId, ingredientId, name, quantity, unit, finalCategory, false, notes || null]
  );

  res.status(201).json({
    success: true,
    item: {
      id: itemId,
      name,
      quantity,
      unit,
      category: finalCategory,
      is_purchased: false,
    },
  });
});

// Update item
export const updateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemId } = req.params;
  const { name, quantity, unit, category, is_purchased, notes } = req.body;
  const userId = req.user?.id;

  const items = await query<RowDataPacket[]>('SELECT sli.*, sl.household_id FROM shopping_list_items sli JOIN shopping_lists sl ON sli.shopping_list_id = sl.id WHERE sli.id = ?', [itemId]);

  if (items.length === 0) {
    throw new AppError('Item not found', 404);
  }

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== items[0].household_id) {
    throw new AppError('Access denied to this item', 403);
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }

  if (quantity !== undefined) {
    updates.push('quantity = ?');
    params.push(quantity);
  }

  if (unit !== undefined) {
    updates.push('unit = ?');
    params.push(unit);
  }

  if (category !== undefined) {
    updates.push('category = ?');
    params.push(category);
  }

  if (is_purchased !== undefined) {
    updates.push('is_purchased = ?');
    params.push(is_purchased);
  }

  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }

  if (updates.length > 0) {
    params.push(itemId);
    await query(`UPDATE shopping_list_items SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  res.json({
    success: true,
    message: 'Item updated successfully',
  });
});

// Delete item
export const deleteItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemId } = req.params;
  const userId = req.user?.id;

  const items = await query<RowDataPacket[]>(
    'SELECT sli.*, sl.household_id FROM shopping_list_items sli JOIN shopping_lists sl ON sli.shopping_list_id = sl.id WHERE sli.id = ?',
    [itemId]
  );

  if (items.length === 0) {
    throw new AppError('Item not found', 404);
  }

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== items[0].household_id) {
    throw new AppError('Access denied to this item', 403);
  }

  await query('DELETE FROM shopping_list_items WHERE id = ?', [itemId]);

  res.json({
    success: true,
    message: 'Item deleted successfully',
  });
});

// Toggle item purchased status
export const toggleItemPurchased = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemId } = req.params;
  const userId = req.user?.id;

  const items = await query<ShoppingListItem[]>(
    'SELECT sli.*, sl.household_id FROM shopping_list_items sli JOIN shopping_lists sl ON sli.shopping_list_id = sl.id WHERE sli.id = ?',
    [itemId]
  );

  if (items.length === 0) {
    throw new AppError('Item not found', 404);
  }

  // Verify user has access
  const userHousehold = await query<RowDataPacket[]>('SELECT household_id FROM users WHERE id = ?', [userId]);

  if (userHousehold[0]?.household_id !== items[0].household_id) {
    throw new AppError('Access denied to this item', 403);
  }

  const newStatus = !items[0].is_purchased;

  await query('UPDATE shopping_list_items SET is_purchased = ? WHERE id = ?', [newStatus, itemId]);

  res.json({
    success: true,
    is_purchased: newStatus,
  });
});
