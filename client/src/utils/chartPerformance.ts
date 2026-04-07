import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { DataPoint } from '../types/charts';

/**
 * Virtualized data hook for large datasets
 * Only renders data points visible in the current viewport
 */
export function useVirtualizedData(
  data: DataPoint[],
  containerWidth: number,
  pointWidth: number = 50
): DataPoint[] {
  return useMemo(() => {
    // Calculate how many points can fit in the viewport
    const visiblePoints = Math.ceil(containerWidth / pointWidth);

    // If all data fits, return everything
    if (data.length <= visiblePoints) {
      return data;
    }

    // Sample data to fit viewport (every nth point)
    const step = Math.ceil(data.length / visiblePoints);
    const virtualized: DataPoint[] = [];

    for (let i = 0; i < data.length; i += step) {
      virtualized.push(data[i]);
    }

    // Always include the last point
    if (virtualized[virtualized.length - 1] !== data[data.length - 1]) {
      virtualized.push(data[data.length - 1]);
    }

    return virtualized;
  }, [data, containerWidth, pointWidth]);
}

/**
 * Data aggregation hook for very large datasets
 * Aggregates data points by time interval
 */
export function useAggregatedData(
  data: DataPoint[],
  interval: 'hour' | 'day' | 'week' | 'month' = 'day'
): DataPoint[] {
  return useMemo(() => {
    if (data.length < 100) return data;

    const aggregated = new Map<string, DataPoint[]>();

    // Group by interval
    data.forEach(point => {
      const date = new Date(point.date);
      let key: string;

      switch (interval) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth()}`;
          break;
      }

      const existing = aggregated.get(key) || [];
      existing.push(point);
      aggregated.set(key, existing);
    });

    // Aggregate each group
    return Array.from(aggregated.entries()).map(([key, points]) => {
      // Use the first date as representative
      const representativeDate = points[0].date;

      // Calculate average value
      const avgValue = points.reduce((sum, p) => sum + p.value, 0) / points.length;

      // Keep other metadata from first point
      return {
        date: representativeDate,
        value: avgValue,
        id: points[0].id,
        notes: points.length > 1 ? `${points.length} measurements` : points[0].notes,
        medications: points[0].medications,
        events: points[0].events,
      };
    });
  }, [data, interval]);
}

/**
 * Lazy loading hook for chart data
 * Loads data in chunks as user scrolls/zooms
 */
export function useLazyLoadedData(
  allData: DataPoint[],
  initialChunkSize: number = 50,
  chunkSize: number = 50
): {
  data: DataPoint[];
  loadMore: () => void;
  hasMore: boolean;
  reset: () => void;
} {
  const [loadedCount, setLoadedCount] = useState(initialChunkSize);

  const data = useMemo(() => {
    return allData.slice(0, loadedCount);
  }, [allData, loadedCount]);

  const hasMore = loadedCount < allData.length;

  const loadMore = useCallback(() => {
    setLoadedCount(prev => Math.min(prev + chunkSize, allData.length));
  }, [allData.length, chunkSize]);

  const reset = useCallback(() => {
    setLoadedCount(initialChunkSize);
  }, [initialChunkSize]);

  return { data, loadMore, hasMore, reset };
}

/**
 * Debounced resize observer hook
 * Optimizes resize handling for responsive charts
 */
export function useDebouncedResize(
  callback: (entry: ResizeObserverEntry) => void,
  delay: number = 100
): (element: HTMLElement | null) => void {
  const ref = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(entries[0]);
      }, delay);
    });

    observer.observe(ref.current);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      observer.disconnect();
    };
  }, [callback, delay]);

  return (element) => {
    ref.current = element;
  };
}

/**
 * Memoized chart calculations hook
 * Caches expensive calculations
 */
export function useMemoizedCalculations<T>(
  data: any[],
  calculator: (data: any[]) => T,
  dependencies: any[] = []
): T {
  return useMemo(() => {
    return calculator(data);
  }, [data, calculator, ...dependencies]);
}

/**
 * Progressive rendering hook
 * Renders chart in stages to prevent blocking
 */
export function useProgressiveRendering(
  data: DataPoint[],
  stages: number = 3
): {
  currentData: DataPoint[];
  progress: number;
  isComplete: boolean;
} {
  const [currentStage, setCurrentStage] = useState(0);

  const currentData = useMemo(() => {
    const chunkSize = Math.ceil(data.length / stages);
    return data.slice(0, (currentStage + 1) * chunkSize);
  }, [data, currentStage, stages]);

  const progress = useMemo(() => {
    return ((currentStage + 1) / stages) * 100;
  }, [currentStage, stages]);

  const isComplete = currentStage >= stages - 1;

  // Auto-advance stages
  useEffect(() => {
    if (isComplete) return;

    const timer = setTimeout(() => {
      setCurrentStage(prev => prev + 1);
    }, 16); // ~60fps

    return () => clearTimeout(timer);
  }, [currentStage, isComplete, stages]);

  return { currentData, progress, isComplete };
}

/**
 * Chart data cache manager
 * Caches calculated chart data to avoid redundant computations
 */
class ChartDataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttl: number = 5 * 60 * 1000) {
    // 5 minutes default TTL
    this.ttl = ttl;
  }

  generateKey(data: any[], operation: string, params: any = {}): string {
    const dataHash = JSON.stringify(data.slice(0, 10)); // Sample for hash
    const paramsHash = JSON.stringify(params);
    return `${operation}-${dataHash}-${paramsHash}`;
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const chartCache = new ChartDataCache();

/**
 * Performance monitoring hook
 * Tracks rendering performance for charts
 */
export function useChartPerformance(chartName: string) {
  const renderStart = useRef<number>();
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current += 1;

    return () => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;
        console.log(
          `[Chart Performance] ${chartName} #${renderCount.current}: ${renderTime.toFixed(2)}ms`
        );
      }
    };
  }, [chartName]);

  // Report performance metrics
  const reportMetrics = useCallback(() => {
    if (!renderStart.current) return;

    const renderTime = performance.now() - renderStart.current;
    const metrics = {
      chartName,
      renderTime,
      renderCount: renderCount.current,
      timestamp: new Date().toISOString(),
    };

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // analytics.track('chart_performance', metrics);
    }

    return metrics;
  }, [chartName]);

  return { reportMetrics };
}

