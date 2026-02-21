import { query } from '../../config/database.js';
import config from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export const predictiveEngine = {
  /**
   * Generate a suggested weekly meal plan for a household.
   * Called every Sunday at 6 AM by the scheduler.
   *
   * Gathers household preferences, recent meals, expiring inventory,
   * and budget to produce a draft meal plan via OpenAI.
   */
  async generateWeeklyPlan(householdId: string): Promise<void> {
    try {
      // 1. Get household members and their preferences
      const members = await query<any[]>(
        'SELECT name, dietary_restrictions, preferences FROM household_members WHERE household_id = ?',
        [householdId]
      );

      if (!members || members.length === 0) return;

      // 2. Get recent meals (last 14 days) to avoid repetition
      const recentMeals = await query<any[]>(
        `SELECT r.name FROM meals m
         JOIN recipes r ON m.recipe_id = r.id
         JOIN meal_plans mp ON m.meal_plan_id = mp.id
         WHERE mp.household_id = ? AND m.date >= DATE_SUB(NOW(), INTERVAL 14 DAY)`,
        [householdId]
      );
      const recentMealNames = (recentMeals || []).map((m: any) => m.name);

      // 3. Get inventory items expiring within the next 7 days
      const expiringItems = await query<any[]>(
        `SELECT name, quantity, unit, expiration_date FROM inventory
         WHERE household_id = ? AND expiration_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
         ORDER BY expiration_date ASC`,
        [householdId]
      );

      // 4. Get household budget
      const budgets = await query<any[]>(
        'SELECT weekly_budget FROM households WHERE id = ?',
        [householdId]
      );
      const weeklyBudget = budgets?.[0]?.weekly_budget || 150;

      // 5. Build aggregated dietary restrictions list
      const restrictions = members
        .flatMap((m: any) => {
          try {
            return JSON.parse(m.dietary_restrictions || '[]');
          } catch {
            return [];
          }
        });

      // 6. Generate meal plan via OpenAI
      const prompt = `Generate a 7-day meal plan (Monday-Sunday) with breakfast, lunch, and dinner.

Household: ${members.length} members
Dietary restrictions: ${restrictions.length > 0 ? [...new Set(restrictions)].join(', ') : 'None'}
Weekly budget: $${weeklyBudget}
Avoid these recent meals: ${recentMealNames.join(', ') || 'None'}
${(expiringItems && expiringItems.length > 0) ? `Use these expiring ingredients: ${expiringItems.map((i: any) => i.name).join(', ')}` : ''}

Return a JSON object with this structure:
{
  "meals": [
    { "day": "Monday", "type": "breakfast", "name": "Meal Name", "estimatedCost": 5.00, "prepTime": 15 }
  ],
  "estimatedTotalCost": 120,
  "summary": "Brief description of the plan"
}`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        logger.warn(`No AI response for weekly plan generation (household: ${householdId})`);
        return;
      }

      const plan = JSON.parse(content);

      // 7. Save as a draft/suggested meal plan
      const planId = uuidv4();
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));

      const endDate = new Date(nextMonday);
      endDate.setDate(nextMonday.getDate() + 6);

      await query(
        `INSERT INTO meal_plans (id, household_id, name, start_date, end_date, status, budget)
         VALUES (?, ?, ?, ?, ?, 'suggested', ?)`,
        [planId, householdId, `Week of ${nextMonday.toLocaleDateString()}`, nextMonday, endDate, weeklyBudget]
      );

      logger.info(`Generated suggested weekly plan for household ${householdId}: ${plan.summary}`);
    } catch (error) {
      logger.error(`Failed to generate weekly plan for household ${householdId}:`, error);
    }
  },

  /**
   * Check for low stock and expiring items in a household's inventory.
   * Called daily at 8 AM by the scheduler.
   *
   * Currently logs alerts; future Task 28 will add push notifications.
   */
  async checkInventory(householdId: string): Promise<void> {
    try {
      // Find items expiring in the next 3 days
      const expiring = await query<any[]>(
        `SELECT name, expiration_date FROM inventory
         WHERE household_id = ? AND expiration_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)`,
        [householdId]
      );

      if (expiring && expiring.length > 0) {
        logger.info(
          `Household ${householdId} has ${expiring.length} items expiring soon: ${expiring.map((i: any) => i.name).join(', ')}`
        );
        // TODO: Trigger push notifications when implemented (Task 28)
      }

      // Find items with low quantity (quantity <= 1)
      const lowStock = await query<any[]>(
        `SELECT name, quantity, unit FROM inventory
         WHERE household_id = ? AND quantity <= 1 AND quantity > 0`,
        [householdId]
      );

      if (lowStock && lowStock.length > 0) {
        logger.info(
          `Household ${householdId} has ${lowStock.length} low-stock items: ${lowStock.map((i: any) => `${i.name} (${i.quantity} ${i.unit || ''})`).join(', ')}`
        );
        // TODO: Auto-add to shopping list when integrated (future task)
      }
    } catch (error) {
      logger.error(`Failed inventory check for household ${householdId}:`, error);
    }
  },
};
