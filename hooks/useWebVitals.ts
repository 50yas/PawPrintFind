import { useEffect } from 'react';
import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import type { CLSMetric, FCPMetric, LCPMetric, TTFBMetric, INPMetric } from 'web-vitals';

interface WebVitalsConfig {
  enableLogging?: boolean;
  enableAnalytics?: boolean;
  sampleRate?: number;
}

const defaultConfig: WebVitalsConfig = {
  enableLogging: true,
  enableAnalytics: true,
  sampleRate: 1.0, // Log 100% of metrics (reduce in production if needed)
};

/**
 * Hook to monitor Core Web Vitals and log them to Firebase
 * Tracks: LCP, FID, CLS, FCP, TTFB, INP
 *
 * Usage:
 * ```tsx
 * function App() {
 *   useWebVitals({ sampleRate: 0.1 }); // 10% sampling for production
 *   return <YourApp />;
 * }
 * ```
 */
export const useWebVitals = (config: WebVitalsConfig = defaultConfig) => {
  useEffect(() => {
    const finalConfig = { ...defaultConfig, ...config };

    // Only track for a sample of users (reduces Firebase costs)
    if (Math.random() > (finalConfig.sampleRate || 1.0)) {
      return;
    }

    const handleMetric = (metric: Metric) => {
      const { name, value, rating, delta, id } = metric;

      // Log to console in development
      if (import.meta.env.DEV && finalConfig.enableLogging) {
        console.log(`[Web Vitals] ${name}:`, {
          value: Math.round(value),
          rating,
          delta: Math.round(delta),
          id,
        });
      }

      // Log to Firebase for analytics
      if (finalConfig.enableAnalytics) {
        // Log to console in production (can be extended to send to Firebase)
        console.log('[Web Vitals]', {
          metric: name,
          value: Math.round(value),
          rating,
          delta: Math.round(delta),
          id,
          timestamp: Date.now(),
          url: window.location.pathname,
        });
      }

      // Send to Firebase Analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', name, {
          value: Math.round(value),
          metric_rating: rating,
          event_category: 'Web Vitals',
          event_label: id,
          non_interaction: true,
        });
      }
    };

    // Register all Core Web Vitals (FID is deprecated, use INP instead)
    onCLS(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);

    // Log initial page load
    if (finalConfig.enableLogging) {
      console.log('[Web Vitals] Monitoring initialized', {
        url: window.location.pathname,
        sampleRate: finalConfig.sampleRate,
      });
    }
  }, [config.sampleRate, config.enableLogging, config.enableAnalytics]);
};

/**
 * Thresholds for Core Web Vitals (in milliseconds)
 * Source: https://web.dev/vitals/
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint
  INP: { good: 200, poor: 500 },        // Interaction to Next Paint
  CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },      // First Contentful Paint
  TTFB: { good: 800, poor: 1800 },      // Time to First Byte
};

/**
 * Get rating for a metric value
 */
export const getMetricRating = (metricName: keyof typeof WEB_VITALS_THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = WEB_VITALS_THRESHOLDS[metricName];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
};
