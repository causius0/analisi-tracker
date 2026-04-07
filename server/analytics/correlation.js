/**
 * Correlation Analysis Module
 * Calculates pairwise correlations between multiple lab values
 */

import { calculateDescriptiveStatistics } from './statistics.js';

/**
 * Calculate Pearson correlation coefficient
 */
export function pearsonCorrelation(x, y) {
  if (x.length !== y.length || x.length < 3) {
    return null;
  }

  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    sumSqX += diffX * diffX;
    sumSqY += diffY * diffY;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  const correlation = denominator === 0 ? 0 : numerator / denominator;

  return {
    coefficient: correlation,
    strength: getCorrelationStrength(Math.abs(correlation)),
    direction: correlation > 0 ? 'positive' : correlation < 0 ? 'negative' : 'none'
  };
}

/**
 * Calculate Spearman rank correlation coefficient
 */
export function spearmanCorrelation(x, y) {
  if (x.length !== y.length || x.length < 3) {
    return null;
  }

  // Rank the data
  const rankX = getRanks(x);
  const rankY = getRanks(y);

  // Calculate Pearson correlation on ranks
  const result = pearsonCorrelation(rankX, rankY);

  return result;
}

/**
 * Get ranks for data (with ties handled)
 */
function getRanks(values) {
  const sorted = values.map((v, i) => ({ value: v, index: i }))
    .sort((a, b) => a.value - b.value);

  const ranks = new Array(values.length);

  for (let i = 0; i < sorted.length; i++) {
    // Handle ties
    let j = i;
    while (j < sorted.length && sorted[j].value === sorted[i].value) {
      j++;
    }

    const avgRank = (i + j - 1) / 2;
    for (let k = i; k < j; k++) {
      ranks[sorted[k].index] = avgRank;
    }

    i = j - 1;
  }

  return ranks;
}

/**
 * Get correlation strength description
 */
function getCorrelationStrength(absCoefficient) {
  if (absCoefficient >= 0.9) return 'very_strong';
  if (absCoefficient >= 0.7) return 'strong';
  if (absCoefficient >= 0.5) return 'moderate';
  if (absCoefficient >= 0.3) return 'weak';
  return 'very_weak';
}

/**
 * Calculate p-value for correlation coefficient
 */
export function calculateCorrelationPValue(correlation, n) {
  if (n < 3 || Math.abs(correlation) >= 1) {
    return 1;
  }

  const t = Math.abs(correlation) * Math.sqrt((n - 2) / (1 - correlation * correlation));

  // Approximate p-value using t-distribution
  const pValue = 2 * (1 - tCDF(t, n - 2));

  return pValue;
}

/**
 * Cumulative distribution function for t-distribution (approximation)
 */
function tCDF(t, df) {
  // Approximation using error function
  const x = (t * t + df) / (df * (1 + t * t / df));
  const a = df / 2;
  const b = 0.5;

  // Simple approximation
  return 0.5 + Math.sign(t) * 0.5 * Math.sqrt(1 - Math.pow(1 - Math.min(t * t / (df + t * t), 1), df));
}

/**
 * Calculate correlation matrix for multiple variables
 */
export function calculateCorrelationMatrix(data, method = 'pearson') {
  const variables = Object.keys(data);
  const matrix = {};
  const pValues = {};
  const n = data[variables[0]].length;

  variables.forEach(var1 => {
    matrix[var1] = {};
    pValues[var1] = {};

    variables.forEach(var2 => {
      if (var1 === var2) {
        matrix[var1][var2] = 1;
        pValues[var1][var2] = 0;
      } else {
        const result = method === 'spearman'
          ? spearmanCorrelation(data[var1], data[var2])
          : pearsonCorrelation(data[var1], data[var2]);

        matrix[var1][var2] = result?.coefficient || 0;
        pValues[var1][var2] = calculateCorrelationPValue(matrix[var1][var2], n);
      }
    });
  });

  return {
    matrix,
    pValues,
    significantPairs: findSignificantCorrelations(matrix, pValues, 0.05),
    method
  };
}

