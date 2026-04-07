/**
 * Trend Analysis Module
 * Calculates trend direction, rate of change, and statistical significance
 */

import {
  calculateRateOfChange,
  calculateMovingAverage,
  calculateZScores,
  calculateDescriptiveStatistics
} from './statistics.js';

/**
 * Determine trend direction based on slope and significance
 */
export function determineTrendDirection(slope, pValue, threshold = 0.05) {
  const isSignificant = pValue < threshold;

  if (!isSignificant) {
    return 'stable';
  }

  if (slope > 0) {
    return slope > 0.1 ? 'strongly_increasing' : 'increasing';
  } else if (slope < 0) {
    return slope < -0.1 ? 'strongly_decreasing' : 'decreasing';
  }

  return 'stable';
}

/**
 * Calculate Mann-Kendall trend test (non-parametric)
 */
export function mannKendallTest(values) {
  const n = values.length;

  // Calculate S statistic
  let S = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      S += Math.sign(values[j] - values[i]);
    }
  }

  // Calculate variance of S
  const uniqueValues = new Set(values).size;
  let g = 0;
  const valueCounts = {};

  values.forEach(v => {
    valueCounts[v] = (valueCounts[v] || 0) + 1;
  });

  Object.values(valueCounts).forEach(count => {
    if (count > 1) {
      g += count * (count - 1) * (2 * count + 5);
    }
  });

  const varS = (n * (n - 1) * (2 * n + 5) - g) / 18;

  // Calculate Z-score
  const z = S === 0 ? 0 : (S - Math.sign(S)) / Math.sqrt(varS);

  // Calculate p-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  // Determine trend
  let trend = 'no trend';
  if (pValue < 0.05) {
    if (z > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }
  }

  return {
    statistic: S,
    variance: varS,
    zScore: z,
    pValue,
    trend,
    isSignificant: pValue < 0.05
  };
}

/**
 * Standard normal cumulative distribution function
 */
function normalCDF(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Calculate Sen's slope estimator (non-parametric)
 */
export function sensSlope(values, timestamps = null) {
  const n = values.length;
  const slopes = [];

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      if (timestamps) {
        const timeDiff = (new Date(timestamps[j]) - new Date(timestamps[i])) / (1000 * 60 * 60 * 24);
        if (timeDiff > 0) {
          slopes.push((values[j] - values[i]) / timeDiff);
        }
      } else {
        slopes.push((values[j] - values[i]) / (j - i));
      }
    }
  }

  slopes.sort((a, b) => a - b);
  const medianSlope = slopes[Math.floor(slopes.length / 2)];

  return {
    slope: medianSlope,
    n: slopes.length,
    confidenceInterval: {
      lower: slopes[Math.floor(slopes.length * 0.025)],
      upper: slopes[Math.floor(slopes.length * 0.975)]
    }
  };
}

/**
 * Perform comprehensive trend analysis
 */
export function analyzeTrends(data, options = {}) {
  const {
    minDataPoints = 5,
    useNonParametric = true,
    includeSeasonality = false
  } = options;

  if (!data || data.length < minDataPoints) {
    throw new Error(`Insufficient data points. Minimum required: ${minDataPoints}`);
  }

  const values = data.map(d => d.value);
  const timestamps = data.map(d => d.timestamp);

  // Calculate basic statistics
  const stats = calculateDescriptiveStatistics(values);

  // Calculate rate of change
  const rateOfChange = calculateRateOfChange(data);

  // Perform trend tests
  let parametricTest = null;
  let nonParametricTest = null;

  if (rateOfChange) {
    // Linear regression (parametric)
    parametricTest = {
      slope: rateOfChange.slope,
      intercept: rateOfChange.intercept,
      rSquared: rateOfChange.rSquared,
      pValue: calculatePValueFromR2(rateOfChange.rSquared, values.length),
      isSignificant: rateOfChange.rSquared > 0.5
    };
  }

  if (useNonParametric) {
    nonParametricTest = mannKendallTest(values);
  }

  // Sen's slope
  const sensSlopeResult = sensSlope(values, timestamps);

  // Determine trend direction
  const testToUse = useNonParametric ? nonParametricTest : parametricTest;
  const slopeToUse = useNonParametric ? sensSlopeResult.slope : rateOfChange?.slope;
  const pValue = testToUse?.pValue || 1;

  const direction = determineTrendDirection(slopeToUse, pValue);

  // Calculate trend strength
  const strength = calculateTrendStrength(rateOfChange?.rSquared, pValue);

  // Detect seasonal patterns (if enabled)
  let seasonality = null;
  if (includeSeasonality && data.length >= 12) {
    seasonality = detectSeasonality(data);
  }

  return {
    direction,
    rateOfChange: {
      absolute: slopeToUse,
      percentage: rateOfChange?.normalizedSlope,
      unit: rateOfChange?.unit || 'per day'
    },
    significance: {
      parametric: parametricTest,
      nonParametric: nonParametricTest,
      recommended: useNonParametric ? 'non-parametric' : 'parametric'
    },
    strength,
    seasonality,
    summary: generateTrendSummary(direction, strength, slopeToUse)
  };
}

