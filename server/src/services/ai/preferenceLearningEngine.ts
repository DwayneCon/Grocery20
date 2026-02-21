import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

/**
 * PreferenceLearningEngine
 *
 * Implements sophisticated preference learning using:
 * - Exponential Moving Average (EMA) for adaptive learning
 * - Recency weighting (recent interactions matter more)
 * - Confidence scoring based on interaction volume
 * - Multi-dimensional preference tracking (cuisine, protein, cooking methods, etc.)
 */

interface PreferenceScore {
  value: string; // e.g., "Italian", "Chicken", "Grilling"
  score: number; // -1.0 to 1.0 (negative = dislike, positive = like)
  confidence: number; // 0.0 to 1.0 (based on number of interactions)
  lastUpdated: Date;
  interactionCount: number;
}

interface MealInteraction {
  id: string;
  household_id: string;
  meal_name: string;
  action: 'accepted' | 'rejected' | 'modified' | 'saved' | 'rated';
  cuisine_type?: string;
  main_protein?: string;
  cooking_method?: string;
  flavor_profile?: string;
  prep_time?: number;
  rating?: number; // 1-5 stars
  interaction_date: Date;
}

interface HouseholdPreferences {
  householdId: string;
  cuisinePreferences: PreferenceScore[];
  proteinPreferences: PreferenceScore[];
  cookingMethodPreferences: PreferenceScore[];
  flavorProfiles: PreferenceScore[];
  avgPrepTimePreference: number;
  lastUpdated: Date;
  totalInteractions: number;
}

export class PreferenceLearningEngine {
  // Exponential Moving Average (EMA) smoothing factor
  // Higher alpha = more weight to recent interactions
  private readonly ALPHA = 0.3;

  // Recency decay factor (days)
  // Interactions older than this are weighted less
  private readonly RECENCY_DECAY_DAYS = 30;

  // Minimum interactions needed for high confidence
  private readonly MIN_INTERACTIONS_FOR_CONFIDENCE = 10;

  /**
   * Learn from a new meal interaction
   * Updates preference scores using exponential moving average
   */
  async recordInteraction(interaction: MealInteraction): Promise<void> {
    try {
      // Calculate interaction value (-1 to 1)
      const value = this.calculateInteractionValue(interaction);

      // Update cuisine preference
      if (interaction.cuisine_type) {
        await this.updatePreference(
          interaction.household_id,
          'cuisine',
          interaction.cuisine_type,
          value
        );
      }

      // Update protein preference
      if (interaction.main_protein) {
        await this.updatePreference(
          interaction.household_id,
          'protein',
          interaction.main_protein,
          value
        );
      }

      // Update cooking method preference
      if (interaction.cooking_method) {
        await this.updatePreference(
          interaction.household_id,
          'cooking_method',
          interaction.cooking_method,
          value
        );
      }

      // Update flavor profile preference
      if (interaction.flavor_profile) {
        await this.updatePreference(
          interaction.household_id,
          'flavor_profile',
          interaction.flavor_profile,
          value
        );
      }

      logger.info('Preference learning updated', {
        householdId: interaction.household_id,
        action: interaction.action,
        value,
      });
    } catch (error) {
      logger.error('Failed to record interaction', error as Error);
      throw error;
    }
  }

  /**
   * Calculate the value of an interaction (-1 to 1)
   * - Rejected: -1.0
   * - Modified: -0.3 (mild dislike, but workable)
   * - Accepted: 0.5
   * - Saved: 0.7
   * - Rated (1-5 stars): Convert to -1 to 1 scale
   */
  private calculateInteractionValue(interaction: MealInteraction): number {
    switch (interaction.action) {
      case 'rejected':
        return -1.0;
      case 'modified':
        return -0.3;
      case 'accepted':
        return 0.5;
      case 'saved':
        return 0.7;
      case 'rated':
        if (interaction.rating) {
          // Convert 1-5 stars to -1 to 1 scale
          // 1 star = -1, 3 stars = 0, 5 stars = 1
          return (interaction.rating - 3) / 2;
        }
        return 0.5; // Default if no rating
      default:
        return 0;
    }
  }

