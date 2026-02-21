import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { store } from '../features/store';
import { setCredentials, logout } from '../features/auth/authSlice';
import { authService } from '../services/authService';
import { logger } from './logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create centralized axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds for AI requests
});

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Function to add subscribers waiting for token refresh
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Function to notify all subscribers when token is refreshed
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// REQUEST INTERCEPTOR: Add auth token to all requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token;

    // Add token to request if available
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Handle 401 errors with automatic token refresh
apiClient.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if this is a 401 error and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      // Mark that we're retrying this request
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const state = store.getState();
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          // No refresh token available, log out
          throw new Error('No refresh token available');
        }

        // Attempt to refresh the token
        const response = await authService.refreshToken(refreshToken);

        // Update Redux store with new tokens
        const user = state.auth.user;
        if (user) {
          store.dispatch(setCredentials({
            user,
            token: response.accessToken,
          }));

          // Update refresh token in localStorage (with rotation)
          localStorage.setItem('refreshToken', response.refreshToken);

          // Update the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
          }

          // Notify all waiting requests
          onTokenRefreshed(response.accessToken);

          // Retry the original request
          return apiClient(originalRequest);
        }

        throw new Error('User not found in state');
      } catch (refreshError) {
        // Refresh failed, log out the user
        logger.error('Token refresh failed, logging out user', refreshError as Error, {
          component: 'apiClient',
          action: 'tokenRefresh',
        });

        // Clear state
        store.dispatch(logout());

        // Redirect to login (use window.location to ensure clean navigation)
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Log non-401 errors
    if (error.response) {
      logger.error(`API Error: ${error.response.status}`, error as Error, {
        component: 'apiClient',
        action: 'request',
        metadata: {
          url: originalRequest.url,
          method: originalRequest.method,
          status: error.response.status,
        },
      });
    }

    // For non-401 errors or already-retried requests, reject the promise
    return Promise.reject(error);
  }
);

export default apiClient;
