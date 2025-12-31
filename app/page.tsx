'use client';

import LabDashboard from '@/components/LabDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Lab Values Tracker
          </h1>
          <p className="text-gray-600">
            Monitor and visualize lab test results over time
          </p>
        </header>
        <LabDashboard />
      </div>
    </main>
  );
}
