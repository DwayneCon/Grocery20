/* client/src/utils/performanceMonitor.ts */

/**
 * Performance monitoring utilities for tracking Core Web Vitals and custom metrics
 */

import { logger } from './logger';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  loadTime?: number;
  domContentLoaded?: number;
}

type MetricCallback = (metric: PerformanceMetrics) => void;

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private callbacks: MetricCallback[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.observeWebVitals();
      this.observePageLoad();
    }
  }

  /**
   * Observe Core Web Vitals using PerformanceObserver API
   */
  private observeWebVitals() {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        this.notifyCallbacks();
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.notifyCallbacks();
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
            this.metrics.cls = clsScore;
            this.notifyCallbacks();
          }
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // First Contentful Paint (FCP)
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            this.notifyCallbacks();
          }
        });
      });
      navigationObserver.observe({ type: 'paint', buffered: true });
    } catch (error) {
      logger.warn('PerformanceObserver not supported', { error });
    }
  }

  /**
   * Observe page load metrics
   */
  private observePageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        this.metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        this.notifyCallbacks();
      }
    });
  }

  /**
   * Register callback to be notified of metric updates
   */
  public onMetric(callback: MetricCallback) {
    this.callbacks.push(callback);
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.metrics));
  }

  /**
   * Get current metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Log metrics to console (development only)
   */
  public logMetrics() {
    if (import.meta.env.DEV) {
      logger.info('Performance Metrics', {
        fcp: this.metrics.fcp?.toFixed(2) + ' ms',
        lcp: this.metrics.lcp?.toFixed(2) + ' ms',
        fid: this.metrics.fid?.toFixed(2) + ' ms',
        cls: this.metrics.cls?.toFixed(4),
        ttfb: this.metrics.ttfb?.toFixed(2) + ' ms',
      });

      // Performance warnings
      if (this.metrics.lcp && this.metrics.lcp > 2500) {
        logger.warn('LCP is slow (>2.5s). Target: <2.5s for good performance.', { lcp: this.metrics.lcp });
      }
      if (this.metrics.fid && this.metrics.fid > 100) {
        logger.warn('FID is slow (>100ms). Target: <100ms for good performance.', { fid: this.metrics.fid });
      }
      if (this.metrics.cls && this.metrics.cls > 0.1) {
        logger.warn('CLS is high (>0.1). Target: <0.1 for good performance.', { cls: this.metrics.cls });
      }
    }
  }

  /**
   * Mark custom timing
   */
  public mark(name: string) {
    performance.mark(name);
  }

  /**
   * Measure between two marks
   */
  public measure(name: string, startMark: string, endMark?: string) {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      const measure = performance.getEntriesByName(name)[0];
      return measure.duration;
    } catch (error) {
      logger.warn(`Failed to measure ${name}`, { error });
      return 0;
    }
  }

  /**
   * Report metrics to analytics service (placeholder)
   */
  public reportToAnalytics() {
    // This will be integrated with Google Analytics 4 in Item 35
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const gtag = (window as any).gtag;

      if (this.metrics.lcp) {
        gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: 'LCP',
          value: Math.round(this.metrics.lcp),
        });
      }

      if (this.metrics.fid) {
        gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: 'FID',
          value: Math.round(this.metrics.fid),
        });
      }

      if (this.metrics.cls) {
        gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: 'CLS',
          value: this.metrics.cls,
        });
      }
    }
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-log in development
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(() => performanceMonitor.logMetrics(), 3000);
  });
}

export default performanceMonitor;
