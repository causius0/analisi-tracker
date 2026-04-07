/**
 * Predictive Analytics Module
 * Forecast future values and assess risk
 */

import { calculateDescriptiveStatistics, calculateRateOfChange } from './statistics.js';

/**
 * Simple moving average forecast
 */
export function forecastMovingAverage(values, forecastHorizon = 5, windowSize = 5) {
  if (values.length < windowSize) {
    throw new Error('Insufficient data for moving average forecast');
  }

  const forecasts = [];
  const lastValue = values[values.length - 1];

  // Calculate moving average of last window
  const window = values.slice(-windowSize);
  const avg = window.reduce((a, b) => a + b, 0) / windowSize;

  for (let i = 1; i <= forecastHorizon; i++) {
    forecasts.push({
      period: i,
      value: avg,
      method: 'moving_average',
      confidence: 'low'
    });
  }

  return {
    forecasts,
    method: 'moving_average',
    windowSize,
    lastValue,
    forecastAverage: avg
  };
}

/**
 * Linear regression forecast
 */
export function forecastLinearRegression(data, forecastHorizon = 5) {
  if (data.length < 3) {
    throw new Error('Insufficient data for linear regression forecast');
  }

  const rateOfChange = calculateRateOfChange(data);

  if (!rateOfChange) {
    return forecastMovingAverage(data.map(d => d.value), forecastHorizon);
  }

  const { slope, intercept, rSquared } = rateOfChange;
  const lastTimestamp = new Date(data[data.length - 1].timestamp);
  const firstTimestamp = new Date(data[0].timestamp);
  const dayOffset = (lastTimestamp - firstTimestamp) / (1000 * 60 * 60 * 24);

  const forecasts = [];

  for (let i = 1; i <= forecastHorizon; i++) {
    const futureDay = dayOffset + i;
    const value = slope * futureDay + intercept;

    forecasts.push({
      period: i,
      value: Math.max(0, value), // Prevent negative values for lab tests
      method: 'linear_regression',
      confidence: rSquared > 0.7 ? 'high' : rSquared > 0.5 ? 'medium' : 'low'
    });
  }

  return {
    forecasts,
    method: 'linear_regression',
    slope,
    intercept,
    rSquared,
    trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
  };
}

/**
 * Simple exponential smoothing forecast
 */
export function forecastExponentialSmoothing(values, forecastHorizon = 5, alpha = 0.3) {
  if (values.length < 2) {
    throw new Error('Insufficient data for exponential smoothing forecast');
  }

  // Calculate smoothed values
  const smoothed = [values[0]];
  for (let i = 1; i < values.length; i++) {
    smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
  }

  const lastSmoothed = smoothed[smoothed.length - 1];
  const forecasts = [];

  for (let i = 1; i <= forecastHorizon; i++) {
    forecasts.push({
      period: i,
      value: lastSmoothed,
      method: 'exponential_smoothing',
      confidence: 'medium'
    });
  }

  return {
    forecasts,
    method: 'exponential_smoothing',
    alpha,
    lastSmoothed,
    trend: smoothed[smoothed.length - 1] > smoothed[0] ? 'increasing' : 'decreasing'
  };
}

/**
 * ARIMA-style forecast (simplified implementation)
 */
