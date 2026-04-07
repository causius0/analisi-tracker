'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function ReportWebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', metric);
    }

    // Send to analytics endpoint
    const analyticsData = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: metric.rating,
      navigationType: metric.navigationType,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    // Send to PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('web_vital', {
        ...analyticsData,
        value: Math.round(
          metric.name === 'CLS' ? metric.value * 1000 : metric.value
        ),
      });
    }

    // Send to Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.metrics?.gauge(metric.name, metric.value, {
        unit: metric.name === 'CLS' ? '' : 'ms',
      });
    }

    // Send to custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsData),
      // Use keepalive to ensure the request completes even if the page is unloading
      keepalive: true,
    }).catch((error) => {
      // Silently fail to not block the main thread
      if (process.env.NODE_ENV === 'development') {
        console.error('[Web Vitals] Failed to send metrics:', error);
      }
    });
  });

  return null;
}

// Performance monitoring utilities
export function measureRender(componentName: string) {
  if (typeof window === 'undefined' || !window.performance) return;

  const start = performance.now();

  return () => {
    const end = performance.now();
    const duration = end - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render Time] ${componentName}: ${duration.toFixed(2)}ms`);
    }

    // Report slow renders (>16ms)
    if (duration > 16) {
      console.warn(
        `[Slow Render] ${componentName} took ${duration.toFixed(2)}ms`
      );
    }
  };
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
