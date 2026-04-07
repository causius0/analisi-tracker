/**
 * Performance Optimization Utilities
 * Tools for optimizing mobile performance
 */

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(
  selector: string = 'img[data-src]',
  options?: IntersectionObserverInit
): void {
  if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers
    const images = document.querySelectorAll(selector);
    images.forEach((img: any) => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });
    return;
  }

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01,
      ...options,
    }
  );

  const images = document.querySelectorAll(selector);
  images.forEach((img) => imageObserver.observe(img));
}

/**
 * Debounce function execution
 */
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

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 */
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

/**
 * Request animation frame throttle
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (rafId !== null) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * Measure performance
 */
export function measurePerformance(
  name: string,
  fn: () => void
): void {
  if (!('performance' in window)) {
    fn();
    return;
  }

  const start = performance.now();
  fn();
  const end = performance.now();

  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);

  // Send to analytics if available
  if ('gtag' in window) {
    (window as any).gtag('event', 'timing_complete', {
      name,
      value: Math.round(end - start),
      event_category: 'performance',
    });
  }
}

/**
 * Get Web Vitals metrics
 */
export function getWebVitals(): {
  LCP?: number;
  FID?: number;
  CLS?: number;
} {
  const vitals: any = {};

  if ('PerformanceObserver' in window) {
    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        vitals.FID = entries[0].processingStart - entries[0].startTime;
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        vitals.CLS = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('[Performance] Failed to observe web vitals:', error);
    }
  }

  return vitals;
}

/**
 * Optimize image loading
 */
export function optimizeImage(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string {
  const { width, height, quality = 80, format = 'webp' } = options;

  // If it's already a data URL or external, return as-is
  if (src.startsWith('data:') || src.startsWith('http')) {
    return src;
  }

  // Add optimization parameters (example for image CDN)
  const params = new URLSearchParams();
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  params.append('q', quality.toString());
  params.append('f', format);

  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}${params.toString()}`;
}

/**
 * Preload critical resources
 */
export function preloadResources(resources: Array<{
  href: string;
  as: 'script' | 'style' | 'font' | 'image';
  type?: string;
}>): void {
  resources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;

    if (resource.type) {
      link.type = resource.type;
    }

    document.head.appendChild(link);
  });
}

/**
 * Detect reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detect device memory (Chrome only)
 */
export function getDeviceMemory(): number {
  return (navigator as any).deviceMemory || 4; // Default to 4GB
}

/**
 * Detect effective connection type
 */
export function getConnectionType(): string {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  return connection ? connection.effectiveType : '4g';
}

/**
 * Check if device is low-end
 */
export function isLowEndDevice(): boolean {
  const memory = getDeviceMemory();
  const connection = getConnectionType();

  return memory <= 2 || connection === 'slow-2g' || connection === '2g';
}

/**
 * Optimize based on device capabilities
 */
export function getOptimizationLevel(): 'high' | 'medium' | 'low' {
  if (isLowEndDevice()) {
    return 'low';
  }

  const memory = getDeviceMemory();
  if (memory <= 4) {
    return 'medium';
  }

  return 'high';
}

/**
 * Lazy load component (React)
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  componentFactory: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  return React.lazy(componentFactory);
}

/**
 * Code splitting helper
 */
export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Batch DOM updates
 */
export function batchUpdates(updates: Array<() => void>): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Reduce layout thrashing
 */
export function batchReadsThenWrites(
  reads: Array<() => any>,
  writes: Array<(results: any[]) => void>
): void {
  const results = reads.map((read) => read());

  requestAnimationFrame(() => {
    writes.forEach((write) => write(results));
  });
}

/**
 * Monitor FPS
 */
export function monitorFPS(callback: (fps: number) => void): () => void {
  let frameCount = 0;
  let lastTime = performance.now();

  const measure = () => {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      callback(fps);

      frameCount = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(measure);
  };

  measure();

  // Return cleanup function
  return () => {
    // Cancel animation frame
  };
}

// Import React for lazy loading
import React from 'react';
