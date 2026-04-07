/**
 * Data downsampling utilities for performance optimization
 * Uses Largest-Triangle-Three-Buckets (LTTB) algorithm for accurate downsampling
 */

export interface DataPoint {
  x: number;
  y: number;
  date?: string;
}

/**
 * Largest-Triangle-Three-Buckets (LTTB) algorithm
 * Preserves visual fidelity while reducing data points
 *
 * @param data - Array of data points to downsample
 * @param threshold - Maximum number of points to keep
 * @returns Downsampled array of data points
 */
export function lttbDownsampling(data: DataPoint[], threshold: number): DataPoint[] {
  if (data.length <= threshold) {
    return data;
  }

  const sampled: DataPoint[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  let a = 0; // First point in the bucket
  let nextA = 0;

  // Always include the first point
  sampled.push(data[0]);

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate bucket range
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    // Calculate average of next bucket
    let avgX = 0;
    let avgY = 0;
    for (let j = avgRangeStart; j < avgRangeEnd && j < data.length; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Get the range of current bucket
    const rangeStart = Math.floor((i + 0) * bucketSize) + 1;
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1;

    // Find the point with the largest triangle area
    let maxArea = -1;
    let maxAreaPoint: DataPoint = data[rangeStart];

    const pointAX = data[a].x;
    const pointAY = data[a].y;

    for (let j = rangeStart; j < rangeEnd && j < data.length; j++) {
      const point = data[j];
      const area = Math.abs(
        (pointAX - avgX) * (point.y - pointAY) -
          (pointAX - point.x) * (avgY - pointAY)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = point;
        nextA = j;
      }
    }

    sampled.push(maxAreaPoint);
    a = nextA;
  }

  // Always include the last point
  sampled.push(data[data.length - 1]);

  return sampled;
}

/**
 * Simple sampling for very large datasets
 * Takes every nth point
 */
export function uniformSampling(data: DataPoint[], targetSize: number): DataPoint[] {
  if (data.length <= targetSize) {
    return data;
  }

  const step = Math.floor(data.length / targetSize);
  const sampled: DataPoint[] = [];

  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }

  // Ensure last point is included
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }

  return sampled;
}

/**
 * Adaptive downsampling based on viewport size
 */
export function adaptiveDownsampling(
  data: DataPoint[],
  viewportWidth: number,
  pixelsPerPoint: number = 2
): DataPoint[] {
  const maxPoints = Math.ceil(viewportWidth / pixelsPerPoint);

  if (data.length <= maxPoints) {
    return data;
  }

  // Use LTTB for better visual fidelity
  return lttbDownsampling(data, maxPoints);
}

/**
 * Calculate optimal sampling rate based on data characteristics
 */
export function calculateOptimalSampleSize(
  dataLength: number,
  variance: number,
  maxPoints: number = 1000
): number {
  // High variance = more points needed
  const varianceFactor = Math.min(variance / 100, 2);
  const adjustedMax = Math.floor(maxPoints * (1 + varianceFactor));

  return Math.min(dataLength, adjustedMax);
}

/**
 * Rolling average smoothing
 */
export function smoothData(data: DataPoint[], windowSize: number = 5): DataPoint[] {
  if (data.length <= windowSize) {
    return data;
  }

  const smoothed: DataPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);

    let sumY = 0;
    for (let j = start; j < end; j++) {
      sumY += data[j].y;
    }

    smoothed.push({
      x: data[i].x,
      y: sumY / (end - start),
      date: data[i].date,
    });
  }

  return smoothed;
}

/**
 * Calculate data variance for adaptive sampling
 */
export function calculateVariance(data: DataPoint[]): number {
  if (data.length === 0) return 0;

  const mean = data.reduce((sum, point) => sum + point.y, 0) / data.length;
  const squaredDiffs = data.map(point => Math.pow(point.y - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / data.length;
}
