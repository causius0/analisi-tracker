/**
 * Dashboard component with code splitting and lazy loading
 */

'use client';

import { lazy, Suspense } from 'react';
import { useTrends, useCorrelations, useInsights } from '@/hooks/use-analytics';

// Lazy load heavy components
const ChartGrid = lazy(() =>
  import('@/components/charts/ChartGrid').then((mod) => ({
    default: mod.ChartGrid,
  }))
);

const CorrelationHeatMap = lazy(() =>
  import('@/components/charts/CorrelationHeatMap').then((mod) => ({
    default: mod.CorrelationHeatMap,
  }))
);

const StatsPanel = lazy(() =>
  import('@/components/dashboard/StatsPanel').then((mod) => ({
    default: mod.StatsPanel,
  }))
);

// Loading skeleton
function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  );
}

export function Dashboard() {
  const { data: insights, isLoading: isLoadingInsights } = useInsights();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      </div>

      {/* Lazy load stats panel */}
      <Suspense fallback={<ChartSkeleton />}>
        <StatsPanel insights={insights} />
      </Suspense>

      {/* Lazy load charts */}
      <Suspense fallback={<ChartSkeleton />}>
        <ChartGrid />
      </Suspense>

      {/* Lazy load correlation heatmap */}
      <Suspense fallback={<ChartSkeleton />}>
        <CorrelationHeatMap />
      </Suspense>
    </div>
  );
}

export default Dashboard;
