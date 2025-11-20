import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import { query } from '../../config/database.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Helper function to safely parse JSON fields
const parseJsonField = (field: any, defaultValue: any): any => {
  // If field is already an object or array, return it as-is
  if (typeof field === 'object' && field !== null) {
    return field;
  }

  // If field is a string, try to parse it
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return defaultValue;
    }
  }

  // If field is null/undefined, return default
  return defaultValue;
};

interface Household extends RowDataPacket {
  id: string;
  name: string;
  budget_weekly: number;
  created_by: string;
  created_at: Date;
}

interface HouseholdMember extends RowDataPacket {
  id: string;
  household_id: string;
  name: string;
  age: number;
  dietary_restrictions: any;
  preferences: any;
}

interface DietaryPreference extends RowDataPacket {
  id: string;
  household_id: string;
  user_id: string;
  preference_type: 'allergy' | 'intolerance' | 'preference' | 'restriction';
  item: string;
  severity: number;
}

// Create household
export const createHousehold = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, budgetWeekly } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const householdId = uuidv4();

  await query(
    'INSERT INTO households (id, name, budget_weekly, created_by) VALUES (?, ?, ?, ?)',
    [householdId, name, budgetWeekly || 0, userId]
  );

  // Update user's household_id
  await query(
    'UPDATE users SET household_id = ? WHERE id = ?',
    [householdId, userId]
  );

  res.status(201).json({
    success: true,
    household: {
      id: householdId,
      name,
      budgetWeekly: budgetWeekly || 0,
      createdBy: userId,
    },
  });
});

// Get household
export const getHousehold = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const userId = req.user?.id;

  // Verify user has access to this household
  const userHousehold = await query<RowDataPacket[]>(
    'SELECT household_id FROM users WHERE id = ?',
    [userId]
  );

  if (userHousehold[0]?.household_id !== householdId) {
    throw new AppError('Access denied to this household', 403);
  }

  const households = await query<Household[]>(
    'SELECT * FROM households WHERE id = ?',
    [householdId]
  );

  if (households.length === 0) {
    throw new AppError('Household not found', 404);
  }

  res.json({
    success: true,
    household: households[0],
  });
});

// Update household
export const updateHousehold = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const { name, budgetWeekly } = req.body;

  await query(
    'UPDATE households SET name = ?, budget_weekly = ? WHERE id = ?',
    [name, budgetWeekly, householdId]
  );

  res.json({
    success: true,
    message: 'Household updated successfully',
  });
});

// Delete household
export const deleteHousehold = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;

  // Remove household_id from all users
  await query(
    'UPDATE users SET household_id = NULL WHERE household_id = ?',
    [householdId]
  );

  // Delete household (cascade will handle related records)
  await query('DELETE FROM households WHERE id = ?', [householdId]);

  res.json({
    success: true,
    message: 'Household deleted successfully',
  });
});

// Add household member
export const addMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const { name, age, dietaryRestrictions, preferences } = req.body;

  const memberId = uuidv4();

  await query(
    'INSERT INTO household_members (id, household_id, name, age, dietary_restrictions, preferences) VALUES (?, ?, ?, ?, ?, ?)',
    [
      memberId,
      householdId,
      name,
      age || null,
      JSON.stringify(dietaryRestrictions || []),
      JSON.stringify(preferences || {}),
    ]
  );

  res.status(201).json({
    success: true,
    member: {
      id: memberId,
      household_id: householdId,
      name,
      age,
      dietaryRestrictions: dietaryRestrictions || [],
      preferences: preferences || {},
    },
  });
});

// Get household members
export const getMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;

  const members = await query<HouseholdMember[]>(
    'SELECT * FROM household_members WHERE household_id = ?',
    [householdId]
  );

  // Parse JSON fields
  const parsedMembers = members.map((member) => ({
    ...member,
    dietary_restrictions: parseJsonField(member.dietary_restrictions, []),
    preferences: parseJsonField(member.preferences, {}),
  }));

  res.json({
    success: true,
    members: parsedMembers,
  });
});

