import { Response } from 'express';
import { AuthRequest } from '../../types/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';

/**
 * Create or update budget tracking for a week
 * POST /api/budget
 */
export const createBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId, weekStart, weekEnd, budgetAllocated, notes } = req.body;
  const userId = req.user!.id;

  try {
    // Verify user belongs to household
    const userCheck: any[] = await query(
      'SELECT household_id FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0 || userCheck[0].household_id !== householdId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this household',
      });
    }

    // Check if budget already exists for this week
    const existing: any[] = await query(
      'SELECT id FROM budget_tracking WHERE household_id = ? AND week_start = ?',
      [householdId, weekStart]
    );

    if (existing.length > 0) {
      // Update existing budget
      await query(
        `UPDATE budget_tracking
         SET budget_allocated = ?, week_end = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [budgetAllocated, weekEnd, notes || null, existing[0].id]
      );

      return res.json({
        success: true,
        message: 'Budget updated successfully',
        budgetId: existing[0].id,
      });
    } else {
      // Create new budget
      const budgetId = uuidv4();
      await query(
        `INSERT INTO budget_tracking
         (id, household_id, week_start, week_end, budget_allocated, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [budgetId, householdId, weekStart, weekEnd, budgetAllocated, notes || null]
      );

      return res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        budgetId,
      });
    }
  } catch (error) {
    console.error('Error creating/updating budget:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create/update budget',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get budget tracking for household
 * GET /api/budget/household/:householdId
 */
export const getHouseholdBudgets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const { limit = 10, offset = 0 } = req.query;
  const userId = req.user!.id;

  try {
    // Verify user belongs to household
    const userCheck: any[] = await query(
      'SELECT household_id FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0 || userCheck[0].household_id !== householdId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this household',
      });
    }

    // Get budget records
    const limitNum = parseInt(limit as string, 10) || 10;
    const offsetNum = parseInt(offset as string, 10) || 0;

    const budgets: any[] = await query(
      `SELECT
        id,
        week_start as weekStart,
        week_end as weekEnd,
        budget_allocated as budgetAllocated,
        amount_spent as amountSpent,
        amount_saved as amountSaved,
        deals_used as dealsUsed,
        notes,
        created_at as createdAt,
        updated_at as updatedAt,
        (budget_allocated - amount_spent) as remaining,
        ROUND((amount_spent / budget_allocated) * 100, 2) as percentageUsed
      FROM budget_tracking
      WHERE household_id = ?
      ORDER BY week_start DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}`,
      [householdId]
    );

    return res.json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    console.error('Error getting household budgets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get household budgets',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get current week's budget for household
 * GET /api/budget/household/:householdId/current
 */
export const getCurrentBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify user belongs to household
    const userCheck: any[] = await query(
      'SELECT household_id FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0 || userCheck[0].household_id !== householdId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this household',
      });
    }

    // Get current week's budget
    const today = new Date();
    const budgets: any[] = await query(
      `SELECT
        id,
        week_start as weekStart,
        week_end as weekEnd,
        budget_allocated as budgetAllocated,
        amount_spent as amountSpent,
        amount_saved as amountSaved,
        deals_used as dealsUsed,
        notes,
        created_at as createdAt,
        updated_at as updatedAt,
        (budget_allocated - amount_spent) as remaining,
        ROUND((amount_spent / budget_allocated) * 100, 2) as percentageUsed
      FROM budget_tracking
      WHERE household_id = ?
        AND week_start <= CURDATE()
        AND week_end >= CURDATE()
      LIMIT 1`,
      [householdId]
    );

    if (budgets.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No budget set for current week',
      });
    }

    return res.json({
      success: true,
      data: budgets[0],
    });
  } catch (error) {
    console.error('Error getting current budget:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get current budget',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Update spending for a budget
 * PATCH /api/budget/:budgetId/spending
 */
export const updateSpending = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { budgetId } = req.params;
  const { amountSpent, amountSaved, dealsUsed } = req.body;
  const userId = req.user!.id;

  try {
    // Get budget and verify user has access
    const budgets: any[] = await query(
      `SELECT bt.household_id
       FROM budget_tracking bt
       JOIN household_members hm ON bt.household_id = hm.household_id
       WHERE bt.id = ? AND hm.user_id = ?`,
      [budgetId, userId]
    );

    if (budgets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found or access denied',
      });
    }

    // Update spending
    await query(
      `UPDATE budget_tracking
       SET amount_spent = COALESCE(?, amount_spent),
           amount_saved = COALESCE(?, amount_saved),
           deals_used = COALESCE(?, deals_used),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [amountSpent, amountSaved, dealsUsed, budgetId]
    );

    // Get updated budget
    const updated: any[] = await query(
      `SELECT
        id,
        week_start as weekStart,
        week_end as weekEnd,
        budget_allocated as budgetAllocated,
        amount_spent as amountSpent,
        amount_saved as amountSaved,
        deals_used as dealsUsed,
        notes,
        (budget_allocated - amount_spent) as remaining,
        ROUND((amount_spent / budget_allocated) * 100, 2) as percentageUsed
      FROM budget_tracking
      WHERE id = ?`,
      [budgetId]
    );

    return res.json({
      success: true,
      message: 'Spending updated successfully',
      data: updated[0],
    });
  } catch (error) {
    console.error('Error updating spending:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update spending',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get budget statistics for household
 * GET /api/budget/household/:householdId/stats
 */
export const getBudgetStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const { months = 3 } = req.query;
  const userId = req.user!.id;

  try {
    // Verify user belongs to household
    const userCheck: any[] = await query(
      'SELECT household_id FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0 || userCheck[0].household_id !== householdId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this household',
      });
    }

    // Get statistics for the last X months
    const monthsNum = parseInt(months as string, 10) || 3;

    const stats: any[] = await query(
      `SELECT
        COUNT(*) as totalWeeks,
        SUM(budget_allocated) as totalAllocated,
        SUM(amount_spent) as totalSpent,
        SUM(amount_saved) as totalSaved,
        SUM(deals_used) as totalDeals,
        AVG(budget_allocated) as avgBudget,
        AVG(amount_spent) as avgSpent,
        AVG(amount_saved) as avgSaved,
        AVG((amount_spent / budget_allocated) * 100) as avgPercentageUsed,
        MIN(week_start) as oldestWeek,
        MAX(week_start) as newestWeek
      FROM budget_tracking
      WHERE household_id = ?
        AND week_start >= DATE_SUB(CURDATE(), INTERVAL ${monthsNum} MONTH)`,
      [householdId]
    );

    // Get weekly breakdown
    const weeklyBreakdown: any[] = await query(
      `SELECT
        week_start as weekStart,
        budget_allocated as budgetAllocated,
        amount_spent as amountSpent,
        amount_saved as amountSaved,
        deals_used as dealsUsed,
        (budget_allocated - amount_spent) as remaining,
        ROUND((amount_spent / budget_allocated) * 100, 2) as percentageUsed
      FROM budget_tracking
      WHERE household_id = ?
        AND week_start >= DATE_SUB(CURDATE(), INTERVAL ${monthsNum} MONTH)
      ORDER BY week_start DESC`,
      [householdId]
    );

    return res.json({
      success: true,
      data: {
        summary: {
          totalWeeks: stats[0]?.totalWeeks || 0,
          totalAllocated: parseFloat(stats[0]?.totalAllocated || 0),
          totalSpent: parseFloat(stats[0]?.totalSpent || 0),
          totalSaved: parseFloat(stats[0]?.totalSaved || 0),
          totalDeals: stats[0]?.totalDeals || 0,
          avgBudget: parseFloat(stats[0]?.avgBudget || 0),
          avgSpent: parseFloat(stats[0]?.avgSpent || 0),
          avgSaved: parseFloat(stats[0]?.avgSaved || 0),
          avgPercentageUsed: parseFloat(stats[0]?.avgPercentageUsed || 0),
          periodStart: stats[0]?.oldestWeek || null,
          periodEnd: stats[0]?.newestWeek || null,
        },
        weeklyBreakdown,
      },
    });
  } catch (error) {
    console.error('Error getting budget stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get budget statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete a budget record
 * DELETE /api/budget/:budgetId
 */
export const deleteBudget = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { budgetId } = req.params;
  const userId = req.user!.id;

  try {
    // Verify user has access
    const budgets: any[] = await query(
      `SELECT bt.household_id
       FROM budget_tracking bt
       JOIN household_members hm ON bt.household_id = hm.household_id
       WHERE bt.id = ? AND hm.user_id = ? AND hm.role IN ('admin', 'owner')`,
      [budgetId, userId]
    );

    if (budgets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found or insufficient permissions',
      });
    }

    // Delete budget
    await query('DELETE FROM budget_tracking WHERE id = ?', [budgetId]);

    return res.json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete budget',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
