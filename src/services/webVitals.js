import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { metricsApi } from '../api/endpoints.js';

export function startWebVitals() {
  const queue = new Map();
  const add = (metric) => queue.set(metric.name, { name: metric.name, value: metric.value, rating: metric.rating });

  const flush = () => {
    if (queue.size === 0) return;
    const body = JSON.stringify({ page: location.pathname.replace(/\/[0-9a-f-]{36}/gi, '/:id'), metrics: [...queue.values()] });
    queue.clear();
    const blob = new Blob([body], { type: 'text/plain' });
    if (!navigator.sendBeacon?.(metricsApi.webVitalsUrl(), blob)) {
      fetch(metricsApi.webVitalsUrl(), { method: 'POST', body: blob, keepalive: true }).catch(() => {});
    }
  };

  [onCLS, onFCP, onINP, onLCP, onTTFB].forEach((register) => register(add));
  addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
  addEventListener('pagehide', flush);
}
