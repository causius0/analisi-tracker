import { DataPoint, TrendLine, ConfidenceInterval, PredictionData } from '../types/charts';

/**
 * Calculate moving average for trend line
 */
export function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const subset = data.slice(start, i + 1);
    const avg = subset.reduce((sum, val) => sum + val, 0) / subset.length;
    result.push(avg);
  }

  return result;
}

/**
 * Calculate linear regression trend line
 */
export function calculateLinearRegression(data: DataPoint[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  data.forEach((point, index) => {
    const x = index;
    const y = point.value;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const yMean = sumY / n;
  const ssTot = data.reduce((sum, point) => sum + Math.pow(point.value - yMean, 2), 0);
  const ssRes = data.reduce((sum, point, index) => {
    const predicted = slope * index + intercept;
    return sum + Math.pow(point.value - predicted, 2);
  }, 0);
  const r2 = 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

/**
 * Calculate confidence interval
 */
export function calculateConfidenceInterval(
  data: number[],
  level: number = 0.95
): ConfidenceInterval {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
  const stdDev = Math.sqrt(variance);

  // Z-score for 95% confidence (approximate)
  const zScore = level === 0.95 ? 1.96 : level === 0.99 ? 2.576 : 1.645;

  const margin = zScore * stdDev;

  return {
    upper: data.map(() => mean + margin),
    lower: data.map(() => mean - margin),
    level,
  };
}

/**
 * Calculate simple ARIMA-like prediction
 */
export function calculatePredictions(
  data: DataPoint[],
  periods: number = 5
): PredictionData {
  const values = data.map(d => d.value);
  const trend = calculateLinearRegression(data);

  // Generate predictions
  const predicted: number[] = [];
  const lastDate = new Date(data[data.length - 1].date);
  const dates: string[] = [];

  for (let i = 1; i <= periods; i++) {
    const x = data.length + i - 1;
    const prediction = trend.slope * x + trend.intercept;
    predicted.push(prediction);

    // Generate future dates
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + 30 * i); // Monthly intervals
    dates.push(futureDate.toISOString().split('T')[0]);
  }

  // Calculate confidence intervals for predictions
  const stdError = Math.sqrt(
    data.reduce((sum, point, index) => {
      const predicted = trend.slope * index + trend.intercept;
      return sum + Math.pow(point.value - predicted, 2);
    }, 0) / (data.length - 2)
  );

  const margin = 1.96 * stdError * Math.sqrt(1 / data.length + 1);

  return {
    predicted,
    confidenceUpper: predicted.map(p => p + margin),
    confidenceLower: predicted.map(p => p - margin),
    dates,
  };
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Detect outliers using Z-score method
 */
export function detectOutliers(data: DataPoint[], threshold: number = 3): DataPoint[] {
  const values = data.map(d => d.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return data.filter(point => {
    const zScore = Math.abs((point.value - mean) / stdDev);
    return zScore > threshold;
  });
}

/**
 * Normalize data to percent of range
 */
export function normalizeToPercent(data: number[]): number[] {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  if (range === 0) return data.map(() => 50);

  return data.map(val => ((val - min) / range) * 100);
}

/**
 * Calculate Z-scores for data
 */
export function calculateZScores(data: number[]): number[] {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return data.map(() => 0);

  return data.map(val => (val - mean) / stdDev);
}

/**
 * Calculate correlation coefficient (Pearson)
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;

  const meanX = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const denominator = Math.sqrt(sumX2 * sumY2);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Format date for display
 */
export function formatDate(date: string, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date);

  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  }

  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format value with unit
 */
export function formatValue(value: number, unit: string, decimals: number = 2): string {
  return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Generate color palette for charts
 */
export function generateColorPalette(count: number): string[] {
  const colors = [
    '#0d9488', // teal
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#10b981', // emerald
    '#f97316', // orange
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
  ];

  if (count <= colors.length) {
    return colors.slice(0, count);
  }

  // Generate additional colors if needed
  const result = [...colors];
  for (let i = colors.length; i < count; i++) {
    const hue = (i * 137.5) % 360; // Golden angle approximation
    result.push(`hsl(${hue}, 70%, 50%)`);
  }

  return result;
}