// Update member
export const updateMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { memberId } = req.params;
  const { name, age, dietaryRestrictions, preferences } = req.body;

  await query(
    'UPDATE household_members SET name = ?, age = ?, dietary_restrictions = ?, preferences = ? WHERE id = ?',
    [
      name,
      age || null,
      JSON.stringify(dietaryRestrictions || []),
      JSON.stringify(preferences || {}),
      memberId,
    ]
  );

  res.json({
    success: true,
    message: 'Member updated successfully',
  });
});

// Remove member
export const removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { memberId } = req.params;

  await query('DELETE FROM household_members WHERE id = ?', [memberId]);

  res.json({
    success: true,
    message: 'Member removed successfully',
  });
});

// Add dietary preference
export const addPreference = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;
  const { userId, preferenceType, item, severity } = req.body;

  const preferenceId = uuidv4();

  await query(
    'INSERT INTO dietary_preferences (id, household_id, user_id, preference_type, item, severity) VALUES (?, ?, ?, ?, ?, ?)',
    [preferenceId, householdId, userId || null, preferenceType, item, severity || 5]
  );

  res.status(201).json({
    success: true,
    preference: {
      id: preferenceId,
      householdId,
      userId,
      preferenceType,
      item,
      severity: severity || 5,
    },
  });
});

// Remove dietary preference
export const removePreference = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { preferenceId } = req.params;

  await query('DELETE FROM dietary_preferences WHERE id = ?', [preferenceId]);

  res.json({
    success: true,
    message: 'Preference removed successfully',
  });
});

// Get household summary with all data
export const getHouseholdSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { householdId } = req.params;

  // Get household info
  const households = await query<Household[]>(
    'SELECT * FROM households WHERE id = ?',
    [householdId]
  );

  if (households.length === 0) {
    throw new AppError('Household not found', 404);
  }

  // Get members
  const members = await query<HouseholdMember[]>(
    'SELECT * FROM household_members WHERE household_id = ?',
    [householdId]
  );

  // Get dietary preferences
  const preferences = await query<DietaryPreference[]>(
    'SELECT * FROM dietary_preferences WHERE household_id = ?',
    [householdId]
  );

  // Parse JSON fields in members
  const parsedMembers = members.map((member) => ({
    ...member,
    dietary_restrictions: parseJsonField(member.dietary_restrictions, []),
    preferences: parseJsonField(member.preferences, {}),
  }));

  // Aggregate all dietary restrictions and preferences
  const aggregatedData = {
    allergies: [] as string[],
    intolerances: [] as string[],
    restrictions: [] as string[],
    preferences: [] as string[],
    dislikes: [] as string[],
  };

  // From members
  parsedMembers.forEach((member) => {
    if (Array.isArray(member.dietary_restrictions)) {
      member.dietary_restrictions.forEach((restriction: any) => {
        if (typeof restriction === 'string') {
          aggregatedData.restrictions.push(restriction);
        } else if (restriction.type === 'allergy') {
          aggregatedData.allergies.push(restriction.item);
        } else if (restriction.type === 'intolerance') {
          aggregatedData.intolerances.push(restriction.item);
        }
      });
    }

    if (member.preferences?.dislikes) {
      aggregatedData.dislikes.push(...member.preferences.dislikes);
    }
    if (member.preferences?.likes) {
      aggregatedData.preferences.push(...member.preferences.likes);
    }
  });

  // From dietary_preferences table
  preferences.forEach((pref) => {
    if (pref.preference_type === 'allergy') {
      aggregatedData.allergies.push(pref.item);
    } else if (pref.preference_type === 'intolerance') {
      aggregatedData.intolerances.push(pref.item);
    } else if (pref.preference_type === 'restriction') {
      aggregatedData.restrictions.push(pref.item);
    } else if (pref.preference_type === 'preference') {
      aggregatedData.preferences.push(pref.item);
    }
  });

  // Remove duplicates
  Object.keys(aggregatedData).forEach((key) => {
    aggregatedData[key as keyof typeof aggregatedData] = [
      ...new Set(aggregatedData[key as keyof typeof aggregatedData]),
    ];
  });

  res.json({
    success: true,
    household: households[0],
    members: parsedMembers,
    preferences: preferences,
    aggregated: aggregatedData,
    stats: {
      totalMembers: parsedMembers.length,
      totalAllergies: aggregatedData.allergies.length,
      totalRestrictions: aggregatedData.restrictions.length,
      weeklyBudget: households[0].budget_weekly,
    },
  });
});
