import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DataPoint } from '../../types/charts';
import { calculateMovingAverage, calculatePercentageChange, cn } from '../../utils/chartCalculations';

interface SparklineProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  showTrendIndicator?: boolean;
  showPercentage?: boolean;
  color?: string;
  strokeWidth?: number;
  showPoints?: boolean;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 120,
  height = 40,
  showTrendIndicator = true,
  showPercentage = true,
  color = '#0d9488',
  strokeWidth = 1.5,
  showPoints = false,
  className,
}) => {
  // Calculate trend
  const trend = useMemo(() => {
    if (data.length < 2) return { direction: 'neutral', percentage: 0 };

    const values = data.map(d => d.value);
    const first = values[0];
    const last = values[values.length - 1];
    const percentage = calculatePercentageChange(last, first);

    let direction: 'up' | 'down' | 'neutral' = 'neutral';

    if (percentage > 1) {
      direction = 'up';
    } else if (percentage < -1) {
      direction = 'down';
    }

    return { direction, percentage };
  }, [data]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return data.map((point, index) => ({
      index,
      value: point.value,
      date: point.date,
    }));
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const date = new Date(data.date);

    return (
      <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
        </p>
        <p className="text-sm font-semibold">{data.value.toFixed(2)}</p>
      </div>
    );
  };

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Sparkline */}
      <ResponsiveContainer width={width} height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={strokeWidth}
            fill={`url(#gradient-${color})`}
            dot={showPoints ? { fill: color, r: 2, strokeWidth: 0 } : false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Trend indicator */}
      {showTrendIndicator && data.length >= 2 && (
        <div className={cn('flex items-center gap-1', getTrendColor())}>
          {getTrendIcon()}
          {showPercentage && (
            <span className="text-xs font-medium">
              {trend.percentage > 0 ? '+' : ''}
              {trend.percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

interface SparklineGroupProps {
  data: Record<string, DataPoint[]>;
  config?: {
    width?: number;
    height?: number;
    showTrendIndicator?: boolean;
    showPercentage?: boolean;
    showPoints?: boolean;
  };
  className?: string;
}

export const SparklineGroup: React.FC<SparklineGroupProps> = ({
  data,
  config = {},
  className,
}) => {
  const colors = [
    '#0d9488', // teal
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#10b981', // emerald
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {Object.entries(data).map(([key, values], index) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[120px]">
            {key}
          </span>
          <Sparkline
            data={values}
            color={colors[index % colors.length]}
            {...config}
          />
        </div>
      ))}
    </div>
  );
};
