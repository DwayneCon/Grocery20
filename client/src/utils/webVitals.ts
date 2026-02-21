import type { Metric } from 'web-vitals';

export function reportWebVitals(onReport?: (metric: Metric) => void) {
  import('web-vitals').then(({ onCLS, onFID, onLCP, onTTFB, onINP }) => {
    const report = onReport || ((metric: Metric) => {
      console.log(`[WebVital] ${metric.name}: ${metric.value}`);
    });
    onCLS(report);
    onFID(report);
    onLCP(report);
    onTTFB(report);
    onINP(report);
  });
}
