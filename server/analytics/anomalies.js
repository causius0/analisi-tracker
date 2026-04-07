/**
 * Anomaly Detection Module
 * Detects outliers and unusual patterns in lab data
 */

import {
  detectOutliersZScore,
  detectOutliersIQR,
  calculateDescriptiveStatistics,
  calculateMovingAverage,
  calculatePercentageChange,
  calculateZScores
} from './statistics.js';

/**
 * Detect statistical outliers using multiple methods
 */
export function detectStatisticalAnomalies(values, options = {}) {
  const {
    zScoreThreshold = 3,
    iqrMultiplier = 1.5,
    useBothMethods = true
  } = options;

  const stats = calculateDescriptiveStatistics(values);

  // Z-score method
  const zScoreAnomalies = detectOutliersZScore(values, zScoreThreshold);

  // IQR method
  const iqrAnomalies = detectOutliersIQR(values, iqrMultiplier);

  // Combine results
  const combined = values.map((value, index) => ({
    index,
    value,
    zScore: zScoreAnomalies[index].zScore,
    isZScoreOutlier: zScoreAnomalies[index].isOutlier,
    isIQROutlier: iqrAnomalies[index].isOutlier,
    isAnomaly: useBothMethods
      ? zScoreAnomalies[index].isOutlier || iqrAnomalies[index].isOutlier
      : zScoreAnomalies[index].isOutlier,
    severity: calculateAnomalySeverity(
      zScoreAnomalies[index],
      iqrAnomalies[index]
    )
  }));

  return {
    anomalies: combined.filter(a => a.isAnomaly),
    totalAnomalies: combined.filter(a => a.isAnomaly).length,
    percentage: (combined.filter(a => a.isAnomaly).length / values.length) * 100,
    referenceRange: {
      mean: stats.mean,
      std: stats.standardDeviation,
      lower: stats.mean - zScoreThreshold * stats.standardDeviation,
      upper: stats.mean + zScoreThreshold * stats.standardDeviation
    }
  };
}

/**
 * Calculate anomaly severity
 */
function calculateAnomalySeverity(zScoreResult, iqrResult) {
  const zScore = Math.abs(zScoreResult.zScore);

  if (zScore > 4 || iqrResult.isOutlier) {
    return 'extreme';
  } else if (zScore > 3) {
    return 'high';
  } else if (zScore > 2.5) {
    return 'moderate';
  } else if (zScore > 2) {
    return 'low';
  }

  return 'none';
}

/**
 * Detect rate-of-change anomalies (sudden spikes or drops)
 */
export function detectRateOfChangeAnomalies(data, options = {}) {
  const {
    windowSize = 2,
    thresholdStd = 3,
    minAbsoluteChange = 0.5
  } = options;

  if (data.length < windowSize + 1) {
    return { anomalies: [], totalAnomalies: 0 };
  }

  const values = data.map(d => d.value);
  const timestamps = data.map(d => d.timestamp);

  // Calculate rate of change between consecutive measurements
  const rates = [];
  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const pctChange = calculatePercentageChange(values[i - 1], values[i]);
    const timeDiff = (new Date(timestamps[i]) - new Date(timestamps[i - 1])) / (1000 * 60 * 60 * 24);

    rates.push({
      index: i,
      value: values[i],
      previousValue: values[i - 1],
      absoluteChange: change,
      percentageChange: pctChange,
      timeDiffDays: timeDiff,
      dailyRate: change / Math.max(timeDiff, 1)
    });
  }

  // Detect anomalies in rates
  const rateValues = rates.map(r => r.dailyRate);
  const rateStats = calculateDescriptiveStatistics(rateValues);
  const rateZScores = calculateZScores(rateValues);

  const anomalies = rates.map((rate, i) => {
    const isAnomaly = Math.abs(rateZScores[i]) > thresholdStd &&
      Math.abs(rate.absoluteChange) >= minAbsoluteChange;

    return {
      ...rate,
      zScore: rateZScores[i],
      isAnomaly,
      severity: Math.abs(rateZScores[i]) > 4 ? 'extreme' :
        Math.abs(rateZScores[i]) > 3 ? 'high' : 'moderate',
      type: rate.absoluteChange > 0 ? 'spike' : 'drop'
    };
  }).filter(a => a.isAnomaly);

  return {
    anomalies,
    totalAnomalies: anomalies.length,
    averageRate: rateStats.mean,
    rateStd: rateStats.standardDeviation
  };
}

