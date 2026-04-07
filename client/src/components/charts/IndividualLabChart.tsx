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
  Area,
  AreaChart,
} from 'recharts';
import { ZoomIn, ZoomOut, Download, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { DataPoint, ChartConfig, Annotation } from '../../types/charts';
import {
  calculateMovingAverage,
  calculateLinearRegression,
  calculateConfidenceInterval,
  calculatePredictions,
  calculatePercentageChange,
  formatDate,
  formatValue,
} from '../../utils/chartCalculations';
import { cn } from '../../utils/cn';

interface IndividualLabChartProps {
  data: DataPoint[];
  labTestName: string;
  unit: string;
  referenceRange?: { min: number; max: number };
  config?: Partial<ChartConfig>;
  annotations?: Annotation[];
  onAnnotationAdd?: (dataPointId: string, note: string) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  className?: string;
}

export const IndividualLabChart: React.FC<IndividualLabChartProps> = ({
  data,
  labTestName,
  unit,
  referenceRange,
  config = {},
  annotations = [],
  onAnnotationAdd,
  onAnnotationDelete,
  className,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomState, setZoomState] = useState<{ startIndex?: number; endIndex?: number }>({});
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredData, setHoveredData] = useState<DataPoint | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Merge config with defaults
  const chartConfig: ChartConfig = {
    showTrendLine: true,
    showConfidenceInterval: true,
    showPredictions: true,
    showAnnotations: true,
    showReferenceRange: true,
    enableZoom: true,
    enablePan: true,
    trendLineType: 'moving-average',
    movingAverageWindow: 3,
    predictionPeriods: 5,
    colors: {
      primary: '#0d9488',
      trend: '#f59e0b',
      confidence: 'rgba(13, 148, 136, 0.2)',
      prediction: '#8b5cf6',
      reference: '#ef4444',
    },
    ...config,
  };

  // Calculate trend data
  const values = data.map(d => d.value);
  const trendData =
    chartConfig.trendLineType === 'moving-average'
      ? calculateMovingAverage(values, chartConfig.movingAverageWindow)
      : data.map((_, i) => {
          const trend = calculateLinearRegression(data);
          return trend.slope * i + trend.intercept;
        });

  // Calculate confidence interval
  const confidenceInterval = chartConfig.showConfidenceInterval
    ? calculateConfidenceInterval(values)
    : null;

  // Calculate predictions
  const predictions = chartConfig.showPredictions ? calculatePredictions(data, chartConfig.predictionPeriods) : null;

  // Prepare chart data
  const chartData = data.map((point, index) => ({
    ...point,
    date: format(new Date(point.date), 'MMM yyyy'),
    originalDate: point.date,
    trend: trendData[index],
    confidenceUpper: confidenceInterval?.upper[index],
    confidenceLower: confidenceInterval?.lower[index],
    hasAnnotation: annotations.some(a => a.dataPointId === point.id),
    percentChange: index > 0 ? calculatePercentageChange(point.value, data[index - 1].value) : 0,
  }));

  // Add prediction data
  if (predictions) {
    predictions.dates.forEach((date, i) => {
      chartData.push({
        date: format(new Date(date), 'MMM yyyy'),
        originalDate: date,
        value: null,
        trend: null,
        predicted: predictions.predicted[i],
        predictionUpper: predictions.confidenceUpper[i],
        predictionLower: predictions.confidenceLower[i],
        isPrediction: true,
      });
    });
  }

  // Handle zoom
  const handleZoom = useCallback(
    (startIndex?: number, endIndex?: number) => {
      setZoomState({ startIndex, endIndex });
    },
    []
  );

  const handleZoomOut = useCallback(() => {
    setZoomState({});
  }, []);

  // Export chart
  const handleExport = useCallback(async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = `${labTestName}-chart.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [labTestName]);

  // Custom tooltip
  const CustomTooltip = useCallback(
    ({ active, payload }: any) => {
      if (!active || !payload || !hoveredData) return null;

      const data = payload[0].payload;
      const isPrediction = data.isPrediction;

      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-semibold text-sm mb-2">{data.date}</p>

          {!isPrediction ? (
            <>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Value:</span> {formatValue(data.value, unit)}
                </p>

                {data.trend && (
                  <p className="text-sm">
                    <span className="font-medium">Trend:</span>{' '}
                    <span style={{ color: chartConfig.colors.trend }}>{formatValue(data.trend, unit)}</span>
                  </p>
                )}

                {data.percentChange !== 0 && (
                  <p className="text-sm">
                    <span className="font-medium">Change:</span>{' '}
                    <span className={data.percentChange > 0 ? 'text-red-600' : 'text-green-600'}>
                      {data.percentChange > 0 ? '+' : ''}
                      {data.percentChange.toFixed(1)}%
                    </span>
                  </p>
                )}

                {data.notes && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    <span className="font-medium">Notes:</span> {data.notes}
                  </p>
                )}

                {data.medications && data.medications.length > 0 && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Medications:</span> {data.medications.join(', ')}
                  </p>
                )}

                {data.events && data.events.length > 0 && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Events:</span> {data.events.join(', ')}
                  </p>
                )}

                {data.hasAnnotation && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    Has annotation
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Predicted</p>
              <p className="text-sm">
                <span className="font-medium">Value:</span>{' '}
                <span style={{ color: chartConfig.colors.prediction }}>
                  {formatValue(data.predicted, unit)}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                Range: {formatValue(data.predictionLower, unit)} - {formatValue(data.predictionUpper, unit)}
              </p>
            </>
          )}
        </div>
      );
    },
    [hoveredData, unit, chartConfig.colors]
  );

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
          <h3 className="text-lg font-semibold">{labTestName}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {data.length} measurements · {unit}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {chartConfig.enableZoom && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom()}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                title="Reset zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          )}

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={chartConfig.showTrendLine}
                onChange={(e) => (config.showTrendLine = e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Trend Line</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={chartConfig.showConfidenceInterval}
                onChange={(e) => (config.showConfidenceInterval = e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Confidence Interval</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={chartConfig.showPredictions}
                onChange={(e) => (config.showPredictions = e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Predictions</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={chartConfig.showReferenceRange}
                onChange={(e) => (config.showReferenceRange = e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Reference Range</span>
            </label>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} onMouseMove={(e) => setHoveredData(e.activePayload?.[0]?.payload)}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />

            <XAxis
              dataKey="date"
              className="text-sm"
              tick={{ fill: 'currentColor' }}
              stroke="currentColor"
            />

            <YAxis
              className="text-sm"
              tick={{ fill: 'currentColor' }}
              stroke="currentColor"
              domain={['auto', 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend />

            {/* Reference range */}
            {chartConfig.showReferenceRange && referenceRange && (
              <>
                <ReferenceArea
                  y1={referenceRange.min}
                  y2={referenceRange.max}
                  fill={chartConfig.colors.reference}
                  fillOpacity={0.1}
                  stroke="none"
                />
                <ReferenceArea
                  y1={referenceRange.min}
                  y2={referenceRange.min}
                  stroke={chartConfig.colors.reference}
                  strokeDasharray="3 3"
                  fillOpacity={0}
                />
                <ReferenceArea
                  y1={referenceRange.max}
                  y2={referenceRange.max}
                  stroke={chartConfig.colors.reference}
                  strokeDasharray="3 3"
                  fillOpacity={0}
                />
              </>
            )}

            {/* Confidence interval */}
            {chartConfig.showConfidenceInterval && confidenceInterval && (
              <Area
                type="monotone"
                dataKey="confidenceUpper"
                stroke="none"
                fill={chartConfig.colors.confidence}
                fillOpacity={0.3}
              />
            )}

            {/* Main data line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartConfig.colors.primary}
              strokeWidth={2}
              dot={{ fill: chartConfig.colors.primary, r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
              name="Value"
            />

            {/* Trend line */}
            {chartConfig.showTrendLine && (
              <Line
                type="monotone"
                dataKey="trend"
                stroke={chartConfig.colors.trend}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Trend"
              />
            )}

            {/* Predictions */}
            {chartConfig.showPredictions && predictions && (
              <Line
                type="monotone"
                dataKey="predicted"
                stroke={chartConfig.colors.prediction}
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ fill: chartConfig.colors.prediction, r: 3 }}
                name="Predicted"
              />
            )}

            {/* Brush for zooming */}
            {chartConfig.enableZoom && (
              <Brush
                dataKey="date"
                height={30}
                stroke={chartConfig.colors.primary}
                fill={chartConfig.colors.confidence}
                onChange={(e) => handleZoom(e.startIndex, e.endIndex)}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Annotations section */}
      {chartConfig.showAnnotations && annotations.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold mb-2">Annotations</h4>
          <div className="space-y-2">
            {annotations.map((annotation) => {
              const dataPoint = data.find(d => d.id === annotation.dataPointId);
              if (!dataPoint) return null;

              return (
                <div key={annotation.id} className="flex items-start justify-between text-sm">
                  <div>
                    <span className="font-medium">{formatDate(dataPoint.date)}:</span>
                    <span className="ml-2 text-slate-600 dark:text-slate-400">{annotation.note}</span>
                  </div>
                  {onAnnotationDelete && (
                    <button
                      onClick={() => onAnnotationDelete(annotation.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
