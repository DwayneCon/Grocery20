import { Response } from 'express';
import OpenAI from 'openai';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import config from '../../config/env.js';
import {
  saveConversationMessage,
  getConversationHistory,
  getConversationStats,
  clearUserHistory,
} from './conversationHistory.js';
import { saveMealPlanWithRecipes } from './recipeHelper.js';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import { MASTER_SYSTEM_PROMPT } from './masterPrompt.js';
import { logger } from '../../utils/logger.js';
import preferenceLearningEngine from '../../services/ai/preferenceLearningEngine.js';
import { extractPreferences, getMemories } from '../../services/ai/preferenceMemory.js';

// Initialize OpenAI client
// Note: Don't include organization if it causes auth issues
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  // organization: config.openai.orgId, // Commented out - causes mismatched_organization error
});

// Use the imported MASTER_SYSTEM_PROMPT
const SYSTEM_PROMPT = MASTER_SYSTEM_PROMPT;

// Helper function to build household context data for template replacement
async function buildHouseholdContext(householdId: string) {
  try {
    // Get household info
    const households = await query<any[]>(
      'SELECT * FROM households WHERE id = ?',
      [householdId]
    );

    if (households.length === 0) {
      return null;
    }

    const household = households[0];

    // Get members
    const members = await query<any[]>(
      'SELECT * FROM household_members WHERE household_id = ?',
      [householdId]
    );

    // Get dietary preferences
    const preferences = await query<any[]>(
      'SELECT * FROM dietary_preferences WHERE household_id = ?',
      [householdId]
    );

    // Get learned preferences from meal interactions
    const interactions = await query<any[]>(
      'SELECT * FROM meal_interactions WHERE household_id = ? ORDER BY interaction_date DESC LIMIT 100',
      [householdId]
    );

    // Use sophisticated preference learning engine to get learned preferences
    let learnedPreferenceSummary = '';
    try {
      learnedPreferenceSummary = await preferenceLearningEngine.generatePreferenceSummary(householdId);
    } catch (error) {
      logger.error('Error getting learned preferences', error as Error);
      // Fall back to basic analysis if preference engine fails
      learnedPreferenceSummary = '';
    }

    // Still analyze for basic patterns (for backward compatibility)
    const accepted = interactions.filter((i: any) => i.action === 'accepted');
    const rejected = interactions.filter((i: any) => i.action === 'rejected');

    const learnedCuisines = new Set<string>();
    const learnedProteins = new Set<string>();
    const learnedDislikes = new Set<string>();

    accepted.forEach((meal: any) => {
      if (meal.cuisine_type) learnedCuisines.add(meal.cuisine_type);
      if (meal.main_protein) learnedProteins.add(meal.main_protein);
    });

    // Track commonly rejected ingredients
    rejected.forEach((meal: any) => {
      if (meal.meal_name) {
        // Extract potential problem ingredients from rejected meals
        const mealLower = meal.meal_name.toLowerCase();
        if (mealLower.includes('mushroom')) learnedDislikes.add('mushrooms');
        if (mealLower.includes('seafood') || mealLower.includes('fish') || mealLower.includes('shrimp')) learnedDislikes.add('seafood');
        if (mealLower.includes('tomato')) learnedDislikes.add('tomatoes');
      }
    });

    // Parse JSON fields
    const parseJsonField = (field: any, defaultValue: any) => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch {
          return defaultValue;
        }
      }
      return field || defaultValue;
    };

    const parsedMembers = members.map((member) => ({
      name: member.name,
      age: member.age,
      dietary_restrictions: parseJsonField(member.dietary_restrictions, []),
      preferences: parseJsonField(member.preferences, {}),
    }));

    // Aggregate dietary information
    const allergies: string[] = [];
    const intolerances: string[] = [];
    const restrictions: string[] = [];
    const likes: string[] = [];
    const dislikes: string[] = [];

    parsedMembers.forEach((member) => {
      if (Array.isArray(member.dietary_restrictions)) {
        member.dietary_restrictions.forEach((restriction: any) => {
          if (typeof restriction === 'string') {
            restrictions.push(restriction);
          } else if (restriction.type === 'allergy') {
            allergies.push(restriction.item);
          } else if (restriction.type === 'intolerance') {
            intolerances.push(restriction.item);
          }
        });
      }

      if (member.preferences?.dislikes) {
        dislikes.push(...member.preferences.dislikes);
      }
      if (member.preferences?.likes) {
        likes.push(...member.preferences.likes);
      }
    });

    // From dietary_preferences table
    preferences.forEach((pref) => {
      if (pref.preference_type === 'allergy') {
        allergies.push(pref.item);
      } else if (pref.preference_type === 'intolerance') {
        intolerances.push(pref.item);
      } else if (pref.preference_type === 'restriction') {
        restrictions.push(pref.item);
      } else if (pref.preference_type === 'preference') {
        likes.push(pref.item);
      }
    });

    // Merge learned dislikes with existing dislikes
    const allDislikes = [...new Set([...dislikes, ...Array.from(learnedDislikes)])];
    const allLikes = [...new Set([...likes, ...Array.from(learnedProteins)])];

    // Format dietary restrictions with severity
    const formattedRestrictions = {
      critical_allergies: [...new Set(allergies)],
      intolerances: [...new Set(intolerances)],
      restrictions: [...new Set(restrictions)],
      preferences: allLikes,
      dislikes: allDislikes
    };

    // Get recent meal history (last 30 days of accepted meals)
    const recentMeals = await query<any[]>(
      `SELECT
        meal_name,
        cuisine_type,
        main_protein,
        interaction_date
      FROM meal_interactions
      WHERE household_id = ? AND action = 'accepted'
      ORDER BY interaction_date DESC
      LIMIT 50`,
      [householdId]
    );

    // Also get meals from current/recent meal plans
    const mealPlanMeals = await query<any[]>(
      `SELECT DISTINCT r.name as meal_name
      FROM meal_plan_meals mpm
      JOIN meal_plans mp ON mpm.meal_plan_id = mp.id
      JOIN recipes r ON mpm.recipe_id = r.id
      WHERE mp.household_id = ?
        AND mp.week_start >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      LIMIT 30`,
      [householdId]
    );

    // Combine and format meal history
    const mealHistory = [
      ...recentMeals.map(m => m.meal_name),
      ...mealPlanMeals.map(m => m.meal_name)
    ].filter(Boolean);

    // Return structured context data
    return {
      householdId: household.id,
      householdName: household.name,
      memberCount: members.length,
      members: parsedMembers.map(m => `${m.name}${m.age ? ` (${m.age}yo)` : ''}`).join(', '),
      memberDetails: parsedMembers,
      learnedPreferences: {
        favoriteCuisines: Array.from(learnedCuisines),
        favoriteProteins: Array.from(learnedProteins),
        totalAccepted: accepted.length,
        totalRejected: rejected.length,
        summary: learnedPreferenceSummary // Add AI-generated summary
      },
      mealHistory: [...new Set(mealHistory)], // Remove duplicates
      weeklyBudget: household.budget_weekly ? `$${parseFloat(String(household.budget_weekly)).toFixed(2)}` : 'Not set',
      dietaryRestrictions: formattedRestrictions,
      season: getCurrentSeason(),
      location: household.location || 'United States' // Defaults to US; add location field to households table for customization
    };
  } catch (error) {
    logger.error('Error building household context', error as Error);
    return null;
  }
}

