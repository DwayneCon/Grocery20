import express from 'express';
import {
  createBudget,
  getHouseholdBudgets,
  getCurrentBudget,
  updateSpending,
  getBudgetStats,
  deleteBudget,
} from './budget.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate, createBudgetSchema, updateSpendingSchema } from '../../middleware/validators.js';

const router = express.Router();

// All budget routes require authentication
router.use(authenticateToken);

// Create or update budget
router.post('/', validate(createBudgetSchema), createBudget);

// Get household budgets
router.get('/household/:householdId', getHouseholdBudgets);

// Get current week's budget
router.get('/household/:householdId/current', getCurrentBudget);

// Get budget statistics
router.get('/household/:householdId/stats', getBudgetStats);

// Update spending
router.patch('/:budgetId/spending', validate(updateSpendingSchema), updateSpending);

// Delete budget
router.delete('/:budgetId', deleteBudget);

export default router;
