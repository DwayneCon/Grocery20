import type { Metric } from 'web-vitals';
import { logger } from './logger';

export function reportWebVitals(onReport?: (metric: Metric) => void) {
  import('web-vitals').then(({ onCLS, onFID, onLCP, onTTFB, onINP }) => {
    const report = onReport || ((metric: Metric) => {
      logger.info(`WebVital ${metric.name}: ${metric.value}`);
    });
    onCLS(report);
    onFID(report);
    onLCP(report);
    onTTFB(report);
    onINP(report);
  });
}