// Helper to get current season
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

// Helper to replace template variables in system prompt
function replaceTemplateVariables(prompt: string, context: any, preferenceMemories?: string): string {
  if (!context) {
    // Return prompt with empty placeholders if no context
    return prompt
      .replace(/\{\{SESSION_CONTEXT\}\}/g, '')
      .replace(/\{\{HOUSEHOLD_ID\}\}/g, '')
      .replace(/\{\{HOUSEHOLD_MEMBERS\}\}/g, 'Not available')
      .replace(/\{\{DIETARY_RESTRICTIONS\}\}/g, 'None specified')
      .replace(/\{\{WEEKLY_BUDGET\}\}/g, 'Not set')
      .replace(/\{\{FOOD_PREFERENCES\}\}/g, 'None specified')
      .replace(/\{\{MEAL_HISTORY\}\}/g, 'Not available')
      .replace(/\{\{PANTRY_INVENTORY\}\}/g, 'Not available')
      .replace(/\{\{USER_LOCATION\}\}/g, 'United States')
      .replace(/\{\{CURRENT_SEASON\}\}/g, getCurrentSeason())
      .replace(/\{\{PREFERENCE_MEMORIES\}\}/g, 'No remembered preferences yet.');
  }

  // Build session context summary
  const sessionContext = `Household: "${context.householdName}" with ${context.memberCount} member(s)`;

  // Format dietary restrictions
  const dietaryInfo = [];
  if (context.dietaryRestrictions.critical_allergies.length > 0) {
    dietaryInfo.push(`🚨 CRITICAL ALLERGIES (MUST AVOID): ${context.dietaryRestrictions.critical_allergies.join(', ')}`);
  }
  if (context.dietaryRestrictions.dislikes.length > 0) {
    dietaryInfo.push(`⚠️ STRONG DISLIKES (NEVER INCLUDE): ${context.dietaryRestrictions.dislikes.join(', ')}`);
  }
  if (context.dietaryRestrictions.intolerances.length > 0) {
    dietaryInfo.push(`Intolerances: ${context.dietaryRestrictions.intolerances.join(', ')}`);
  }
  if (context.dietaryRestrictions.restrictions.length > 0) {
    dietaryInfo.push(`Restrictions: ${context.dietaryRestrictions.restrictions.join(', ')}`);
  }

  // Format preferences (enhanced with AI learning)
  const preferenceInfo = [];

  // Include AI-learned preference summary first (most valuable)
  if (context.learnedPreferences.summary) {
    preferenceInfo.push(`🤖 AI-Learned Patterns: ${context.learnedPreferences.summary}`);
  }

  // Then include manually specified preferences
  if (context.dietaryRestrictions.preferences.length > 0) {
    preferenceInfo.push(`Likes: ${context.dietaryRestrictions.preferences.join(', ')}`);
  }
  if (context.learnedPreferences.favoriteCuisines.length > 0) {
    preferenceInfo.push(`Frequently enjoyed cuisines: ${context.learnedPreferences.favoriteCuisines.join(', ')}`);
  }
  if (context.learnedPreferences.favoriteProteins.length > 0) {
    preferenceInfo.push(`Preferred proteins: ${context.learnedPreferences.favoriteProteins.join(', ')}`);
  }

  return prompt
    .replace(/\{\{SESSION_CONTEXT\}\}/g, sessionContext)
    .replace(/\{\{HOUSEHOLD_ID\}\}/g, context.householdId)
    .replace(/\{\{HOUSEHOLD_MEMBERS\}\}/g, context.members)
    .replace(/\{\{DIETARY_RESTRICTIONS\}\}/g, dietaryInfo.length > 0 ? dietaryInfo.join('; ') : 'None')
    .replace(/\{\{WEEKLY_BUDGET\}\}/g, context.weeklyBudget)
    .replace(/\{\{FOOD_PREFERENCES\}\}/g, preferenceInfo.length > 0 ? preferenceInfo.join('\n') : 'None specified')
    .replace(/\{\{MEAL_HISTORY\}\}/g, context.mealHistory && context.mealHistory.length > 0
      ? `Recently suggested/planned meals (IMPORTANT - provide DIFFERENT meals to avoid repetition): ${context.mealHistory.join(', ')}`
      : 'No recent meal history')
    .replace(/\{\{PANTRY_INVENTORY\}\}/g, 'Not tracked yet')
    .replace(/\{\{USER_LOCATION\}\}/g, context.location)
    .replace(/\{\{CURRENT_SEASON\}\}/g, context.season)
    .replace(/\{\{PREFERENCE_MEMORIES\}\}/g, preferenceMemories || 'No remembered preferences yet.');
}

