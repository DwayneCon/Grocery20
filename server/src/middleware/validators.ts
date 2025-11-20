import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

// User validation schemas
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Household validation schemas
export const createHouseholdSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  budgetWeekly: Joi.number().positive().optional(),
});

export const addMemberSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  age: Joi.number().integer().min(0).max(150).optional(),
  dietaryRestrictions: Joi.array()
    .items(
      Joi.alternatives().try(
        Joi.string(),
        Joi.object({
          type: Joi.string().valid('allergy', 'intolerance', 'restriction').required(),
          item: Joi.string().required(),
          severity: Joi.number().integer().min(1).max(10).optional(),
        })
      )
    )
    .optional(),
  preferences: Joi.object().optional(),
});

// Meal plan validation schemas
export const createMealPlanSchema = Joi.object({
  householdId: Joi.string().uuid().required(),
  weekStart: Joi.date().required(),
  weekEnd: Joi.date().optional(),
  budget: Joi.number().positive().optional(),
  meals: Joi.array().items(
    Joi.object({
      recipeId: Joi.string().uuid().optional(),
      dayOfWeek: Joi.number().integer().min(0).max(6).required(),
      mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
      servings: Joi.number().integer().min(1).optional(),
      notes: Joi.string().max(500).optional(),
    })
  ).optional(),
});

export const updateMealPlanSchema = Joi.object({
  weekStart: Joi.date().optional(),
  weekEnd: Joi.date().optional(),
  budget: Joi.number().positive().optional(),
  status: Joi.string().valid('active', 'completed', 'archived').optional(),
});

export const addMealSchema = Joi.object({
  recipeId: Joi.string().uuid().optional(),
  dayOfWeek: Joi.number().integer().min(0).max(6).required(),
  mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
  servings: Joi.number().integer().min(1).optional(),
  notes: Joi.string().max(500).optional(),
});

export const updateMealSchema = Joi.object({
  recipeId: Joi.string().uuid().optional(),
  dayOfWeek: Joi.number().integer().min(0).max(6).optional(),
  mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').optional(),
  servings: Joi.number().integer().min(1).optional(),
  notes: Joi.string().max(500).optional(),
});

// AI validation schemas
export const chatSchema = Joi.object({
  message: Joi.string().min(1).max(5000).required(),
  conversationHistory: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant', 'system').required(),
      content: Joi.string().required(),
    })
  ).optional(),
  householdId: Joi.string().uuid().optional(),
});

export const aiMealPlanSchema = Joi.object({
  householdId: Joi.string().uuid().required(),
  days: Joi.number().integer().min(1).max(14).optional(),
  mealsPerDay: Joi.number().integer().min(1).max(5).optional(),
  budget: Joi.number().positive().optional(),
  preferences: Joi.object().optional(),
});

// Recipe validation schemas
export const createRecipeSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).optional(),
  prepTime: Joi.number().integer().min(0).required(),
  cookTime: Joi.number().integer().min(0).required(),
  servings: Joi.number().integer().min(1).required(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  cuisine: Joi.string().max(100).optional(),
  ingredients: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      amount: Joi.number().positive().required(),
      unit: Joi.string().required(),
      notes: Joi.string().optional(),
    })
  ).min(1).required(),
  instructions: Joi.array().items(Joi.string()).min(1).required(),
  nutritionInfo: Joi.object({
    calories: Joi.number().min(0).optional(),
    protein: Joi.number().min(0).optional(),
    carbs: Joi.number().min(0).optional(),
    fat: Joi.number().min(0).optional(),
  }).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  imageUrl: Joi.string().uri().optional(),
});

export const updateRecipeSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  prepTime: Joi.number().integer().min(0).optional(),
  cookTime: Joi.number().integer().min(0).optional(),
  servings: Joi.number().integer().min(1).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  cuisine: Joi.string().max(100).optional(),
  ingredients: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      amount: Joi.number().positive().required(),
      unit: Joi.string().required(),
      notes: Joi.string().optional(),
    })
  ).optional(),
  instructions: Joi.array().items(Joi.string()).optional(),
  nutritionInfo: Joi.object({
    calories: Joi.number().min(0).optional(),
    protein: Joi.number().min(0).optional(),
    carbs: Joi.number().min(0).optional(),
    fat: Joi.number().min(0).optional(),
  }).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  imageUrl: Joi.string().uri().optional(),
});

// Shopping list validation schemas
export const createShoppingListSchema = Joi.object({
  householdId: Joi.string().uuid().required(),
  mealPlanId: Joi.string().uuid().optional(),
  name: Joi.string().min(2).max(200).required(),
  items: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().positive().required(),
      unit: Joi.string().required(),
      category: Joi.string().optional(),
      notes: Joi.string().optional(),
    })
  ).optional(),
});

export const createFromMealPlanSchema = Joi.object({
  mealPlanId: Joi.string().uuid().required(),
  name: Joi.string().min(2).max(200).optional(),
});

export const updateShoppingListSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  status: Joi.string().valid('active', 'completed', 'archived').optional(),
});

export const addItemSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().min(1).max(50).required(),
  category: Joi.string().max(100).optional(),
  notes: Joi.string().max(500).optional(),
});

export const updateItemSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  quantity: Joi.number().positive().optional(),
  unit: Joi.string().min(1).max(50).optional(),
  category: Joi.string().max(100).optional(),
  is_purchased: Joi.boolean().optional(),
  notes: Joi.string().max(500).optional(),
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      throw new AppError(
        JSON.stringify({ validation: errors }),
        400
      );
    }

    next();
  };
};
