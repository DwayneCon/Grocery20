/* client/src/utils/mealParser.ts */
export interface ParsedMeal {
  day?: string;
  mealType?: string;
  name: string;
  emoji?: string;
  prepTime?: string;
  cookTime?: string;
  cost?: string;
  servings?: string;
  difficulty?: string;
  whyItWorks?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  nutrition?: string;
  proTips?: string[];
  storage?: string;
}

export interface ParsedMealPlan {
  hasMeals: boolean;
  introText?: string;
  meals: ParsedMeal[];
  closingText?: string;
  budgetInfo?: string;
}

/**
 * Strip markdown syntax from text while preserving readable content.
 * Removes: ---, ##, **, *, >, etc.
 */
function cleanMarkdown(text: string): string {
  return text
    .replace(/^---+\s*/gm, '')           // Horizontal rules
    .replace(/^#{1,6}\s*/gm, '')          // Headers (## , ### , etc.)
    .replace(/\*\*([^*]+)\*\*/g, '$1')    // Bold **text** -> text
    .replace(/\*([^*]+)\*/g, '$1')        // Italic *text* -> text
    .replace(/^>\s*/gm, '')               // Blockquotes
    .replace(/`([^`]+)`/g, '$1')          // Inline code
    .replace(/\n{3,}/g, '\n\n')           // Collapse excess newlines
    .trim();
}

// Day names for context tracking
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Parse AI response text to extract structured meal data
 */
export function parseMealPlan(text: string): ParsedMealPlan {
  const lines = text.split('\n');
  const meals: ParsedMeal[] = [];
  let budgetInfo = '';
  let currentMeal: ParsedMeal | null = null;
  let currentSection: 'ingredients' | 'instructions' | 'tips' | null = null;
  let inMealBlock = false;
  let introLines: string[] = [];
  let closingLines: string[] = [];
  let captureClosing = false;

  // Track current day and meal type across lines for context
  let currentDay = '';
  let currentMealType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      if (currentSection) currentSection = null;
      continue;
    }

    // Skip pure markdown formatting lines (---, ===, etc.)
    if (/^[-=]{3,}$/.test(line)) {
      continue;
    }

    // Detect budget / cost-per-serving information
    if (line.includes('Budget') || line.includes('💰') || /Cost per serving/i.test(line) || /💲/.test(line)) {
      budgetInfo += line.replace(/^\*\*|\*\*$/g, '').replace(/^#+\s*/, '') + '\n';
      continue;
    }

    // --- Day detection ---
    // Pattern: "## **Monday**", "## Monday", "### Monday", "**Monday**", "Monday:"
    const dayHeaderMatch = line.match(
      /^(?:#{1,3}\s*)?(?:\*\*)?(?:Day \d+:\s*)?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\*\*)?(?:\s*[-:]\s*(.*))?$/i
    );
    if (dayHeaderMatch) {
      currentDay = dayHeaderMatch[1].charAt(0).toUpperCase() + dayHeaderMatch[1].slice(1).toLowerCase();
      currentMealType = ''; // Reset meal type for new day
      // If there's a theme after the day name (e.g., "Monday - Italian Night"), skip it
      continue;
    }

    // --- Meal type detection ---
    // Pattern: "### **Breakfast**", "### Breakfast", "**Breakfast**", "Breakfast:", "**Breakfast:**"
    const mealTypeMatch = line.match(
      /^(?:#{1,3}\s*)?(?:\*\*)?(Breakfast|Lunch|Dinner|Snack)(?:\*\*)?:?\s*$/i
    );
    if (mealTypeMatch) {
      currentMealType = mealTypeMatch[1].toLowerCase();
      continue;
    }

    // --- Emoji meal name detection ---
    // This is the primary way we identify a new meal: an emoji followed by the meal name
    const emojiMealMatch = line.match(
      /^([🍽️🥘🍲🥗🍜🍝🥙🌮🍕🍔🥪🍛🍱🥟🍳🥓🍗🍖🥩🍤🦐🦞🦀🐟🥚🧀🥐🥖🥨🥯🥞🧇🥣🌯🫔🥧🍰🧁🥗🫕🍿🥜🫘🥕🥦🥒🌽🫑🧄🧅🍄🥑🫛]+)\s+(.+)$/
    );

    if (emojiMealMatch) {
      // Save previous meal
      if (currentMeal && currentMeal.name) {
        meals.push(currentMeal);
        captureClosing = true;
      }

      inMealBlock = true;
      currentSection = null;

      const emoji = emojiMealMatch[1];
      const mealName = emojiMealMatch[2].replace(/^\*\*|\*\*$/g, '').replace(/\*\*/g, '');

      // If we don't have a current meal type, look back up to 5 lines for context
      if (!currentMealType) {
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          const prevLine = lines[j].trim().toLowerCase();
          for (const mt of MEAL_TYPES) {
            if (prevLine.includes(mt)) {
              currentMealType = mt;
              break;
            }
          }
          if (currentMealType) break;
        }
      }

      // If we don't have a current day, look back up to 10 lines for context
      if (!currentDay) {
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          const prevLine = lines[j].trim().toLowerCase();
          for (const dn of DAY_NAMES) {
            if (prevLine.includes(dn)) {
              currentDay = dn.charAt(0).toUpperCase() + dn.slice(1);
              break;
            }
          }
          if (currentDay) break;
        }
      }

      currentMeal = {
        name: mealName,
        emoji: emoji || '🍽️',
        day: currentDay || undefined,
        mealType: currentMealType || undefined,
      };

      continue;
    }

    // --- Also detect "**Meal Name**" style without emoji (bold-only meal names) ---
    // Only if we already have a meal type context set (prevents false positives)
    const boldMealMatch: RegExpMatchArray | null = (currentMealType && !currentMeal) ? line.match(/^\*\*([^*]+)\*\*$/) : null;
    if (boldMealMatch && !isSectionHeaderLine(line)) {
      if (currentMeal && currentMeal.name) {
        meals.push(currentMeal);
        captureClosing = true;
      }

      inMealBlock = true;
      currentSection = null;

      currentMeal = {
        name: boldMealMatch[1],
        emoji: getMealTypeEmoji(currentMealType),
        day: currentDay || undefined,
        mealType: currentMealType || undefined,
      };

      continue;
    }

    // If we haven't started any meal block yet, capture as intro text
    if (!inMealBlock) {
      // Filter out markdown-only lines from intro
      if (!isMarkdownOnlyLine(line)) {
        introLines.push(line);
      }
      continue;
    }

    // --- Parse meal details ---
    if (currentMeal) {
      // Time indicators (various formats)
      const timeMatch = line.match(/⏱️?\s*Prep:\s*([^|,]+)\s*[|,]\s*Cook:\s*(.+)/i) ||
                       line.match(/Prep:\s*([^|,]+)\s*[|,]\s*Cook:\s*(.+)/i) ||
                       line.match(/Time:\s*([^|,]+)\s*[|,]\s*(.+)/i);
      if (timeMatch) {
        currentMeal.prepTime = timeMatch[1].trim().replace(/\*\*/g, '');
        currentMeal.cookTime = timeMatch[2].trim().replace(/\*\*/g, '');
        continue;
      }

      // Separate prep/cook time lines
      const prepOnlyMatch = line.match(/⏱️?\s*Prep(?:\s*(?:time|Time))?:\s*(.+)/i);
      if (prepOnlyMatch && !currentMeal.prepTime) {
        currentMeal.prepTime = prepOnlyMatch[1].trim().replace(/\*\*/g, '');
        continue;
      }

      const cookOnlyMatch = line.match(/🔥?\s*Cook(?:\s*(?:time|Time))?:\s*(.+)/i);
      if (cookOnlyMatch && !currentMeal.cookTime) {
        currentMeal.cookTime = cookOnlyMatch[1].trim().replace(/\*\*/g, '');
        continue;
      }

      // Cost
      const costMatch = line.match(/[💰💲$]?\s*Cost.*?[:~]\s*[~$]?\s*\$?([0-9.]+)/i) ||
                       line.match(/Cost per serving.*?[:~]\s*[~$]?\s*\$?([0-9.]+)/i);
      if (costMatch) {
        currentMeal.cost = costMatch[1];
        continue;
      }

      // Servings
      const servingsMatch = line.match(/Serves?:?\s*(\d+)/i);
      if (servingsMatch) {
        currentMeal.servings = servingsMatch[1];
        continue;
      }

      // Difficulty
      const difficultyMatch = line.match(/Difficulty:\s*(easy|medium|hard|beginner|intermediate|advanced)/i);
      if (difficultyMatch) {
        currentMeal.difficulty = difficultyMatch[1];
        continue;
      }

      // Why it works
      const whyMatch = line.match(/[✨⭐]?\s*Why.*?:\s*(.+)/i);
      if (whyMatch && !line.match(/^(Ingredients|Instructions|Pro Tips?|Storage|Nutrition)/i)) {
        currentMeal.whyItWorks = whyMatch[1].replace(/\*\*/g, '');
        continue;
      }

      // Section headers
      if (line.match(/^(#{2,3}\s*)?(\*\*)?Ingredients(\*\*)?:?/i)) {
        currentSection = 'ingredients';
        currentMeal.ingredients = [];
        continue;
      }

      if (line.match(/^(#{2,3}\s*)?(\*\*)?Instructions(\*\*)?:?/i) || line.match(/^(#{2,3}\s*)?(\*\*)?Directions(\*\*)?:?/i)) {
        currentSection = 'instructions';
        currentMeal.instructions = [];
        continue;
      }

      if (line.match(/^(💡\s*)?(\*\*)?Pro Tips?(\*\*)?:?/i) || line.match(/^Tips?:?/i)) {
        currentSection = 'tips';
        currentMeal.proTips = [];
        continue;
      }

      if (line.match(/^(📦\s*)?(\*\*)?Storage(\*\*)?:?/i)) {
        const storageContent = line.replace(/^(📦\s*)?(\*\*)?Storage(\*\*)?:?\s*/i, '');
        if (storageContent) {
          currentMeal.storage = storageContent.replace(/\*\*/g, '');
        }
        continue;
      }

      // Nutrition info
      if (line.match(/Nutrition/i) || line.match(/Calories/i)) {
        currentMeal.nutrition = line.replace(/\*\*/g, '');
        continue;
      }

      // Parse section content (list items)
      if (currentSection === 'ingredients' && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\.?\s/))) {
        currentMeal.ingredients?.push(line.replace(/^[-•]\s*/, '').replace(/^\d+\.?\s*/, '').replace(/\*\*/g, ''));
        continue;
      }

      if (currentSection === 'instructions' && (line.startsWith('-') || line.match(/^\d+\.?\s/))) {
        currentMeal.instructions?.push(
          line.replace(/^[-•]\s*/, '').replace(/^\d+\.?\s*/, '').replace(/^\*\*(.+)\*\*:?\s*/, '$1: ')
        );
        continue;
      }

      if (currentSection === 'tips' && (line.startsWith('-') || line.startsWith('•'))) {
        currentMeal.proTips?.push(line.replace(/^[-•]\s*/, '').replace(/\*\*/g, ''));
        continue;
      }

      // Description (first non-structured line after meal name that isn't a section header)
      if (!currentMeal.description && !currentSection && !isSectionHeaderLine(line) && !isMarkdownOnlyLine(line)) {
        currentMeal.description = line.replace(/\*\*/g, '').replace(/^[:#>]+\s*/, '');
        continue;
      }
    }

    // Capture closing text after all meals
    if (captureClosing && !isSectionHeaderLine(line) && !line.startsWith('-') && !line.match(/^\d+\./) && !isMarkdownOnlyLine(line)) {
      closingLines.push(line);
    }
  }

  // Save last meal
  if (currentMeal && currentMeal.name) {
    meals.push(currentMeal);
  }

  // Clean up intro and closing text - strip remaining markdown
  const introText = cleanMarkdown(introLines.join('\n'));
  const closingText = cleanMarkdown(closingLines.join('\n'));

  return {
    hasMeals: meals.length > 0,
    introText: introText || undefined,
    meals,
    closingText: closingText || undefined,
    budgetInfo: budgetInfo ? cleanMarkdown(budgetInfo) : undefined,
  };
}

/**
 * Check if a line is purely markdown formatting (no useful text content)
 */
function isMarkdownOnlyLine(line: string): boolean {
  const stripped = line
    .replace(/^#{1,6}\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/^[-=]{3,}$/, '')
    .replace(/^>\s*/, '')
    .trim();

  // If stripping markdown leaves nothing meaningful, it's markdown-only
  if (!stripped) return true;

  // If the remaining text is just a day name or meal type by itself, skip it
  if (DAY_NAMES.includes(stripped.toLowerCase()) || MEAL_TYPES.includes(stripped.toLowerCase())) return true;

  return false;
}

/**
 * Check if line is a section header like **Ingredients:**, **Instructions:**, etc.
 */
function isSectionHeaderLine(line: string): boolean {
  return /^(#{1,3}\s*)?(\*\*)?(Ingredients|Instructions|Directions|Pro Tips?|Storage|Nutrition|Calories)(\*\*)?:?/i.test(line);
}

/**
 * Get a default emoji for a meal type
 */
function getMealTypeEmoji(mealType: string): string {
  switch (mealType.toLowerCase()) {
    case 'breakfast': return '🍳';
    case 'lunch': return '🥗';
    case 'dinner': return '🍽️';
    case 'snack': return '🥜';
    default: return '🍽️';
  }
}

/**
 * Detect if text contains a meal plan structure
 */
export function isMealPlan(text: string): boolean {
  // Must have meal emoji AND timing/cost info to be considered a meal plan
  const hasMealEmoji = /[🍽️🥘🍲🥗🍜🍝🥙🌮🍕🍔🥪🍛🍱🥟🍳🥣🌯🫔🥧]/.test(text);
  const hasTimingInfo = /Prep:\s*\d+/i.test(text) || /Cook:\s*\d+/i.test(text);
  const hasCostInfo = /Cost.*\$\d/i.test(text) || /\$\d+\.\d+/.test(text) || /Cost per serving/i.test(text);
  const hasIngredients = /Ingredients:/i.test(text);
  const hasInstructions = /Instructions:/i.test(text) || /Directions:/i.test(text);

  // Strong indicators: emoji + (timing OR cost) + (ingredients OR instructions)
  if (hasMealEmoji && (hasTimingInfo || hasCostInfo) && (hasIngredients || hasInstructions)) {
    return true;
  }

  // Medium indicators: Must have at least 3 of these
  const indicators = [
    hasMealEmoji,
    hasTimingInfo,
    hasCostInfo,
    hasIngredients,
    hasInstructions
  ];

  return indicators.filter(Boolean).length >= 3;
}