/**
 * Find significant correlations
 */
function findSignificantCorrelations(matrix, pValues, alpha = 0.05) {
  const pairs = [];

  Object.keys(matrix).forEach(var1 => {
    Object.keys(matrix[var1]).forEach(var2 => {
      if (var1 < var2 && pValues[var1][var2] < alpha) {
        pairs.push({
          variable1: var1,
          variable2: var2,
          correlation: matrix[var1][var2],
          pValue: pValues[var1][var2],
          strength: getCorrelationStrength(Math.abs(matrix[var1][var2])),
          direction: matrix[var1][var2] > 0 ? 'positive' : 'negative'
        });
      }
    });
  });

  return pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

/**
 * Calculate time-lagged correlation
 */
export function calculateLaggedCorrelation(x, y, maxLag = 5, method = 'pearson') {
  const correlations = [];

  for (let lag = -maxLag; lag <= maxLag; lag++) {
    const xLagged = lag > 0 ? x.slice(0, -lag) : lag < 0 ? x.slice(-lag) : x;
    const yLagged = lag > 0 ? y.slice(lag) : lag < 0 ? y.slice(0, lag) : y;

    const result = method === 'spearman'
      ? spearmanCorrelation(xLagged, yLagged)
      : pearsonCorrelation(xLagged, yLagged);

    correlations.push({
      lag,
      correlation: result?.coefficient || 0,
      strength: result?.strength,
      n: xLagged.length
    });
  }

  // Find maximum correlation
  const maxCorr = correlations.reduce((max, curr) =>
    Math.abs(curr.correlation) > Math.abs(max.correlation) ? curr : max
  );

  return {
    correlations,
    maximum: maxCorr,
    bestLag: maxCorr.lag,
    interpretation: maxCorr.lag === 0
      ? 'Contemporaneous relationship'
      : maxCorr.lag > 0
      ? `X leads Y by ${maxCorr.lag} periods`
      : `Y leads X by ${Math.abs(maxCorr.lag)} periods`
  };
}

/**
 * Calculate partial correlation (correlation controlling for other variables)
 */
export function calculatePartialCorrelation(data, x, y, controls) {
  // Build correlation matrix
  const allVars = [x, y, ...controls];
  const matrixData = {};
  allVars.forEach(v => {
    matrixData[v] = data[v];
  });

  const corrMatrix = calculateCorrelationMatrix(matrixData, 'pearson').matrix;

  // Use inverse covariance matrix method
  const n = allVars.length;
  const p = new Array(n).fill(0).map(() => new Array(n).fill(0));

  // Build precision matrix (inverse of correlation matrix)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      p[i][j] = corrMatrix[allVars[i]][allVars[j]];
    }
  }

  // Invert matrix (simplified 2x2 case with one control variable)
  if (controls.length === 1) {
    const z = controls[0];
    const rxy = corrMatrix[x][y];
    const rxz = corrMatrix[x][z];
    const ryz = corrMatrix[y][z];

    const partial = (rxy - rxz * ryz) /
      Math.sqrt((1 - rxz * rxz) * (1 - ryz * ryz));

    return {
      partialCorrelation: partial,
      interpretation: `${x} and ${y} correlation controlling for ${z}`,
      strength: getCorrelationStrength(Math.abs(partial))
    };
  }

  // For multiple controls, return null (requires full matrix inversion)
  return {
    partialCorrelation: null,
    interpretation: 'Multiple controls not yet supported'
  };
}

/**
 * Calculate rolling window correlation
 */
export function calculateRollingCorrelation(x, y, windowSize = 10) {
  if (x.length !== y.length || x.length < windowSize) {
    return [];
  }

  const rollingCorrelations = [];

  for (let i = windowSize; i <= x.length; i++) {
    const xWindow = x.slice(i - windowSize, i);
    const yWindow = y.slice(i - windowSize, i);

    const result = pearsonCorrelation(xWindow, yWindow);

    rollingCorrelations.push({
      index: i - 1,
      correlation: result?.coefficient || 0,
      strength: result?.strength,
      n: windowSize
    });
  }

  return rollingCorrelations;
}

