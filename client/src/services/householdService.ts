import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    const response = await api.post('/households', data);
    return response.data;
  },

  // Get household
  getHousehold: async (householdId: string) => {
    const response = await api.get(`/households/${householdId}`);
    return response.data;
  },

  // Update household
  updateHousehold: async (householdId: string, data: { name?: string; budgetWeekly?: number }) => {
    const response = await api.put(`/households/${householdId}`, data);
    return response.data;
  },

  // Delete household
  deleteHousehold: async (householdId: string) => {
    const response = await api.delete(`/households/${householdId}`);
    return response.data;
  },

  // Get household summary
  getHouseholdSummary: async (householdId: string): Promise<{ success: boolean; } & HouseholdSummary> => {
    const response = await api.get(`/households/${householdId}/summary`);
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
    const response = await api.post(`/households/${householdId}/members`, data);
    return response.data;
  },

  // Get members
  getMembers: async (householdId: string) => {
    const response = await api.get(`/households/${householdId}/members`);
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
    const response = await api.put(`/households/${householdId}/members/${memberId}`, data);
    return response.data;
  },

  // Remove member
  removeMember: async (householdId: string, memberId: string) => {
    const response = await api.delete(`/households/${householdId}/members/${memberId}`);
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
    const response = await api.post(`/households/${householdId}/preferences`, data);
    return response.data;
  },

  // Remove preference
  removePreference: async (householdId: string, preferenceId: string) => {
    const response = await api.delete(`/households/${householdId}/preferences/${preferenceId}`);
    return response.data;
  },
};

export default householdService;
