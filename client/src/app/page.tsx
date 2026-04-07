/**
 * Home Page - Analisi Tracker
 * Main entry point for the application
 */

'use client';

import { Suspense } from 'react';

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Analisi Tracker
          </h1>
          <p className="text-muted-foreground">
            Advanced Medical Lab Test Analytics Platform
          </p>
        </header>

        <div className="space-y-6">
          {/* Welcome Section */}
          <section className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Analisi Tracker</h2>
            <p className="text-muted-foreground mb-4">
              Your personal medical lab test analytics platform with AI-powered insights,
              trend analysis, and predictive analytics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Trend Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Track your lab test results over time and identify patterns
                </p>
              </div>
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Correlations</h3>
                <p className="text-sm text-muted-foreground">
                  Discover relationships between different lab tests
                </p>
              </div>
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Predictions</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered forecasting of future lab values
                </p>
              </div>
            </div>
          </section>

          {/* Demo Notice */}
          <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Demo Mode Active</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The application is running in demo mode with sample data. No backend server is required.
            </p>
            <div className="text-xs text-muted-foreground">
              <p>To connect to a real backend:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Set NEXT_PUBLIC_DEMO_MODE=false in .env.local</li>
                <li>Start the backend server: npm run server:dev</li>
                <li>Configure your database in .env.local</li>
              </ol>
            </div>
          </section>

          {/* Quick Stats */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Abnormal Results</p>
                <p className="text-3xl font-bold text-yellow-600">0</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Trends Detected</p>
                <p className="text-3xl font-bold text-blue-600">0</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Active Insights</p>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
            </div>
          </section>

          {/* Sample Charts Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Sample Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Complete Blood Count</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-muted-foreground">Chart placeholder - Add data to see visualization</p>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Metabolic Panel</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-muted-foreground">Chart placeholder - Add data to see visualization</p>
                </div>
              </div>
            </div>
          </section>

          {/* Getting Started */}
          <section className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h3 className="font-semibold">Import Lab Results</h3>
                  <p className="text-sm text-muted-foreground">Upload PDF reports or enter data manually</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h3 className="font-semibold">View Analytics</h3>
                  <p className="text-sm text-muted-foreground">Explore trends, correlations, and predictions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h3 className="font-semibold">Get Insights</h3>
                  <p className="text-sm text-muted-foreground">Receive AI-powered analysis and recommendations</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
