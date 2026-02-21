import { Response } from 'express';
import { AuthRequest } from '../../types/auth.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

interface Suggestion {
  id: string;
  type: 'deal' | 'expiring' | 'reorder' | 'timing' | 'tip';
  title: string;
  message: string;
  actionType: 'chat' | 'shopping' | 'inventory' | 'meal-plan';
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

/**
 * Get proactive suggestions for a household
 * GET /api/suggestions/:householdId
 */
export const getSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const suggestions: Suggestion[] = [];

  try {
    // 1. Check for expiring inventory items (high priority)
    const expiringItems: any[] = await query(
      `SELECT name, expiration_date, DATEDIFF(expiration_date, NOW()) as days_left
       FROM inventory
       WHERE household_id = ? AND expiration_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
       ORDER BY expiration_date ASC LIMIT 5`,
      [householdId]
    );

    for (const item of expiringItems) {
      suggestions.push({
        id: `expiring-${item.name}`,
        type: 'expiring',
        title: 'Expiring Soon',
        message: `Your ${item.name} expires in ${item.days_left} day${item.days_left !== 1 ? 's' : ''}. Ask Nora for recipes to use it up!`,
        actionType: 'chat',
        priority: item.days_left <= 1 ? 'high' : 'medium',
        icon: '⚠️',
      });
    }

    // 2. Check for meal plan gaps (medium priority)
    const currentPlan: any[] = await query(
      `SELECT mp.id, COUNT(m.id) as meal_count
       FROM meal_plans mp
       LEFT JOIN meals m ON m.meal_plan_id = mp.id
       WHERE mp.household_id = ? AND mp.start_date <= CURDATE() AND mp.end_date >= CURDATE()
       GROUP BY mp.id LIMIT 1`,
      [householdId]
    );

    if (currentPlan.length === 0) {
      suggestions.push({
        id: 'no-plan',
        type: 'tip',
        title: 'No Meal Plan',
        message: "You don't have a meal plan for this week. Chat with Nora to create one!",
        actionType: 'chat',
        priority: 'high',
        icon: '📋',
      });
    } else if (currentPlan[0].meal_count < 14) {
      suggestions.push({
        id: 'incomplete-plan',
        type: 'tip',
        title: 'Incomplete Plan',
        message: `Your meal plan only has ${currentPlan[0].meal_count} meals. Ask Nora to fill in the gaps!`,
        actionType: 'chat',
        priority: 'medium',
        icon: '📝',
      });
    }

    // 3. Check shopping list status (medium priority)
    const shoppingStatus: any[] = await query(
      `SELECT sl.id, COUNT(sli.id) as total_items,
       SUM(CASE WHEN sli.is_checked = 1 THEN 1 ELSE 0 END) as checked_items
       FROM shopping_lists sl
       LEFT JOIN shopping_list_items sli ON sli.shopping_list_id = sl.id
       WHERE sl.household_id = ? AND sl.status IN ('pending', 'shopping')
       GROUP BY sl.id LIMIT 1`,
      [householdId]
    );

    if (shoppingStatus.length > 0 && shoppingStatus[0].total_items > 0) {
      const remaining = shoppingStatus[0].total_items - shoppingStatus[0].checked_items;
      if (remaining > 0) {
        suggestions.push({
          id: 'shopping-remaining',
          type: 'tip',
          title: 'Shopping List',
          message: `You have ${remaining} item${remaining !== 1 ? 's' : ''} left on your shopping list.`,
          actionType: 'shopping',
          priority: 'low',
          icon: '🛒',
        });
      }
    }

    // 4. Time-based cooking reminder (check current hour)
    const hour = new Date().getHours();
    if (hour >= 15 && hour <= 17) {
      // Between 3-5 PM, suggest starting dinner prep
      const tonightsMeal: any[] = await query(
        `SELECT m.name, m.prep_time FROM meals m
         JOIN meal_plans mp ON m.meal_plan_id = mp.id
         WHERE mp.household_id = ? AND m.date = CURDATE() AND m.meal_type = 'dinner'
         LIMIT 1`,
        [householdId]
      );

      if (tonightsMeal.length > 0) {
        suggestions.push({
          id: 'dinner-reminder',
          type: 'timing',
          title: 'Dinner Time',
          message: `Tonight's dinner is ${tonightsMeal[0].name} (${tonightsMeal[0].prep_time || 30} min prep). Time to start!`,
          actionType: 'meal-plan',
          priority: 'medium',
          icon: '⏰',
        });
      }
    }

    // Sort by priority
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    res.json({ suggestions });
  } catch (error) {
    logger.error('Failed to fetch suggestions', error as Error, {
      metadata: { householdId },
    });
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});