/**
 * Detect contextual anomalies (considering medications, events)
 */
export function detectContextualAnomalies(data, context = {}) {
  const { medications = [], events = [] } = context;

  const anomalies = [];

  // Check for anomalies after medication changes
  medications.forEach(med => {
    if (med.startDate) {
      const startDate = new Date(med.startDate);
      const endDate = med.endDate ? new Date(med.endDate) : new Date();

      // Find measurements during medication period
      const duringMedication = data.filter(d => {
        const date = new Date(d.timestamp);
        return date >= startDate && date <= endDate;
      });

      // Find measurements before medication
      const beforeMedication = data.filter(d => {
        const date = new Date(d.timestamp);
        return date < startDate;
      });

      if (beforeMedication.length > 0 && duringMedication.length > 0) {
        const beforeAvg = beforeMedication.map(d => d.value).reduce((a, b) => a + b, 0) / beforeMedication.length;
        const duringAvg = duringMedication.map(d => d.value).reduce((a, b) => a + b, 0) / duringMedication.length;

        const change = Math.abs(duringAvg - beforeAvg);
        const pctChange = Math.abs(calculatePercentageChange(beforeAvg, duringAvg));

        if (pctChange > 20) { // Significant change
          anomalies.push({
            type: 'medication_effect',
            medication: med.name,
            startDate: med.startDate,
            change: duringAvg - beforeAvg,
            percentageChange: pctChange,
            beforeAverage: beforeAvg,
            duringAverage: duringAvg,
            severity: pctChange > 50 ? 'extreme' : pctChange > 30 ? 'high' : 'moderate',
            description: `Significant change (${pctChange.toFixed(1)}%) detected after starting ${med.name}`
          });
        }
      }
    }
  });

  // Check for anomalies around events
  events.forEach(event => {
    const eventDate = new Date(event.date);
    const windowDays = 7; // Look at week before and after

    const beforeEvent = data.filter(d => {
      const date = new Date(d.timestamp);
      const diffDays = (eventDate - date) / (1000 * 60 * 60 * 24);
      return diffDays > 0 && diffDays <= windowDays;
    });

    const afterEvent = data.filter(d => {
      const date = new Date(d.timestamp);
      const diffDays = (date - eventDate) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= windowDays;
    });

    if (beforeEvent.length > 0 && afterEvent.length > 0) {
      const beforeAvg = beforeEvent.map(d => d.value).reduce((a, b) => a + b, 0) / beforeEvent.length;
      const afterAvg = afterEvent.map(d => d.value).reduce((a, b) => a + b, 0) / afterEvent.length;

      const change = Math.abs(afterAvg - beforeAvg);
      const pctChange = Math.abs(calculatePercentageChange(beforeAvg, afterAvg));

      if (pctChange > 20) {
        anomalies.push({
          type: 'event_related',
          event: event.name,
          eventDate: event.date,
          change: afterAvg - beforeAvg,
          percentageChange: pctChange,
          beforeAverage: beforeAvg,
          afterAverage: afterAvg,
          severity: pctChange > 50 ? 'extreme' : pctChange > 30 ? 'high' : 'moderate',
          description: `Significant change (${pctChange.toFixed(1)}%) detected around ${event.name}`
        });
      }
    }
  });

  return {
    anomalies,
    totalAnomalies: anomalies.length,
    summary: {
      medicationRelated: anomalies.filter(a => a.type === 'medication_effect').length,
      eventRelated: anomalies.filter(a => a.type === 'event_related').length
    }
  };
}

/**
 * Detect persistent abnormalities (values consistently outside range)
 */
