/**
 * Home Page - Analisi Tracker
 */

'use client';

import { Suspense, lazy } from 'react';

const Dashboard = lazy(() =>
  import('@/components/dashboard/Dashboard').then((mod) => ({
    default: mod.Dashboard,
  }))
);

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-48 bg-gray-200 rounded"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSkeleton />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}