/**
 * Calculate p-value from R-squared
 */
function calculatePValueFromR2(rSquared, n) {
  if (!rSquared || n < 3) return 1;

  const f = (rSquared / (1 - rSquared)) * ((n - 2) / 1);
  // Simplified p-value calculation
  return Math.max(0, 1 - rSquared);
}

/**
 * Calculate trend strength
 */
function calculateTrendStrength(rSquared, pValue) {
  if (!rSquared) {
    return { level: 'none', score: 0 };
  }

  let level = 'none';
  if (rSquared > 0.8 && pValue < 0.05) {
    level = 'very_strong';
  } else if (rSquared > 0.6 && pValue < 0.05) {
    level = 'strong';
  } else if (rSquared > 0.4 && pValue < 0.05) {
    level = 'moderate';
  } else if (rSquared > 0.2 && pValue < 0.1) {
    level = 'weak';
  }

  return {
    level,
    score: rSquared,
    description: getStrengthDescription(level)
  };
}

/**
 * Get strength description
 */
function getStrengthDescription(level) {
  const descriptions = {
    none: 'No significant trend detected',
    weak: 'Weak trend with low confidence',
    moderate: 'Moderate trend with some confidence',
    strong: 'Strong trend with high confidence',
    very_strong: 'Very strong trend with very high confidence'
  };
  return descriptions[level] || 'Unknown';
}

/**
 * Generate human-readable trend summary
 */
function generateTrendSummary(direction, strength, slope) {
  const directionText = {
    stable: 'remained stable',
    increasing: 'is increasing',
    decreasing: 'is decreasing',
    strongly_increasing: 'is increasing rapidly',
    strongly_decreasing: 'is decreasing rapidly'
  };

  const slopeText = slope ? ` at ${slope.toFixed(3)} units per day` : '';

  return `Values ${directionText[direction]}${slopeText}. Trend strength: ${strength.level.replace(/_/g, ' ')}.`;
}

/**
 * Detect seasonal patterns using autocorrelation
 */
export function detectSeasonality(data, period = 12) {
  if (data.length < period * 2) {
    return { hasSeasonality: false, reason: 'Insufficient data' };
  }

  const values = data.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  // Calculate autocorrelation at lag = period
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < values.length - period; i++) {
    numerator += (values[i] - mean) * (values[i + period] - mean);
  }

  for (let i = 0; i < values.length; i++) {
    denominator += Math.pow(values[i] - mean, 2);
  }

  const autocorrelation = numerator / denominator;

  return {
    hasSeasonality: Math.abs(autocorrelation) > 0.3,
    autocorrelation,
    period,
    strength: Math.abs(autocorrelation),
    phase: autocorrelation > 0 ? 'in-phase' : 'out-of-phase'
  };
}

/**
 * Calculate trend over different time windows
 */
export function calculateRollingTrends(data, windowSize = 5) {
  if (data.length < windowSize) {
    return [];
  }

  const trends = [];

  for (let i = windowSize; i <= data.length; i++) {
    const window = data.slice(i - windowSize, i);
    const trend = analyzeTrends(window, { useNonParametric: false });

    trends.push({
      endDate: window[window.length - 1].timestamp,
      startDate: window[0].timestamp,
      trend: trend.direction,
      slope: trend.rateOfChange.absolute,
      strength: trend.strength.level
    });
  }

  return trends;
}

/**
 * Calculate trend acceleration (change in rate of change)
 */
export function calculateTrendAcceleration(data) {
  const rollingTrends = calculateRollingTrends(data, Math.min(5, Math.floor(data.length / 2)));

  if (rollingTrends.length < 2) {
    return { acceleration: 0, interpretation: 'insufficient_data' };
  }

  const recentTrends = rollingTrends.slice(-3);
  const slopes = recentTrends.map(t => t.slope || 0);

  // Calculate acceleration (second derivative)
  const acceleration = slopes.length >= 2
    ? slopes[slopes.length - 1] - slopes[0]
    : 0;

  let interpretation = 'stable';
  if (acceleration > 0.01) {
    interpretation = 'accelerating_upward';
  } else if (acceleration < -0.01) {
    interpretation = 'accelerating_downward';
  }

  return {
    acceleration,
    interpretation,
    recentSlopes: slopes,
    description: getAccelerationDescription(interpretation)
  };
}

/**
 * Get acceleration description
 */
function getAccelerationDescription(interpretation) {
  const descriptions = {
    stable: 'Rate of change is stable',
    accelerating_upward: 'Values are increasing at an increasing rate',
    accelerating_downward: 'Values are decreasing at an increasing rate',
    insufficient_data: 'Not enough data to determine acceleration'
  };
  return descriptions[interpretation] || 'Unknown';
}

export default {
  analyzeTrends,
  determineTrendDirection,
  mannKendallTest,
  sensSlope,
  detectSeasonality,
  calculateRollingTrends,
  calculateTrendAcceleration
};
