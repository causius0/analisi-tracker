'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface LabValue {
  value: number | null;
  unit: string;
  range: {
    min: number;
    max: number;
  };
  note?: string;
}

interface LabTest {
  date: string;
  source: string;
  values: Record<string, LabValue>;
}

interface LabData {
  patient: {
    name: string;
    dateOfBirth: string;
    gender: string;
  };
  labTests: LabTest[];
}

interface ComparisonChartProps {
  labData: LabData;
  valueNames: string[];
  onRemoveValue: (valueName: string) => void;
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export default function ComparisonChart({ labData, valueNames, onRemoveValue }: ComparisonChartProps) {
  const chartData = useMemo(() => {
    const sortedTests = [...labData.labTests].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sortedTests.map((test) => {
      const dataPoint: any = {
        date: test.date,
        dateFormatted: format(new Date(test.date), 'dd/MM/yyyy'),
      };

      valueNames.forEach((valueName) => {
        const labValue = test.values[valueName];
        if (labValue) {
          dataPoint[valueName] = labValue.value;
          dataPoint[`${valueName}_unit`] = labValue.unit;
          dataPoint[`${valueName}_min`] = labValue.range.min;
          dataPoint[`${valueName}_max`] = labValue.range.max;
        }
      });

      return dataPoint;
    });
  }, [labData, valueNames]);

  const valueUnits = useMemo(() => {
    const units: Record<string, string> = {};
    valueNames.forEach((valueName) => {
      const firstTest = labData.labTests.find((test) => test.values[valueName]);
      if (firstTest?.values[valueName]) {
        units[valueName] = firstTest.values[valueName].unit;
      }
    });
    return units;
  }, [labData, valueNames]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-800 mb-2">{data.dateFormatted}</p>
          {valueNames.map((valueName, index) => {
            const value = data[valueName];
            const unit = data[`${valueName}_unit`];
            const min = data[`${valueName}_min`];
            const max = data[`${valueName}_max`];

            if (value !== null && value !== undefined) {
              const outOfRange = value < min || value > max;
              return (
                <div key={valueName} className="mt-2">
                  <p className={`text-sm font-medium ${outOfRange ? 'text-red-600' : 'text-gray-700'}`}>
                    {valueName}:
                  </p>
                  <p className="text-sm text-gray-600">
                    {value} {unit}
                    {outOfRange && ' ⚠️'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Range: {min}-{max} {unit}
                  </p>
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  if (valueNames.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-800">
            Comparison: {valueNames.join(', ')}
          </h3>
          <button
            onClick={() => {}}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {valueNames.map((valueName, index) => (
            <div
              key={valueName}
              className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] + '20' }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="font-medium">{valueName}</span>
              <span className="text-gray-600">({valueUnits[valueName]})</span>
              <button
                onClick={() => onRemoveValue(valueName)}
                className="ml-1 text-gray-500 hover:text-red-600 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          ⚠️ Note: Comparing values with different units or scales may not be meaningful.
          This view is best for values with similar ranges.
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="dateFormatted"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />

          {valueNames.map((valueName, index) => (
            <Line
              key={valueName}
              type="monotone"
              dataKey={valueName}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{
                r: 4,
                fill: CHART_COLORS[index % CHART_COLORS.length],
                strokeWidth: 2,
                stroke: 'white',
              }}
              connectNulls={false}
              name={`${valueName} (${valueUnits[valueName]})`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
