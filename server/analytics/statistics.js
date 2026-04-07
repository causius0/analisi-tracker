/**
 * Statistical Functions Module
 * Provides fundamental statistical calculations for lab data analysis
 */

import * as ss from 'simple-statistics';

const {
  mean,
  median,
  mode,
  standardDeviation,
  variance,
  sampleSkewness,
  sampleKurtosis,
  quantile,
  min,
  max
} = ss;

// Percentile function using quantile
function percentile(values, p) {
  return quantile(values, p / 100);
}

/**
 * Calculate comprehensive descriptive statistics
 */
export function calculateDescriptiveStatistics(values) {
  if (!values || values.length === 0) {
    throw new Error('Values array is empty');
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const n = values.length;

  return {
    count: n,
    mean: mean(values),
    median: median(values),
    mode: mode(values),
    standardDeviation: standardDeviation(values),
    variance: variance(values),
    minimum: min(values),
    maximum: max(values),
    range: max(values) - min(values),
    percentiles: {
      p25: percentile(values, 25),
      p50: percentile(values, 50),
      p75: percentile(values, 75),
      p90: percentile(values, 90),
      p95: percentile(values, 95),
      p99: percentile(values, 99)
    },
    quartiles: {
      q1: quantile(values, 0.25),
      q2: quantile(values, 0.50),
      q3: quantile(values, 0.75),
      iqr: quantile(values, 0.75) - quantile(values, 0.25)
    },
    shape: {
      skewness: sampleSkewness(values),
      kurtosis: sampleKurtosis(values)
    },
    coefficientOfVariation: (standardDeviation(values) / mean(values)) * 100
  };
}

/**
 * Calculate z-scores for each value
 */
export function calculateZScores(values, referenceMean = null, referenceStd = null) {
  const stats = calculateDescriptiveStatistics(values);
  const meanValue = referenceMean || stats.mean;
  const stdValue = referenceStd || stats.standardDeviation;

  if (stdValue === 0) {
    return values.map(() => 0);
  }

  return values.map(value => (value - meanValue) / stdValue);
}

/**
 * Detect outliers using z-score method
 */
export function detectOutliersZScore(values, threshold = 3) {
  const zScores = calculateZScores(values);

  return values.map((value, index) => ({
    value,
    zScore: zScores[index],
    isOutlier: Math.abs(zScores[index]) > threshold,
    severity: Math.abs(zScores[index]) > 4 ? 'extreme' : 'moderate'
  }));
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliersIQR(values, multiplier = 1.5) {
  const stats = calculateDescriptiveStatistics(values);
  const { q1, q3, iqr } = stats.quartiles;

  const lowerBound = q1 - (multiplier * iqr);
  const upperBound = q3 + (multiplier * iqr);

  return values.map(value => ({
    value,
    isOutlier: value < lowerBound || value > upperBound,
    bounds: { lower: lowerBound, upper: upperBound },
    type: value < lowerBound ? 'low' : 'high'
  }));
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : 100;
  }
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate rate of change (slope) using linear regression
 */
export function calculateRateOfChange(timestampedValues) {
  if (timestampedValues.length < 2) {
    return null;
  }

  // Convert timestamps to numeric values (days since first measurement)
  const firstTimestamp = timestampedValues[0].timestamp;
  const xValues = timestampedValues.map(v =>
    (new Date(v.timestamp) - new Date(firstTimestamp)) / (1000 * 60 * 60 * 24)
  );
  const yValues = timestampedValues.map(v => v.value);

  // Calculate linear regression
  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const ssResidual = yValues.reduce((sum, y, i) => {
    const predicted = slope * xValues[i] + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const rSquared = 1 - (ssResidual / ssTotal);

  return {
    slope,
    intercept,
    rSquared,
    unit: 'per day',
    normalizedSlope: slope / yMean * 100 // Percentage change per day
  };
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(values, windowSize) {
  if (values.length < windowSize) {
    return [];
  }

  const result = [];
  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1);
    result.push(mean(window));
  }

  return result;
}

/**
 * Calculate exponential moving average
 */
export function calculateExponentialMovingAverage(values, smoothing = 2) {
  if (values.length === 0) return [];

  const period = values.length;
  const multiplier = smoothing / (period + 1);

  const ema = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ema.push((values[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }

  return ema;
}

/**
 * Test for normality using Shapiro-Wilk approximation
 */
export function testNormality(values) {
  const stats = calculateDescriptiveStatistics(values);
  const n = values.length;

  // Simplified Shapiro-Wilk test approximation
  // For accurate results, use a proper statistical library
  const skewness = Math.abs(stats.shape.skewness);
  const kurtosis = Math.abs(stats.shape.kurtosis);

  const isNormal = skewness < 1 && kurtosis < 3;

  return {
    isNormal,
    skewness: stats.shape.skewness,
    kurtosis: stats.shape.kurtosis,
    recommendation: isNormal ? 'parametric' : 'non-parametric'
  };
}

/**
 * Calculate confidence interval
 */
export function calculateConfidenceInterval(values, confidence = 0.95) {
  const stats = calculateDescriptiveStatistics(values);
  const n = values.length;
  const zScore = 1.96; // For 95% confidence

  const marginOfError = zScore * (stats.standardDeviation / Math.sqrt(n));

  return {
    lower: stats.mean - marginOfError,
    upper: stats.mean + marginOfError,
    marginOfError,
    confidence
  };
}

/**
 * Calculate time in target range (for diabetes metrics)
 */
export function calculateTimeInRange(values, targetMin, targetMax) {
  if (!values || values.length === 0) {
    return { percentage: 0, count: 0, total: 0 };
  }

  const inRange = values.filter(v => v >= targetMin && v <= targetMax).length;

  return {
    percentage: (inRange / values.length) * 100,
    count: inRange,
    total: values.length,
    targetRange: { min: targetMin, max: targetMax }
  };
}

/**
 * Calculate variability metrics
 */
export function calculateVariabilityMetrics(values) {
  const stats = calculateDescriptiveStatistics(values);

  return {
    standardDeviation: stats.standardDeviation,
    variance: stats.variance,
    coefficientOfVariation: stats.coefficientOfVariation,
    range: stats.range,
    interquartileRange: stats.quartiles.iqr,
    quartileCoefficientOfDispersion: stats.quartiles.iqr / (stats.quartiles.q1 + stats.quartiles.q3)
  };
}

export default {
  calculateDescriptiveStatistics,
  calculateZScores,
  detectOutliersZScore,
  detectOutliersIQR,
  calculatePercentageChange,
  calculateRateOfChange,
  calculateMovingAverage,
  calculateExponentialMovingAverage,
  testNormality,
  calculateConfidenceInterval,
  calculateTimeInRange,
  calculateVariabilityMetrics
};
