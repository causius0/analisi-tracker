import React, { useState, useRef, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  Brush,
} from 'recharts';
import { ZoomIn, ZoomOut, Download, Maximize2, Minimize2, Eye, EyeOff, Settings } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { ComparisonSeries, ChartConfig } from '../../types/charts';
import { calculateCorrelation, normalizeToPercent, calculateZScores, formatDate, formatValue } from '../../utils/chartCalculations';
import { cn } from '../../utils/cn';

interface ComparisonChartProps {
  series: ComparisonSeries[];
  config?: Partial<ChartConfig>;
  normalizationMode?: 'none' | 'percent' | 'zscore';
  showCorrelation?: boolean;
  className?: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  series,
  config = {},
  normalizationMode = 'none',
  showCorrelation = true,
  className,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set(series.map(s => s.id)));
  const [showSettings, setShowSettings] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Merge config with defaults
  const chartConfig: ChartConfig = {
    showTrendLine: config.showTrendLine ?? false,
    showConfidenceInterval: config.showConfidenceInterval ?? false,
    showPredictions: config.showPredictions ?? false,
    showAnnotations: config.showAnnotations ?? false,
    showReferenceRange: config.showReferenceRange ?? true,
    enableZoom: config.enableZoom ?? true,
    enablePan: config.enablePan ?? true,
    trendLineType: config.trendLineType ?? 'linear',
    movingAverageWindow: config.movingAverageWindow ?? 5,
    predictionPeriods: config.predictionPeriods ?? 10,
    colors: {
      primary: '#0d9488',
      trend: '#f59e0b',
      confidence: 'rgba(13, 148, 136, 0.2)',
      prediction: '#8b5cf6',
      reference: '#ef4444',
      ...config.colors,
    },
  };

  // Calculate correlations between visible series
  const correlations = React.useMemo(() => {
    if (!showCorrelation || visibleSeries.size < 2) return {};

    const visibleSeriesList = series.filter(s => visibleSeries.has(s.id));
    const result: Record<string, Record<string, number>> = {};

    for (let i = 0; i < visibleSeriesList.length; i++) {
      for (let j = i + 1; j < visibleSeriesList.length; j++) {
        const s1 = visibleSeriesList[i];
        const s2 = visibleSeriesList[j];

        // Find common dates
        const commonData: { x: number[]; y: number[] } = { x: [], y: [] };

        s1.data.forEach((point1) => {
          const point2 = s2.data.find(p => p.date === point1.date);
          if (point2) {
            commonData.x.push(point1.value);
            commonData.y.push(point2.value);
          }
        });

        if (commonData.x.length > 1) {
          const corr = calculateCorrelation(commonData.x, commonData.y);

          if (!result[s1.id]) result[s1.id] = {};
          if (!result[s2.id]) result[s2.id] = {};

          result[s1.id][s2.id] = corr;
          result[s2.id][s1.id] = corr;
        }
      }
    }

    return result;
  }, [series, visibleSeries, showCorrelation]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    // Get all unique dates
    const allDates = Array.from(
      new Set(series.flatMap(s => s.data.map(d => d.date)))
    ).sort();

    return allDates.map(date => {
      const dataPoint: any = {
        date: format(new Date(date), 'MMM yyyy'),
        originalDate: date,
      };

      series.forEach(s => {
        if (!visibleSeries.has(s.id)) return;

        const data = s.data.find(d => d.date === date);
        let value = data?.value ?? null;

        // Apply normalization
        if (value !== null && normalizationMode !== 'none') {
          const allValues = s.data.map(d => d.value).filter(v => v !== null);

          if (normalizationMode === 'percent') {
            const normalized = normalizeToPercent(allValues);
            const index = allValues.indexOf(value);
            value = normalized[index];
          } else if (normalizationMode === 'zscore') {
            const zScores = calculateZScores(allValues);
            const index = allValues.indexOf(value);
            value = zScores[index];
          }
        }

        dataPoint[s.id] = value;
      });

      return dataPoint;
    });
  }, [series, visibleSeries, normalizationMode]);

  // Handle series visibility toggle
  const toggleSeries = useCallback((seriesId: string) => {
    setVisibleSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesId)) {
        newSet.delete(seriesId);
      } else {
        newSet.add(seriesId);
      }
      return newSet;
    });
  }, []);

  // Export chart
  const handleExport = useCallback(async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = `comparison-chart-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  // Custom tooltip
  const CustomTooltip = useCallback(
    ({ active, payload }: any) => {
      if (!active || !payload || !payload.length) return null;

      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-semibold text-sm mb-2">{payload[0].payload.date}</p>

          <div className="space-y-1">
            {payload.map((entry: any) => {
              const s = series.find(s => s.id === entry.dataKey);
              if (!s) return null;

              return (
                <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="font-medium">{s.name}:</span>
                  <span>
                    {normalizationMode === 'percent'
                      ? `${entry.value.toFixed(1)}%`
                      : normalizationMode === 'zscore'
                      ? entry.value.toFixed(2)
                      : formatValue(entry.value, s.unit)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    },
    [series, normalizationMode]
  );

  // Get Y-axis domains
  const getYAxisDomain = (position: 'left' | 'right') => {
    const relevantSeries = series.filter(s => s.yAxisPosition === position && visibleSeries.has(s.id));
    if (relevantSeries.length === 0) return [0, 100];

    const allValues = relevantSeries.flatMap(s => s.data.map(d => d.value));
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;

    return [min - padding, max + padding];
  };

  return (
    <div
      ref={chartRef}
      className={cn(
        'bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h3 className="text-lg font-semibold">Comparison Chart</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {visibleSeries.size} series · {normalizationMode} normalization
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Normalization Mode</label>
              <select
                value={normalizationMode}
                onChange={(e) => {
                  // Update normalization mode
                  // You'd need to pass this setter up
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md"
              >
                <option value="none">None (raw values)</option>
                <option value="percent">Percent of range</option>
                <option value="zscore">Z-score</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Series Visibility</label>
              <div className="space-y-2">
                {series.map(s => (
                  <label key={s.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={visibleSeries.has(s.id)}
                      onChange={() => toggleSeries(s.id)}
                      className="rounded"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-sm">{s.name}</span>
                    <span className="text-xs text-slate-500">({s.unit})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correlation indicators */}
      {showCorrelation && Object.keys(correlations).length > 0 && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <h4 className="text-sm font-semibold mb-2">Correlations</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(correlations).map(([seriesId, corrMap]) => {
              const s1 = series.find(s => s.id === seriesId);
              if (!s1) return null;

              return Object.entries(corrMap).map(([otherSeriesId, corr]) => {
                const s2 = series.find(s => s.id === otherSeriesId);
                if (!s2 || seriesId > otherSeriesId) return null;

                const strength = Math.abs(corr);
                const color =
                  strength > 0.7 ? 'text-green-600' : strength > 0.4 ? 'text-yellow-600' : 'text-red-600';

                return (
                  <div
                    key={`${seriesId}-${otherSeriesId}`}
                    className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-sm border border-slate-200 dark:border-slate-700"
                  >
                    <span className="font-medium">{s1.name}</span>
                    <span className="mx-1">vs</span>
                    <span className="font-medium">{s2.name}</span>
                    <span className={`ml-2 ${color}`}>
                      {corr > 0 ? '+' : ''}
                      {corr.toFixed(2)}
                    </span>
                  </div>
                );
              });
            })}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />

            <XAxis
              dataKey="date"
              className="text-sm"
              tick={{ fill: 'currentColor' }}
              stroke="currentColor"
            />

            {/* Left Y-axis */}
            <YAxis
              yAxisId="left"
              className="text-sm"
              tick={{ fill: 'currentColor' }}
              stroke="currentColor"
              domain={getYAxisDomain('left')}
            />

            {/* Right Y-axis */}
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-sm"
              tick={{ fill: 'currentColor' }}
              stroke="currentColor"
              domain={getYAxisDomain('right')}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend />

            {/* Render visible series */}
            {series
              .filter(s => visibleSeries.has(s.id))
              .map(s => (
                <React.Fragment key={s.id}>
                  {/* Reference range */}
                  {chartConfig.showReferenceRange && s.referenceRange && (
                    <ReferenceArea
                      yAxisId={s.yAxisPosition}
                      y1={s.referenceRange.min}
                      y2={s.referenceRange.max}
                      fill={s.color}
                      fillOpacity={0.1}
                      stroke="none"
                    />
                  )}

                  {/* Data line */}
                  <Line
                    yAxisId={s.yAxisPosition}
                    type="monotone"
                    dataKey={s.id}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ fill: s.color, r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                    name={s.name}
                  />
                </React.Fragment>
              ))}

            {/* Brush for zooming */}
            {chartConfig.enableZoom && (
              <Brush
                dataKey="date"
                height={30}
                stroke={chartConfig.colors.primary}
                fill={chartConfig.colors.confidence}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
