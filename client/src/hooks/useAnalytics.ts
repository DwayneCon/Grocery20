/* client/src/hooks/useAnalytics.ts */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../utils/analytics';

/**
 * Hook for tracking analytics events throughout the app
 */
export const useAnalytics = () => {
  return analytics;
};

/**
 * Hook for automatic page view tracking
 */
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    analytics.pageView(location.pathname + location.search, document.title);
  }, [location]);
};

/**
 * Hook for tracking session duration
 */
export const useSessionTracking = () => {
  useEffect(() => {
    const sessionStart = Date.now();
    analytics.trackSessionStart();

    return () => {
      const sessionDuration = Math.floor((Date.now() - sessionStart) / 1000);
      analytics.trackSessionEnd(sessionDuration);
    };
  }, []);
};

export default useAnalytics;
