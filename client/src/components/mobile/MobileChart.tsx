import React, { useState, useRef, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { ZoomIn, Download, Maximize2, Info } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { DataPoint } from '../../types/charts';
import { cn } from '../../utils/cn';

interface MobileChartProps {
  data: DataPoint[];
  labTestName: string;
  unit: string;
  referenceRange?: { min: number; max: number };
  className?: string;
}

export const MobileChart: React.FC<MobileChartProps> = ({
  data,
  labTestName,
  unit,
  referenceRange,
  className,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Prepare chart data
  const chartData = data.map((point) => ({
    ...point,
    date: format(new Date(point.date), 'MMM dd'),
    originalDate: point.date,
  }));

  // Handle chart click
  const handleChartClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      setSelectedPoint(data.activePayload[0].payload);

      // Vibrate on selection
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
  }, []);

  // Export chart
  const handleExport = useCallback(async () => {
    if (!chartRef.current) return;

    // Use html2canvas if available, otherwise alert
    if (typeof html2canvas !== 'undefined') {
      const canvas = await html2canvas(chartRef.current);
      const link = document.createElement('a');
      link.download = `${labTestName}-chart.png`;
      link.href = canvas.toDataURL();
      link.click();
    } else {
      alert('Export feature requires html2canvas library');
    }
  }, [labTestName]);

  // Custom tooltip optimized for mobile
  const CustomTooltip = useCallback(
    ({ active, payload }: any) => {
      if (!active || !payload || !payload.length) return null;

      const data = payload[0].payload;

      return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 max-w-xs">
          <p className="font-semibold text-sm mb-2">{data.date}</p>

          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Value:</span> {data.value} {unit}
            </p>

            {data.notes && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                <span className="font-medium">Notes:</span> {data.notes}
              </p>
            )}

            {data.medications && data.medications.length > 0 && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium">Medications:</span>{' '}
                {data.medications.join(', ')}
              </p>
            )}
          </div>
        </div>
      );
    },
    [unit]
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
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">{labTestName}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {data.length} measurements · {unit}
          </p>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md active:scale-95 transition-transform"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md active:scale-95 transition-transform"
            title="Export chart"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected point info */}
      {selectedPoint && (
        <div className="mx-4 mt-3 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-teal-800 dark:text-teal-300 mb-1">
                {format(new Date(selectedPoint.date), 'MMM dd, yyyy')}
              </p>
              <p className="text-lg font-bold text-teal-900 dark:text-teal-100">
                {selectedPoint.value} {unit}
              </p>
              {selectedPoint.notes && (
                <p className="text-xs text-teal-700 dark:text-teal-400 mt-1 line-clamp-2">
                  {selectedPoint.notes}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="ml-2 p-1 text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={isFullscreen ? 400 : 250}>
          <LineChart
            data={chartData}
            onClick={handleChartClick}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />

            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'currentColor', fontSize: 10 }}
              stroke="currentColor"
              interval="preserveStartEnd"
            />

            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor', fontSize: 10 }}
              stroke="currentColor"
              domain={['auto', 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Reference range */}
            {referenceRange && (
              <>
                <ReferenceArea
                  y1={referenceRange.min}
                  y2={referenceRange.max}
                  fill="#10b981"
                  fillOpacity={0.1}
                  stroke="none"
                />
              </>
            )}

            {/* Main data line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0d9488"
              strokeWidth={2}
              dot={{ fill: '#0d9488', r: isFullscreen ? 5 : 4 }}
              activeDot={{ r: 6 }}
              name="Value"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {referenceRange && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-teal-600" />
              <span>Value</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500 opacity-20" />
              <span>Reference Range ({referenceRange.min}-{referenceRange.max})</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Latest
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {data[data.length - 1]?.value}
          </p>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Average
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(1)}
          </p>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Change
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {data.length > 1
              ? ((data[data.length - 1].value - data[0].value) / data[0].value * 100).toFixed(1) + '%'
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileChart;
