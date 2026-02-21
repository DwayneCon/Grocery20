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
    email: 'mealplan@example.com',
    name: 'Meal Plan Tester',
  });
  const householdId = await seedTestHousehold(userId, { name: 'Plan Household' });

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

describe('Meal plan API integration', () => {
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
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post('/api/meal-plans').send({});

      expect(res.status).toBe(401);
    });

    it('returns 403 when an invalid token is provided', async () => {
      const res = await request(app)
        .post('/api/meal-plans')
        .set('Authorization', 'Bearer bad.token.here')
        .send({});

      expect(res.status).toBe(403);
    });
  });

  // ---- Create meal plan ----

  describe('POST /api/meal-plans', () => {
    it('creates a new meal plan for a household', async () => {
      const { accessToken, householdId } = await bootstrapUserWithHousehold();
      const { weekStart, weekEnd } = weekRange();

      const res = await request(app)
        .post('/api/meal-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ householdId, weekStart, weekEnd, budget: 150 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.mealPlan).toBeDefined();
      expect(res.body.mealPlan.id).toBeTruthy();
      expect(res.body.mealPlan.householdId).toBe(householdId);
    });
  });

  // ---- Get meal plans for household ----

  describe('GET /api/meal-plans/household/:householdId', () => {
    it('returns meal plans for a household', async () => {
      const { accessToken, householdId } = await bootstrapUserWithHousehold();
      const { weekStart, weekEnd } = weekRange();

      // Create two meal plans
      await request(app)
        .post('/api/meal-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ householdId, weekStart, weekEnd });

      const nextWeekStart = new Date();
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);

      await request(app)
        .post('/api/meal-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          householdId,
          weekStart: nextWeekStart.toISOString().split('T')[0],
          weekEnd: nextWeekEnd.toISOString().split('T')[0],
        });

      const res = await request(app)
        .get(`/api/meal-plans/household/${householdId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
    });
  });

  // ---- Get current week plan ----

  describe('GET /api/meal-plans/household/:householdId/current', () => {
    it('returns a meal plan with recipe details when fetched by ID', async () => {
      const { accessToken, householdId } = await bootstrapUserWithHousehold();

      // Seed a recipe with an ingredient
      const recipeId = uuidv4();
      const ingredientId = uuidv4();

      await query(
        'INSERT INTO recipes (id, name, description, prep_time, cook_time, servings, difficulty, nutrition) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [recipeId, 'Test Pasta', 'Simple pasta', 10, 15, 2, 'easy', JSON.stringify({ calories: 450 })]
      );

      await query(
        'INSERT INTO ingredients (id, name, category, unit) VALUES (?, ?, ?, ?)',
        [ingredientId, 'Pasta', 'Pantry', 'oz']
      );

      await query(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES (?, ?, ?, ?)',
        [recipeId, ingredientId, 8, 'oz']
      );

      // Create a meal plan via the API
      const { weekStart, weekEnd } = weekRange();

      const createPlanRes = await request(app)
        .post('/api/meal-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ householdId, weekStart, weekEnd, budget: 150 });

      expect(createPlanRes.status).toBe(201);
      const mealPlanId = createPlanRes.body.mealPlan.id as string;

      // Add a meal via the API
      const addMealRes = await request(app)
        .post(`/api/meal-plans/${mealPlanId}/meals`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ recipeId, dayOfWeek: 1, mealType: 'dinner', servings: 2 });

      expect(addMealRes.status).toBe(201);

      // Fetch the meal plan by ID (GET /api/meal-plans/:mealPlanId)
      const planRes = await request(app)
        .get(`/api/meal-plans/${mealPlanId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(planRes.status).toBe(200);
      expect(planRes.body.mealPlan).toBeDefined();
      expect(planRes.body.mealPlan.totalMeals).toBe(1);

      const meal = planRes.body.mealPlan.meals[0];
      expect(meal.recipe_name).toBe('Test Pasta');
      expect(meal.meal_type).toBe('dinner');
    });

    it('returns null mealPlan when no plan exists for the current week', async () => {
      const { accessToken, householdId } = await bootstrapUserWithHousehold();

      const res = await request(app)
        .get(`/api/meal-plans/household/${householdId}/current`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.mealPlan).toBeNull();
    });
  });

  // ---- Add meal to plan ----

  describe('POST /api/meal-plans/:mealPlanId/meals', () => {
    it('adds a meal to an existing plan', async () => {
      const { accessToken, householdId } = await bootstrapUserWithHousehold();
      const { weekStart, weekEnd } = weekRange();

      const createRes = await request(app)
        .post('/api/meal-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ householdId, weekStart, weekEnd });

      const mealPlanId = createRes.body.mealPlan.id;

      const addMealRes = await request(app)
        .post(`/api/meal-plans/${mealPlanId}/meals`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ dayOfWeek: 2, mealType: 'lunch', servings: 3 });

      expect(addMealRes.status).toBe(201);
      expect(addMealRes.body.success).toBe(true);
      expect(addMealRes.body.meal).toBeDefined();
    });
  });

  // ---- Delete meal plan ----

  describe('DELETE /api/meal-plans/:mealPlanId', () => {
    it('deletes an existing meal plan', async () => {
      const { accessToken, householdId } = await bootstrapUserWithHousehold();
      const { weekStart, weekEnd } = weekRange();

      const createRes = await request(app)
        .post('/api/meal-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ householdId, weekStart, weekEnd });

      const mealPlanId = createRes.body.mealPlan.id;

      const deleteRes = await request(app)
        .delete(`/api/meal-plans/${mealPlanId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });
  });
});
