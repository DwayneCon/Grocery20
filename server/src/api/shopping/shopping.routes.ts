import express from 'express';
import {
  createFromMealPlan,
  createShoppingList,
  getShoppingLists,
  getShoppingList,
  updateShoppingList,
  deleteShoppingList,
  addItem,
  updateItem,
  deleteItem,
  toggleItemPurchased,
} from './shopping.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import {
  validate,
  createShoppingListSchema,
  createFromMealPlanSchema,
  updateShoppingListSchema,
  addItemSchema,
  updateItemSchema,
} from '../../middleware/validators.js';

const router = express.Router();

// All shopping list routes require authentication
router.use(authenticateToken);

// Shopping list management
router.post('/from-meal-plan', validate(createFromMealPlanSchema), createFromMealPlan);
router.post('/', validate(createShoppingListSchema), createShoppingList);
router.get('/household/:householdId', getShoppingLists);
router.get('/:shoppingListId', getShoppingList);
router.put('/:shoppingListId', validate(updateShoppingListSchema), updateShoppingList);
router.delete('/:shoppingListId', deleteShoppingList);

// Shopping list item management
router.post('/:shoppingListId/items', validate(addItemSchema), addItem);
router.put('/items/:itemId', validate(updateItemSchema), updateItem);
router.delete('/items/:itemId', deleteItem);
router.patch('/items/:itemId/toggle', toggleItemPurchased);

export default router;
