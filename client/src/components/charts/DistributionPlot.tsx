import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Download, Maximize2, Minimize2, Info, BarChart3 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { DataPoint, DistributionData, BoxPlotData } from '../../types/charts';
import { cn } from '../../utils/cn';

interface DistributionPlotProps {
  data: DataPoint[];
  labTestName: string;
  unit: string;
  referenceRange?: { min: number; max: number };
  binCount?: number;
  showHistogram?: boolean;
  showBoxPlot?: boolean;
  showStatistics?: boolean;
  className?: string;
}

interface Statistics {
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  count: number;
}

export const DistributionPlot: React.FC<DistributionPlotProps> = ({
  data,
  labTestName,
  unit,
  referenceRange,
  binCount = 10,
  showHistogram = true,
  showBoxPlot = true,
  showStatistics = true,
  className,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [activeView, setActiveView] = useState<'histogram' | 'boxplot' | 'both'>('both');

  // Calculate statistics
  const statistics = useMemo((): Statistics => {
    const values = data.map(d => d.value).sort((a, b) => a - b);
    const count = values.length;
    const min = values[0];
    const max = values[values.length - 1];

    // Mean
    const mean = values.reduce((sum, val) => sum + val, 0) / count;

    // Median
    const median =
      count % 2 === 0
        ? (values[count / 2 - 1] + values[count / 2]) / 2
        : values[Math.floor(count / 2)];

    // Mode
    const frequency: Record<number, number> = {};
    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });
    const mode = parseInt(
      Object.entries(frequency).sort(([, a], [, b]) => b - a)[0][0],
      10
    );

    // Variance and standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (count - 1);
    const stdDev = Math.sqrt(variance);

    // Quartiles
    const q1 = values[Math.floor(count * 0.25)];
    const q3 = values[Math.floor(count * 0.75)];
    const iqr = q3 - q1;

    // Skewness (Fisher-Pearson coefficient)
    const skewness =
      (count /
        ((count - 1) * (count - 2))) *
      values.reduce((sum, val) => Math.pow((val - mean) / stdDev, 3), 0);

    // Kurtosis (excess kurtosis)
    const kurtosis =
      (count * (count + 1) / ((count - 1) * (count - 2) * (count - 3))) *
        values.reduce((sum, val) => Math.pow((val - mean) / stdDev, 4), 0) -
      (3 * Math.pow(count - 1, 2)) / ((count - 2) * (count - 3));

    return {
      mean,
      median,
      mode,
      stdDev,
      variance,
      min,
      max,
      q1,
      q3,
      iqr,
      skewness,
      kurtosis,
      count,
    };
  }, [data]);

  // Calculate histogram bins
  const histogramData = useMemo((): DistributionData[] => {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / binCount;

    const bins: DistributionData[] = [];

    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = values.filter(v => v >= binStart && v < binEnd).length;

      bins.push({
        range: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        count,
        percentage: (count / values.length) * 100,
      });
    }

    return bins;
  }, [data, binCount]);

  // Calculate box plot data
  const boxPlotData = useMemo((): BoxPlotData => {
    const values = data.map(d => d.value).sort((a, b) => a - b);
    const q1 = statistics.q1;
    const q3 = statistics.q3;
    const iqr = statistics.iqr;

    // Outliers (values beyond 1.5 * IQR from Q1 or Q3)
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    const outliers = values.filter(v => v < lowerFence || v > upperFence);

    return {
      min: values[0],
      q1,
      median: statistics.median,
      q3,
      max: values[values.length - 1],
      outliers,
    };
  }, [data, statistics]);

  // Export chart
  const handleExport = useCallback(async () => {
    const element = document.getElementById('distribution-plot');
    if (!element) return;

    const canvas = await html2canvas(element);
    const link = document.createElement('a');
    link.download = `${labTestName}-distribution.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [labTestName]);

  // Custom tooltip for histogram
  const HistogramTooltip = useCallback(({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="font-semibold text-sm mb-1">Range: {data.range} {unit}</p>
        <p className="text-sm">
          <span className="font-medium">Count:</span> {data.count}
        </p>
        <p className="text-sm">
          <span className="font-medium">Percentage:</span> {data.percentage.toFixed(1)}%
        </p>
      </div>
    );
  }, [unit]);

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700',
        isFullscreen && 'fixed inset-0 z-50 rounded-none overflow-auto',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          <div>
            <h3 className="text-lg font-semibold">{labTestName} Distribution</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {statistics.count} measurements · {unit}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-md">
            <button
              onClick={() => setActiveView('histogram')}
              className={cn(
                'px-3 py-1 text-sm',
                activeView === 'histogram'
                  ? 'bg-teal-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              Histogram
            </button>
            <button
              onClick={() => setActiveView('boxplot')}
              className={cn(
                'px-3 py-1 text-sm',
                activeView === 'boxplot'
                  ? 'bg-teal-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              Box Plot
            </button>
            <button
              onClick={() => setActiveView('both')}
              className={cn(
                'px-3 py-1 text-sm',
                activeView === 'both'
                  ? 'bg-teal-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              Both
            </button>
          </div>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
            title="Show info"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleExport}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
            title="Export chart"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <h4 className="font-semibold mb-2">About Distribution Plots</h4>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p>
              <strong>Histogram:</strong> Shows the frequency distribution of data points across
              value ranges.
            </p>
            <p>
              <strong>Box Plot:</strong> Displays the five-number summary (min, Q1, median, Q3, max)
              and outliers.
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>
                <strong>Mean:</strong> Average value ({statistics.mean.toFixed(2)} {unit})
              </li>
              <li>
                <strong>Median:</strong> Middle value ({statistics.median.toFixed(2)} {unit})
              </li>
              <li>
                <strong>Std Dev:</strong> Measure of spread ({statistics.stdDev.toFixed(2)} {unit})
              </li>
              <li>
                <strong>Skewness:</strong> Asymmetry ({statistics.skewness.toFixed(2)})
              </li>
              <li>
                <strong>Kurtosis:</strong> Tailedness ({statistics.kurtosis.toFixed(2)})
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="p-4" id="distribution-plot">
        {/* View toggle buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Histogram */}
          {(activeView === 'histogram' || activeView === 'both') && (
            <div>
              <h4 className="text-sm font-semibold mb-4">Histogram</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis
                    dataKey="range"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    stroke="currentColor"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    stroke="currentColor"
                  />
                  <Tooltip content={<HistogramTooltip />} />
                  <Bar dataKey="count" fill="#0d9488" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Box Plot */}
          {(activeView === 'boxplot' || activeView === 'both') && (
            <div>
              <h4 className="text-sm font-semibold mb-4">Box Plot</h4>
              <div className="h-[300px] flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 400 300">
                  {/* Y-axis */}
                  <line x1="50" y1="20" x2="50" y2="280" stroke="#64748b" strokeWidth="2" />

                  {/* Reference range (if provided) */}
                  {referenceRange && (
                    <>
                      <rect
                        x="80"
                        y={280 - ((referenceRange.max - statistics.min) / (statistics.max - statistics.min)) * 260}
                        width={240}
                        height={
                          ((referenceRange.max - referenceRange.min) / (statistics.max - statistics.min)) * 260
                        }
                        fill="#ef4444"
                        fillOpacity={0.1}
                      />
                      <text x="330" y={280 - ((referenceRange.max - statistics.min) / (statistics.max - statistics.min)) * 260 + 5} className="text-xs" fill="#ef4444">
                        Ref max
                      </text>
                      <text x="330" y={280 - ((referenceRange.min - statistics.min) / (statistics.max - statistics.min)) * 260 + 5} className="text-xs" fill="#ef4444">
                        Ref min
                      </text>
                    </>
                  )}

                  {/* Box */}
                  <rect
                    x="150"
                    y={280 - ((statistics.q3 - statistics.min) / (statistics.max - statistics.min)) * 260}
                    width={100}
                    height={
                      ((statistics.q3 - statistics.q1) / (statistics.max - statistics.min)) * 260
                    }
                    fill="#0d9488"
                    fillOpacity={0.3}
                    stroke="#0d9488"
                    strokeWidth={2}
                  />

                  {/* Median line */}
                  <line
                    x1="150"
                    y1={280 - ((statistics.median - statistics.min) / (statistics.max - statistics.min)) * 260}
                    x2="250"
                    y2={280 - ((statistics.median - statistics.min) / (statistics.max - statistics.min)) * 260}
                    stroke="#0d9488"
                    strokeWidth={3}
                  />

                  {/* Whiskers */}
                  <line
                    x1="200"
                    y1={280 - ((statistics.q1 - statistics.min) / (statistics.max - statistics.min)) * 260}
                    x2="200"
                    y2={280 - ((boxPlotData.min - statistics.min) / (statistics.max - statistics.min)) * 260}
                    stroke="#0d9488"
                    strokeWidth={2}
                  />
                  <line
                    x1="200"
                    y1={280 - ((statistics.q3 - statistics.min) / (statistics.max - statistics.min)) * 260}
                    x2="200"
                    y2={280 - ((boxPlotData.max - statistics.min) / (statistics.max - statistics.min)) * 260}
                    stroke="#0d9488"
                    strokeWidth={2}
                  />

                  {/* Whisker caps */}
                  <line
                    x1="180"
                    y1={280 - ((boxPlotData.min - statistics.min) / (statistics.max - statistics.min)) * 260}
                    x2="220"
                    y2={280 - ((boxPlotData.min - statistics.min) / (statistics.max - statistics.min)) * 260}
                    stroke="#0d9488"
                    strokeWidth={2}
                  />
                  <line
                    x1="180"
                    y1={280 - ((boxPlotData.max - statistics.min) / (statistics.max - statistics.min)) * 260}
                    x2="220"
                    y2={280 - ((boxPlotData.max - statistics.min) / (statistics.max - statistics.min)) * 260}
                    stroke="#0d9488"
                    strokeWidth={2}
                  />

                  {/* Outliers */}
                  {boxPlotData.outliers.map((outlier, index) => (
                    <circle
                      key={index}
                      cx="200"
                      cy={280 - ((outlier - statistics.min) / (statistics.max - statistics.min)) * 260}
                      r="4"
                      fill="#ef4444"
                    />
                  ))}

                  {/* Labels */}
                  <text x="260" y={280 - ((statistics.q3 - statistics.min) / (statistics.max - statistics.min)) * 260 + 5} className="text-xs" fill="#0d9488">
                    Q3: {statistics.q3.toFixed(2)}
                  </text>
                  <text x="260" y={280 - ((statistics.median - statistics.min) / (statistics.max - statistics.min)) * 260 + 5} className="text-xs" fill="#0d9488">
                    Med: {statistics.median.toFixed(2)}
                  </text>
                  <text x="260" y={280 - ((statistics.q1 - statistics.min) / (statistics.max - statistics.min)) * 260 + 5} className="text-xs" fill="#0d9488">
                    Q1: {statistics.q1.toFixed(2)}
                  </text>
                  <text x="260" y={280 - ((boxPlotData.max - statistics.min) / (statistics.max - statistics.min)) * 260 + 5} className="text-xs" fill="#0d9488">
                    Max: {boxPlotData.max.toFixed(2)}
                  </text>
                  <text x="260" y={280 - ((boxPlotData.min - statistics.min) / (statistics.max - statistics.min)) * 260 + 5} className="text-xs" fill="#0d9488">
                    Min: {boxPlotData.min.toFixed(2)}
                  </text>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Statistics table */}
        {showStatistics && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3">Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400">Mean</p>
                <p className="text-lg font-semibold">{statistics.mean.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400">Median</p>
                <p className="text-lg font-semibold">{statistics.median.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400">Std Dev</p>
                <p className="text-lg font-semibold">{statistics.stdDev.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400">Variance</p>
                <p className="text-lg font-semibold">{statistics.variance.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400">Min</p>
                <p className="text-lg font-semibold">{statistics.min.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400">Max</p>
                <p className="text-lg font-semibold">{statistics.max.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400">Skewness</p>
                <p className="text-lg font-semibold">{statistics.skewness.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400">Kurtosis</p>
                <p className="text-lg font-semibold">{statistics.kurtosis.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