  /**
   * Update a preference score using Exponential Moving Average
   *
   * Formula: new_score = alpha * interaction_value + (1 - alpha) * old_score
   *
   * This gives more weight to recent interactions while still considering history
   */
  private async updatePreference(
    householdId: string,
    category: string,
    value: string,
    interactionValue: number
  ): Promise<void> {
    try {
      // Get existing preference
      const existing = await query<any[]>(
        `SELECT * FROM learned_preferences
         WHERE household_id = ? AND category = ? AND preference_value = ?`,
        [householdId, category, value]
      );

      if (existing.length > 0) {
        // Update existing preference using EMA
        const current = existing[0];
        const oldScore = current.score;
        const oldCount = current.interaction_count;

        // Apply exponential moving average
        const newScore = this.ALPHA * interactionValue + (1 - this.ALPHA) * oldScore;

        // Calculate confidence based on interaction count
        const confidence = this.calculateConfidence(oldCount + 1);

        await query(
          `UPDATE learned_preferences
           SET score = ?, confidence = ?, interaction_count = interaction_count + 1,
               last_updated = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [newScore, confidence, current.id]
        );
      } else {
        // Create new preference
        const confidence = this.calculateConfidence(1);

        await query(
          `INSERT INTO learned_preferences
           (id, household_id, category, preference_value, score, confidence, interaction_count, last_updated)
           VALUES (UUID(), ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
          [householdId, category, value, interactionValue, confidence]
        );
      }
    } catch (error) {
      logger.error('Failed to update preference', error as Error);
      throw error;
    }
  }

  /**
   * Calculate confidence score based on number of interactions
   * Uses logarithmic scale to avoid overconfidence with few interactions
   *
   * Formula: confidence = log(count + 1) / log(MIN_INTERACTIONS + 1)
   * Capped at 1.0 for high interaction counts
   */
  private calculateConfidence(interactionCount: number): number {
    const confidence =
      Math.log(interactionCount + 1) / Math.log(this.MIN_INTERACTIONS_FOR_CONFIDENCE + 1);
    return Math.min(confidence, 1.0);
  }

  /**
   * Get all learned preferences for a household
   * Returns preferences sorted by score (highest first) with confidence weighting
   */
  async getHouseholdPreferences(householdId: string): Promise<HouseholdPreferences> {
    try {
      const preferences = await query<any[]>(
        `SELECT * FROM learned_preferences
         WHERE household_id = ?
         ORDER BY score DESC`,
        [householdId]
      );

      // Apply recency weighting
      const now = new Date();
      const weightedPreferences = preferences.map((pref) => {
        const daysSinceUpdate = Math.floor(
          (now.getTime() - new Date(pref.last_updated).getTime()) / (1000 * 60 * 60 * 24)
        );
        const recencyWeight = Math.exp(-daysSinceUpdate / this.RECENCY_DECAY_DAYS);

        return {
          ...pref,
          weightedScore: pref.score * pref.confidence * recencyWeight,
        };
      });

      // Group by category
      const cuisinePreferences = this.groupPreferences(weightedPreferences, 'cuisine');
      const proteinPreferences = this.groupPreferences(weightedPreferences, 'protein');
      const cookingMethodPreferences = this.groupPreferences(weightedPreferences, 'cooking_method');
      const flavorProfiles = this.groupPreferences(weightedPreferences, 'flavor_profile');

      // Calculate average prep time preference from interactions
      const interactions = await query<any[]>(
        `SELECT AVG(prep_time) as avg_prep_time
         FROM meal_interactions
         WHERE household_id = ? AND prep_time IS NOT NULL AND action IN ('accepted', 'saved', 'rated')`,
        [householdId]
      );

      const avgPrepTimePreference = interactions[0]?.avg_prep_time || 30; // Default 30 mins

      // Count total interactions
      const stats = await query<any[]>(
        `SELECT COUNT(*) as total FROM meal_interactions WHERE household_id = ?`,
        [householdId]
      );

      return {
        householdId,
        cuisinePreferences,
        proteinPreferences,
        cookingMethodPreferences,
        flavorProfiles,
        avgPrepTimePreference,
        lastUpdated: new Date(),
        totalInteractions: stats[0]?.total || 0,
      };
    } catch (error) {
      logger.error('Failed to get household preferences', error as Error);
      throw error;
    }
  }

  /**
   * Group preferences by category
   */
  private groupPreferences(preferences: any[], category: string): PreferenceScore[] {
    return preferences
      .filter((p) => p.category === category)
      .map((p) => ({
        value: p.preference_value,
        score: p.weightedScore,
        confidence: p.confidence,
        lastUpdated: new Date(p.last_updated),
        interactionCount: p.interaction_count,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get top preferences for meal recommendations
   * Returns the highest-scoring preferences with high confidence
   */
  async getTopPreferences(
    householdId: string,
    category: string,
    limit: number = 5
  ): Promise<PreferenceScore[]> {
    try {
      const allPreferences = await this.getHouseholdPreferences(householdId);

      let preferences: PreferenceScore[] = [];
      switch (category) {
        case 'cuisine':
          preferences = allPreferences.cuisinePreferences;
          break;
        case 'protein':
          preferences = allPreferences.proteinPreferences;
          break;
        case 'cooking_method':
          preferences = allPreferences.cookingMethodPreferences;
          break;
        case 'flavor_profile':
          preferences = allPreferences.flavorProfiles;
          break;
      }

      // Filter out low-confidence or negative preferences
      return preferences
        .filter((p) => p.confidence > 0.3 && p.score > 0)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get top preferences', error as Error);
      return [];
    }
  }

  /**
   * Get preferences to avoid (negative scores)
   */
  async getDislikedPreferences(
    householdId: string,
    category: string
  ): Promise<PreferenceScore[]> {
    try {
      const allPreferences = await this.getHouseholdPreferences(householdId);

      let preferences: PreferenceScore[] = [];
      switch (category) {
        case 'cuisine':
          preferences = allPreferences.cuisinePreferences;
          break;
        case 'protein':
          preferences = allPreferences.proteinPreferences;
          break;
        case 'cooking_method':
          preferences = allPreferences.cookingMethodPreferences;
          break;
        case 'flavor_profile':
          preferences = allPreferences.flavorProfiles;
          break;
      }

      // Return preferences with negative scores and reasonable confidence
      return preferences.filter((p) => p.confidence > 0.3 && p.score < -0.2);
    } catch (error) {
      logger.error('Failed to get disliked preferences', error as Error);
      return [];
    }
  }

  /**
   * Generate preference summary text for AI prompts
   */
  async generatePreferenceSummary(householdId: string): Promise<string> {
    try {
      const prefs = await this.getHouseholdPreferences(householdId);

      let summary = '';

      // Add cuisine preferences
      const topCuisines = prefs.cuisinePreferences.slice(0, 3).filter((p) => p.score > 0);
      if (topCuisines.length > 0) {
        summary += `Preferred cuisines: ${topCuisines.map((p) => p.value).join(', ')}. `;
      }

      const dislikedCuisines = prefs.cuisinePreferences.filter((p) => p.score < -0.2);
      if (dislikedCuisines.length > 0) {
        summary += `Avoid: ${dislikedCuisines.map((p) => p.value).join(', ')} cuisine. `;
      }

      // Add protein preferences
      const topProteins = prefs.proteinPreferences.slice(0, 3).filter((p) => p.score > 0);
      if (topProteins.length > 0) {
        summary += `Preferred proteins: ${topProteins.map((p) => p.value).join(', ')}. `;
      }

      const dislikedProteins = prefs.proteinPreferences.filter((p) => p.score < -0.2);
      if (dislikedProteins.length > 0) {
        summary += `Avoid proteins: ${dislikedProteins.map((p) => p.value).join(', ')}. `;
      }

      // Add cooking method preferences
      const topMethods = prefs.cookingMethodPreferences.slice(0, 2).filter((p) => p.score > 0);
      if (topMethods.length > 0) {
        summary += `Preferred cooking methods: ${topMethods.map((p) => p.value).join(', ')}. `;
      }

      // Add prep time preference
      summary += `Typical prep time: ${Math.round(prefs.avgPrepTimePreference)} minutes. `;

      // Add confidence note
      if (prefs.totalInteractions < 10) {
        summary += '(Learning your preferences - these will improve over time)';
      } else if (prefs.totalInteractions >= 50) {
        summary += '(High confidence - based on extensive history)';
      }

      return summary.trim();
    } catch (error) {
      logger.error('Failed to generate preference summary', error as Error);
      return '';
    }
  }

  /**
   * Reset preferences for a household (for testing or user request)
   */
  async resetPreferences(householdId: string): Promise<void> {
    try {
      await query('DELETE FROM learned_preferences WHERE household_id = ?', [householdId]);
      logger.info('Preferences reset', { householdId });
    } catch (error) {
      logger.error('Failed to reset preferences', error as Error);
      throw error;
    }
  }
}

// Singleton instance
export const preferenceLearningEngine = new PreferenceLearningEngine();
export default preferenceLearningEngine;
