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

    // Format dietary restrictions with severity
    const formattedRestrictions = {
      critical_allergies: [...new Set(allergies)],
      intolerances: [...new Set(intolerances)],
      restrictions: [...new Set(restrictions)],
      preferences: [...new Set(likes)],
      dislikes: [...new Set(dislikes)]
    };

    // Return structured context data
    return {
      householdId: household.id,
      householdName: household.name,
      memberCount: members.length,
      members: parsedMembers.map(m => `${m.name}${m.age ? ` (${m.age}yo)` : ''}`).join(', '),
      memberDetails: parsedMembers,
      weeklyBudget: household.budget_weekly ? `$${parseFloat(String(household.budget_weekly)).toFixed(2)}` : 'Not set',
      dietaryRestrictions: formattedRestrictions,
      season: getCurrentSeason(),
      location: 'United States' // TODO: Get from household data when available
    };
  } catch (error) {
    console.error('Error building household context:', error);
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
function replaceTemplateVariables(prompt: string, context: any): string {
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
      .replace(/\{\{CURRENT_SEASON\}\}/g, getCurrentSeason());
  }

  // Build session context summary
  const sessionContext = `Household: "${context.householdName}" with ${context.memberCount} member(s)`;

  // Format dietary restrictions
  const dietaryInfo = [];
  if (context.dietaryRestrictions.critical_allergies.length > 0) {
    dietaryInfo.push(`🚨 CRITICAL ALLERGIES (MUST AVOID): ${context.dietaryRestrictions.critical_allergies.join(', ')}`);
  }
  if (context.dietaryRestrictions.intolerances.length > 0) {
    dietaryInfo.push(`Intolerances: ${context.dietaryRestrictions.intolerances.join(', ')}`);
  }
  if (context.dietaryRestrictions.restrictions.length > 0) {
    dietaryInfo.push(`Restrictions: ${context.dietaryRestrictions.restrictions.join(', ')}`);
  }

  // Format preferences
  const preferenceInfo = [];
  if (context.dietaryRestrictions.preferences.length > 0) {
    preferenceInfo.push(`Likes: ${context.dietaryRestrictions.preferences.join(', ')}`);
  }
  if (context.dietaryRestrictions.dislikes.length > 0) {
    preferenceInfo.push(`Dislikes: ${context.dietaryRestrictions.dislikes.join(', ')}`);
  }

  return prompt
    .replace(/\{\{SESSION_CONTEXT\}\}/g, sessionContext)
    .replace(/\{\{HOUSEHOLD_ID\}\}/g, context.householdId)
    .replace(/\{\{HOUSEHOLD_MEMBERS\}\}/g, context.members)
    .replace(/\{\{DIETARY_RESTRICTIONS\}\}/g, dietaryInfo.length > 0 ? dietaryInfo.join('; ') : 'None')
    .replace(/\{\{WEEKLY_BUDGET\}\}/g, context.weeklyBudget)
    .replace(/\{\{FOOD_PREFERENCES\}\}/g, preferenceInfo.length > 0 ? preferenceInfo.join('; ') : 'None specified')
    .replace(/\{\{MEAL_HISTORY\}\}/g, 'Not available yet')
    .replace(/\{\{PANTRY_INVENTORY\}\}/g, 'Not tracked yet')
    .replace(/\{\{USER_LOCATION\}\}/g, context.location)
    .replace(/\{\{CURRENT_SEASON\}\}/g, context.season);
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
    if (householdId) {
      householdContext = await buildHouseholdContext(householdId);
    }

    // Replace template variables in system prompt
    const systemPrompt = replaceTemplateVariables(SYSTEM_PROMPT, householdContext);

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

    // Detect if user is requesting a meal plan (needs more tokens and specific formatting)
    const isMealPlanRequest = /\b(meal plan|week of meals|plan.*meals?|suggest.*meals?|menu for|what should.*eat)\b/i.test(message);
    const maxTokens = isMealPlanRequest ? 3000 : 1000;

    // Add formatting instructions for meal plans
    const messagesWithFormatting = isMealPlanRequest
      ? [
          ...messages.slice(0, -1), // All messages except the last user message
          {
            role: 'user' as const,
            content: `${message}

IMPORTANT FORMATTING: For each meal, you MUST use this exact structure:

🍽️ **[Meal Name]**
⏱️ Prep: [time] | Cook: [time]
💰 Cost per serving: ~$[amount]
✨ Why this works: [brief reason]

**Ingredients:**
- [ingredient 1]
- [ingredient 2]
...

**Instructions:**
1. [Step 1]
2. [Step 2]
...

**Pro Tips:**
- [tip 1]
- [tip 2]

Group meals by type (Breakfast, Lunch, Dinner) with headers. Be concise but include all sections.`
          }
        ]
      : messages;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: messagesWithFormatting,
      temperature: 0.8,
      max_tokens: maxTokens,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I couldn\'t generate a response.';
    const tokensUsed = completion.usage?.total_tokens || 0;

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
    console.error('OpenAI API error:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
      response: error.response?.data || error.response,
    });

    // Fallback to simpler model if primary fails
    if (config.openai.fallbackModel) {
      try {
        console.log(`Attempting fallback with model: ${config.openai.fallbackModel}`);
        const fallbackCompletion = await openai.chat.completions.create({
          model: config.openai.fallbackModel,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          max_tokens: 500,
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
        console.error('Fallback model error:', fallbackError);
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
          members: members.map(m => ({
            ...m,
            dietary_restrictions: JSON.parse(m.dietary_restrictions || '[]'),
            preferences: JSON.parse(m.preferences || '{}'),
          })),
          preferences,
        };
      }
    } catch (error) {
      console.error('Error fetching household data:', error);
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

  const prompt = `Generate a ${days}-day meal plan for ${finalHouseholdSize} people with a weekly budget of $${finalBudget}.

${householdContext}

${!householdContext ? `Requirements:
- Dietary restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}
- Cuisine preferences: ${cuisinePreferences.length > 0 ? cuisinePreferences.join(', ') : 'Any'}` : ''}

REQUIREMENTS:
- Include breakfast, lunch, and dinner for each day
- Provide ingredient lists
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
      temperature: 0.7,
      max_tokens: 2500,
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
        console.error('Database save error:', dbError);
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

    res.json({
      success: true,
      data: mealPlanData,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error('Meal plan generation error:', error);
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
