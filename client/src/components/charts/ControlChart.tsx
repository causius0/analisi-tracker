import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Scatter,
} from 'recharts';
import { AlertTriangle, CheckCircle, XCircle, Download, Maximize2, Minimize2, Info } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { DataPoint, ControlChartData } from '../../types/charts';
import { formatDate } from '../../utils/chartCalculations';
import { cn } from '../../utils/cn';

interface ControlChartProps {
  data: DataPoint[];
  labTestName: string;
  unit: string;
  sigma?: number;
  showRules?: boolean;
  enableWestwardRules?: boolean;
  className?: string;
}

type RuleViolation =
  | 'beyond_limits'
  | 'zone_a'
  | 'zone_b'
  | 'zone_c'
  | 'trend'
  | 'alternating'
  | 'stratification';

interface RuleViolationDetail {
  type: RuleViolation;
  index: number;
  description: string;
  severity: 'warning' | 'critical';
}

export const ControlChart: React.FC<ControlChartProps> = ({
  data,
  labTestName,
  unit,
  sigma = 3,
  showRules = true,
  enableWestwardRules = true,
  className,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<RuleViolationDetail | null>(null);

  // Calculate control chart statistics
  const controlChartData = useMemo(() => {
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    const stdDev = Math.sqrt(variance);

    const upperControlLimit = mean + sigma * stdDev;
    const lowerControlLimit = mean - sigma * stdDev;
    const centerLine = mean;

    // Calculate zones (1-sigma, 2-sigma, 3-sigma)
    const zones = {
      a: [mean + 2 * stdDev, mean + 3 * stdDev, mean - 2 * stdDev, mean - 3 * stdDev],
      b: [mean + 1 * stdDev, mean + 2 * stdDev, mean - 1 * stdDev, mean - 2 * stdDev],
      c: [mean, mean + 1 * stdDev, mean - 1 * stdDev, mean],
    };

    // Detect rule violations
    const violations: RuleViolationDetail[] = [];

    data.forEach((point, index) => {
      const value = point.value;
      const outOfControl = value > upperControlLimit || value < lowerControlLimit;

      // Rule 1: Beyond control limits
      if (outOfControl) {
        violations.push({
          type: 'beyond_limits',
          index,
          description: `Value ${formatDate(point.date)} is beyond ${sigma}-sigma limits`,
          severity: 'critical',
        });
      }

      if (!enableWestwardRules) return;

      // Rule 2: Zone A (2 of 3 consecutive points in Zone A or beyond)
      if (index >= 2) {
        const recent = values.slice(index - 2, index + 1);
        const inZoneA = recent.filter(
          v => v >= zones.a[0] || v <= zones.a[2]
        ).length;

        if (inZoneA >= 2) {
          violations.push({
            type: 'zone_a',
            index,
            description: `2 of 3 points in Zone A (${formatDate(point.date)})`,
            severity: 'warning',
          });
        }
      }

      // Rule 3: Zone B (4 of 5 consecutive points in Zone B or beyond)
      if (index >= 4) {
        const recent = values.slice(index - 4, index + 1);
        const inZoneB = recent.filter(
          v => v >= zones.b[0] || v <= zones.b[2]
        ).length;

        if (inZoneB >= 4) {
          violations.push({
            type: 'zone_b',
            index,
            description: `4 of 5 points in Zone B (${formatDate(point.date)})`,
            severity: 'warning',
          });
        }
      }

      // Rule 4: Zone C (6 consecutive points in Zone C (one side of center line))
      if (index >= 5) {
        const recent = values.slice(index - 5, index + 1);
        const allAbove = recent.every(v => v >= zones.c[0]);
        const allBelow = recent.every(v => v <= zones.c[2]);

        if (allAbove || allBelow) {
          violations.push({
            type: 'zone_c',
            index,
            description: `6 consecutive points on one side (${formatDate(point.date)})`,
            severity: 'warning',
          });
        }
      }

      // Rule 5: Trend (6 consecutive points steadily increasing or decreasing)
      if (index >= 5) {
        const recent = values.slice(index - 5, index + 1);
        const increasing = recent.every((v, i) => i === 0 || v > recent[i - 1]);
        const decreasing = recent.every((v, i) => i === 0 || v < recent[i - 1]);

        if (increasing || decreasing) {
          violations.push({
            type: 'trend',
            index,
            description: `6 point ${increasing ? 'increasing' : 'decreasing'} trend (${formatDate(
              point.date
            )})`,
            severity: 'warning',
          });
        }
      }

      // Rule 6: Alternating (14 consecutive points alternating up and down)
      if (index >= 13) {
        const recent = values.slice(index - 13, index + 1);
        const alternating = recent.every((v, i) => {
          if (i === 0) return true;
          return (v > recent[i - 1] && recent[i - 1] < recent[i - 2]) ||
                 (v < recent[i - 1] && recent[i - 1] > recent[i - 2]);
        });

        if (alternating) {
          violations.push({
            type: 'alternating',
            index,
            description: `14 alternating points (${formatDate(point.date)})`,
            severity: 'warning',
          });
        }
      }

      // Rule 7: Stratification (15 consecutive points within Zone C)
      if (index >= 14) {
        const recent = values.slice(index - 14, index + 1);
        const inZoneC = recent.every(
          v => v >= zones.c[2] && v <= zones.c[1]
        );

        if (inZoneC) {
          violations.push({
            type: 'stratification',
            index,
            description: `15 points in Zone C (${formatDate(point.date)})`,
            severity: 'warning',
          });
        }
      }
    });

    return {
      upperControlLimit,
      lowerControlLimit,
      centerLine,
      violations,
      zones,
    };
  }, [data, sigma, enableWestwardRules]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return data.map((point, index) => ({
      ...point,
      date: format(new Date(point.date), 'MMM yyyy'),
      originalDate: point.date,
      ucl: controlChartData.upperControlLimit,
      lcl: controlChartData.lowerControlLimit,
      cl: controlChartData.centerLine,
      outOfControl:
        point.value > controlChartData.upperControlLimit ||
        point.value < controlChartData.lowerControlLimit,
      violation: controlChartData.violations.find(v => v.index === index),
    }));
  }, [data, controlChartData]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalViolations = controlChartData.violations.length;
    const criticalViolations = controlChartData.violations.filter(v => v.severity === 'critical')
      .length;
    const processStatus =
      totalViolations === 0
        ? 'stable'
        : criticalViolations > 0
        ? 'out-of-control'
        : 'warning';

    return {
      totalViolations,
      criticalViolations,
      processStatus,
    };
  }, [controlChartData.violations]);

  // Export chart
  const handleExport = useCallback(async () => {
    const element = document.getElementById('control-chart');
    if (!element) return;

    const canvas = await html2canvas(element);
    const link = document.createElement('a');
    link.download = `${labTestName}-control-chart.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [labTestName]);

  // Custom tooltip
  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="font-semibold text-sm mb-2">{data.date}</p>
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Value:</span> {data.value.toFixed(2)} {unit}
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            <span className="font-medium">UCL:</span> {data.ucl.toFixed(2)} {unit}
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            <span className="font-medium">Center:</span> {data.cl.toFixed(2)} {unit}
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            <span className="font-medium">LCL:</span> {data.lcl.toFixed(2)} {unit}
          </p>
          {data.violation && (
            <p className={data.violation.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}>
              {data.violation.description}
            </p>
          )}
        </div>
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
          <div>
            <h3 className="text-lg font-semibold">{labTestName}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Control Chart ({sigma}-sigma) · {data.length} measurements
            </p>
          </div>

          {/* Process status indicator */}
          <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium">
            {stats.processStatus === 'stable' ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Stable</span>
              </>
            ) : stats.processStatus === 'out-of-control' ? (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-600">Out of Control</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-600">Warning</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <h4 className="font-semibold mb-2">About Control Charts</h4>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p>
              Control charts monitor process stability over time using statistical process control
              (SPC) methods.
            </p>
            <p>
              <strong>Control Limits:</strong> {sigma}-sigma limits (UCL/LCL) represent the expected
              variation. Points beyond these limits indicate special cause variation.
            </p>
            <p>
              <strong>Westward Rules:</strong> Additional pattern detection rules that identify
              non-random patterns indicating process instability.
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Rule 1: Beyond control limits</li>
              <li>Rule 2: 2 of 3 points in Zone A</li>
              <li>Rule 3: 4 of 5 points in Zone B</li>
              <li>Rule 4: 6 consecutive points on one side</li>
              <li>Rule 5: 6 point trend</li>
              <li>Rule 6: 14 alternating points</li>
              <li>Rule 7: 15 points in Zone C (stratification)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Violations summary */}
      {showRules && stats.totalViolations > 0 && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <h4 className="font-semibold mb-2">Violations Detected</h4>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span>{stats.totalViolations - stats.criticalViolations} warnings</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>{stats.criticalViolations} critical</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div id="control-chart" className="p-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
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

            {/* Control limits */}
            <ReferenceLine
              y={controlChartData.upperControlLimit}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: 'UCL', fill: '#ef4444', fontSize: 12 }}
            />
            <ReferenceLine
              y={controlChartData.centerLine}
              stroke="#0d9488"
              strokeDasharray="3 3"
              label={{ value: 'CL', fill: '#0d9488', fontSize: 12 }}
            />
            <ReferenceLine
              y={controlChartData.lowerControlLimit}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: 'LCL', fill: '#ef4444', fontSize: 12 }}
            />

            {/* Zones (optional visual indication) */}
            <ReferenceArea
              y1={controlChartData.centerLine}
              y2={controlChartData.upperControlLimit}
              fill="rgba(13, 148, 136, 0.05)"
              stroke="none"
            />
            <ReferenceArea
              y1={controlChartData.lowerControlLimit}
              y2={controlChartData.centerLine}
              fill="rgba(13, 148, 136, 0.05)"
              stroke="none"
            />

            {/* Data line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0d9488"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const isViolation = payload.outOfControl;

                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isViolation ? 6 : 4}
                    fill={isViolation ? '#ef4444' : '#0d9488'}
                    className={isViolation ? 'animate-pulse' : ''}
                  />
                );
              }}
              activeDot={{ r: 8 }}
            />

            {/* Violation markers */}
            <Scatter
              data={chartData.filter(d => d.violation)}
              fill={chartData =>
                chartData.violation?.severity === 'critical' ? '#ef4444' : '#f59e0b'
              }
              shape={(props: any) => {
                const { cx, cy } = props;
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={8} fill="none" stroke="#ef4444" strokeWidth={2} />
                    <path
                      d={`M ${cx - 4} ${cy - 4} L ${cx + 4} ${cy + 4} M ${cx + 4} ${cy - 4} L ${cx - 4} ${cy + 4}`}
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                  </g>
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Violations list */}
      {showRules && controlChartData.violations.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
          <h4 className="font-semibold mb-2">Violation Details</h4>
          <div className="space-y-2">
            {controlChartData.violations.map((violation, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-2 rounded text-sm ${
                  violation.severity === 'critical'
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                }`}
              >
                {violation.severity === 'critical' ? (
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">{violation.description}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Data point: {data[violation.index].value.toFixed(2)} {unit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
