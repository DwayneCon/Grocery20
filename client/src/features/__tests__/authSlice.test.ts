import { describe, it, expect, beforeEach, vi } from 'vitest';
import authReducer, {
  setCredentials,
  updateUser,
  logout,
  setLoading,
} from '../auth/authSlice';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock });

describe('authSlice', () => {
  const unauthenticatedState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
  };

  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have unauthenticated state when no token in localStorage', () => {
      // The reducer when called with undefined state and an unknown action
      // returns the initial state computed by initializeAuth()
      const state = authReducer(undefined, { type: 'unknown' });
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });
  });

  describe('setCredentials', () => {
    it('should set user and token', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        householdId: 'household-1',
      };
      const token = 'jwt-token-abc';

      const state = authReducer(
        unauthenticatedState,
        setCredentials({ user, token })
      );

      expect(state.user).toEqual(user);
      expect(state.token).toBe(token);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should save token to localStorage', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };
      const token = 'jwt-token-xyz';

      authReducer(unauthenticatedState, setCredentials({ user, token }));

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', token);
    });
  });

  describe('updateUser', () => {
    it('should update user fields when user exists', () => {
      const authenticatedState = {
        user: {
          id: 'user-123',
          email: 'old@example.com',
          name: 'Old Name',
        },
        token: 'some-token',
        isAuthenticated: true,
        loading: false,
      };

      const state = authReducer(
        authenticatedState,
        updateUser({ name: 'New Name', email: 'new@example.com' })
      );

      expect(state.user?.name).toBe('New Name');
      expect(state.user?.email).toBe('new@example.com');
      expect(state.user?.id).toBe('user-123'); // unchanged
    });

    it('should not modify state when user is null', () => {
      const state = authReducer(
        unauthenticatedState,
        updateUser({ name: 'New Name' })
      );

      expect(state.user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear user and token', () => {
      const authenticatedState = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        token: 'some-token',
        isAuthenticated: true,
        loading: false,
      };

      const state = authReducer(authenticatedState, logout());

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should remove tokens from storage', () => {
      const authenticatedState = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        token: 'some-token',
        isAuthenticated: true,
        loading: false,
      };

      authReducer(authenticatedState, logout());

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const state = authReducer(unauthenticatedState, setLoading(true));
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const loadingState = { ...unauthenticatedState, loading: true };
      const state = authReducer(loadingState, setLoading(false));
      expect(state.loading).toBe(false);
    });
  });
});
