/* client/src/utils/contextualMessages.ts */

/**
 * Contextual Messages for Nora
 *
 * Generates personalized, warm welcome messages based on:
 * - Time of day
 * - Day of week
 * - User history (meal plans, recent activity)
 * - Household context
 * - Season
 */

interface ContextualMessageParams {
  userName?: string;
  hasMealPlan?: boolean;
  hasShoppingList?: boolean;
  upcomingMealsCount?: number;
  expiringItemsCount?: number;
  lastVisit?: Date;
  householdMembersCount?: number;
}

/**
 * Get time-based greeting
 */
export const getTimeGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'Good evening';
  } else {
    return 'Hello';
  }
};

/**
 * Get day of week context
 */
export const getDayContext = (): { day: string; emoji: string; vibe: string } => {
  const dayOfWeek = new Date().getDay();

  const contexts = [
    { day: 'Sunday', emoji: '☕', vibe: 'lazy breakfast' },
    { day: 'Monday', emoji: '💪', vibe: 'energizing start' },
    { day: 'Tuesday', emoji: '🍽️', vibe: 'tasty inspiration' },
    { day: 'Wednesday', emoji: '🌟', vibe: 'midweek pick-me-up' },
    { day: 'Thursday', emoji: '🎉', vibe: 'almost-weekend vibes' },
    { day: 'Friday', emoji: '🍕', vibe: 'celebratory meal' },
    { day: 'Saturday', emoji: '🥘', vibe: 'cooking adventure' },
  ];

  return contexts[dayOfWeek];
};

/**
 * Get seasonal context
 */
export const getSeasonalContext = (): { season: string; ingredients: string[] } => {
  const month = new Date().getMonth();

  if (month >= 2 && month <= 4) {
    // Spring (Mar-May)
    return {
      season: 'spring',
      ingredients: ['asparagus', 'peas', 'strawberries', 'artichokes', 'fresh herbs'],
    };
  } else if (month >= 5 && month <= 7) {
    // Summer (Jun-Aug)
    return {
      season: 'summer',
      ingredients: ['tomatoes', 'corn', 'berries', 'zucchini', 'peaches'],
    };
  } else if (month >= 8 && month <= 10) {
    // Fall (Sep-Nov)
    return {
      season: 'fall',
      ingredients: ['pumpkin', 'squash', 'apples', 'brussels sprouts', 'sweet potatoes'],
    };
  } else {
    // Winter (Dec-Feb)
    return {
      season: 'winter',
      ingredients: ['root vegetables', 'citrus', 'kale', 'cabbage', 'pomegranates'],
    };
  }
};

/**
 * Generate contextual welcome message for chat
 */
export const generateChatWelcomeMessage = (params: ContextualMessageParams = {}): string => {
  const {
    userName,
    hasMealPlan = false,
    hasShoppingList = false,
    upcomingMealsCount = 0,
    expiringItemsCount = 0,
    householdMembersCount = 1,
  } = params;

  const greeting = getTimeGreeting();
  const { day, emoji, vibe } = getDayContext();
  const { season, ingredients } = getSeasonalContext();
  const hour = new Date().getHours();

  // Personalized greeting
  const personalGreeting = userName ? `${greeting}, ${userName}!` : `${greeting}!`;

  // Base messages array
  const messages: string[] = [
    `${personalGreeting} I'm Nora, your AI culinary assistant. ${emoji}`,
    '',
  ];

  // Add time/day-specific context
  if (hour >= 5 && hour < 10) {
    messages.push(`Perfect ${day} morning for breakfast planning! What are you craving?`);
  } else if (hour >= 10 && hour < 12) {
    messages.push(`It's nearly lunch time! Let me help you plan something delicious.`);
  } else if (hour >= 17 && hour < 20) {
    messages.push(`Dinner time is approaching! Let's create something special for tonight.`);
  } else if (hour >= 20 && hour < 23) {
    messages.push(`Planning ahead for tomorrow? I love a good prep session! 🌙`);
  } else {
    messages.push(`Happy ${day}! ${emoji} Let's plan some amazing meals together.`);
  }

  messages.push('');

  // Add contextual suggestions based on household status
  if (hasMealPlan && upcomingMealsCount > 0) {
    messages.push(`✓ You have ${upcomingMealsCount} upcoming meal${upcomingMealsCount > 1 ? 's' : ''} planned`);
  }

  if (hasShoppingList) {
    messages.push(`✓ Your shopping list is ready to go`);
  }

  if (expiringItemsCount > 0) {
    messages.push(`⚠️ ${expiringItemsCount} item${expiringItemsCount > 1 ? 's' : ''} expiring soon - let's use ${expiringItemsCount > 1 ? 'them' : 'it'}!`);
  }

  // Add seasonal inspiration
  if (messages.length < 8) {
    messages.push('');
    messages.push(`🍃 ${season.charAt(0).toUpperCase() + season.slice(1)} is here! Perfect time for meals featuring ${ingredients[0]}, ${ingredients[1]}, and ${ingredients[2]}.`);
  }

  messages.push('');
  messages.push('**What would you like to create today?**');

  return messages.join('\n');
};

