import apiClient from '../utils/apiClient';

export const mealInteractionService = {
  /**
   * Log a meal interaction (accepted, rejected, modified)
   */
  logInteraction: async (data: {
    householdId: string;
    mealName: string;
    mealType?: string;
    cuisineType?: string;
    mainProtein?: string;
    ingredients?: string[];
    action: 'accepted' | 'rejected' | 'modified';
    notes?: string;
  }) => {
    const response = await apiClient.post('/meal-interactions/log-interaction', data);
    return response.data;
  },

  /**
   * Get learned preferences for a household
   */
  getLearnedPreferences: async (householdId: string) => {
    const response = await apiClient.get(`/meal-interactions/learned-preferences/${householdId}`);
    return response.data;
  },

  /**
   * Update household preferences based on learned data
   */
  updatePreferences: async (householdId: string) => {
    const response = await apiClient.post(`/meal-interactions/update-preferences/${householdId}`);
    return response.data;
  },
};