// Chat endpoint with conversation history persistence
export const chat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message, householdId, useHistory = true } = req.body;

  if (!message || typeof message !== 'string') {
    throw new AppError('Message is required', 400);
  }

  if (!config.openai.apiKey) {
    throw new AppError('OpenAI API key not configured', 500);
  }

  const userId = req.user!.id;
  let conversationContext: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  try {
    // Load household context if provided
    let householdContext = null;
    let preferenceMemories = '';
    if (householdId) {
      householdContext = await buildHouseholdContext(householdId);

      // Extract any explicit preferences from the user's message (non-blocking)
      extractPreferences(message, householdId).catch((err) => {
        logger.error('Preference extraction failed (non-blocking)', err as Error);
      });

      // Retrieve stored preference memories for system prompt context
      preferenceMemories = await getMemories(householdId);
    }

    // Replace template variables in system prompt
    const systemPrompt = replaceTemplateVariables(SYSTEM_PROMPT, householdContext, preferenceMemories);

    // Load conversation history from database if enabled
    if (useHistory) {
      const history = await getConversationHistory(userId, 20, householdId);

      // Convert database history to OpenAI format (skip system messages)
      conversationContext = history
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));
    }

    // Build messages array with system prompt, history, and new message
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationContext,
      { role: 'user', content: message },
    ];

    // Detect if user is requesting a meal plan (check current message AND recent conversation history)
    const mealPlanKeywords = /\b(meal plan|week of meals|plan.*meals?|suggest.*meals?|menu for|what should.*eat|days? of meals?|weekly plan)\b/i;
    const currentMessageIsMealPlan = mealPlanKeywords.test(message);

    // Also check last 3 messages in conversation for meal plan context
    const recentMessages = conversationContext.slice(-6); // Last 3 exchanges (user + assistant)
    const conversationHasMealPlan = recentMessages.some(msg =>
      typeof msg.content === 'string' && mealPlanKeywords.test(msg.content)
    );

    // Trigger meal plan mode if current message OR recent conversation mentions meal planning
    const isMealPlanRequest = currentMessageIsMealPlan || conversationHasMealPlan;
    const maxTokens = isMealPlanRequest ? 4096 : 2000; // Max 4096 for GPT-4 Turbo (full 7-day plan), 2000 for regular chat

    // Build explicit allergy warning with actual items
    const criticalAllergies = householdContext?.dietaryRestrictions?.critical_allergies || [];
    const allergyWarning = criticalAllergies.length > 0
      ? `\n🚨🚨🚨 CRITICAL LIFE-THREATENING ALLERGIES - ABSOLUTE ZERO TOLERANCE 🚨🚨🚨\nNEVER SUGGEST ANY MEAL CONTAINING THESE:\n${criticalAllergies.map((a: string) => `- ${a.toUpperCase()}`).join('\n')}\n`
      : '';

    const dislikes = householdContext?.dietaryRestrictions?.dislikes || [];
    const dislikeWarning = dislikes.length > 0
      ? `\n⚠️ STRONG DISLIKES - NEVER INCLUDE ⚠️\n${dislikes.map((d: string) => `- ${d}`).join('\n')}\n`
      : '';

    const intolerances = householdContext?.dietaryRestrictions?.intolerances || [];
    const intoleranceWarning = intolerances.length > 0
      ? `\n⚠️ INTOLERANCES - AVOID THESE:\n${intolerances.map((i: string) => `- ${i}`).join('\n')}\n`
      : '';

    const restrictions = householdContext?.dietaryRestrictions?.restrictions || [];
    const restrictionWarning = restrictions.length > 0
      ? `\n📋 DIETARY RESTRICTIONS:\n${restrictions.map((r: string) => `- ${r}`).join('\n')}\n`
      : '';

    // Build household context summary for meal plan requests
    const learnedPrefs = householdContext?.learnedPreferences;
    const learnedInsights = learnedPrefs?.totalAccepted && learnedPrefs.totalAccepted > 0
      ? `\n🎓 LEARNED PREFERENCES (AI has learned from ${learnedPrefs.totalAccepted} accepted meals):\n- Favorite Cuisines: ${learnedPrefs.favoriteCuisines?.length > 0 ? learnedPrefs.favoriteCuisines.join(', ') : 'Still learning'}\n- Favorite Proteins: ${learnedPrefs.favoriteProteins?.length > 0 ? learnedPrefs.favoriteProteins.join(', ') : 'Still learning'}\n- Note: Prioritize these cuisines and proteins in meal suggestions!\n`
      : '';

    const householdContextSummary = householdContext
      ? `\n📊 HOUSEHOLD INFORMATION AVAILABLE:\n- Household: ${householdContext.householdName}\n- Members: ${householdContext.members}\n- Budget: ${householdContext.weeklyBudget}\n- Preferences: ${householdContext.dietaryRestrictions.preferences.length > 0 ? householdContext.dietaryRestrictions.preferences.join(', ') : 'None specified'}${learnedInsights}\n✅ YOU HAVE ALL NECESSARY INFORMATION - Generate the meal plan now without asking more questions!\n`
      : '';

    // Add formatting instructions for meal plans
    const messagesWithFormatting = isMealPlanRequest
      ? [
          ...messages.slice(0, -1), // All messages except the last user message
          {
            role: 'user' as const,
            content: `${message}
${householdContextSummary}${allergyWarning}${dislikeWarning}${intoleranceWarning}${restrictionWarning}
🚨 VERIFICATION CHECKLIST 🚨
Before suggesting EACH meal, carefully verify it does NOT contain:
- ANY items listed in CRITICAL ALLERGIES above (🚨)
- ANY items listed in STRONG DISLIKES above (⚠️)
- ANY items listed in INTOLERANCES above
- ANY items that violate DIETARY RESTRICTIONS above

DOUBLE-CHECK every ingredient in every meal against the lists above!

🚨🚨🚨 CRITICAL FORMATTING RULES - Follow EXACTLY: 🚨🚨🚨

MEAL PLAN GENERATION MODES:
1. **SINGLE DAY MODE**: If user requests "Monday's meals" or "meals for Tuesday" - generate ONLY that day (3 meals)
2. **FULL WEEK MODE**: If user requests "7-day meal plan" or "weekly plan" - generate all 7 days (21 meals)

FOR SINGLE DAY (recommended to avoid token limits):
- **EXACTLY 3 MEALS**: Breakfast, Lunch, Dinner for the requested day
- Complete recipes with all details for each meal

FOR FULL WEEK (if specifically requested):
- **EXACTLY 7 DAYS**: Monday through Sunday
- **EXACTLY 3 MEALS PER DAY**: Breakfast, Lunch, Dinner
- **TOTAL: 21 COMPLETE MEAL RECIPES**
- **DO NOT** stop after a few meals or skip any meal slots

ORGANIZE THE MEAL PLAN BY DAY OF THE WEEK using this structure:

---
## **Monday**

### **Breakfast**
🍳 **[Breakfast Meal Name]**
⏱️ Prep: [X] min | Cook: [Y] min
💰 Cost per serving: ~$[amount]
✨ Why this works: [Brief explanation]

**Ingredients:**
- [ingredient with quantity]
- [ingredient with quantity]

**Instructions:**
1. [Step]
2. [Step]

**Pro Tips:**
- [Tip]

---

### **Lunch**
🥗 **[Lunch Meal Name]**
[Same format as breakfast]

---

### **Dinner**
🍽️ **[Dinner Meal Name]**
[Same format as breakfast]

---
## **Tuesday**
[Repeat for Tuesday's 3 meals]

[Continue for all 7 days: Monday through Sunday]

🚨 MANDATORY REQUIREMENTS FOR EVERY SINGLE MEAL:
1. MUST start with day header (## **[Day]**)
2. MUST have meal type subheader (### **[Breakfast/Lunch/Dinner]**)
3. MUST have emoji + bold name
4. MUST have Prep & Cook time
5. MUST have Cost
6. MUST have "Why this works" explanation
7. MUST have complete **Ingredients:** section with AT LEAST 3 ingredients
8. MUST have complete **Instructions:** section with AT LEAST 3 steps
9. MUST have **Pro Tips:** section (optional but recommended)

DO NOT just provide a description - EVERY meal needs the full recipe with ingredients and step-by-step instructions!
DO NOT skip ingredients or instructions for ANY meal - all 21 meals must be complete recipes!`
          }
        ]
      : messages;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: messagesWithFormatting,
      temperature: 0.9, // Increased for more variety in meal suggestions
      max_tokens: maxTokens,
      presence_penalty: 0.5, // Increased to encourage new meal ideas
      frequency_penalty: 0.5, // Increased to avoid repeating same meals
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I couldn\'t generate a response.';

    // Save user message to database
    await saveConversationMessage({
      userId,
      householdId,
      role: 'user',
      content: message,
      tokensUsed: completion.usage?.prompt_tokens || 0,
      model: config.openai.model,
    });

    // Save AI response to database
    await saveConversationMessage({
      userId,
      householdId,
      role: 'assistant',
      content: aiResponse,
      tokensUsed: completion.usage?.completion_tokens || 0,
      model: config.openai.model,
    });

    res.json({
      response: aiResponse,
      usage: completion.usage,
      historyLength: conversationContext.length,
    });
  } catch (error: any) {
    logger.error('OpenAI API error', error, {
      metadata: {
        status: error.status,
        type: error.type,
        code: error.code,
      },
    });

    // Fallback to simpler model if primary fails
    if (config.openai.fallbackModel) {
      try {
        const fallbackCompletion = await openai.chat.completions.create({
          model: config.openai.fallbackModel,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          max_tokens: 4096, // Maximum for GPT-3.5-turbo fallback
        });

        const fallbackResponse = fallbackCompletion.choices[0]?.message?.content;

        // Save to history even with fallback
        await saveConversationMessage({
          userId,
          householdId,
          role: 'user',
          content: message,
          model: config.openai.fallbackModel,
        });

        await saveConversationMessage({
          userId,
          householdId,
          role: 'assistant',
          content: fallbackResponse || 'Failed to generate response',
          tokensUsed: fallbackCompletion.usage?.total_tokens || 0,
          model: config.openai.fallbackModel,
        });

        res.json({
          response: fallbackResponse,
          fallback: true,
          historyLength: conversationContext.length,
        });
        return;
      } catch (fallbackError) {
        logger.error('Fallback model error', fallbackError as Error);
        throw new AppError('Both primary and fallback AI models failed', 500);
      }
    }

    throw new AppError('Failed to generate AI response', 500);
  }
});