export function detectPersistentAbnormalities(data, referenceRange, options = {}) {
  const {
    minConsecutive = 3,
    minPercentage = 50
  } = options;

  const { lower, upper } = referenceRange;

  // Check each value
  const abnormalFlags = data.map(d => ({
    ...d,
    isAbnormal: d.value < lower || d.value > upper,
    type: d.value < lower ? 'low' : 'high'
  }));

  // Find consecutive abnormalities
  const persistentAbnormalities = [];
  let currentStreak = null;

  abnormalFlags.forEach((flag, index) => {
    if (flag.isAbnormal) {
      if (!currentStreak) {
        currentStreak = {
          startIndex: index,
          type: flag.type,
          count: 1,
          values: [flag.value]
        };
      } else if (currentStreak.type === flag.type) {
        currentStreak.count++;
        currentStreak.values.push(flag.value);
      } else {
        // Type changed, save previous streak if significant
        if (currentStreak.count >= minConsecutive) {
          persistentAbnormalities.push({
            ...currentStreak,
            endIndex: index - 1,
            startTimestamp: abnormalFlags[currentStreak.startIndex].timestamp,
            endTimestamp: abnormalFlags[index - 1].timestamp,
            severity: currentStreak.count > 5 ? 'severe' : 'moderate',
            description: `Persistent ${currentStreak.type} values detected for ${currentStreak.count} consecutive measurements`
          });
        }
        currentStreak = {
          startIndex: index,
          type: flag.type,
          count: 1,
          values: [flag.value]
        };
      }
    } else {
      if (currentStreak && currentStreak.count >= minConsecutive) {
        persistentAbnormalities.push({
          ...currentStreak,
          endIndex: index - 1,
          startTimestamp: abnormalFlags[currentStreak.startIndex].timestamp,
          endTimestamp: abnormalFlags[index - 1].timestamp,
          severity: currentStreak.count > 5 ? 'severe' : 'moderate',
          description: `Persistent ${currentStreak.type} values detected for ${currentStreak.count} consecutive measurements`
        });
      }
      currentStreak = null;
    }
  });

  // Check last streak
  if (currentStreak && currentStreak.count >= minConsecutive) {
    persistentAbnormalities.push({
      ...currentStreak,
      endIndex: abnormalFlags.length - 1,
      startTimestamp: abnormalFlags[currentStreak.startIndex].timestamp,
      endTimestamp: abnormalFlags[abnormalFlags.length - 1].timestamp,
      severity: currentStreak.count > 5 ? 'severe' : 'moderate',
      description: `Persistent ${currentStreak.type} values detected for ${currentStreak.count} consecutive measurements`
    });
  }

  // Calculate overall percentage outside range
  const totalAbnormal = abnormalFlags.filter(f => f.isAbnormal).length;
  const abnormalPercentage = (totalAbnormal / data.length) * 100;

  return {
    persistentAbnormalities,
    totalPersistent: persistentAbnormalities.length,
    overallAbnormal: {
      count: totalAbnormal,
      percentage: abnormalPercentage,
      isElevated: abnormalPercentage >= minPercentage
    },
    referenceRange
  };
}

/**
 * Detect multivariate anomalies (unusual combinations of values)
 */
export function detectMultivariateAnomalies(data, options = {}) {
  const {
    threshold = 3,
    useMahalanobis = true
  } = options;

  const variables = Object.keys(data);

  if (variables.length < 2) {
    return {
      anomalies: [],
      totalAnomalies: 0,
      method: 'univariate',
      note: 'Need at least 2 variables for multivariate analysis'
    };
  }

  const n = data[variables[0]].length;
  const p = variables.length;

  // Build data matrix
  const matrix = [];
  for (let i = 0; i < n; i++) {
    const row = variables.map(v => data[v][i]);
    matrix.push(row);
  }

  // Calculate mean vector and covariance matrix
  const means = variables.map(v => {
    const values = data[v];
    return values.reduce((a, b) => a + b, 0) / n;
  });

  // Calculate covariance matrix
  const covariance = [];
  for (let i = 0; i < p; i++) {
    covariance[i] = [];
    for (let j = 0; j < p; j++) {
      let cov = 0;
      for (let k = 0; k < n; k++) {
        cov += (matrix[k][i] - means[i]) * (matrix[k][j] - means[j]);
      }
      covariance[i][j] = cov / (n - 1);
    }
  }

  // Calculate Mahalanobis distance for each point
  const mahalanobisDistances = [];

  for (let i = 0; i < n; i++) {
    const diff = matrix[i].map((val, idx) => val - means[idx]);

    // Inverse covariance (simplified - use proper library for production)
    const inverseCov = invertMatrix(covariance);

    let distance = 0;
    for (let j = 0; j < p; j++) {
      for (let k = 0; k < p; k++) {
        distance += diff[j] * inverseCov[j][k] * diff[k];
      }
    }

    mahalanobisDistances.push(Math.sqrt(distance));
  }

  // Detect anomalies
  const thresholdValue = threshold; // Chi-squared distribution would give better threshold
  const anomalies = mahalanobisDistances
    .map((dist, index) => ({
      index,
      distance: dist,
      isAnomaly: dist > thresholdValue,
      values: matrix[index]
    }))
    .filter(a => a.isAnomaly);

  return {
    anomalies,
    totalAnomalies: anomalies.length,
    method: 'mahalanobis',
    threshold: thresholdValue,
    meanDistance: mahalanobisDistances.reduce((a, b) => a + b, 0) / n
  };
}