/**
 * Optimized data sampling hook
 * Intelligently samples data to maintain chart accuracy while reducing render load
 */
export function useSmartSampledData(
  data: DataPoint[],
  maxPoints: number = 1000
): DataPoint[] {
  return useMemo(() => {
    if (data.length <= maxPoints) return data;

    // Use LTO (Largest-Triangle-Three-Buckets) algorithm for smart sampling
    // This preserves important features like peaks and valleys

    const sampled: DataPoint[] = [];
    const bucketSize = (data.length - 2) / (maxPoints - 2);

    // Always include first point
    sampled.push(data[0]);

    // Sample each bucket
    for (let i = 0; i < maxPoints - 2; i++) {
      const start = Math.floor((i + 1) * bucketSize);
      const end = Math.floor((i + 2) * bucketSize);
      const bucket = data.slice(start, end);

      if (bucket.length === 0) continue;

      // Find point with largest triangle area
      let maxArea = 0;
      let maxPoint = bucket[0];

      for (let j = 0; j < bucket.length; j++) {
        const point = bucket[j];
        const prevPoint = sampled[sampled.length - 1];

        // Calculate triangle area
        const base = end - start;
        const height = Math.abs(point.value - prevPoint.value);
        const area = (base * height) / 2;

        if (area > maxArea) {
          maxArea = area;
          maxPoint = point;
        }
      }

      sampled.push(maxPoint);
    }

    // Always include last point
    sampled.push(data[data.length - 1]);

    return sampled;
  }, [data, maxPoints]);
}
