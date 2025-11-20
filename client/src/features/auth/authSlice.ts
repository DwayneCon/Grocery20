import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { decodeToken, isTokenExpired } from '../../utils/jwt';

interface User {
  id: string;
  email: string;
  name: string;
  householdId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Initialize state from localStorage token
const initializeAuth = (): AuthState => {
  const token = localStorage.getItem('token');

  if (token && !isTokenExpired(token)) {
    const decoded = decodeToken(token);
    if (decoded) {
      return {
        user: {
          id: decoded.id,
          email: decoded.email,
          name: '', // We don't store name in token, will be empty until next login
          householdId: decoded.householdId,
        },
        token,
        isAuthenticated: true,
        loading: false,
      };
    }
  }

  // Token is invalid or expired, clear it
  if (token) {
    localStorage.removeItem('token');
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
  };
};

const initialState: AuthState = initializeAuth();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, updateUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
