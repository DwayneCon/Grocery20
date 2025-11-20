import { Response } from 'express';
import OpenAI from 'openai';
import { AuthRequest } from '../../middleware/auth.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import config from '../../config/env.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// System prompt for meal planning
const SYSTEM_PROMPT = `You are a helpful AI meal planning assistant. Your role is to:
1. Understand user preferences, dietary restrictions, and budget constraints
2. Suggest balanced, nutritious meal plans
3. Consider household size and member preferences
4. Provide cost-effective meal suggestions
5. Explain nutritional benefits
6. Offer alternatives when needed

Always prioritize:
- Food safety (allergies and restrictions)
- Budget constraints
- Nutritional balance
- User preferences
- Variety in meals

Format your responses in a friendly, conversational manner.`;

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
        { role: 'system', content: 'You are a professional meal planning assistant. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new AppError('Failed to generate meal plan', 500);
    }

    const mealPlanData = JSON.parse(responseContent);

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