/**
 * Generate contextual dashboard message
 */
export const generateDashboardWelcome = (params: ContextualMessageParams = {}): string => {
  const {
    userName,
    hasMealPlan = false,
    upcomingMealsCount = 0,
  } = params;

  const greeting = getTimeGreeting();
  const { emoji } = getDayContext();
  const hour = new Date().getHours();

  if (!hasMealPlan || upcomingMealsCount === 0) {
    if (hour >= 5 && hour < 10) {
      return `${greeting}${userName ? ', ' + userName : ''}! ${emoji} Ready to plan your meals for the day?`;
    } else if (hour >= 17 && hour < 21) {
      return `${greeting}${userName ? ', ' + userName : ''}! Let's get dinner sorted for tonight.`;
    } else {
      return `${greeting}${userName ? ', ' + userName : ''}! ${emoji} I'm ready to help you plan delicious meals.`;
    }
  } else {
    return `${greeting}${userName ? ', ' + userName : ''}! You have ${upcomingMealsCount} meal${upcomingMealsCount > 1 ? 's' : ''} coming up. Need to adjust anything?`;
  }
};

/**
 * Generate quick action prompts based on context
 */
export const generateContextualPrompts = (params: ContextualMessageParams = {}): string[] => {
  const {
    hasMealPlan = false,
    hasShoppingList = false,
    expiringItemsCount = 0,
    upcomingMealsCount = 0,
  } = params;

  const hour = new Date().getHours();
  const prompts: string[] = [];

  // Time-based prompts
  if (hour >= 5 && hour < 10) {
    prompts.push('Plan healthy breakfast for today');
    prompts.push('Quick breakfast under 15 minutes');
  } else if (hour >= 10 && hour < 14) {
    prompts.push('Suggest lunch ideas');
    prompts.push('Pack-able lunch for work');
  } else if (hour >= 16 && hour < 21) {
    prompts.push('What\'s for dinner tonight?');
    prompts.push('Quick 30-minute dinner');
  }

  // Context-based prompts
  if (expiringItemsCount > 0) {
    prompts.push('Use up ingredients expiring soon');
  }

  if (!hasMealPlan || upcomingMealsCount === 0) {
    prompts.push('Generate this week\'s meal plan');
    prompts.push('Plan meals for next 3 days');
  } else {
    prompts.push('Modify my current meal plan');
    prompts.push('Add one more meal to plan');
  }

  if (!hasShoppingList) {
    prompts.push('Create shopping list');
  }

  // Always include
  prompts.push('Surprise me with recipe ideas');
  prompts.push('Budget-friendly meal suggestions');

  // Return top 6 prompts
  return prompts.slice(0, 6);
};

/**
 * Generate returning user message
 */
export const generateReturningUserMessage = (lastVisit?: Date): string | null => {
  if (!lastVisit) return null;

  const daysSinceLastVisit = Math.floor(
    (new Date().getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastVisit === 0) {
    return null; // Same day, no special message
  } else if (daysSinceLastVisit === 1) {
    return "Welcome back! Hope yesterday's meals turned out great! 🍽️";
  } else if (daysSinceLastVisit <= 3) {
    return `Good to see you again! It's been ${daysSinceLastVisit} days - let's get cooking! 👨‍🍳`;
  } else if (daysSinceLastVisit <= 7) {
    return `Welcome back! I've missed our cooking sessions. Ready to plan some delicious meals? 🥘`;
  } else if (daysSinceLastVisit <= 30) {
    return `Hey there! It's been a while (${daysSinceLastVisit} days)! I'm excited to help you meal plan again. 🎉`;
  } else {
    return `Long time no see! I'm thrilled you're back. Let's create something amazing together! ✨`;
  }
};
