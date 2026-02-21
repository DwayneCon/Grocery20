/* client/src/utils/analytics.ts */

/**
 * Google Analytics 4 tracking utilities
 * Custom events for measuring user engagement and app performance
 */

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

interface EventParams {
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

class Analytics {
  private isInitialized = false;
  private measurementId: string | null = null;

  /**
   * Initialize Google Analytics 4
   */
  public init(measurementId: string) {
    if (typeof window === 'undefined' || this.isInitialized) {
      return;
    }

    this.measurementId = measurementId;

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, // We'll send manually for SPA
      anonymize_ip: true,
    });

    this.isInitialized = true;
  }

  /**
   * Track page view (for SPA navigation)
   */
  public pageView(path: string, title?: string) {
    if (!this.isEnabled()) return;

    window.gtag?.('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }

  /**
   * Track custom event
   */
  public event(eventName: string, params?: EventParams) {
    if (!this.isEnabled()) return;

    window.gtag?.('event', eventName, params);
  }

  /**
   * User Authentication Events
   */
  public trackLogin(method: string = 'email') {
    this.event('login', {
      method,
    });
  }

  public trackSignUp(method: string = 'email') {
    this.event('sign_up', {
      method,
    });
  }

  public trackLogout() {
    this.event('logout');
  }

  /**
   * Meal Planning Events
   */
  public trackMealPlanCreated(mealCount: number, days: number) {
    this.event('meal_plan_created', {
      event_category: 'Meal Planning',
      meal_count: mealCount,
      days: days,
      value: days, // Days of meals planned
    });
  }

  public trackMealSaved(mealName: string, mealType: string) {
    this.event('meal_saved', {
      event_category: 'Meal Planning',
      meal_name: mealName,
      meal_type: mealType,
    });
  }

  public trackMealRated(rating: number, mealId: string) {
    this.event('meal_rated', {
      event_category: 'Engagement',
      rating: rating,
      meal_id: mealId,
      value: rating,
    });
  }

  /**
   * AI Chat Events
   */
  public trackChatMessage(messageType: 'user' | 'ai', messageLength: number) {
    this.event('chat_message', {
      event_category: 'AI Interaction',
      message_type: messageType,
      message_length: messageLength,
    });
  }

  public trackVoiceInput(duration: number) {
    this.event('voice_input_used', {
      event_category: 'AI Interaction',
      duration: duration,
      value: duration,
    });
  }

  public trackAIError(errorType: string) {
    this.event('ai_error', {
      event_category: 'Errors',
      error_type: errorType,
    });
  }

  /**
   * Shopping List Events
   */
  public trackShoppingListGenerated(itemCount: number) {
    this.event('shopping_list_generated', {
      event_category: 'Shopping',
      item_count: itemCount,
      value: itemCount,
    });
  }

  public trackShoppingListShared(method: string) {
    this.event('shopping_list_shared', {
      event_category: 'Sharing',
      method: method,
    });
  }

  /**
   * Budget Events
   */
  public trackBudgetSet(amount: number) {
    this.event('budget_set', {
      event_category: 'Budget',
      budget_amount: amount,
      value: amount,
    });
  }

  public trackBudgetSavings(savingsAmount: number, percentSaved: number) {
    this.event('budget_savings', {
      event_category: 'Budget',
      savings_amount: savingsAmount,
      percent_saved: percentSaved,
      value: savingsAmount,
    });
  }

  /**
   * Gamification Events
   */
  public trackStreakAchieved(streakDays: number) {
    this.event('streak_achieved', {
      event_category: 'Gamification',
      streak_days: streakDays,
      value: streakDays,
    });
  }

  public trackAchievementUnlocked(achievementName: string) {
    this.event('achievement_unlocked', {
      event_category: 'Gamification',
      achievement_name: achievementName,
    });
  }

  /**
   * Recipe Events
   */
  public trackRecipeViewed(recipeId: string, recipeName: string) {
    this.event('recipe_viewed', {
      event_category: 'Recipe',
      recipe_id: recipeId,
      recipe_name: recipeName,
    });
  }

  public trackRecipeImported(source: string) {
    this.event('recipe_imported', {
      event_category: 'Recipe',
      source: source,
    });
  }

  public trackRecipeShared(recipeId: string, method: string) {
    this.event('recipe_shared', {
      event_category: 'Sharing',
      recipe_id: recipeId,
      method: method,
    });
  }

  /**
   * Household Events
   */
  public trackHouseholdCreated(memberCount: number) {
    this.event('household_created', {
      event_category: 'Onboarding',
      member_count: memberCount,
      value: memberCount,
    });
  }

  public trackMemberAdded() {
    this.event('household_member_added', {
      event_category: 'Household',
    });
  }

  /**
   * PWA Events
   */
  public trackPWAInstalled() {
    this.event('pwa_installed', {
      event_category: 'Engagement',
    });
  }

  public trackPWAPromptShown() {
    this.event('pwa_prompt_shown', {
      event_category: 'Engagement',
    });
  }

  public trackPWAPromptDismissed() {
    this.event('pwa_prompt_dismissed', {
      event_category: 'Engagement',
    });
  }

  /**
   * Performance Events
   */
  public trackPerformance(metricName: string, value: number) {
    this.event('performance_metric', {
      event_category: 'Performance',
      metric_name: metricName,
      value: Math.round(value),
    });
  }

  /**
   * Error Events
   */
  public trackError(errorMessage: string, errorStack?: string) {
    this.event('error', {
      event_category: 'Errors',
      error_message: errorMessage,
      error_stack: errorStack?.substring(0, 150), // Limit stack trace length
    });
  }

  /**
   * Feature Usage Events
   */
  public trackFeatureUsed(featureName: string) {
    this.event('feature_used', {
      event_category: 'Features',
      feature_name: featureName,
    });
  }

  /**
   * Session Events
   */
  public trackSessionStart() {
    this.event('session_start', {
      event_category: 'Session',
    });
  }

  public trackSessionEnd(duration: number) {
    this.event('session_end', {
      event_category: 'Session',
      duration: duration,
      value: duration,
    });
  }

  /**
   * Conversion Events
   */
  public trackConversion(conversionType: string, value?: number) {
    this.event('conversion', {
      event_category: 'Conversion',
      conversion_type: conversionType,
      value: value,
    });
  }

  /**
   * Set user properties
   */
  public setUserProperty(propertyName: string, value: string | number | boolean) {
    if (!this.isEnabled()) return;

    window.gtag?.('set', 'user_properties', {
      [propertyName]: value,
    });
  }

  /**
   * Set user ID (for cross-device tracking)
   */
  public setUserId(userId: string) {
    if (!this.isEnabled()) return;

    window.gtag?.('config', this.measurementId!, {
      user_id: userId,
    });
  }

  /**
   * Check if analytics is enabled
   */
  private isEnabled(): boolean {
    return (
      this.isInitialized &&
      typeof window !== 'undefined' &&
      typeof window.gtag === 'function'
    );
  }

  /**
   * Disable analytics (for privacy)
   */
  public disable() {
    if (this.measurementId) {
      (window as any)[`ga-disable-${this.measurementId}`] = true;
    }
  }

  /**
   * Enable analytics
   */
  public enable() {
    if (this.measurementId) {
      (window as any)[`ga-disable-${this.measurementId}`] = false;
    }
  }
}

// Singleton instance
const analytics = new Analytics();

// Auto-initialize in production (set your GA4 measurement ID)
if (process.env.NODE_ENV === 'production') {
  const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX';
  analytics.init(GA4_MEASUREMENT_ID);
}

export default analytics;
