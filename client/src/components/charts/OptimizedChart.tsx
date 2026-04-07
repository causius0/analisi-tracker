/**
 * Performance-optimized chart component
 * Features: data downsampling, lazy loading, memoization, debouncing
 */

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useResizeDetector } from 'react-resize-detector';
import {
  lttbDownsampling,
  adaptiveDownsampling,
  calculateVariance,
} from '@/utils/data-downsampling';
import { debounce } from '@/lib/web-vitals';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface OptimizedChartProps {
  data: Array<{ x: number; y: number; date?: string }>;
  type?: 'line' | 'bar';
  title?: string;
  color?: string;
  height?: number;
  enableDownsampling?: boolean;
  maxPoints?: number;
  animation?: boolean;
}

export function OptimizedChart({
  data,
  type = 'line',
  title,
  color = '#3b82f6',
  height = 300,
  enableDownsampling = true,
  maxPoints = 1000,
  animation = true,
}: OptimizedChartProps) {
  const chartRef = useRef<ChartJS<'line' | 'bar'>>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Resize detection with debouncing
  const { width, ref: resizeRef } = useResizeDetector({
    refreshMode: 'debounce',
    refreshRate: 200,
  });

  // Data downsampling (memoized)
  const downsampledData = useMemo(() => {
    if (!enableDownsampling || data.length <= maxPoints) {
      return data;
    }

    const variance = calculateVariance(data);
    const optimalMaxPoints = Math.min(
      maxPoints,
      Math.floor(maxPoints * (1 + variance / 100))
    );

    if (width) {
      return adaptiveDownsampling(data, width);
    }

    return lttbDownsampling(data, optimalMaxPoints);
  }, [data, enableDownsampling, maxPoints, width, variance]);

  // Chart data (memoized)
  const chartData = useMemo(() => {
    const labels = downsampledData.map((point) =>
      point.date || new Date(point.x).toLocaleDateString()
    );
    const values = downsampledData.map((point) => point.y);

    return {
      labels,
      datasets: [
        {
          label: title || 'Value',
          data: values,
          borderColor: color,
          backgroundColor: type === 'line' ? `${color}20` : `${color}80`,
          borderWidth: 2,
          pointRadius: data.length > 100 ? 0 : 3,
          pointHoverRadius: 5,
          fill: type === 'line' ? true : undefined,
          tension: 0.3,
        },
      ],
    };
  }, [downsampledData, title, color, type, data.length]);

  // Chart options (memoized)
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: animation
        ? {
            duration: data.length > 500 ? 0 : 300, // Disable animation for large datasets
          }
        : false,
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
      plugins: {
        legend: {
          display: !!title,
          position: 'top' as const,
        },
        title: {
          display: !!title,
          text: title,
        },
        tooltip: {
          enabled: true,
          mode: 'index' as const,
          intersect: false,
          debounce: 200, // Debounce tooltip updates
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date',
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Value',
          },
        },
      },
      performance: true, // Enable performance optimizations
    }),
    [title, animation, data.length]
  );

  // Combine refs
  const combinedRef = (node: HTMLDivElement) => {
    containerRef.current = node;
    resizeRef(node);
  };

  // Don't render if not visible (lazy loading)
  if (!isVisible) {
    return (
      <div
        ref={combinedRef}
        style={{ height }}
        className="flex items-center justify-center bg-muted/20 rounded-lg"
      >
        <div className="text-sm text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  const ChartComponent = type === 'line' ? Line : Bar;

  return (
    <div ref={combinedRef} style={{ height }} className="w-full">
      <ChartComponent
        ref={chartRef}
        data={chartData}
        options={chartOptions}
      />
    </div>
  );
}

/**
 * Memoized export to prevent unnecessary re-renders
 */
export default React.memo(OptimizedChart, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.type === nextProps.type &&
    prevProps.title === nextProps.title &&
    prevProps.color === nextProps.color
  );
});
