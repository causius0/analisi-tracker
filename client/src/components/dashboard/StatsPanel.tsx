/**
 * StatsPanel Component
 * Displays key statistics and insights
 */

'use client';

interface StatsPanelProps {
  insights?: any[];
}

export function StatsPanel({ insights = [] }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium text-muted-foreground">Total Tests</h3>
        <p className="text-2xl font-bold">1,234</p>
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium text-muted-foreground">Abnormal Results</h3>
        <p className="text-2xl font-bold text-yellow-600">23</p>
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium text-muted-foreground">Trends Detected</h3>
        <p className="text-2xl font-bold text-blue-600">12</p>
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-medium text-muted-foreground">Active Insights</h3>
        <p className="text-2xl font-bold text-green-600">{insights.length || 5}</p>
      </div>
    </div>
  );
}

export default StatsPanel;
