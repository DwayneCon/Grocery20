/**
 * Tests for recipeHelper module.
 *
 * The ingredient parsing functions (parseIngredient, parseIngredientString,
 * parseQuantity, normalizeUnit, cleanIngredientName) are private, so we
 * exercise them through the exported saveAIGeneratedRecipe function while
 * mocking the database layer and logger.
 */

import { saveAIGeneratedRecipe, AIGeneratedMeal } from '../recipeHelper';

// ---- mocks ----

// Mock the database module so no real DB calls are made.
const mockQuery = jest.fn();
jest.mock('../../../config/database', () => ({
  query: (...args: any[]) => mockQuery(...args),
}));

// Mock the logger to silence output and allow assertions.
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the recipeValidator since it is imported by recipeHelper.
jest.mock('../../../utils/recipeValidator', () => ({
  validateRecipe: jest.fn().mockReturnValue({
    isValid: true,
    missingCategories: [],
    warnings: [],
    score: 100,
  }),
  getValidationMessage: jest.fn().mockReturnValue('OK'),
}));

// Mock uuid to return predictable IDs.
let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: () => `mock-uuid-${++uuidCounter}`,
}));

beforeEach(() => {
  jest.clearAllMocks();
  uuidCounter = 0;

  // Default: no existing ingredient found, so a new one will be created.
  mockQuery.mockResolvedValue([]);
});

// Helper to build a minimal valid meal.
function makeMeal(overrides: Partial<AIGeneratedMeal> = {}): AIGeneratedMeal {
  return {
    name: 'Test Recipe',
    ingredients: [],
    instructions: ['Step 1'],
    servings: 4,
    ...overrides,
  };
}

