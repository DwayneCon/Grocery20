import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

/**
 * PreferenceMemory Service
 *
 * Extracts and stores EXPLICIT user preferences from chat messages.
 * Examples: "I don't like cilantro", "We love Mexican food", "Our budget is $100"
 *
 * This is fundamentally different from PreferenceLearningEngine which uses
 * implicit EMA-based learning from meal interactions (accept/reject/rate).
 * PreferenceMemory captures what users directly SAY in conversation.
 */

export interface PreferenceMemory {
  id: string;
  householdId: string;
  statement: string;
  category: PreferenceCategory;
  sentiment: PreferenceSentiment;
  confidence: number;
  sourceMessage: string;
  createdAt?: Date;
}

type PreferenceCategory = 'ingredient' | 'cuisine' | 'cooking_method' | 'dietary' | 'timing' | 'budget' | 'general';
type PreferenceSentiment = 'positive' | 'negative' | 'neutral';

interface PreferencePattern {
  regex: RegExp;
  sentiment: PreferenceSentiment;
  category: PreferenceCategory;
  confidence?: number;
}

// Patterns that indicate explicit preferences stated in conversation
const PREFERENCE_PATTERNS: PreferencePattern[] = [
  // Negative ingredient/food preferences
  { regex: /(?:i|we)\s+(?:don'?t|do not|never)\s+(?:like|eat|want|use|cook with)\s+(.+)/i, sentiment: 'negative', category: 'ingredient' },
  { regex: /(?:i|we)\s+(?:hate|dislike|can'?t stand|detest)\s+(.+)/i, sentiment: 'negative', category: 'ingredient' },
  { regex: /(?:no|avoid|skip|exclude|hold the|without)\s+(.+?)(?:\s+please|\s*[.,!]|\s*$)/i, sentiment: 'negative', category: 'ingredient' },

  // Positive ingredient/food preferences
  { regex: /(?:i|we)\s+(?:love|really like|enjoy|prefer|adore|crave)\s+(.+)/i, sentiment: 'positive', category: 'ingredient' },
  { regex: /(?:i|we)\s+(?:can'?t get enough of|always want|am obsessed with)\s+(.+)/i, sentiment: 'positive', category: 'ingredient' },

  // Allergy and dietary restrictions
  { regex: /(?:i'm|i am|we're|we are)\s+(?:allergic to|intolerant to)\s+(.+)/i, sentiment: 'negative', category: 'dietary', confidence: 0.95 },
  { regex: /(?:i|we)\s+(?:have|has)\s+(?:a|an)\s+(.+?)\s+(?:allergy|intolerance)/i, sentiment: 'negative', category: 'dietary', confidence: 0.95 },
  { regex: /(?:i'm|i am|we're|we are)\s+(?:vegetarian|vegan|pescatarian|keto|paleo|gluten[- ]free|dairy[- ]free|lactose[- ]intolerant)/i, sentiment: 'neutral', category: 'dietary', confidence: 0.95 },

  // Family/household preferences
  { regex: /(?:my|our)\s+(?:kids?|children|family|husband|wife|partner|spouse)\s+(?:love|like|prefer|enjoy)\s+(.+)/i, sentiment: 'positive', category: 'general' },
  { regex: /(?:my|our)\s+(?:kids?|children|family|husband|wife|partner|spouse)\s+(?:don'?t|hate|dislike|won'?t eat|refuse to eat)\s+(.+)/i, sentiment: 'negative', category: 'general' },

  // Budget preferences
  { regex: /(?:budget|spend|spending)\s+(?:is|of|around|about|limit)\s+\$?(\d+)/i, sentiment: 'neutral', category: 'budget' },
  { regex: /(?:we|i)\s+(?:can|want to)\s+(?:only)?\s*(?:spend|afford)\s+(?:about|around|up to)?\s*\$?(\d+)/i, sentiment: 'neutral', category: 'budget' },

  // Timing/cooking time preferences
  { regex: /(?:only have|have about|usually cook in|max|no more than)\s+(\d+)\s*(?:min|minutes?|hour|hours?)/i, sentiment: 'neutral', category: 'timing' },
  { regex: /(?:i|we)\s+(?:don'?t have|never have)\s+(?:much|a lot of)\s+time\s+(?:to cook|for cooking)/i, sentiment: 'neutral', category: 'timing' },
  { regex: /(?:quick|fast|easy|simple)\s+(?:meals?|recipes?|dinners?|lunches?)/i, sentiment: 'positive', category: 'timing' },

  // Cuisine preferences
  { regex: /(?:we love|i love|we prefer|i prefer|we enjoy|i enjoy)\s+(.+?)\s+(?:food|cuisine|cooking|dishes|recipes)/i, sentiment: 'positive', category: 'cuisine' },
  { regex: /(?:we'?re|i'?m)\s+(?:really into|big fans? of|crazy about)\s+(.+?)\s+(?:food|cuisine|cooking)/i, sentiment: 'positive', category: 'cuisine' },
  { regex: /(?:we|i)\s+(?:don'?t|never)\s+(?:like|eat|enjoy)\s+(.+?)\s+(?:food|cuisine)/i, sentiment: 'negative', category: 'cuisine' },

  // Cooking method preferences
  { regex: /(?:i|we)\s+(?:love|prefer|like)\s+(?:to\s+)?(?:grill|bake|roast|slow cook|air fry|stir[- ]fry|smoke|steam|saut[eé])/i, sentiment: 'positive', category: 'cooking_method' },
  { regex: /(?:i|we)\s+(?:don'?t|never)\s+(?:like to|want to)?\s*(?:fry|deep[- ]fry|grill|bake)/i, sentiment: 'negative', category: 'cooking_method' },
];

/**
 * Extract explicit preferences from a user message and store them.
 * Runs pattern matching against known preference indicators.
 */
export async function extractPreferences(message: string, householdId: string): Promise<number> {
  let extracted = 0;

  for (const pattern of PREFERENCE_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match) {
      const statement = match[0].trim();
      const confidence = pattern.confidence ?? 0.80;

      try {
        // Check for duplicate/similar preference already stored
        const existing = await query<any[]>(
          'SELECT id FROM preference_memories WHERE household_id = ? AND statement = ? LIMIT 1',
          [householdId, statement]
        );

        if (existing.length === 0) {
          await query(
            'INSERT INTO preference_memories (id, household_id, statement, category, sentiment, confidence, source_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), householdId, statement, pattern.category, pattern.sentiment, confidence, message]
          );
          logger.info(`Preference memory stored for household ${householdId}: "${statement}" [${pattern.category}/${pattern.sentiment}]`);
          extracted++;
        }
      } catch (error) {
        // Don't let preference extraction failures break the chat flow
        logger.error('Failed to store preference memory', error as Error, {
          metadata: { householdId, statement, category: pattern.category },
        });
      }
    }
  }

  return extracted;
}

/**
 * Retrieve stored preference memories for a household, formatted for
 * inclusion in the AI system prompt.
 */
export async function getMemories(householdId: string): Promise<string> {
  try {
    const rows = await query<any[]>(
      `SELECT statement, category, sentiment
       FROM preference_memories
       WHERE household_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [householdId]
    );

    if (rows.length === 0) return '';

    const lines = rows.map((r: any) => {
      const icon = r.sentiment === 'negative' ? '[AVOID]' : r.sentiment === 'positive' ? '[LIKES]' : '[NOTE]';
      return `- ${icon} ${r.statement} (${r.category})`;
    });

    return lines.join('\n');
  } catch (error) {
    logger.error('Failed to retrieve preference memories', error as Error, {
      metadata: { householdId },
    });
    return '';
  }
}

/**
 * Delete a specific preference memory (e.g., if a user says "actually, I do like cilantro now").
 */
export async function deleteMemory(memoryId: string, householdId: string): Promise<boolean> {
  try {
    const result = await query<any>(
      'DELETE FROM preference_memories WHERE id = ? AND household_id = ?',
      [memoryId, householdId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    logger.error('Failed to delete preference memory', error as Error, {
      metadata: { memoryId, householdId },
    });
    return false;
  }
}

/**
 * Get all preference memories for a household (for UI display/management).
 */
export async function listMemories(householdId: string): Promise<PreferenceMemory[]> {
  try {
    const rows = await query<any[]>(
      `SELECT id, household_id, statement, category, sentiment, confidence, source_message, created_at
       FROM preference_memories
       WHERE household_id = ?
       ORDER BY created_at DESC`,
      [householdId]
    );

    return rows.map((r: any) => ({
      id: r.id,
      householdId: r.household_id,
      statement: r.statement,
      category: r.category,
      sentiment: r.sentiment,
      confidence: parseFloat(r.confidence),
      sourceMessage: r.source_message,
      createdAt: r.created_at,
    }));
  } catch (error) {
    logger.error('Failed to list preference memories', error as Error, {
      metadata: { householdId },
    });
    return [];
  }
}
