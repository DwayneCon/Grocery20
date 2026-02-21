/* server/src/services/gamification/levelSystem.ts */
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import { RowDataPacket } from 'mysql2';
import { logger } from '../../utils/logger.js';

export interface Level {
  level: number;
  title: string;
  xpRequired: number;
  icon: string;
}

export const LEVELS: Level[] = [
  { level: 1, title: 'Home Cook', xpRequired: 0, icon: '🥄' },
  { level: 2, title: 'Kitchen Explorer', xpRequired: 100, icon: '🍳' },
  { level: 3, title: 'Sous Chef', xpRequired: 300, icon: '👨‍🍳' },
  { level: 4, title: 'Head Chef', xpRequired: 600, icon: '⭐' },
  { level: 5, title: 'Master Chef', xpRequired: 1000, icon: '👑' },
  { level: 6, title: 'Culinary Legend', xpRequired: 2000, icon: '🏆' },
];

export const XP_ACTIONS = {
  MEAL_ACCEPTED: 10,
  PLAN_COMPLETED: 50,
  RECIPE_RATED: 5,
  RECIPE_COOKED: 25,
  STREAK_DAY: 15,
  SHOPPING_COMPLETED: 20,
  NEW_CUISINE_TRIED: 30,
  BUDGET_UNDER: 40,
} as const;

export type XPAction = keyof typeof XP_ACTIONS;

interface UserXPRow extends RowDataPacket {
  total_xp: number;
}

interface XPEventRow extends RowDataPacket {
  id: string;
  user_id: string;
  action: string;
  xp_amount: number;
  created_at: string;
}

interface HeatmapRow extends RowDataPacket {
  activity_date: string;
  meal_count: number;
}

interface LeaderboardRow extends RowDataPacket {
  user_id: string;
  name: string;
  total_xp: number;
}

/**
 * Calculate the level for a given total XP amount.
 */
export function calculateLevel(totalXP: number) {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXP >= level.xpRequired) {
      currentLevel = level;
    } else {
      break;
    }
  }

  const currentIndex = LEVELS.indexOf(currentLevel);
  const nextLevel = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;

  const xpIntoLevel = totalXP - currentLevel.xpRequired;
  const xpForNextLevel = nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 0;
  const progress = nextLevel ? Math.min(100, Math.floor((xpIntoLevel / xpForNextLevel) * 100)) : 100;

  return {
    ...currentLevel,
    totalXP,
    xpIntoLevel,
    xpForNextLevel,
    progress,
    nextLevel,
  };
}

/**
 * Award XP to a user for a specific action.
 */
export async function awardXP(userId: string, action: XPAction) {
  const xpAmount = XP_ACTIONS[action];

  // Insert XP event
  await query(
    `INSERT INTO user_xp_events (id, user_id, action, xp_amount, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [uuidv4(), userId, action, xpAmount]
  );

  // Upsert total XP
  await query(
    `INSERT INTO user_xp (user_id, total_xp, updated_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE total_xp = total_xp + ?, updated_at = NOW()`,
    [userId, xpAmount, xpAmount]
  );

  // Fetch updated total
  const rows = await query<UserXPRow[]>(
    'SELECT total_xp FROM user_xp WHERE user_id = ?',
    [userId]
  );

  const totalXP = rows.length > 0 ? rows[0].total_xp : xpAmount;
  const levelInfo = calculateLevel(totalXP);

  logger.info(`XP awarded: ${action} (+${xpAmount}) to user ${userId}, total: ${totalXP}`, {
    metadata: { userId, action, xpAmount, totalXP, level: levelInfo.level },
  });

  return { xpAwarded: xpAmount, ...levelInfo };
}

/**
 * Get the current level and XP info for a user.
 */
export async function getUserLevel(userId: string) {
  const rows = await query<UserXPRow[]>(
    'SELECT total_xp FROM user_xp WHERE user_id = ?',
    [userId]
  );

  const totalXP = rows.length > 0 ? rows[0].total_xp : 0;
  return calculateLevel(totalXP);
}

/**
 * Get a leaderboard of XP for members of a household.
 */
export async function getHouseholdLeaderboard(householdId: string) {
  const rows = await query<LeaderboardRow[]>(
    `SELECT hm.user_id, u.name, COALESCE(ux.total_xp, 0) AS total_xp
     FROM household_members hm
     JOIN users u ON hm.user_id = u.id
     LEFT JOIN user_xp ux ON hm.user_id = ux.user_id
     WHERE hm.household_id = ?
     ORDER BY total_xp DESC`,
    [householdId]
  );

  return rows.map((row, index) => ({
    rank: index + 1,
    userId: row.user_id,
    name: row.name,
    totalXP: row.total_xp,
    ...calculateLevel(row.total_xp),
  }));
}

/**
 * Get cooking activity heatmap data for the last 365 days.
 */
export async function getCookingHeatmap(userId: string) {
  const rows = await query<HeatmapRow[]>(
    `SELECT DATE(created_at) AS activity_date, COUNT(*) AS meal_count
     FROM user_xp_events
     WHERE user_id = ?
       AND action IN ('MEAL_ACCEPTED', 'RECIPE_COOKED')
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
     GROUP BY DATE(created_at)
     ORDER BY activity_date ASC`,
    [userId]
  );

  return rows.map((row) => ({
    date: row.activity_date,
    count: row.meal_count,
  }));
}
