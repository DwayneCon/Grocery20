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

export default { scanReceipt };
