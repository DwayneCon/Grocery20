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
 * Parse AI response text to extract structured meal data
 */
export function parseMealPlan(text: string): ParsedMealPlan {
  const lines = text.split('\n');
  const meals: ParsedMeal[] = [];
  let introText = '';
  let closingText = '';
  let budgetInfo = '';
  let currentMeal: ParsedMeal | null = null;
  let currentSection: 'ingredients' | 'instructions' | 'tips' | null = null;
  let inMealBlock = false;
  let introLines: string[] = [];
  let closingLines: string[] = [];
  let captureClosing = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      if (currentSection) currentSection = null;
      continue;
    }

    // Detect budget information
    if (line.includes('Budget') || line.includes('💰')) {
      budgetInfo += line + '\n';
      continue;
    }

    // Detect meal header patterns
    // Pattern 1: "Breakfast:", "Lunch:", "Dinner:" (standalone)
    const mealTypeHeaderMatch = line.match(/^(Breakfast|Lunch|Dinner|Snack):\s*$/i);

    // Pattern 2: "Monday: Italian Night" or "Tuesday: Taco Tuesday"
    const dayThemeMatch = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*(.+)$/i);

    // Pattern 3: "## Recipe Name" or "# Recipe Name"
    const recipeHeaderMatch = line.match(/^#{1,3}\s+(.+)$/);

    // Check if this is a section header (not a meal name)
    const isSectionHeader = /^(Ingredients|Instructions|Pro Tips?|Storage|Nutrition):/i.test(line);
    const isCategoryHeader = /^\*\*(Breakfast|Lunch|Dinner|Snack)\*\*$/i.test(line);

    // Check if this looks like a meal name (has emoji or is bold, but NOT a section/category header)
    const possibleMealName = !isSectionHeader && !isCategoryHeader && (
      line.match(/^([🍽️🥘🍲🥗🍜🍝🥙🌮🍕🍔🥪🍛🍱🥟🍳]+)\s+(.+)$/) ||
      line.match(/^\*\*(.+)\*\*$/) ||
      recipeHeaderMatch
    );

    // Handle meal type headers (like "Breakfast:" or "Lunch:" or "**Breakfast**")
    if (mealTypeHeaderMatch || isCategoryHeader) {
      // This is just a category header, not a meal itself
      const nextMealType = mealTypeHeaderMatch ? mealTypeHeaderMatch[1] : line.match(/^\*\*(Breakfast|Lunch|Dinner|Snack)\*\*$/i)?.[1];
      // Store for next meal and skip this line
      continue;
    }

    // Detect start of a meal section
    if (possibleMealName || dayThemeMatch) {
      // Save previous meal if exists
      if (currentMeal && currentMeal.name) {
        meals.push(currentMeal);
        captureClosing = true; // Start capturing closing text after first meal found
      }

      inMealBlock = true;
      currentSection = null;

      // Extract meal name
      let mealName = '';
      let emoji = '';
      let dayName = '';

      if (dayThemeMatch) {
        // "Monday: Italian Night" format
        dayName = dayThemeMatch[1];
        // Don't use the theme as the meal name, let the next line with emoji be the name
        continue;
      }

      if (possibleMealName) {
        if (possibleMealName[2]) {
          emoji = possibleMealName[1];
          mealName = possibleMealName[2];
        } else if (possibleMealName[1]) {
          mealName = possibleMealName[1];
        }
      }

      // Look ahead to next line to determine meal type from context
      const lookAheadContext = lines[i - 1]?.toLowerCase() || '';
      let mealType = '';
      if (lookAheadContext.includes('breakfast')) mealType = 'breakfast';
      else if (lookAheadContext.includes('lunch')) mealType = 'lunch';
      else if (lookAheadContext.includes('dinner')) mealType = 'dinner';

      currentMeal = {
        name: mealName,
        emoji: emoji || '🍽️',
        day: dayName || undefined,
        mealType: mealType || undefined,
      };

      continue;
    }

    // If we haven't started a meal block yet, it's intro text
    if (!inMealBlock) {
      introLines.push(line);
      continue;
    }

    // Parse meal details
    if (currentMeal) {
      // Time indicators
      const timeMatch = line.match(/⏱️\s*Prep:\s*([^|]+)\s*\|\s*Cook:\s*(.+)/i) ||
                       line.match(/Prep:\s*([^|]+)\s*\|\s*Cook:\s*(.+)/i) ||
                       line.match(/Time:\s*([^|]+)\s*\|\s*(.+)/i);
      if (timeMatch) {
        currentMeal.prepTime = timeMatch[1].trim();
        currentMeal.cookTime = timeMatch[2].trim();
        continue;
      }

      // Cost
      const costMatch = line.match(/💰\s*Cost.*?[:~]\s*\$?([0-9.]+)/i) ||
                       line.match(/Cost.*?[:~]\s*\$?([0-9.]+)/i);
      if (costMatch) {
        currentMeal.cost = costMatch[1];
        continue;
      }

      // Servings
      const servingsMatch = line.match(/Serves?:\s*(\d+)/i);
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
      const whyMatch = line.match(/✨\s*Why.*?:\s*(.+)/i) ||
                      line.match(/Why.*?:\s*(.+)/i);
      if (whyMatch) {
        currentMeal.whyItWorks = whyMatch[1];
        continue;
      }

      // Description (first non-structured line after meal name)
      if (!currentMeal.description && !currentSection && !line.startsWith('**') && !line.match(/^[🍽️💰⏱️✨📦💡#]/)) {
        currentMeal.description = line;
        continue;
      }

      // Section headers (more flexible matching)
      if (line.match(/^(#{2,3}\s*)?(\*\*)?Ingredients(\*\*)?:?/i)) {
        currentSection = 'ingredients';
        currentMeal.ingredients = [];
        continue;
      }

      if (line.match(/^(#{2,3}\s*)?(\*\*)?Instructions(\*\*)?:?/i)) {
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
          currentMeal.storage = storageContent;
        }
        continue;
      }

      // Nutrition info
      if (line.match(/Nutrition/i) || line.match(/Calories/i)) {
        currentMeal.nutrition = line;
        continue;
      }

      // Parse section content
      if (currentSection === 'ingredients' && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\.?\s/))) {
        currentMeal.ingredients?.push(line.replace(/^[-•]\s*/, '').replace(/^\d+\.?\s*/, ''));
        continue;
      }

      if (currentSection === 'instructions' && (line.startsWith('-') || line.match(/^\d+\.?\s/))) {
        currentMeal.instructions?.push(line.replace(/^[-•]\s*/, '').replace(/^\d+\.?\s*/, '').replace(/^\*\*(.+)\*\*:?\s*/, '$1: '));
        continue;
      }

      if (currentSection === 'tips' && (line.startsWith('-') || line.startsWith('•'))) {
        currentMeal.proTips?.push(line.replace(/^[-•]\s*/, ''));
        continue;
      }
    }

    // Capture closing text after meals
    if (captureClosing && !line.match(/^[🍽️💰⏱️✨📦💡#]/) && !line.startsWith('-') && !line.match(/^\d+\./)) {
      closingLines.push(line);
    }
  }

  // Save last meal
  if (currentMeal && currentMeal.name) {
    meals.push(currentMeal);
  }

  introText = introLines.join('\n').trim();
  closingText = closingLines.join('\n').trim();

  return {
    hasMeals: meals.length > 0,
    introText: introText || undefined,
    meals,
    closingText: closingText || undefined,
    budgetInfo: budgetInfo || undefined,
  };
}

/**
 * Detect if text contains a meal plan structure
 */
export function isMealPlan(text: string): boolean {
  // Must have meal emoji AND timing/cost info to be considered a meal plan
  const hasMealEmoji = /[🍽️🥘🍲🥗🍜🍝🥙🌮🍕🍔🥪🍛🍱🥟🍳]/.test(text);
  const hasTimingInfo = /Prep:\s*\d+/i.test(text) || /Cook:\s*\d+/i.test(text);
  const hasCostInfo = /Cost.*\$\d/i.test(text) || /\$\d+\.\d+/.test(text);
  const hasIngredients = /Ingredients:/i.test(text);
  const hasInstructions = /Instructions:/i.test(text);

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

  const matchCount = indicators.filter(Boolean).length;

  // Require at least 3 strong indicators to avoid false positives
  return matchCount >= 3;
}
