export interface Substitution {
  original: string;
  substitute: string;
  ratio: string;
  notes: string;
  dietary?: string[];
}

export const substitutionMap: Record<string, Substitution[]> = {
  'butter': [
    { original: 'butter', substitute: 'coconut oil', ratio: '1:1', notes: 'Works for baking and sauteing', dietary: ['dairy-free', 'vegan'] },
    { original: 'butter', substitute: 'olive oil', ratio: '1 tbsp : 3/4 tbsp', notes: 'Best for savory dishes', dietary: ['dairy-free', 'vegan'] },
    { original: 'butter', substitute: 'applesauce', ratio: '1:1', notes: 'For baking, reduces fat', dietary: ['dairy-free', 'vegan', 'low-fat'] },
    { original: 'butter', substitute: 'avocado', ratio: '1:1', notes: 'Creamy texture for baking', dietary: ['dairy-free', 'vegan'] },
  ],
  'milk': [
    { original: 'milk', substitute: 'oat milk', ratio: '1:1', notes: 'Creamy, good for baking', dietary: ['dairy-free', 'vegan'] },
    { original: 'milk', substitute: 'almond milk', ratio: '1:1', notes: 'Lighter, slight nutty flavor', dietary: ['dairy-free', 'vegan'] },
    { original: 'milk', substitute: 'coconut milk', ratio: '1:1', notes: 'Rich, adds coconut flavor', dietary: ['dairy-free', 'vegan'] },
  ],
  'eggs': [
    { original: 'eggs', substitute: 'flax egg (1 tbsp ground flax + 3 tbsp water)', ratio: '1 egg : 1 flax egg', notes: 'Let sit 5 min to gel', dietary: ['vegan', 'egg-free'] },
    { original: 'eggs', substitute: 'mashed banana', ratio: '1 egg : 1/4 cup', notes: 'Adds sweetness, good for muffins', dietary: ['vegan', 'egg-free'] },
    { original: 'eggs', substitute: 'applesauce', ratio: '1 egg : 1/4 cup', notes: 'Neutral flavor for baking', dietary: ['vegan', 'egg-free'] },
  ],
  'flour': [
    { original: 'flour', substitute: 'almond flour', ratio: '1:1', notes: 'Gluten-free, denser texture', dietary: ['gluten-free'] },
    { original: 'flour', substitute: 'oat flour', ratio: '1:1', notes: 'Blend oats into flour', dietary: ['gluten-free'] },
    { original: 'flour', substitute: 'coconut flour', ratio: '1 cup : 1/3 cup', notes: 'Very absorbent, add more liquid', dietary: ['gluten-free'] },
  ],
  'sugar': [
    { original: 'sugar', substitute: 'honey', ratio: '1 cup : 3/4 cup', notes: 'Reduce other liquids slightly', dietary: [] },
    { original: 'sugar', substitute: 'maple syrup', ratio: '1 cup : 3/4 cup', notes: 'Adds maple flavor', dietary: ['vegan'] },
    { original: 'sugar', substitute: 'stevia', ratio: '1 cup : 1 tsp', notes: 'Zero calories, very concentrated', dietary: ['low-sugar'] },
  ],
  'sour cream': [
    { original: 'sour cream', substitute: 'Greek yogurt', ratio: '1:1', notes: 'Higher protein, tangier', dietary: [] },
    { original: 'sour cream', substitute: 'cashew cream', ratio: '1:1', notes: 'Soak cashews, blend smooth', dietary: ['dairy-free', 'vegan'] },
  ],
  'heavy cream': [
    { original: 'heavy cream', substitute: 'coconut cream', ratio: '1:1', notes: 'Chill can, use solid part', dietary: ['dairy-free', 'vegan'] },
    { original: 'heavy cream', substitute: 'evaporated milk', ratio: '1:1', notes: 'Lower fat alternative', dietary: [] },
  ],
  'soy sauce': [
    { original: 'soy sauce', substitute: 'coconut aminos', ratio: '1:1', notes: 'Lower sodium, slightly sweeter', dietary: ['soy-free', 'gluten-free'] },
    { original: 'soy sauce', substitute: 'tamari', ratio: '1:1', notes: 'Gluten-free soy sauce alternative', dietary: ['gluten-free'] },
  ],
  'pasta': [
    { original: 'pasta', substitute: 'zucchini noodles', ratio: '1:1', notes: 'Low-carb, spiralize fresh', dietary: ['gluten-free', 'low-carb'] },
    { original: 'pasta', substitute: 'rice noodles', ratio: '1:1', notes: 'Gluten-free, lighter texture', dietary: ['gluten-free'] },
  ],
  'rice': [
    { original: 'rice', substitute: 'cauliflower rice', ratio: '1:1', notes: 'Low-carb, pulse cauliflower in food processor', dietary: ['low-carb', 'gluten-free'] },
    { original: 'rice', substitute: 'quinoa', ratio: '1:1', notes: 'Higher protein, complete amino acids', dietary: ['gluten-free'] },
  ],
  'breadcrumbs': [
    { original: 'breadcrumbs', substitute: 'crushed pork rinds', ratio: '1:1', notes: 'Keto-friendly coating', dietary: ['gluten-free', 'low-carb'] },
    { original: 'breadcrumbs', substitute: 'almond flour', ratio: '1:1', notes: 'Gluten-free, nutty flavor', dietary: ['gluten-free'] },
  ],
  'cheese': [
    { original: 'cheese', substitute: 'nutritional yeast', ratio: '1 cup : 1/4 cup', notes: 'Cheesy flavor, sprinkle on top', dietary: ['dairy-free', 'vegan'] },
    { original: 'cheese', substitute: 'cashew cheese', ratio: '1:1', notes: 'Soak cashews, blend with lemon + nutritional yeast', dietary: ['dairy-free', 'vegan'] },
  ],
  'cream cheese': [
    { original: 'cream cheese', substitute: 'cashew cream cheese', ratio: '1:1', notes: 'Blend soaked cashews with lemon juice', dietary: ['dairy-free', 'vegan'] },
    { original: 'cream cheese', substitute: 'silken tofu', ratio: '1:1', notes: 'Blend until smooth, add salt', dietary: ['dairy-free', 'vegan'] },
  ],
  'mayonnaise': [
    { original: 'mayonnaise', substitute: 'Greek yogurt', ratio: '1:1', notes: 'Lower fat, tangy', dietary: [] },
    { original: 'mayonnaise', substitute: 'mashed avocado', ratio: '1:1', notes: 'Creamy, healthy fats', dietary: ['egg-free', 'vegan'] },
  ],
  'chicken broth': [
    { original: 'chicken broth', substitute: 'vegetable broth', ratio: '1:1', notes: 'Direct swap for any recipe', dietary: ['vegan', 'vegetarian'] },
    { original: 'chicken broth', substitute: 'mushroom broth', ratio: '1:1', notes: 'Rich umami flavor', dietary: ['vegan', 'vegetarian'] },
  ],
  'ground beef': [
    { original: 'ground beef', substitute: 'ground turkey', ratio: '1:1', notes: 'Leaner, milder flavor', dietary: [] },
    { original: 'ground beef', substitute: 'lentils', ratio: '1 lb : 2 cups cooked', notes: 'High protein, works in tacos/sauces', dietary: ['vegan', 'vegetarian'] },
  ],
  'white rice': [
    { original: 'white rice', substitute: 'brown rice', ratio: '1:1', notes: 'More fiber, longer cook time', dietary: ['whole-grain'] },
    { original: 'white rice', substitute: 'cauliflower rice', ratio: '1:1', notes: 'Low-carb alternative', dietary: ['low-carb', 'gluten-free'] },
  ],
  'tortillas': [
    { original: 'tortillas', substitute: 'lettuce wraps', ratio: '1:1', notes: 'Low-carb, use large leaves', dietary: ['gluten-free', 'low-carb'] },
    { original: 'tortillas', substitute: 'corn tortillas', ratio: '1:1', notes: 'Gluten-free option', dietary: ['gluten-free'] },
  ],
};

/**
 * Find substitutions for an ingredient name.
 * Matches on partial/fuzzy names (e.g., "whole milk" matches "milk").
 */
export const findSubstitutions = (ingredientName: string): Substitution[] => {
  const lower = ingredientName.toLowerCase().trim();

  // Direct match first
  if (substitutionMap[lower]) return substitutionMap[lower];

  // Partial match: check if any key is contained in the ingredient name
  for (const [key, subs] of Object.entries(substitutionMap)) {
    if (lower.includes(key) || key.includes(lower)) {
      return subs;
    }
  }

  return [];
};
