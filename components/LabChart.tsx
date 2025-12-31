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
  ReferenceLine,
  ReferenceArea,
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

interface LabChartProps {
  labData: LabData;
  valueName: string;
}

interface ChartDataPoint {
  date: string;
  dateFormatted: string;
  value: number | null;
  unit: string;
  rangeMin: number;
  rangeMax: number;
  note?: string;
  hasGap: boolean;
}

export default function LabChart({ labData, valueName }: LabChartProps) {
  const chartData = useMemo(() => {
    const sortedTests = [...labData.labTests].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const data: ChartDataPoint[] = [];
    let previousHadValue = false;

    sortedTests.forEach((test, index) => {
      const labValue = test.values[valueName];

      if (labValue) {
        const hasValue = labValue.value !== null && labValue.value !== undefined;
        const hasGap = previousHadValue && index > 0 && !hasValue;

        data.push({
          date: test.date,
          dateFormatted: format(new Date(test.date), 'dd/MM/yyyy'),
          value: labValue.value,
          unit: labValue.unit,
          rangeMin: labValue.range.min,
          rangeMax: labValue.range.max,
          note: labValue.note,
          hasGap,
        });

        previousHadValue = hasValue;
      }
    });

    return data;
  }, [labData, valueName]);

  const { unit, rangeMin, rangeMax } = useMemo(() => {
    const firstDataPoint = chartData.find((d) => d.value !== null);
    return {
      unit: firstDataPoint?.unit || '',
      rangeMin: firstDataPoint?.rangeMin || 0,
      rangeMax: firstDataPoint?.rangeMax || 100,
    };
  }, [chartData]);

  const yAxisDomain = useMemo(() => {
    const values = chartData.filter((d) => d.value !== null).map((d) => d.value as number);
    if (values.length === 0) return [0, 100];

    const minValue = Math.min(...values, rangeMin);
    const maxValue = Math.max(...values, rangeMax);
    const padding = (maxValue - minValue) * 0.2;

    return [Math.floor(minValue - padding), Math.ceil(maxValue + padding)];
  }, [chartData, rangeMin, rangeMax]);

  const hasAnyData = chartData.some((d) => d.value !== null);

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{valueName}</h3>
        <div className="text-gray-500 text-center py-8">
          No data available for this lab value
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{data.dateFormatted}</p>
          {data.value !== null ? (
            <>
              <p className="text-gray-700">
                <span className="font-medium">Value:</span> {data.value} {data.unit}
              </p>
              <p className="text-gray-600 text-sm mt-2">
                <span className="font-medium">Normal Range:</span>
              </p>
              <p className="text-gray-600 text-sm">
                {data.rangeMin} - {data.rangeMax} {data.unit}
              </p>
              {data.note && (
                <p className="text-blue-600 text-sm mt-2">
                  <span className="font-medium">Note:</span> {data.note}
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-500 italic">No measurement</p>
          )}
        </div>
      );
    }
    return null;
  };

  const isOutOfRange = (value: number | null) => {
    if (value === null) return false;
    return value < rangeMin || value > rangeMax;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{valueName}</h3>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
          <span>
            <span className="font-medium">Unit:</span> {unit}
          </span>
          <span>
            <span className="font-medium">Normal Range:</span> {rangeMin} - {rangeMax} {unit}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600">Measured value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-gray-400"></div>
            <span className="text-gray-600">Gap (not measured)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-3 bg-green-100 border border-green-300"></div>
            <span className="text-gray-600">Normal range</span>
          </div>
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
          <YAxis
            domain={yAxisDomain}
            tick={{ fontSize: 12 }}
            label={{ value: unit, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />

          <ReferenceArea
            y1={rangeMin}
            y2={rangeMax}
            fill="#d4edda"
            fillOpacity={0.3}
            stroke="#28a745"
            strokeOpacity={0.5}
            label={{
              value: 'Normal Range',
              position: 'insideTopRight',
              fontSize: 12,
              fill: '#28a745',
            }}
          />

          <ReferenceLine y={rangeMin} stroke="#28a745" strokeDasharray="3 3" strokeOpacity={0.7} />
          <ReferenceLine y={rangeMax} stroke="#28a745" strokeDasharray="3 3" strokeOpacity={0.7} />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.value === null) return null;

              const outOfRange = isOutOfRange(payload.value);
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={outOfRange ? '#ef4444' : '#3b82f6'}
                  stroke="white"
                  strokeWidth={2}
                />
              );
            }}
            connectNulls={false}
            name={valueName}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls={true}
            name="Gap"
            legendType="none"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        {chartData.map((dataPoint, index) => {
          const outOfRange = isOutOfRange(dataPoint.value);
          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                dataPoint.value === null
                  ? 'bg-gray-50 border-gray-300'
                  : outOfRange
                  ? 'bg-red-50 border-red-300'
                  : 'bg-green-50 border-green-300'
              }`}
            >
              <div className="font-medium text-gray-800">{dataPoint.dateFormatted}</div>
              {dataPoint.value !== null ? (
                <>
                  <div className="text-gray-700 mt-1">
                    {dataPoint.value} {dataPoint.unit}
                  </div>
                  {outOfRange && (
                    <div className="text-red-600 text-xs mt-1 font-medium">Out of range</div>
                  )}
                </>
              ) : (
                <div className="text-gray-500 italic mt-1">
                  {dataPoint.note || 'Not measured'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