// Generate structured meal plan
export const generateMealPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    householdId,
    householdSize = 2,
    budget = 150,
    dietaryRestrictions = [],
    cuisinePreferences = [],
    days = 7,
  } = req.body;

  // If householdId is provided, fetch household data
  let householdData: any = null;
  if (householdId) {
    try {
      // Import query function
      const { query } = await import('../../config/database.js');

      // Get household info
      const households: any[] = await query(
        'SELECT * FROM households WHERE id = ?',
        [householdId]
      );

      // Get members
      const members: any[] = await query(
        'SELECT * FROM household_members WHERE household_id = ?',
        [householdId]
      );

      // Get dietary preferences
      const preferences: any[] = await query(
        'SELECT * FROM dietary_preferences WHERE household_id = ?',
        [householdId]
      );

      if (households.length > 0) {
        householdData = {
          household: households[0],
          members: members.map(m => {
            let dietaryRestrictions = [];
            let preferences = {};

            try {
              dietaryRestrictions = m.dietary_restrictions ? JSON.parse(m.dietary_restrictions) : [];
            } catch (e) {
              logger.warn('Invalid JSON in dietary_restrictions', {
                metadata: { value: m.dietary_restrictions },
              });
            }

            try {
              preferences = m.preferences ? JSON.parse(m.preferences) : {};
            } catch (e) {
              logger.warn('Invalid JSON in preferences', {
                metadata: { value: m.preferences },
              });
            }

            return {
              ...m,
              dietary_restrictions: dietaryRestrictions,
              preferences: preferences,
            };
          }),
          preferences,
        };
      }
    } catch (error) {
      logger.error('Error fetching household data', error as Error);
    }
  }

  if (!config.openai.apiKey) {
    throw new AppError('OpenAI API key not configured', 500);
  }

  // Build comprehensive prompt with household data
  let householdContext = '';
  if (householdData) {
    const allAllergies = new Set<string>();
    const allDislikes = new Set<string>();
    const allLikes = new Set<string>();

    // Aggregate from members
    householdData.members.forEach((member: any) => {
      if (Array.isArray(member.dietary_restrictions)) {
        member.dietary_restrictions.forEach((r: any) => {
          const item = typeof r === 'string' ? r : r.item;
          if (item) allAllergies.add(item);
        });
      }
      if (member.preferences?.dislikes) {
        member.preferences.dislikes.forEach((d: string) => allDislikes.add(d));
      }
      if (member.preferences?.likes) {
        member.preferences.likes.forEach((l: string) => allLikes.add(l));
      }
    });

    // Aggregate from preferences table
    householdData.preferences.forEach((pref: any) => {
      if (pref.preference_type === 'allergy' || pref.preference_type === 'intolerance') {
        allAllergies.add(pref.item);
      }
    });

    householdContext = `
HOUSEHOLD INFORMATION:
- Household: ${householdData.household.name}
- Members: ${householdData.members.map((m: any) => `${m.name}${m.age ? ` (${m.age} years old)` : ''}`).join(', ')}
- Total People: ${householdData.members.length}

CRITICAL ALLERGIES (MUST AVOID):
${allAllergies.size > 0 ? Array.from(allAllergies).join(', ') : 'None'}

DISLIKES (AVOID IF POSSIBLE):
${allDislikes.size > 0 ? Array.from(allDislikes).join(', ') : 'None'}

PREFERENCES (INCLUDE MORE OF):
${allLikes.size > 0 ? Array.from(allLikes).join(', ') : 'None'}

Weekly Budget: $${householdData.household.budget_weekly || budget}
`;
  }

  const finalBudget = householdData?.household?.budget_weekly || budget;
  const finalHouseholdSize = householdData?.members?.length || householdSize;

  const prompt = `🚨 CRITICAL: You MUST generate a COMPLETE ${days}-day meal plan for ${finalHouseholdSize} people with a weekly budget of $${finalBudget}.

${householdContext}

${!householdContext ? `Requirements:
- Dietary restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}
- Cuisine preferences: ${cuisinePreferences.length > 0 ? cuisinePreferences.join(', ') : 'Any'}` : ''}

🚨 MANDATORY REQUIREMENTS - DO NOT SKIP ANY:
- YOU MUST PROVIDE EXACTLY ${days} DAYS (Monday through Sunday)
- EACH DAY MUST HAVE ALL 3 MEALS: breakfast, lunch, AND dinner
- TOTAL MEALS REQUIRED: ${days * 3} meals (${days} days × 3 meals per day)
- DO NOT provide partial days or skip any meal slots
- DO NOT stop generating before completing all ${days} days

ADDITIONAL REQUIREMENTS:
- Provide ingredient lists for every meal
- Include estimated cost per meal
- Ensure nutritional balance
- STRICTLY AVOID all listed allergies
- Try to minimize dishes with dislikes
- Incorporate preferred foods when possible
- Consider age-appropriate portions

Format the response as a structured JSON object with the following structure:
{
  "mealPlan": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": {
          "name": "...",
          "description": "Brief appetizing description",
          "ingredients": [
            { "name": "ingredient", "amount": "1", "unit": "cup", "category": "Produce" }
          ],
          "instructions": [
            "Step 1: Detailed instruction",
            "Step 2: Next step with timing"
          ],
          "prepTime": 10,
          "cookTime": 15,
          "servings": ${finalHouseholdSize},
          "difficulty": "easy|medium|hard",
          "cost": 0,
          "nutrition": {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0
          },
          "tags": ["quick", "healthy", "kid-friendly"],
          "tips": "Pro tip or substitution suggestion"
        },
        "lunch": { /* same structure */ },
        "dinner": { /* same structure */ }
      }
    }
  ],
  "shoppingList": [
    { "item": "...", "quantity": "...", "unit": "...", "estimatedCost": 0, "category": "Produce|Meat|Dairy|..." }
  ],
  "totalEstimatedCost": 0,
  "nutritionSummary": {
    "averageCaloriesPerDay": 0,
    "proteinGrams": 0,
    "carbsGrams": 0,
    "fatGrams": 0,
    "fiberGrams": 0
  },
  "notes": "Overall meal plan notes, batch cooking suggestions, leftover ideas"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9, // Increased for more variety and creativity
      max_tokens: 4096, // Maximum for GPT-4 Turbo - ensures full 7-day plan
      presence_penalty: 0.5, // Encourage discussing new topics (meals)
      frequency_penalty: 0.5, // Discourage repeating same meals
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new AppError('Failed to generate meal plan', 500);
    }

    const mealPlanData = JSON.parse(responseContent);

    // Save to database if householdId is provided
    if (householdId) {
      try {
        // Calculate week start and end dates
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + (days - 1));

        const mealPlanId = uuidv4();

        // Create meal plan record
        await query(
          `INSERT INTO meal_plans (id, household_id, week_start, week_end, status, total_cost, ai_generated, preferences)
           VALUES (?, ?, ?, ?, 'draft', ?, TRUE, ?)`,
          [
            mealPlanId,
            householdId,
            weekStart.toISOString().split('T')[0],
            weekEnd.toISOString().split('T')[0],
            mealPlanData.totalEstimatedCost || 0,
            JSON.stringify({ budget: finalBudget, days, dietaryRestrictions, cuisinePreferences })
          ]
        );

        // Save all meals with proper recipe records
        const savedMeals = await saveMealPlanWithRecipes(
          mealPlanData,
          mealPlanId,
          householdId,
          req.user!.id,
          weekStart,
          finalHouseholdSize
        );

        // Return response with saved plan ID and saved meals
        return res.json({
          success: true,
          data: mealPlanData,
          mealPlanId,
          savedMealsCount: savedMeals.length,
          savedMeals: savedMeals.map(m => ({
            type: m.mealType,
            date: m.date,
            recipeId: m.recipeId
          })),
          usage: completion.usage,
          saved: true,
          message: `Meal plan generated and saved successfully with ${savedMeals.length} recipes`
        });
      } catch (dbError) {
        logger.error('Database save error', dbError as Error);
        // Return generated plan even if save fails
        return res.json({
          success: true,
          data: mealPlanData,
          usage: completion.usage,
          saved: false,
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
          warning: 'Meal plan generated but not saved to database'
        });
      }
    }

    return res.json({
      success: true,
      data: mealPlanData,
      usage: completion.usage,
    });
  } catch (error: any) {
    logger.error('Meal plan generation error', error);
    throw new AppError('Failed to generate meal plan', 500);
  }
});

// Get conversation statistics
export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const stats = await getConversationStats(userId);

  res.json({
    success: true,
    data: stats,
  });
});

// Clear user conversation history
export const clearHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const deletedCount = await clearUserHistory(userId);

  res.json({
    success: true,
    message: `Deleted ${deletedCount} conversation messages`,
    deletedCount,
  });
});