/**
 * Perform comprehensive correlation analysis
 */
export function analyzeCorrelations(data, options = {}) {
  const {
    method = 'pearson',
    includeLagged = true,
    maxLag = 5,
    includeRolling = false,
    rollingWindow = 10,
    significanceLevel = 0.05
  } = options;

  const variables = Object.keys(data);

  // Basic correlation matrix
  const correlationMatrix = calculateCorrelationMatrix(data, method);

  // Time-lagged correlations (if enabled)
  const laggedCorrelations = {};
  if (includeLagged && variables.length >= 2) {
    for (let i = 0; i < variables.length - 1; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const key = `${variables[i]}_${variables[j]}`;
        laggedCorrelations[key] = calculateLaggedCorrelation(
          data[variables[i]],
          data[variables[j]],
          maxLag,
          method
        );
      }
    }
  }

  // Rolling correlations (if enabled)
  const rollingCorrelations = {};
  if (includeRolling && variables.length >= 2 && data[variables[0]].length >= rollingWindow) {
    for (let i = 0; i < variables.length - 1; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const key = `${variables[i]}_${variables[j]}`;
        rollingCorrelations[key] = calculateRollingCorrelation(
          data[variables[i]],
          data[variables[j]],
          rollingWindow
        );
      }
    }
  }

  // Generate insights
  const insights = generateCorrelationInsights(correlationMatrix, laggedCorrelations);

  return {
    matrix: correlationMatrix,
    lagged: includeLagged ? laggedCorrelations : undefined,
    rolling: includeRolling ? rollingCorrelations : undefined,
    insights,
    summary: generateCorrelationSummary(correlationMatrix, insights)
  };
}

/**
 * Generate correlation insights
 */
function generateCorrelationInsights(correlationMatrix, laggedCorrelations) {
  const insights = {
    strongCorrelations: [],
    moderateCorrelations: [],
    leadLagRelationships: [],
    unexpectedPatterns: []
  };

  // Strong correlations
  correlationMatrix.significantPairs.forEach(pair => {
    if (pair.strength === 'strong' || pair.strength === 'very_strong') {
      insights.strongCorrelations.push({
        ...pair,
        description: `${pair.variable1} and ${pair.variable2} show a ${pair.strength} ${pair.direction} correlation`
      });
    } else if (pair.strength === 'moderate') {
      insights.moderateCorrelations.push({
        ...pair,
        description: `${pair.variable1} and ${pair.variable2} show a moderate ${pair.direction} correlation`
      });
    }
  });

  // Lead-lag relationships
  if (laggedCorrelations) {
    Object.entries(laggedCorrelations).forEach(([key, result]) => {
      if (result.bestLag !== 0 && Math.abs(result.maximum.correlation) > 0.5) {
        insights.leadLagRelationships.push({
          variables: key.split('_'),
          lag: result.bestLag,
          correlation: result.maximum.correlation,
          interpretation: result.interpretation
        });
      }
    });
  }

  return insights;
}

/**
 * Generate correlation summary
 */
function generateCorrelationSummary(correlationMatrix, insights) {
  const nStrong = insights.strongCorrelations.length;
  const nModerate = insights.moderateCorrelations.length;
  const nLeadLag = insights.leadLagRelationships.length;

  let summary = `Found ${nStrong} strong and ${nModerate} moderate significant correlations.`;

  if (nLeadLag > 0) {
    summary += ` Detected ${nLeadLag} lead-lag relationships.`;
  }

  return summary;
}

export default {
  pearsonCorrelation,
  spearmanCorrelation,
  calculateCorrelationMatrix,
  calculateLaggedCorrelation,
  calculatePartialCorrelation,
  calculateRollingCorrelation,
  analyzeCorrelations
};
