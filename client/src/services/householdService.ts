import apiClient from '../utils/apiClient';

export interface HouseholdMember {
  id: string;
  household_id: string;
  name: string;
  age?: number;
  dietary_restrictions: Array<string | { type: string; item: string; severity?: number }>;
  preferences: {
    likes?: string[];
    dislikes?: string[];
    cuisines?: string[];
    [key: string]: any;
  };
}

export interface Household {
  id: string;
  name: string;
  budget_weekly: number;
  created_by: string;
  created_at: string;
}

export interface HouseholdSummary {
  household: Household;
  members: HouseholdMember[];
  preferences: any[];
  aggregated: {
    allergies: string[];
    intolerances: string[];
    restrictions: string[];
    preferences: string[];
    dislikes: string[];
  };
  stats: {
    totalMembers: number;
    totalAllergies: number;
    totalRestrictions: number;
    weeklyBudget: number;
  };
}

export const householdService = {
  // Create household
  createHousehold: async (data: { name: string; budgetWeekly?: number }) => {
    const response = await apiClient.post('/households', data);
    return response.data;
  },

  // Get household
  getHousehold: async (householdId: string) => {
    const response = await apiClient.get(`/households/${householdId}`);
    return response.data;
  },

  // Update household
  updateHousehold: async (householdId: string, data: { name?: string; budgetWeekly?: number }) => {
    const response = await apiClient.put(`/households/${householdId}`, data);
    return response.data;
  },

  // Update zip code for store location
  updateZipCode: async (householdId: string, zipCode: string, preferredStoreLocation?: string) => {
    const response = await apiClient.put(`/households/${householdId}`, {
      zipCode,
      preferredStoreLocation,
    });
    return response.data;
  },

  // Delete household
  deleteHousehold: async (householdId: string) => {
    const response = await apiClient.delete(`/households/${householdId}`);
    return response.data;
  },

  // Get household summary
  getHouseholdSummary: async (householdId: string): Promise<{ success: boolean; } & HouseholdSummary> => {
    const response = await apiClient.get(`/households/${householdId}/summary`);
    return response.data;
  },

  // Add member
  addMember: async (
    householdId: string,
    data: {
      name: string;
      age?: number;
      dietaryRestrictions?: any[];
      preferences?: any;
    }
  ) => {
    const response = await apiClient.post(`/households/${householdId}/members`, data);
    return response.data;
  },

  // Get members
  getMembers: async (householdId: string) => {
    const response = await apiClient.get(`/households/${householdId}/members`);
    return response.data;
  },

  // Update member
  updateMember: async (
    householdId: string,
    memberId: string,
    data: {
      name?: string;
      age?: number;
      dietaryRestrictions?: any[];
      preferences?: any;
    }
  ) => {
    const response = await apiClient.put(`/households/${householdId}/members/${memberId}`, data);
    return response.data;
  },

  // Remove member
  removeMember: async (householdId: string, memberId: string) => {
    const response = await apiClient.delete(`/households/${householdId}/members/${memberId}`);
    return response.data;
  },

  // Add preference
  addPreference: async (
    householdId: string,
    data: {
      userId?: string;
      preferenceType: 'allergy' | 'intolerance' | 'preference' | 'restriction';
      item: string;
      severity?: number;
    }
  ) => {
    const response = await apiClient.post(`/households/${householdId}/preferences`, data);
    return response.data;
  },

  // Remove preference
  removePreference: async (householdId: string, preferenceId: string) => {
    const response = await apiClient.delete(`/households/${householdId}/preferences/${preferenceId}`);
    return response.data;
  },
};

export default householdService;
