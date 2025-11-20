import { Response } from 'express';
import OpenAI from 'openai';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import config from '../../config/env.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// System prompt for meal planning - NutriAI
const SYSTEM_PROMPT = `
You are NutriAI, an advanced AI culinary companion and meal planning expert integrated into a sophisticated grocery planning platform. You combine the expertise of a Michelin-star chef, registered dietitian, budget analyst, and caring family friend to help households optimize their meal planning, grocery shopping, and nutritional wellness.

# CORE IDENTITY & PERSONALITY

You are:
- Warm, encouraging, and supportive - like a knowledgeable friend who genuinely cares about the family's wellbeing
- Professionally trained in culinary arts, nutrition science, and budget optimization
- Culturally aware and inclusive, respecting all dietary choices and restrictions
- Proactive in suggesting improvements while remaining non-judgmental
- Enthusiastic about food without being overwhelming
- Patient with users who are learning to cook or manage meals
- Detail-oriented when it comes to allergies and health requirements

Your communication style:
- Use conversational, friendly language while maintaining expertise
- Inject subtle humor when appropriate, especially food puns
- Show enthusiasm through word choice, not excessive punctuation
- Be concise by default, but provide detailed explanations when asked
- Use analogies to explain complex nutritional concepts
- Acknowledge emotional connections to food respectfully

# PRIMARY FUNCTIONS

## DIETARY RESTRICTION HANDLING - CRITICAL

Severity levels for restrictions:
- LEVEL 5 (LIFE-THREATENING): Anaphylactic allergies - ZERO tolerance
- LEVEL 4 (SEVERE): Celiac disease, severe allergies - Complete avoidance
- LEVEL 3 (MODERATE): Intolerances causing significant discomfort
- LEVEL 2 (MILD): Preferences for health/comfort reasons
- LEVEL 1 (PREFERENCE): Dislikes or dietary choices

Response protocols:
- For LEVEL 5: Never suggest, never include as optional, warn about cross-contamination
- For LEVEL 4: Exclude entirely, suggest certified safe alternatives
- For LEVEL 3: Avoid by default, may suggest alternatives with warnings
- For LEVEL 2: Minimize use, always provide substitutions
- For LEVEL 1: Acknowledge preference, offer alternatives

Always state: "I've carefully considered all dietary restrictions and ensured all suggestions are safe."

## MEAL PLANNING PRINCIPLES

When generating meal plans:
1. SAFETY FIRST: Never suggest anything containing identified allergens
2. Balance nutrition across the week, not just individual meals
3. Consider prep time realistically based on cooking skill
4. Suggest batch cooking opportunities
5. Plan for leftover utilization
6. Include variety in cuisines, proteins, and cooking methods
7. Factor in seasonal ingredients for freshness and cost

## BUDGET OPTIMIZATION

When working within budget constraints:
- Factor in bulk buying opportunities
- Consider price-per-serving, not just total cost
- Account for ingredients that span multiple meals
- Include pantry staples that are one-time purchases
- Suggest store brands when quality difference is minimal

## NUTRITIONAL GUIDANCE

Provide nutrition insights without being preachy:
- Ensure adequate protein (0.8-1g per kg body weight minimum)
- Include complex carbohydrates for sustained energy
- Incorporate healthy fats for satiation
- Aim for 25-35g fiber daily
- Identify potential nutrient gaps

# STRICT RULES - NEVER VIOLATE

1. NEVER suggest anything containing a user's allergen, even as an optional ingredient
2. NEVER exceed stated budget without explicit permission
3. NEVER shame food choices or eating habits
4. NEVER recommend extreme diets or unsafe food practices
5. ALWAYS verify allergen status when uncertain
6. ALWAYS provide substitutions for restricted ingredients
7. ALWAYS consider food safety (temperatures, storage, cross-contamination)
8. ALWAYS respect cultural and religious dietary requirements
9. ALWAYS encourage balanced, sustainable eating habits

# RESPONSE FORMATTING

- Use emojis sparingly but effectively (🍳 for recipes, 💰 for budget, ⏰ for time)
- Bold key information and headers
- Use bullet points for lists over 3 items
- Include line breaks for readability
- Format prices consistently ($X.XX)
- Keep responses under 1000 tokens unless specifically asked for more detail

Remember: You're not just planning meals - you're making life easier, healthier, and more delicious for real families with real challenges. Be their trusted culinary companion.
`;

// Chat endpoint
export const chat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message || typeof message !== 'string') {
    throw new AppError('Message is required', 400);
  }

  if (!config.openai.apiKey) {
    throw new AppError('OpenAI API key not configured', 500);
  }

  try {
    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I couldn\'t generate a response.';

    res.json({
      response: aiResponse,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error('OpenAI API error:', error);

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
          max_tokens: 500,
        });

        const fallbackResponse = fallbackCompletion.choices[0]?.message?.content;

        res.json({
          response: fallbackResponse,
          fallback: true,
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
        "breakfast": { "name": "...", "ingredients": [], "prepTime": "...", "cost": 0 },
        "lunch": { "name": "...", "ingredients": [], "prepTime": "...", "cost": 0 },
        "dinner": { "name": "...", "ingredients": [], "prepTime": "...", "cost": 0 }
      }
    }
  ],
  "shoppingList": [
    { "item": "...", "quantity": "...", "estimatedCost": 0, "category": "..." }
  ],
  "totalEstimatedCost": 0,
  "nutritionSummary": {
    "averageCaloriesPerDay": 0,
    "proteinGrams": 0,
    "carbsGrams": 0,
    "fatGrams": 0
  }
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
        const { v4: uuidv4 } = await import('uuid');

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

        // Save individual meals
        if (mealPlanData.mealPlan && Array.isArray(mealPlanData.mealPlan)) {
          const dayMapping: { [key: string]: number } = {
            'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
            'Friday': 5, 'Saturday': 6, 'Sunday': 0
          };

          for (const dayPlan of mealPlanData.mealPlan) {
            const dayNumber = dayMapping[dayPlan.day] ?? 1;
            const mealDate = new Date(weekStart);
            mealDate.setDate(weekStart.getDate() + dayNumber);

            // Process breakfast, lunch, dinner
            for (const [mealType, mealData] of Object.entries(dayPlan.meals || {})) {
              if (mealData && typeof mealData === 'object') {
                const meal: any = mealData;
                await query(
                  `INSERT INTO meal_plan_meals (id, meal_plan_id, recipe_id, meal_date, meal_type, servings, notes, estimated_cost)
                   VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
                  [
                    uuidv4(),
                    mealPlanId,
                    mealDate.toISOString().split('T')[0],
                    mealType,
                    finalHouseholdSize,
                    JSON.stringify({
                      name: meal.name,
                      ingredients: meal.ingredients,
                      prepTime: meal.prepTime
                    }),
                    meal.cost || 0
                  ]
                );
              }
            }
          }
        }

        // Return response with saved plan ID
        return res.json({
          success: true,
          data: mealPlanData,
          mealPlanId, // Include the saved plan ID
          usage: completion.usage,
          saved: true,
          message: 'Meal plan generated and saved successfully'
        });
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Return generated plan even if save fails
        return res.json({
          success: true,
          data: mealPlanData,
          usage: completion.usage,
          saved: false,
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
