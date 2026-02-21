import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../../index.js';
import { query } from '../../config/database.js';
import {
  resetTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
  seedTestUser,
  seedTestHousehold,
} from '../../test/testDb.js';

/** Bootstrap a test user that already has a household */
const bootstrapUserWithHousehold = async () => {
  const { userId, token } = await seedTestUser({
    email: 'shop@example.com',
    name: 'Shop Tester',
  });
  const householdId = await seedTestHousehold(userId, { name: 'Shop Household', budgetWeekly: 140 });
  return { userId, accessToken: token, householdId };
};

/** Current week date range */
const weekRange = () => {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
  };
};

describe('Shopping API integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  // ---- Authentication gate ----

  describe('Authentication', () => {
    it('returns 401 when no token is provided for POST /api/shopping', async () => {
      const res = await request(app).post('/api/shopping').send({});

      expect(res.status).toBe(401);
    });

    it('returns 401 when no token is provided for GET /api/shopping/household/:id', async () => {
      const res = await request(app).get('/api/shopping/household/some-id');

      expect(res.status).toBe(401);
    });
  });

  // ---- Create manual shopping list ----

  describe('POST /api/shopping', () => {
    it('creates a manual shopping list with items', async () => {
      const { accessToken, householdId } = await bootstrapUserWithHousehold();

      const res = await request(app)
        .post('/api/shopping')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          householdId,
          name: 'Weekly Groceries',
          items: [
            { name: 'Milk', quantity: 1, unit: 'gallon' },
            { name: 'Eggs', quantity: 12, unit: 'pcs' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.shoppingList).toBeDefined();
      expect(res.body.shoppingList.name).toBe('Weekly Groceries');
      expect(res.body.shoppingList.itemCount).toBe(2);
    });
  });

  // ---- Get shopping lists ----

  describe('GET /api/shopping/household/:householdId', () => {
    it('returns shopping lists for a household', async () => {
      const { accessToken, householdId } = await bootstrapUserWithHousehold();

      // Create two lists
      await request(app)
        .post('/api/shopping')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ householdId, name: 'List A', items: [] });

      await request(app)
        .post('/api/shopping')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ householdId, name: 'List B', items: [] });

      const res = await request(app)
        .get(`/api/shopping/household/${householdId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ---- Create from meal plan with ingredient consolidation ----

  describe('POST /api/shopping/from-meal-plan', () => {
    it('creates a shopping list from a meal plan and consolidates duplicate ingredients', async () => {
      const { accessToken, householdId } = await bootstrapUserWithHousehold();

      // Set up recipe, ingredient, and duplicate entries
      const recipeId = uuidv4();
      const ingredientId = uuidv4();

      await query(
        'INSERT INTO recipes (id, name, description, prep_time, cook_time, servings, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [recipeId, 'Test Soup', 'Simple soup', 5, 20, 4, 'easy']
      );

      await query(
        'INSERT INTO ingredients (id, name, category, unit) VALUES (?, ?, ?, ?)',
        [ingredientId, 'Tomato', 'Produce', 'pcs']
      );

      // Two rows for the same ingredient -- should consolidate to 5
      await query(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
        [recipeId, ingredientId, 2, 'pcs', recipeId, ingredientId, 3, 'pcs']
      );

      // Create a meal plan and add the meal
      const { weekStart, weekEnd } = weekRange();

      const planRes = await request(app)
        .post('/api/meal-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ householdId, weekStart, weekEnd });

      const mealPlanId = planRes.body.mealPlan.id as string;

      await request(app)
        .post(`/api/meal-plans/${mealPlanId}/meals`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ recipeId, dayOfWeek: 1, mealType: 'dinner', servings: 2 });

      // Generate shopping list from the meal plan
      const shoppingRes = await request(app)
        .post('/api/shopping/from-meal-plan')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ mealPlanId, name: 'Weekly Shop' });

      expect(shoppingRes.status).toBe(201);
      expect(shoppingRes.body.success).toBe(true);

      const shoppingListId = shoppingRes.body.shoppingList.id as string;

      // Fetch the list and verify consolidation
      const listRes = await request(app)
        .get(`/api/shopping/${shoppingListId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.items.length).toBe(1); // consolidated
      expect(Number(listRes.body.data.items[0].quantity)).toBe(5); // 2 + 3
    });
  });

  // ---- Toggle and delete item ----

  describe('Item operations', () => {
    it('toggles an item purchased status and deletes the item', async () => {
      const { accessToken, householdId } = await bootstrapUserWithHousehold();

      // Create a list with one item
      const createRes = await request(app)
        .post('/api/shopping')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          householdId,
          name: 'Toggle Test',
          items: [{ name: 'Bread', quantity: 1, unit: 'loaf' }],
        });

      const shoppingListId = createRes.body.shoppingList.id as string;

      // Fetch items
      const listRes = await request(app)
        .get(`/api/shopping/${shoppingListId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const itemId = listRes.body.data.items[0].id as string;

      // Toggle purchased
      const toggleRes = await request(app)
        .patch(`/api/shopping/items/${itemId}/toggle`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(toggleRes.status).toBe(200);
      expect(toggleRes.body.is_purchased).toBe(true);

      // Delete item
      const deleteRes = await request(app)
        .delete(`/api/shopping/items/${itemId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });
  });

  // ---- Add item to existing list ----

  describe('POST /api/shopping/:shoppingListId/items', () => {
    it('adds an item to an existing shopping list', async () => {
      const { accessToken, householdId } = await bootstrapUserWithHousehold();

      const createRes = await request(app)
        .post('/api/shopping')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ householdId, name: 'Add Item Test', items: [] });

      const shoppingListId = createRes.body.shoppingList.id as string;

      const addRes = await request(app)
        .post(`/api/shopping/${shoppingListId}/items`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Butter', quantity: 1, unit: 'stick' });

      expect(addRes.status).toBe(201);
      expect(addRes.body.success).toBe(true);
      expect(addRes.body.item.name).toBe('Butter');
    });
  });
});
