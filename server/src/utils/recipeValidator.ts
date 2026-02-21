/* server/src/utils/recipeValidator.ts */

/**
 * Recipe Validation Utility
 * Ensures AI-generated recipes include all essential ingredients
 */

export interface RecipeValidationResult {
  isValid: boolean;
  missingCategories: string[];
  warnings: string[];
  score: number; // 0-100, quality score
}

interface RecipeIngredient {
  name: string;
  amount?: string;
  unit?: string;
}

/**
 * Common essential ingredients categorized by type
 */
const ESSENTIAL_INGREDIENTS = {
  // Cooking fats - at least one should be present
  cookingFats: [
    'oil', 'olive oil', 'vegetable oil', 'canola oil', 'butter', 'ghee', 'lard',
    'coconut oil', 'avocado oil', 'sesame oil', 'cooking spray'
  ],

  // Basic seasonings - salt and pepper are almost always needed
  basicSeasonings: [
    'salt', 'kosher salt', 'sea salt', 'black pepper', 'white pepper',
    'pepper', 'ground pepper'
  ],

  // Aromatics - most savory dishes need at least one
  aromatics: [
    'onion', 'garlic', 'shallot', 'ginger', 'scallion', 'green onion',
    'leek', 'chive'
  ],

  // Liquid components - many dishes need liquid
  liquids: [
    'broth', 'stock', 'water', 'wine', 'beer', 'milk', 'cream',
    'coconut milk', 'juice', 'sauce'
  ],

  // Acid components - brighten flavors
  acids: [
    'lemon', 'lime', 'vinegar', 'wine', 'tomato', 'yogurt', 'sour cream'
  ],
};

/**
 * Check if ingredient list contains any item from a category
 */
function hasIngredientFrom(ingredients: RecipeIngredient[], category: string[]): boolean {
  const ingredientNames = ingredients.map(ing => ing.name.toLowerCase());

  return category.some(item =>
    ingredientNames.some(name => name.includes(item.toLowerCase()))
  );
}

/**
 * Check if recipe name suggests it needs certain ingredients
 */
function getExpectedIngredients(recipeName: string): string[] {
  const name = recipeName.toLowerCase();
  const expected: string[] = [];

  // Dishes that definitely need broth/stock
  if (name.includes('soup') || name.includes('stew') || name.includes('risotto') ||
      name.includes('curry') || name.includes('braised')) {
    expected.push('broth or stock');
  }

  // Dishes that need thickeners
  if (name.includes('gravy') || name.includes('sauce') || name.includes('stroganoff') ||
      name.includes('creamy')) {
    expected.push('flour or cornstarch (for thickening)');
  }

  // Italian dishes
  if (name.includes('pasta') || name.includes('pizza') || name.includes('italian')) {
    if (!name.includes('aglio e olio') && !name.includes('cacio e pepe')) {
      expected.push('garlic');
    }
  }

  // Asian dishes
  if (name.includes('stir fry') || name.includes('fried rice') || name.includes('teriyaki') ||
      name.includes('chinese') || name.includes('thai') || name.includes('asian')) {
    expected.push('soy sauce or similar umami sauce');
    expected.push('ginger and/or garlic');
  }

  // Mexican dishes
  if (name.includes('taco') || name.includes('burrito') || name.includes('enchilada') ||
      name.includes('mexican') || name.includes('salsa')) {
    expected.push('cumin or chili powder');
  }

  return expected;
}

/**
 * Validate a recipe's ingredient list for completeness
 */
export function validateRecipe(
  recipeName: string,
  ingredients: RecipeIngredient[]
): RecipeValidationResult {
  const result: RecipeValidationResult = {
    isValid: true,
    missingCategories: [],
    warnings: [],
    score: 100,
  };

  // Minimum ingredient count check
  if (ingredients.length < 5) {
    result.warnings.push(
      `Recipe only has ${ingredients.length} ingredients - most complete recipes need at least 5-8 ingredients`
    );
    result.score -= 20;
  }

  // Check for cooking fat (unless it's a no-cook recipe)
  const noCookRecipes = ['salad', 'smoothie', 'overnight oats', 'no-bake'];
  const isNoCook = noCookRecipes.some(term => recipeName.toLowerCase().includes(term));

  if (!isNoCook && !hasIngredientFrom(ingredients, ESSENTIAL_INGREDIENTS.cookingFats)) {
    result.missingCategories.push('cooking fat (oil, butter, etc.)');
    result.score -= 25;
  }

  // Check for basic seasonings (salt/pepper)
  const hasSalt = hasIngredientFrom(ingredients, ESSENTIAL_INGREDIENTS.basicSeasonings.filter(s => s.includes('salt')));
  const hasPepper = hasIngredientFrom(ingredients, ESSENTIAL_INGREDIENTS.basicSeasonings.filter(s => s.includes('pepper')));

  if (!hasSalt && !isNoCook) {
    result.missingCategories.push('salt');
    result.score -= 20;
  }

  if (!hasPepper && !isNoCook) {
    result.warnings.push('No pepper specified - most savory dishes benefit from black pepper');
    result.score -= 5;
  }

  // Check for aromatics in savory dishes
  const isSavory = !recipeName.toLowerCase().match(/dessert|cake|cookie|sweet|breakfast|oatmeal|smoothie/);
  if (isSavory && !hasIngredientFrom(ingredients, ESSENTIAL_INGREDIENTS.aromatics)) {
    result.warnings.push('No aromatics (garlic, onion, etc.) - savory dishes usually need flavor base');
    result.score -= 10;
  }

  // Check recipe-specific expected ingredients
  const expectedIngredients = getExpectedIngredients(recipeName);
  expectedIngredients.forEach(expected => {
    result.warnings.push(`Recipe name suggests this might need: ${expected}`);
  });

  // Check for liquid components in appropriate dishes
  const needsLiquid = recipeName.toLowerCase().match(/soup|stew|curry|braised|sauce|stroganoff/);
  if (needsLiquid && !hasIngredientFrom(ingredients, ESSENTIAL_INGREDIENTS.liquids)) {
    result.missingCategories.push('liquid component (broth, stock, water, etc.)');
    result.score -= 25;
  }

  // Determine overall validity
  result.isValid = result.score >= 70 && result.missingCategories.length === 0;

  return result;
}

/**
 * Get a human-readable validation message
 */
export function getValidationMessage(validation: RecipeValidationResult): string {
  if (validation.isValid && validation.warnings.length === 0) {
    return '✅ Recipe looks complete!';
  }

  let message = '';

  if (validation.missingCategories.length > 0) {
    message += `❌ Missing essential ingredients: ${validation.missingCategories.join(', ')}\n`;
  }

  if (validation.warnings.length > 0) {
    message += `⚠️ Warnings:\n${validation.warnings.map(w => `  - ${w}`).join('\n')}`;
  }

  message += `\n\nQuality Score: ${validation.score}/100`;

  return message;
}