/**
 * Simple matrix inversion (2x2 only for demonstration)
 */
function invertMatrix(matrix) {
  const n = matrix.length;

  if (n === 1) {
    return [[1 / matrix[0][0]]];
  }

  if (n === 2) {
    const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    if (det === 0) {
      return [[1, 0], [0, 1]]; // Identity matrix as fallback
    }
    return [
      [matrix[1][1] / det, -matrix[0][1] / det],
      [-matrix[1][0] / det, matrix[0][0] / det]
    ];
  }

  // For larger matrices, return identity (would need proper implementation)
  const identity = [];
  for (let i = 0; i < n; i++) {
    identity[i] = [];
    for (let j = 0; j < n; j++) {
      identity[i][j] = i === j ? 1 : 0;
    }
  }
  return identity;
}

/**
 * Perform comprehensive anomaly detection
 */
export function detectAnomalies(data, referenceRange, context, options = {}) {
  const values = data.map(d => d.value);

  // Statistical outliers
  const statistical = detectStatisticalAnomalies(values, options);

  // Rate of change anomalies
  const rateOfChange = detectRateOfChangeAnomalies(data, options);

  // Contextual anomalies
  const contextual = detectContextualAnomalies(data, context);

  // Persistent abnormalities
  const persistent = detectPersistentAbnormalities(data, referenceRange, options);

  // Aggregate all anomalies
  const allAnomalies = [
    ...statistical.anomalies,
    ...rateOfChange.anomalies,
    ...contextual.anomalies,
    ...persistent.persistentAbnormalities
  ];

  // Sort by severity
  const severityOrder = { extreme: 4, severe: 3, high: 2, moderate: 1, low: 0 };
  allAnomalies.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  return {
    statistical,
    rateOfChange,
    contextual,
    persistent,
    allAnomalies,
    totalCount: allAnomalies.length,
    summary: generateAnomalySummary(statistical, rateOfChange, contextual, persistent)
  };
}

/**
 * Generate anomaly summary
 */
function generateAnomalySummary(statistical, rateOfChange, contextual, persistent) {
  const parts = [];

  if (statistical.totalAnomalies > 0) {
    parts.push(`${statistical.totalAnomalies} statistical outliers`);
  }

  if (rateOfChange.totalAnomalies > 0) {
    parts.push(`${rateOfChange.totalAnomalies} rapid changes`);
  }

  if (contextual.totalAnomalies > 0) {
    parts.push(`${contextual.totalAnomalies} context-related anomalies`);
  }

  if (persistent.totalPersistent > 0) {
    parts.push(`${persistent.totalPersistent} persistent abnormalities`);
  }

  if (parts.length === 0) {
    return 'No anomalies detected';
  }

  return `Detected: ${parts.join(', ')}.`;
}

export default {
  detectStatisticalAnomalies,
  detectRateOfChangeAnomalies,
  detectContextualAnomalies,
  detectPersistentAbnormalities,
  detectMultivariateAnomalies,
  detectAnomalies
};
