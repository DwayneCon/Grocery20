import { describe, it, expect } from 'vitest';
import { parseMealPlan, isMealPlan } from '../mealParser';

describe('parseMealPlan', () => {
  it('should return empty meals for non-meal text', () => {
    const result = parseMealPlan('Hello! How can I help you today?');

    expect(result.hasMeals).toBe(false);
    expect(result.meals).toEqual([]);
  });

  it('should return empty meals for plain conversational text', () => {
    const result = parseMealPlan(
      'I recommend trying some healthy recipes. Let me know your preferences.'
    );

    expect(result.hasMeals).toBe(false);
    expect(result.meals).toHaveLength(0);
  });

  it('should parse a meal card with emoji format', () => {
    const text = `Here's a great recipe for you!

\u{1F373} **Scrambled Eggs**
\u2B50\uFE0F Prep: 5 min | Cook: 10 min
\u{1F4B0} Cost: $3.50
Serves: 4

**Ingredients:**
- 4 eggs
- Salt and pepper
- Butter

**Instructions:**
1. Crack eggs into a bowl
2. Whisk with salt and pepper
3. Cook in buttered pan`;

    const result = parseMealPlan(text);

    expect(result.hasMeals).toBe(true);
    expect(result.meals.length).toBeGreaterThanOrEqual(1);

    const meal = result.meals[0];
    expect(meal.name).toContain('Scrambled Eggs');
    expect(meal.emoji).toBeDefined();
  });

  it('should parse multiple meals', () => {
    const text = `## **Monday**
### **Breakfast**
\u{1F373} **Pancakes**
Prep: 10 min | Cook: 15 min

### **Lunch**
\u{1F96A} **Turkey Sandwich**
Prep: 5 min | Cook: 0 min

### **Dinner**
\u{1F35D} **Spaghetti Bolognese**
Prep: 15 min | Cook: 30 min`;

    const result = parseMealPlan(text);

    expect(result.hasMeals).toBe(true);
    expect(result.meals.length).toBe(3);
  });

  it('should capture day information from headers', () => {
    const text = `## **Monday**
### **Breakfast**
\u{1F373} **Oatmeal Bowl**
Prep: 5 min | Cook: 10 min`;

    const result = parseMealPlan(text);

    expect(result.hasMeals).toBe(true);
    expect(result.meals[0].day).toBe('Monday');
  });

  it('should capture meal type from headers', () => {
    const text = `### **Dinner**
\u{1F35C} **Chicken Stir-Fry**
Prep: 10 min | Cook: 20 min`;

    const result = parseMealPlan(text);

    expect(result.hasMeals).toBe(true);
    expect(result.meals[0].mealType).toBe('dinner');
  });

  it('should parse cost information', () => {
    // Note: Cost lines with the money bag emoji are captured as budgetInfo
    // by the parser. Use plain "Cost:" format to test cost parsing on meals.
    const text = `\u{1F958} **Vegetable Curry**
Cost: ~$8.50
Serves: 4`;

    const result = parseMealPlan(text);

    expect(result.hasMeals).toBe(true);
    expect(result.meals[0].cost).toBe('8.50');
  });

  it('should parse servings information', () => {
    const text = `\u{1F957} **Caesar Salad**
Serves: 2`;

    const result = parseMealPlan(text);

    expect(result.hasMeals).toBe(true);
    expect(result.meals[0].servings).toBe('2');
  });

  it('should parse ingredients list', () => {
    const text = `\u{1F354} **Classic Burger**
**Ingredients:**
- Ground beef
- Burger buns
- Lettuce
- Tomato`;

    const result = parseMealPlan(text);

    expect(result.hasMeals).toBe(true);
    expect(result.meals[0].ingredients).toBeDefined();
    expect(result.meals[0].ingredients!.length).toBe(4);
    expect(result.meals[0].ingredients).toContain('Ground beef');
  });

  it('should parse instructions list', () => {
    const text = `\u{1F373} **Fried Eggs**
**Instructions:**
1. Heat pan with oil
2. Crack eggs into pan
3. Cook until whites are set`;

    const result = parseMealPlan(text);

    expect(result.hasMeals).toBe(true);
    expect(result.meals[0].instructions).toBeDefined();
    expect(result.meals[0].instructions!.length).toBe(3);
  });

  it('should capture budget information', () => {
    const text = `\u{1F4B0} Budget Summary: $45 total for the week

\u{1F958} **Lentil Soup**
Prep: 10 min | Cook: 30 min`;

    const result = parseMealPlan(text);

    expect(result.budgetInfo).toBeDefined();
    expect(result.budgetInfo).toContain('Budget');
  });

  it('should capture intro text before meals', () => {
    const text = `Here's your personalized meal plan for the week!

\u{1F373} **Morning Omelette**
Prep: 5 min | Cook: 10 min`;

    const result = parseMealPlan(text);

    expect(result.introText).toBeDefined();
    expect(result.introText).toContain('personalized meal plan');
  });
});

describe('isMealPlan', () => {
  it('should return false for plain text', () => {
    expect(isMealPlan('Hello, how are you?')).toBe(false);
  });

  it('should return false for text with only emojis but no structure', () => {
    expect(isMealPlan('\u{1F373} I love cooking!')).toBe(false);
  });

  it('should return true for text with emoji, ingredients, and instructions', () => {
    const text = `\u{1F373} **Scrambled Eggs**
**Ingredients:**
- Eggs
- Butter
**Instructions:**
1. Whisk eggs
2. Cook in pan`;

    expect(isMealPlan(text)).toBe(true);
  });

  it('should return true for text with emoji, timing, and ingredients', () => {
    const text = `\u{1F958} **Chicken Curry**
Prep: 15 min | Cook: 30 min
**Ingredients:**
- Chicken
- Curry paste`;

    expect(isMealPlan(text)).toBe(true);
  });

  it('should return true for text with emoji, cost, and instructions', () => {
    const text = `\u{1F354} **Burger**
\u{1F4B0} Cost: $5.00
**Instructions:**
1. Form patties
2. Grill`;

    expect(isMealPlan(text)).toBe(true);
  });

  it('should return false for text with only ingredients and no emoji', () => {
    const text = `**Ingredients:**
- Flour
- Sugar
- Butter`;

    expect(isMealPlan(text)).toBe(false);
  });
});
