import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import householdService, { Household, HouseholdMember, HouseholdSummary } from '../../services/householdService';

interface HouseholdState {
  currentHousehold: Household | null;
  members: HouseholdMember[];
  summary: HouseholdSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: HouseholdState = {
  currentHousehold: null,
  members: [],
  summary: null,
  loading: false,
  error: null,
};

// Async thunks
export const createHousehold = createAsyncThunk(
  'household/create',
  async (data: { name: string; budgetWeekly?: number }) => {
    const response = await householdService.createHousehold(data);
    return response;
  }
);

export const fetchHouseholdSummary = createAsyncThunk(
  'household/fetchSummary',
  async (householdId: string) => {
    const response = await householdService.getHouseholdSummary(householdId);
    return response;
  }
);

export const addHouseholdMember = createAsyncThunk(
  'household/addMember',
  async ({
    householdId,
    memberData,
  }: {
    householdId: string;
    memberData: {
      name: string;
      age?: number;
      dietaryRestrictions?: any[];
      preferences?: any;
    };
  }) => {
    const response = await householdService.addMember(householdId, memberData);
    return response;
  }
);

export const updateHouseholdMember = createAsyncThunk(
  'household/updateMember',
  async ({
    householdId,
    memberId,
    memberData,
  }: {
    householdId: string;
    memberId: string;
    memberData: {
      name?: string;
      age?: number;
      dietaryRestrictions?: any[];
      preferences?: any;
    };
  }) => {
    const response = await householdService.updateMember(householdId, memberId, memberData);
    return { memberId, memberData };
  }
);

export const removeHouseholdMember = createAsyncThunk(
  'household/removeMember',
  async ({ householdId, memberId }: { householdId: string; memberId: string }) => {
    await householdService.removeMember(householdId, memberId);
    return memberId;
  }
);

const householdSlice = createSlice({
  name: 'household',
  initialState,
  reducers: {
    setCurrentHousehold: (state, action: PayloadAction<Household>) => {
      state.currentHousehold = action.payload;
    },
    clearHousehold: (state) => {
      state.currentHousehold = null;
      state.members = [];
      state.summary = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Create household
    builder
      .addCase(createHousehold.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createHousehold.fulfilled, (state, action) => {
        state.loading = false;
        state.currentHousehold = action.payload.household;
      })
      .addCase(createHousehold.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create household';
      });

    // Fetch summary
    builder
      .addCase(fetchHouseholdSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHouseholdSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
        state.currentHousehold = action.payload.household;
        state.members = action.payload.members;
      })
      .addCase(fetchHouseholdSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch household';
      });

    // Add member
    builder
      .addCase(addHouseholdMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addHouseholdMember.fulfilled, (state, action) => {
        state.loading = false;
        state.members.push(action.payload.member);
      })
      .addCase(addHouseholdMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add member';
      });

    // Update member
    builder
      .addCase(updateHouseholdMember.fulfilled, (state, action) => {
        const index = state.members.findIndex((m) => m.id === action.payload.memberId);
        if (index !== -1) {
          state.members[index] = { ...state.members[index], ...action.payload.memberData };
        }
      });

    // Remove member
    builder
      .addCase(removeHouseholdMember.fulfilled, (state, action) => {
        state.members = state.members.filter((m) => m.id !== action.payload);
      });
  },
});

export const { setCurrentHousehold, clearHousehold, setError } = householdSlice.actions;
export default householdSlice.reducer;
