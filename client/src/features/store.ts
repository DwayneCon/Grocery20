import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import householdReducer from './household/householdSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    household: householdReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
