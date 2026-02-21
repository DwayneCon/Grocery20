import apiClient from '../utils/apiClient';

export interface Suggestion {
  id: string;
  type: 'deal' | 'expiring' | 'reorder' | 'timing' | 'tip';
  title: string;
  message: string;
  actionType: 'chat' | 'shopping' | 'inventory' | 'meal-plan';
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

export const getSuggestions = async (householdId: string): Promise<Suggestion[]> => {
  const response = await apiClient.get(`/suggestions/${householdId}`);
  return response.data.suggestions;
};
