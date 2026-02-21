import OpenAI from 'openai';
import config from '../../config/env.js';
import { logger } from '../../utils/logger.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

/**
 * Represents a single item extracted from a receipt
 */
export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
}

/**
 * Structured data extracted from a grocery receipt image
 */
export interface ReceiptData {
  storeName: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Validates that parsed receipt data conforms to the expected structure.
 * Fills in defaults for missing fields to make the result robust.
 */
function validateReceiptData(data: any): ReceiptData {
  if (!data || typeof data !== 'object') {
    throw new Error('Receipt data is not a valid object');
  }

  const storeName = typeof data.storeName === 'string' ? data.storeName : 'Unknown Store';
  const date = typeof data.date === 'string' ? data.date : new Date().toISOString().split('T')[0];
  const subtotal = typeof data.subtotal === 'number' ? data.subtotal : 0;
  const tax = typeof data.tax === 'number' ? data.tax : 0;
  const total = typeof data.total === 'number' ? data.total : 0;

  const items: ReceiptItem[] = [];

  if (Array.isArray(data.items)) {
    for (const item of data.items) {
      if (item && typeof item === 'object' && typeof item.name === 'string') {
        items.push({
          name: item.name,
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          price: typeof item.price === 'number' ? item.price : 0,
          category: typeof item.category === 'string' ? item.category : 'Other',
        });
      }
    }
  }

  return { storeName, date, items, subtotal, tax, total };
}

/**
 * Scans a grocery receipt image using OpenAI GPT-4 Vision and extracts
 * structured item/price data.
 *
 * @param base64Image - The receipt image encoded as a base64 data URL (e.g. "data:image/jpeg;base64,...")
 * @returns Structured receipt data with store name, items, and totals
 */
export async function scanReceipt(base64Image: string): Promise<ReceiptData> {
  if (!config.openai.apiKey) {
    throw new Error('OpenAI API key is not configured. Receipt scanning requires GPT-4 Vision.');
  }

  // Strip data URL prefix if present to get raw base64, then re-add for the API
  let imageUrl = base64Image;
  if (!imageUrl.startsWith('data:')) {
    imageUrl = `data:image/jpeg;base64,${imageUrl}`;
  }

  const prompt = `Extract all items and prices from this grocery receipt. Return ONLY valid JSON with no additional text, in this exact format:
{
  "storeName": "Store Name",
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "Item Name", "quantity": 1, "price": 2.99, "category": "Produce" }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00
}

Categories should be one of: Produce, Dairy, Meat, Bakery, Frozen, Beverages, Snacks, Canned Goods, Condiments, Household, Health, Other.

If you cannot read certain values, use your best estimate. Always return valid JSON.`;

  logger.info('Scanning receipt with GPT-4 Vision');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1, // Low temperature for accurate extraction
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content received from OpenAI Vision API');
    }

    logger.debug('Receipt scan raw response received');

    // Parse JSON from the response, handling potential markdown code fences
    let jsonString = content.trim();