describe('saveAIGeneratedRecipe', () => {
  // ---- String ingredient parsing ----

  describe('string ingredient formats', () => {
    it('should parse "2 cups flour" (quantity + unit + name)', async () => {
      const meal = makeMeal({
        ingredients: [
          // The type expects objects, but parseIngredient handles any/string
          '2 cups flour' as any,
        ],
      });

      await saveAIGeneratedRecipe(meal, 'user-1');

      // First call: INSERT recipe, second: SELECT ingredient, third: INSERT ingredient, fourth: INSERT recipe_ingredients
      const recipeIngredientInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );

      expect(recipeIngredientInsert).toBeDefined();
      const params = recipeIngredientInsert![1];
      // params: [recipeId, ingredientId, quantity, unit]
      expect(params[2]).toBe(2);     // quantity
      expect(params[3]).toBe('cup');  // unit normalized from "cups"
    });

    it('should parse "3 eggs" (quantity + name, no unit)', async () => {
      const meal = makeMeal({
        ingredients: ['3 eggs' as any],
      });

      await saveAIGeneratedRecipe(meal, 'user-1');

      const recipeIngredientInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );

      expect(recipeIngredientInsert).toBeDefined();
      const params = recipeIngredientInsert![1];
      expect(params[2]).toBe(3);      // quantity
      expect(params[3]).toBe('unit'); // default unit when none specified
    });

    it('should parse "Salt to taste" (name only with modifier)', async () => {
      const meal = makeMeal({
        ingredients: ['Salt to taste' as any],
      });

      await saveAIGeneratedRecipe(meal, 'user-1');

      // The ingredient should be inserted into the ingredients table
      const ingredientInsert = mockQuery.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('INSERT INTO ingredients') &&
          call[1] &&
          typeof call[1][1] === 'string' &&
          call[1][1].toLowerCase().includes('salt')
      );

      expect(ingredientInsert).toBeDefined();
    });

    it('should parse fractions like "1/2 cup milk"', async () => {
      const meal = makeMeal({
        ingredients: ['1/2 cup milk' as any],
      });

      await saveAIGeneratedRecipe(meal, 'user-1');

      const recipeIngredientInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );

      expect(recipeIngredientInsert).toBeDefined();
      const params = recipeIngredientInsert![1];
      expect(params[2]).toBe(0.5);    // quantity: 1/2
      expect(params[3]).toBe('cup');  // unit
    });
  });

  // ---- Object ingredient parsing ----

  describe('object ingredient formats', () => {
    it('should handle a well-formed ingredient object', async () => {
      const meal = makeMeal({
        ingredients: [
          { name: 'Chicken Breast', amount: '2', unit: 'pounds', category: 'Protein' },
        ],
      });

      await saveAIGeneratedRecipe(meal, 'user-1');

      const recipeIngredientInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );

      expect(recipeIngredientInsert).toBeDefined();
      const params = recipeIngredientInsert![1];
      expect(params[2]).toBe(2);     // quantity parsed from '2'
      expect(params[3]).toBe('lb');  // 'pounds' normalized to 'lb'
    });

    it('should handle amount as a number', async () => {
      const meal = makeMeal({
        ingredients: [
          { name: 'Olive Oil', amount: '3', unit: 'tablespoons' } as any,
        ],
      });

      await saveAIGeneratedRecipe(meal, 'user-1');

      const recipeIngredientInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );

      expect(recipeIngredientInsert).toBeDefined();
      const params = recipeIngredientInsert![1];
      expect(params[2]).toBe(3);       // quantity
      expect(params[3]).toBe('tbsp');  // 'tablespoons' normalized to 'tbsp'
    });

    it('should handle "to taste" as amount by setting quantity to 1', async () => {
      const meal = makeMeal({
        ingredients: [
          { name: 'Salt', amount: 'to taste', unit: 'pinch' },
        ],
      });

      await saveAIGeneratedRecipe(meal, 'user-1');

      const recipeIngredientInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );

      expect(recipeIngredientInsert).toBeDefined();
      const params = recipeIngredientInsert![1];
      // When amount is "to taste", it becomes the unit, and quantity defaults to 1
      expect(params[2]).toBe(1);
    });

    it('should handle missing unit by defaulting to "unit"', async () => {
      const meal = makeMeal({
        ingredients: [
          { name: 'Garlic Cloves', amount: '4', unit: '' },
        ],
      });

      await saveAIGeneratedRecipe(meal, 'user-1');

      const recipeIngredientInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );

      expect(recipeIngredientInsert).toBeDefined();
      const params = recipeIngredientInsert![1];
      expect(params[2]).toBe(4);
      expect(params[3]).toBe('unit'); // empty string defaults to 'unit'
    });

    it('should skip an ingredient object with a very short name (< 2 chars)', async () => {
      const { logger } = require('../../../utils/logger');

      const meal = makeMeal({
        ingredients: [
          { name: 'X', amount: '1', unit: 'cup' },
        ],
      });

      await saveAIGeneratedRecipe(meal, 'user-1');

      // The recipe_ingredients INSERT should NOT be called for this ingredient
      const recipeIngredientInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );

      expect(recipeIngredientInsert).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  // ---- Empty arrays ----

  describe('empty ingredient arrays', () => {
    it('should handle an empty ingredients array without errors', async () => {
      const meal = makeMeal({ ingredients: [] });

      const recipeId = await saveAIGeneratedRecipe(meal, 'user-1');

      expect(recipeId).toBeDefined();
      expect(typeof recipeId).toBe('string');

      // Only the recipe INSERT should be called, no ingredient queries
      const ingredientInserts = mockQuery.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );
      expect(ingredientInserts).toHaveLength(0);
    });

    it('should still insert the recipe record when ingredients are empty', async () => {
      const meal = makeMeal({ ingredients: [] });

      await saveAIGeneratedRecipe(meal, 'user-1');

      const recipeInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO recipes')
      );

      expect(recipeInsert).toBeDefined();
      const params = recipeInsert![1];
      expect(params[1]).toBe('Test Recipe'); // name
      expect(params[5]).toBe(4);             // servings
    });

    it('should handle undefined ingredients gracefully', async () => {
      const meal = makeMeal({ ingredients: undefined as any });

      const recipeId = await saveAIGeneratedRecipe(meal, 'user-1');

      expect(recipeId).toBeDefined();

      const ingredientInserts = mockQuery.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );
      expect(ingredientInserts).toHaveLength(0);
    });
  });

  // ---- Unit normalization ----

  describe('unit normalization', () => {
    it.each([
      ['tablespoons', 'tbsp'],
      ['teaspoons', 'tsp'],
      ['ounces', 'oz'],
      ['pounds', 'lb'],
      ['grams', 'g'],
      ['cups', 'cup'],
    ])('should normalize "%s" to "%s"', async (input, expected) => {
      const meal = makeMeal({
        ingredients: [{ name: 'Ingredient', amount: '1', unit: input }],
      });

      await saveAIGeneratedRecipe(meal, 'user-1');

      const recipeIngredientInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );

      expect(recipeIngredientInsert).toBeDefined();
      const params = recipeIngredientInsert![1];
      expect(params[3]).toBe(expected);
    });
  });

  // ---- Recipe record defaults ----

  describe('recipe record defaults', () => {
    it('should default name to "Untitled Recipe" when name is empty', async () => {
      const meal = makeMeal({ name: '' });

      await saveAIGeneratedRecipe(meal, 'user-1');

      const recipeInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO recipes')
      );

      expect(recipeInsert).toBeDefined();
      const params = recipeInsert![1];
      expect(params[1]).toBe('Untitled Recipe');
    });

    it('should default difficulty to "medium"', async () => {
      const meal = makeMeal({});

      await saveAIGeneratedRecipe(meal, 'user-1');

      const recipeInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO recipes')
      );

      expect(recipeInsert).toBeDefined();
      const params = recipeInsert![1];
      expect(params[6]).toBe('medium'); // difficulty
    });

    it('should default servings to 4', async () => {
      const meal = makeMeal({ servings: undefined as any });

      await saveAIGeneratedRecipe(meal, 'user-1');

      const recipeInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO recipes')
      );

      expect(recipeInsert).toBeDefined();
      const params = recipeInsert![1];
      expect(params[5]).toBe(4); // servings defaults to 4
    });
  });

  // ---- Existing ingredient re-use ----

  describe('ingredient re-use', () => {
    it('should re-use an existing ingredient instead of creating a new one', async () => {
      // First SELECT returns an existing ingredient
      mockQuery
        .mockResolvedValueOnce([]) // recipe INSERT (returns empty, that's fine)
        .mockResolvedValueOnce([{ id: 'existing-ingredient-id' }]) // SELECT ingredient
        .mockResolvedValueOnce([]); // INSERT recipe_ingredients

      const meal = makeMeal({
        ingredients: [{ name: 'Flour', amount: '2', unit: 'cups' }],
      });

      await saveAIGeneratedRecipe(meal, 'user-1');

      // Should NOT have an INSERT INTO ingredients call (only SELECT)
      const ingredientInsertCalls = mockQuery.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO ingredients')
      );
      expect(ingredientInsertCalls).toHaveLength(0);

      // recipe_ingredients should reference the existing ID
      const recipeIngredientInsert = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('recipe_ingredients')
      );
      expect(recipeIngredientInsert).toBeDefined();
      expect(recipeIngredientInsert![1][1]).toBe('existing-ingredient-id');
    });
  });
});
