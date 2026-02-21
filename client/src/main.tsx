import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline } from '@mui/material';
import * as Sentry from '@sentry/react';
import App from './App';
import { store } from './features/store';
import { ThemeProvider } from './contexts/ThemeContext';
import { logger } from './utils/logger';
import './styles/design-tokens.css';
import './styles/index.css';

// Initialize Sentry error monitoring in production
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
  });
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <CssBaseline />
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = import.meta.env.DEV ? '/dev-dist/sw.js' : '/sw.js';
    navigator.serviceWorker.register(swPath).then(
      (registration) => {
        logger.info('✅ Service Worker registered successfully:', { metadata: { data: registration.scope } });

        // Check for updates every hour in production
        if (import.meta.env.PROD) {
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        }
      },
      (error) => {
        logger.warn('Service Worker registration failed (this is normal in development)', { metadata: { errorMessage: error.message } });
      }
    );
  });
}