    // Remove markdown code fences if present
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      logger.error('Failed to parse receipt JSON from Vision API', parseError as Error, {
        metadata: { rawContent: content.substring(0, 500) },
      });
      throw new Error('Failed to parse receipt data from image. The image may be unclear or not a receipt.');
    }

    const receiptData = validateReceiptData(parsed);

    logger.info('Receipt scanned successfully', {
      metadata: {
        storeName: receiptData.storeName,
        itemCount: receiptData.items.length,
        total: receiptData.total,
      },
    });

    return receiptData;
  } catch (error) {
    // Re-throw known errors
    if (error instanceof Error && (
      error.message.includes('Failed to parse') ||
      error.message.includes('OpenAI API key')
    )) {
      throw error;
    }

    logger.error('Receipt scanning failed', error as Error);
    throw new Error(
      `Receipt scanning failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Represents a single ingredient identified from a fridge/pantry photo
 */
export interface FridgeIngredient {
  name: string;
  quantity: string;
  condition: 'fresh' | 'aging' | 'expired';
}

/**
 * A quick meal suggestion based on identified fridge ingredients
 */
export interface MealSuggestion {
  name: string;
  ingredients: string[];
  cookTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

/**
 * Structured data returned from a fridge scan
 */
export interface FridgeScanData {
  ingredients: FridgeIngredient[];
  mealSuggestions: MealSuggestion[];
}

/**
 * Validates that parsed fridge ingredient data conforms to the expected structure.
 */
function validateFridgeIngredients(data: any): FridgeIngredient[] {
  if (!Array.isArray(data)) {
    throw new Error('Fridge ingredients data is not an array');
  }

  const validConditions = ['fresh', 'aging', 'expired'];
  const ingredients: FridgeIngredient[] = [];

  for (const item of data) {
    if (item && typeof item === 'object' && typeof item.name === 'string') {
      ingredients.push({
        name: item.name,
        quantity: typeof item.quantity === 'string' ? item.quantity : String(item.quantity || 'unknown'),
        condition: validConditions.includes(item.condition) ? item.condition : 'fresh',
      });
    }
  }

  return ingredients;
}

/**
 * Validates that parsed meal suggestion data conforms to the expected structure.
 */
function validateMealSuggestions(data: any): MealSuggestion[] {
  if (!Array.isArray(data)) {
    return [];
  }

  const validDifficulties = ['easy', 'medium', 'hard'];
  const suggestions: MealSuggestion[] = [];

  for (const item of data) {
    if (item && typeof item === 'object' && typeof item.name === 'string') {
      suggestions.push({
        name: item.name,
        ingredients: Array.isArray(item.ingredients)
          ? item.ingredients.filter((i: any) => typeof i === 'string')
          : [],
        cookTime: typeof item.cookTime === 'string' ? item.cookTime : '30 minutes',
        difficulty: validDifficulties.includes(item.difficulty) ? item.difficulty : 'easy',
        description: typeof item.description === 'string' ? item.description : '',
      });
    }
  }

  return suggestions;
}

/**
 * Strips markdown code fences from a JSON response string if present.
 */
function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned;
}

/**
 * Scans a fridge or pantry image using OpenAI GPT-4 Vision, identifies visible
 * food items with condition estimates, then generates quick meal suggestions
 * based on those ingredients.
 *
 * @param base64Image - The fridge/pantry image encoded as a base64 data URL or raw base64
 * @returns Identified ingredients and 3 meal suggestions
 */
export async function scanFridge(base64Image: string): Promise<FridgeScanData> {
  if (!config.openai.apiKey) {
    throw new Error('OpenAI API key is not configured. Fridge scanning requires GPT-4 Vision.');
  }

  // Ensure proper data URL format
  let imageUrl = base64Image;
  if (!imageUrl.startsWith('data:')) {
    imageUrl = `data:image/jpeg;base64,${imageUrl}`;
  }

  // ---- Step 1: Identify ingredients from the fridge photo ----
  const identifyPrompt = `Identify all food items visible in this refrigerator/pantry photo. For each item estimate: name, approximate quantity, condition (fresh/aging/expired). Return ONLY valid JSON with no additional text, as an array in this exact format:
[
  { "name": "Milk", "quantity": "1 gallon, half full", "condition": "fresh" },
  { "name": "Lettuce", "quantity": "1 head", "condition": "aging" }
]

Conditions:
- "fresh" = looks good, normal appearance
- "aging" = starting to wilt, discolor, or nearing expiration
- "expired" = visibly spoiled, moldy, or clearly past use

Be thorough - identify every visible food item. If you cannot clearly see an item, make your best guess. Always return valid JSON.`;

  logger.info('Scanning fridge with GPT-4 Vision - identifying ingredients');

  let ingredients: FridgeIngredient[];

  try {
    const identifyResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: identifyPrompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.2,
    });

    const identifyContent = identifyResponse.choices[0]?.message?.content;

    if (!identifyContent) {
      throw new Error('No response content received from OpenAI Vision API for ingredient identification');
    }

    logger.debug('Fridge scan ingredient response received');

    const jsonString = stripCodeFences(identifyContent);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      logger.error('Failed to parse fridge ingredients JSON from Vision API', parseError as Error, {
        metadata: { rawContent: identifyContent.substring(0, 500) },
      });
      throw new Error('Failed to parse fridge scan data. The image may be unclear.');
    }

    ingredients = validateFridgeIngredients(parsed);

    logger.info('Fridge ingredients identified successfully', {
      metadata: { ingredientCount: ingredients.length },
    });
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('Failed to parse') ||
      error.message.includes('OpenAI API key')
    )) {
      throw error;
    }
    logger.error('Fridge ingredient identification failed', error as Error);
    throw new Error(
      `Fridge scanning failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // If no ingredients found, return early with empty suggestions
  if (ingredients.length === 0) {
    return { ingredients: [], mealSuggestions: [] };
  }

  // ---- Step 2: Generate meal suggestions from the identified ingredients ----
  const usableIngredients = ingredients
    .filter(i => i.condition !== 'expired')
    .map(i => i.name);

  if (usableIngredients.length === 0) {
    return { ingredients, mealSuggestions: [] };
  }

  const mealPrompt = `Based on these available ingredients: ${usableIngredients.join(', ')}

Suggest exactly 3 quick meals that can be made primarily with these ingredients (you may assume basic pantry staples like salt, pepper, oil, butter, garlic are available). Return ONLY valid JSON with no additional text, in this exact format:
[
  {
    "name": "Meal Name",
    "ingredients": ["ingredient1", "ingredient2"],
    "cookTime": "20 minutes",
    "difficulty": "easy",
    "description": "A brief one-sentence description of the meal."
  }
]

Difficulty should be one of: easy, medium, hard. Always return valid JSON.`;

  logger.info('Generating meal suggestions from fridge ingredients');

  let mealSuggestions: MealSuggestion[];

  try {
    const mealResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: mealPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });

    const mealContent = mealResponse.choices[0]?.message?.content;

    if (!mealContent) {
      logger.warn('No meal suggestion response received, returning empty suggestions');
      mealSuggestions = [];
    } else {
      const mealJsonString = stripCodeFences(mealContent);

      try {
        const mealParsed = JSON.parse(mealJsonString);
        mealSuggestions = validateMealSuggestions(mealParsed);
      } catch (parseError) {
        logger.warn('Failed to parse meal suggestions JSON, returning empty suggestions', {
          metadata: { rawContent: mealContent.substring(0, 500) },
        });
        mealSuggestions = [];
      }
    }
  } catch (error) {
    // Meal suggestions are non-critical - log and continue with empty array
    logger.warn('Meal suggestion generation failed, returning ingredients only', {
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
    mealSuggestions = [];
  }

  logger.info('Fridge scan completed', {
    metadata: {
      ingredientCount: ingredients.length,
      mealSuggestionCount: mealSuggestions.length,
    },
  });

  return { ingredients, mealSuggestions };
}

export default { scanReceipt, scanFridge };
