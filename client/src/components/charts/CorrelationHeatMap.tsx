import React, { useState, useCallback, useMemo } from 'react';
import { Download, Maximize2, Minimize2, Info } from 'lucide-react';
import html2canvas from 'html2canvas';
import { CorrelationData } from '../../types/charts';
import { calculateCorrelation } from '../../utils/chartCalculations';
import { cn } from '../../utils/cn';

interface CorrelationHeatMapProps {
  data: Record<string, { date: string; value: number }[]>;
  significanceThreshold?: number;
  showLabels?: boolean;
  colorScheme?: 'blue' | 'red' | 'green';
  className?: string;
}

interface HeatMapCell {
  x: string;
  y: string;
  value: number;
  significant: boolean;
}

export const CorrelationHeatMap: React.FC<CorrelationHeatMapProps> = ({
  data,
  significanceThreshold = 0.05,
  showLabels = true,
  colorScheme = 'blue',
  className,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<HeatMapCell | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Calculate correlation matrix
  const correlationMatrix = useMemo(() => {
    const parameters = Object.keys(data);
    const matrix: CorrelationData[] = [];

    for (let i = 0; i < parameters.length; i++) {
      for (let j = i; j < parameters.length; j++) {
        const param1 = parameters[i];
        const param2 = parameters[j];

        // Find common dates
        const commonData: { x: number[]; y: number[] } = { x: [], y: [] };

        data[param1].forEach((point1) => {
          const point2 = data[param2].find(p => p.date === point1.date);
          if (point2) {
            commonData.x.push(point1.value);
            commonData.y.push(point2.value);
          }
        });

        if (commonData.x.length > 2) {
          const corr = calculateCorrelation(commonData.x, commonData.y);

          // Test significance (simplified t-test)
          const tStat = (corr * Math.sqrt(commonData.x.length - 2)) / Math.sqrt(1 - corr * corr);
          const pValue = 2 * (1 - Math.abs(tStat)); // Simplified
          const significant = pValue < significanceThreshold;

          matrix.push({
            x: param1,
            y: param2,
            value: corr,
            significant,
          });

          if (i !== j) {
            matrix.push({
              x: param2,
              y: param1,
              value: corr,
              significant,
            });
          }
        }
      }
    }

    return matrix;
  }, [data, significanceThreshold]);

  // Get color based on correlation value
  const getColor = useCallback(
    (value: number): string => {
      const intensity = Math.abs(value);

      if (colorScheme === 'blue') {
        if (value > 0) {
          return `rgba(59, 130, 246, ${intensity})`; // Blue
        } else {
          return `rgba(239, 68, 68, ${intensity})`; // Red
        }
      } else if (colorScheme === 'red') {
        if (value > 0) {
          return `rgba(239, 68, 68, ${intensity})`; // Red
        } else {
          return `rgba(59, 130, 246, ${intensity})`; // Blue
        }
      } else {
        // Green
        if (value > 0) {
          return `rgba(16, 185, 129, ${intensity})`; // Green
        } else {
          return `rgba(245, 158, 11, ${intensity})`; // Amber
        }
      }
    },
    [colorScheme]
  );

  // Get text color based on background
  const getTextColor = useCallback(
    (value: number): string => {
      const intensity = Math.abs(value);
      return intensity > 0.5 ? 'white' : 'black';
    },
    []
  );

  // Export heatmap
  const handleExport = useCallback(async () => {
    const element = document.getElementById('correlation-heatmap');
    if (!element) return;

    const canvas = await html2canvas(element);
    const link = document.createElement('a');
    link.download = `correlation-heatmap-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  const parameters = Object.keys(data);
  const cellSize = Math.max(40, Math.min(60, 600 / parameters.length));

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
          <h3 className="text-lg font-semibold">Correlation Heat Map</h3>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
            title="Show info"
          >
            <Info className="w-4 h-4" />
          </button>
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
            title="Export heatmap"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <h4 className="font-semibold mb-2">About Correlation Heat Maps</h4>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p>
              <strong>Correlation coefficient:</strong> Measures the linear relationship between two
              variables (-1 to +1).
            </p>
            <ul className="list-disc list-inside ml-2">
              <li>+1: Perfect positive correlation</li>
              <li>0: No correlation</li>
              <li>-1: Perfect negative correlation</li>
            </ul>
            <p className="mt-2">
              <strong>Significance:</strong> Marked with asterisk (*) if p &lt; {significanceThreshold}
            </p>
          </div>
        </div>
      )}

      {/* Heat map */}
      <div className="p-4">
        <div id="correlation-heatmap" className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header row */}
            <div className="flex" style={{ marginLeft: `${cellSize}px` }}>
              {parameters.map(param => (
                <div
                  key={param}
                  className="flex items-center justify-center text-xs font-semibold"
                  style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                >
                  <span className="transform -rotate-45 origin-center whitespace-nowrap">
                    {param}
                  </span>
                </div>
              ))}
            </div>

            {/* Data rows */}
            {parameters.map((yParam, yIndex) => (
              <div key={yParam} className="flex">
                {/* Y-axis label */}
                <div
                  className="flex items-center justify-end pr-2 text-xs font-semibold"
                  style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                >
                  <span className="whitespace-nowrap">{yParam}</span>
                </div>

                {/* Cells */}
                {parameters.map((xParam, xIndex) => {
                  const cellData = correlationMatrix.find(
                    c => c.x === xParam && c.y === yParam
                  );

                  const isDiagonal = xIndex === yIndex;
                  const backgroundColor = isDiagonal
                    ? 'rgba(13, 148, 136, 0.3)'
                    : getColor(cellData?.value ?? 0);
                  const textColor = getTextColor(cellData?.value ?? 0);

                  return (
                    <div
                      key={`${xParam}-${yParam}`}
                      className="flex items-center justify-center text-xs font-medium border border-slate-200 dark:border-slate-700 cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        backgroundColor,
                        color: textColor,
                      }}
                      onMouseEnter={() => setHoveredCell(cellData ?? null)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${xParam} vs ${yParam}: ${cellData?.value.toFixed(2) ?? 'N/A'}`}
                    >
                      {isDiagonal ? (
                        '1.00'
                      ) : cellData ? (
                        <div className="text-center">
                          <div>{cellData.value.toFixed(2)}</div>
                          {cellData.significant && <div className="text-[10px]">*</div>}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Color scale legend */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="text-xs">-1</span>
          <div className="flex">
            {Array.from({ length: 11 }).map((_, i) => {
              const value = -1 + (i / 10) * 2;
              return (
                <div
                  key={i}
                  className="w-8 h-4"
                  style={{ backgroundColor: getColor(value) }}
                />
              );
            })}
          </div>
          <span className="text-xs">+1</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
          <div className="text-sm space-y-1">
            <p className="font-semibold">
              {hoveredCell.x} vs {hoveredCell.y}
            </p>
            <p>Correlation: {hoveredCell.value.toFixed(3)}</p>
            <p className="text-slate-600 dark:text-slate-400">
              {hoveredCell.significant ? (
                <span className="text-green-600">Significant (p &lt; {significanceThreshold})</span>
              ) : (
                <span className="text-yellow-600">Not significant</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