export function forecastARIMA(values, forecastHorizon = 5, options = {}) {
  const {
    p = 1, // Auto-regressive order
    d = 1, // Differencing order
    q = 1  // Moving average order
  } = options;

  if (values.length < p + d + q) {
    throw new Error('Insufficient data for ARIMA forecast');
  }

  // Differencing to make stationary
  let differenced = [...values];
  for (let i = 0; i < d; i++) {
    differenced = difference(differenced);
  }

  // Simple AR(1) model: Y_t = c + phi * Y_{t-1} + epsilon
  const n = differenced.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (let i = 1; i < n; i++) {
    const x = differenced[i - 1];
    const y = differenced[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const phi = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const c = (sumY - phi * sumX) / n;

  // Forecast
  const forecasts = [];
  let lastValue = values[values.length - 1];
  let lastDiff = differenced[differenced.length - 1];

  for (let i = 1; i <= forecastHorizon; i++) {
    // Predict next differenced value
    const nextDiff = c + phi * lastDiff;

    // Integrate back to original scale
    const predictedValue = lastValue + nextDiff;

    forecasts.push({
      period: i,
      value: Math.max(0, predictedValue),
      method: 'arima',
      confidence: 'medium',
      parameters: { p, d, q, phi, c }
    });

    lastValue = predictedValue;
    lastDiff = nextDiff;
  }

  return {
    forecasts,
    method: 'arima',
    parameters: { p, d, q, phi, c }
  };
}

/**
 * Calculate differences
 */
function difference(values) {
  const diff = [];
  for (let i = 1; i < values.length; i++) {
    diff.push(values[i] - values[i - 1]);
  }
  return diff;
}

/**
 * Ensemble forecast (combine multiple methods)
 */
export function forecastEnsemble(data, forecastHorizon = 5) {
  const values = data.map(d => d.value);

  const methods = [
    forecastMovingAverage(values, forecastHorizon),
    forecastLinearRegression(data, forecastHorizon),
    forecastExponentialSmoothing(values, forecastHorizon),
    forecastARIMA(values, forecastHorizon)
  ];

  // Combine forecasts with weights based on confidence
  const weights = {
    high: 0.4,
    medium: 0.3,
    low: 0.2
  };

  const ensembleForecasts = [];

  for (let i = 0; i < forecastHorizon; i++) {
    let weightedSum = 0;
    let totalWeight = 0;

    methods.forEach(method => {
      const forecast = method.forecasts[i];
      const weight = weights[forecast.confidence] || 0.2;
      weightedSum += forecast.value * weight;
      totalWeight += weight;
    });

    ensembleForecasts.push({
      period: i + 1,
      value: totalWeight > 0 ? weightedSum / totalWeight : values[values.length - 1],
      method: 'ensemble',
      confidence: totalWeight > 1 ? 'high' : totalWeight > 0.7 ? 'medium' : 'low',
      components: methods.map(m => ({
        method: m.method,
        value: m.forecasts[i].value,
        confidence: m.forecasts[i].confidence
      }))
    });
  }

  return {
    forecasts: ensembleForecasts,
    method: 'ensemble',
    methods: methods.map(m => ({
      method: m.method,
      rSquared: m.rSquared,
      trend: m.trend
    }))
  };
}

/**
 * Calculate risk stratification
 */
export function calculateRiskStratification(data, referenceRange, options = {}) {
  const {
    veryHighRiskThreshold = 3,
    highRiskThreshold = 2,
    mediumRiskThreshold = 1
  } = options;

  const values = data.map(d => d.value);
  const { lower, upper } = referenceRange;

  // Calculate z-scores
  const stats = calculateDescriptiveStatistics(values);
  const lastValue = values[values.length - 1];
  const zScore = (lastValue - stats.mean) / stats.standardDeviation;

  // Determine risk level
  let riskLevel = 'low';
  let riskFactors = [];

  if (Math.abs(zScore) > veryHighRiskThreshold) {
    riskLevel = 'very_high';
    riskFactors.push('extreme_outlier');
  } else if (Math.abs(zScore) > highRiskThreshold) {
    riskLevel = 'high';
    riskFactors.push('significant_outlier');
  } else if (Math.abs(zScore) > mediumRiskThreshold) {
    riskLevel = 'medium';
    riskFactors.push('mild_outlier');
  }

  // Check if outside reference range
  if (lastValue < lower || lastValue > upper) {
    riskFactors.push('outside_range');

    if (riskLevel === 'low') {
      riskLevel = 'medium';
    }

    // Upgrade risk if significantly outside range
    const distanceFromRange = lastValue < lower
      ? lower - lastValue
      : lastValue - upper;

    if (distanceFromRange > stats.standardDeviation) {
      if (riskLevel === 'medium') {
        riskLevel = 'high';
      }
    }
  }

  // Check trend
  const rateOfChange = calculateRateOfChange(data);
  if (rateOfChange && Math.abs(rateOfChange.slope) > 0.1) {
    riskFactors.push('adverse_trend');

    if (rateOfChange.slope > 0 && lastValue > upper) {
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    } else if (rateOfChange.slope < 0 && lastValue < lower) {
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }
  }

  // Calculate risk score (0-100)
  let riskScore = 0;
  if (riskLevel === 'very_high') riskScore = 80 + Math.min(20, Math.abs(zScore) * 5);
  else if (riskLevel === 'high') riskScore = 60 + Math.min(20, Math.abs(zScore) * 5);
  else if (riskLevel === 'medium') riskScore = 40 + Math.min(20, Math.abs(zScore) * 10);
  else riskScore = Math.min(40, Math.abs(zScore) * 20);

  return {
    riskLevel,
    riskScore: Math.min(100, Math.max(0, riskScore)),
    riskFactors,
    currentValue: lastValue,
    zScore,
    referenceRange,
    recommendations: generateRiskRecommendations(riskLevel, riskFactors)
  };
}

/**
 * Generate risk recommendations
 */
function generateRiskRecommendations(riskLevel, riskFactors) {
  const recommendations = [];

  if (riskFactors.includes('extreme_outlier')) {
    recommendations.push({
      priority: 'urgent',
      message: 'Immediately consult healthcare provider - extreme values detected'
    });
  }

  if (riskFactors.includes('significant_outlier')) {
    recommendations.push({
      priority: 'high',
      message: 'Schedule appointment with healthcare provider soon'
    });
  }

  if (riskFactors.includes('outside_range')) {
    recommendations.push({
      priority: 'medium',
      message: 'Values are outside normal range - monitor closely'
    });
  }

  if (riskFactors.includes('adverse_trend')) {
    recommendations.push({
      priority: 'medium',
      message: 'Trend is concerning - consider follow-up testing'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      message: 'Continue regular monitoring'
    });
  }

  return recommendations;
}

/**
 * Calculate personalized reference range
 */
export function calculatePersonalizedRange(data, coverage = 0.95) {
  const values = data.map(d => d.value);
  const stats = calculateDescriptiveStatistics(values);

  // Use percentiles for personalized range
  const alpha = (1 - coverage) / 2;
  const lowerPercentile = alpha * 100;
  const upperPercentile = (1 - alpha) * 100;

  const lowerPercentileValue = stats.percentiles[`p${Math.round(lowerPercentile)}`] ||
    stats.quartiles.q1;
  const upperPercentileValue = stats.percentiles[`p${Math.round(upperPercentile)}`] ||
    stats.quartiles.q3;

  return {
    lower: lowerPercentileValue,
    upper: upperPercentileValue,
    coverage,
    mean: stats.mean,
    median: stats.median,
    standardDeviation: stats.standardDeviation,
    sampleSize: values.length,
    confidence: values.length >= 30 ? 'high' : values.length >= 10 ? 'medium' : 'low'
  };
}

/**
 * Early warning detection
 */
export function detectEarlyWarnings(data, referenceRange, forecasts) {
  const warnings = [];
  const values = data.map(d => d.value);
  const lastValue = values[values.length - 1];
  const { lower, upper } = referenceRange;

  // Check if forecasted values will cross thresholds
  forecasts.forEach(forecast => {
    const daysToThreshold = calculateDaysToThreshold(
      lastValue,
      forecast.value,
      lower,
      upper
    );

    if (daysToThreshold !== null) {
      warnings.push({
        type: 'threshold_crossing',
        period: forecast.period,
        predictedValue: forecast.value,
        threshold: forecast.value > upper ? upper : lower,
        direction: forecast.value > upper ? 'above' : 'below',
        urgency: daysToThreshold <= 7 ? 'critical' : daysToThreshold <= 30 ? 'warning' : 'advisory',
        message: `Will ${forecast.value > upper ? 'exceed upper' : 'fall below lower'} limit in ${daysToThreshold} days`
      });
    }
  });

  // Check for rapid changes
  if (forecasts.length >= 2) {
    const change = Math.abs(forecasts[forecasts.length - 1].value - lastValue);
    const pctChange = Math.abs((forecasts[forecasts.length - 1].value - lastValue) / lastValue) * 100;

    if (pctChange > 20) {
      warnings.push({
        type: 'rapid_change',
        magnitude: change,
        percentageChange: pctChange,
        urgency: pctChange > 50 ? 'critical' : pctChange > 30 ? 'warning' : 'advisory',
        message: `Predicted rapid change of ${pctChange.toFixed(1)}%`
      });
    }
  }

  return {
    warnings,
    totalWarnings: warnings.length,
    criticalCount: warnings.filter(w => w.urgency === 'critical').length,
    warningCount: warnings.filter(w => w.urgency === 'warning').length
  };
}

/**
 * Calculate days until threshold is crossed
 */
function calculateDaysToThreshold(currentValue, forecastValue, lowerThreshold, upperThreshold) {
  if (forecastValue > upperThreshold && currentValue <= upperThreshold) {
    // Will exceed upper threshold
    const change = forecastValue - currentValue;
    const distanceToThreshold = upperThreshold - currentValue;
    const daysToThreshold = (distanceToThreshold / change) * 30; // Assume 30-day forecast
    return Math.ceil(daysToThreshold);
  } else if (forecastValue < lowerThreshold && currentValue >= lowerThreshold) {
    // Will fall below lower threshold
    const change = currentValue - forecastValue;
    const distanceToThreshold = currentValue - lowerThreshold;
    const daysToThreshold = (distanceToThreshold / change) * 30;
    return Math.ceil(daysToThreshold);
  }

  return null;
}

/**
 * What-if scenario analysis
 */
export function analyzeWhatIf(data, scenario, options = {}) {
  const {
    scenarioType = 'medication_change',
    expectedEffect = 0, // Percentage change expected
    durationDays = 30
  } = scenario;

  const values = data.map(d => d.value);
  const stats = calculateDescriptiveStatistics(values);
  const lastValue = values[values.length - 1];

  // Apply expected effect
  const modifiedValue = lastValue * (1 + expectedEffect / 100);

  // Calculate new risk level
  const rateOfChange = calculateRateOfChange(data);
  const newTrend = rateOfChange ? {
    slope: rateOfChange.slope * (1 + expectedEffect / 200),
    direction: expectedEffect > 0 ? 'increasing' : expectedEffect < 0 ? 'decreasing' : 'stable'
  } : null;

  return {
    scenario: scenarioType,
    expectedChange: expectedEffect,
    currentValue: lastValue,
    projectedValue: modifiedValue,
    absoluteChange: modifiedValue - lastValue,
    newTrend,
    assessment: expectedEffect > 0
      ? 'Values are expected to increase - monitor for adverse effects'
      : expectedEffect < 0
      ? 'Values are expected to improve - continue monitoring'
      : 'No significant change expected',
    recommendations: expectedEffect > 10 || expectedEffect < -10
      ? ['Frequent monitoring recommended', 'Consider follow-up testing in 1-2 weeks']
      : ['Continue regular monitoring']
  };
}

/**
 * Perform comprehensive predictive analysis
 */
export function performPredictiveAnalysis(data, referenceRange, options = {}) {
  const {
    forecastHorizon = 30,
    useEnsemble = true,
    calculateRisk = true,
    detectWarnings = true
  } = options;

  // Generate forecasts
  const forecastMethod = useEnsemble ? 'ensemble' : 'linear_regression';
  const forecasts = forecastMethod === 'ensemble'
    ? forecastEnsemble(data, forecastHorizon)
    : forecastLinearRegression(data, forecastHorizon);

  // Calculate risk
  let risk = null;
  if (calculateRisk) {
    risk = calculateRiskStratification(data, referenceRange);
  }

  // Detect early warnings
  let warnings = null;
  if (detectWarnings) {
    warnings = detectEarlyWarnings(data, referenceRange, forecasts.forecasts);
  }

  // Calculate personalized range
  const personalizedRange = calculatePersonalizedRange(data);

  return {
    forecasts,
    risk,
    warnings,
    personalizedRange,
    summary: generatePredictionSummary(forecasts, risk, warnings)
  };
}

/**
 * Generate prediction summary
 */
function generatePredictionSummary(forecasts, risk, warnings) {
  const parts = [];

  const avgForecast = forecasts.forecasts.reduce((sum, f) => sum + f.value, 0) / forecasts.forecasts.length;
  parts.push(`Forecasted average value: ${avgForecast.toFixed(2)}`);

  if (risk) {
    parts.push(`Risk level: ${risk.riskLevel.replace(/_/g, ' ')} (${risk.riskScore.toFixed(0)}%)`);
  }

  if (warnings && warnings.totalWarnings > 0) {
    parts.push(`${warnings.totalWarnings} warnings detected`);
  }

  return parts.join('. ');
}

export default {
  forecastMovingAverage,
  forecastLinearRegression,
  forecastExponentialSmoothing,
  forecastARIMA,
  forecastEnsemble,
  calculateRiskStratification,
  calculatePersonalizedRange,
  detectEarlyWarnings,
  analyzeWhatIf,
  performPredictiveAnalysis
};
