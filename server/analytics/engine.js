/**
 * Main Analytics Engine
 * Orchestrates all analytics modules and provides unified interface
 */

import {
  calculateDescriptiveStatistics,
  calculateVariabilityMetrics,
  calculateTimeInRange,
  calculateConfidenceInterval
} from './statistics.js';

import {
  analyzeTrends,
  calculateRollingTrends,
  calculateTrendAcceleration
} from './trends.js';

import {
  analyzeCorrelations,
  calculateLaggedCorrelation,
  calculatePartialCorrelation
} from './correlation.js';

import {
  detectAnomalies,
  detectMultivariateAnomalies
} from './anomalies.js';

import {
  performPredictiveAnalysis,
  analyzeWhatIf,
  calculatePersonalizedRange
} from './prediction.js';

/**
 * Perform comprehensive analytics on a single lab test
 */
export function analyzeSingleLabTest(data, options = {}) {
  const {
    referenceRange = { lower: 0, upper: 100 },
    targetRange = null,
    context = {},
    includeTrends = true,
    includeCorrelations = false,
    includeAnomalies = true,
    includePredictions = true,
    forecastHorizon = 30
  } = options;

  if (!data || data.length < 3) {
    throw new Error('Insufficient data for analysis. Minimum 3 data points required.');
  }

  const values = data.map(d => d.value);

  // Basic statistics
  const statistics = calculateDescriptiveStatistics(values);
  const variability = calculateVariabilityMetrics(values);
  const confidenceInterval = calculateConfidenceInterval(values);

  // Time in target range (if applicable)
  let timeInRange = null;
  if (targetRange) {
    timeInRange = calculateTimeInRange(values, targetRange.min, targetRange.max);
  }

  // Trend analysis
  let trends = null;
  if (includeTrends) {
    trends = {
      overall: analyzeTrends(data),
      rolling: calculateRollingTrends(data, Math.min(5, Math.floor(data.length / 2))),
      acceleration: calculateTrendAcceleration(data)
    };
  }

  // Anomaly detection
  let anomalies = null;
  if (includeAnomalies) {
    anomalies = detectAnomalies(data, referenceRange, context);
  }

  // Predictive analytics
  let predictions = null;
  if (includePredictions) {
    predictions = performPredictiveAnalysis(data, referenceRange, { forecastHorizon });
  }

  // Personalized range
  const personalizedRange = calculatePersonalizedRange(values);

  // Generate insights
  const insights = generateInsights({
    statistics,
    trends,
    anomalies,
    predictions,
    referenceRange,
    personalizedRange
  });

  return {
    metadata: {
      labTestId: options.labTestId || 'unknown',
      dataPoints: data.length,
      dateRange: {
        start: data[0].timestamp,
        end: data[data.length - 1].timestamp
      },
      analysisDate: new Date().toISOString()
    },
    statistics,
    variability,
    confidenceInterval,
    timeInRange,
    trends,
    anomalies,
    predictions,
    personalizedRange,
    insights,
    summary: generateSummary(statistics, trends, anomalies, predictions)
  };
}

/**
 * Perform comparative analysis across multiple lab tests
 */
export function analyzeMultipleLabTests(dataByLabTest, options = {}) {
  const labTestIds = Object.keys(dataByLabTest);

  if (labTestIds.length < 2) {
    throw new Error('Need at least 2 lab tests for comparative analysis');
  }

  // Prepare correlation data
  const correlationData = {};
  const commonLength = Math.min(...labTestIds.map(id => dataByLabTest[id].length));

  labTestIds.forEach(id => {
    correlationData[id] = dataByLabTest[id]
      .slice(0, commonLength)
      .map(d => d.value);
  });

  // Correlation analysis
  const correlations = analyzeCorrelations(correlationData, {
    includeLagged: options.includeLagged || false,
    includeRolling: options.includeRolling || false
  });

  // Individual analyses
  const individualAnalyses = {};
  labTestIds.forEach(id => {
    try {
      individualAnalyses[id] = analyzeSingleLabTest(dataByLabTest[id], {
        ...options,
        includeCorrelations: false
      });
    } catch (error) {
      individualAnalyses[id] = {
        error: error.message
      };
    }
  });

  // Composite scores
  const compositeScores = calculateCompositeScores(individualAnalyses);

  // Multivariate anomalies
  let multivariateAnomalies = null;
  try {
    multivariateAnomalies = detectMultivariateAnomalies(correlationData);
  } catch (error) {
    multivariateAnomalies = {
      error: error.message
    };
  }

  return {
    metadata: {
      labTestCount: labTestIds.length,
      dataPointsPerTest: commonLength,
      analysisDate: new Date().toISOString()
    },
    correlations,
    individualAnalyses,
    compositeScores,
    multivariateAnomalies,
    summary: generateComparativeSummary(correlations, compositeScores)
  };
}

/**
 * Calculate composite health scores
 */
function calculateCompositeScores(analyses) {
  const scores = {};

  // Kidney function score (based on creatinine, eGFR, BUN)
  if (analyses.creatinine || analyses.egfr) {
    scores.kidneyFunction = calculateKidneyScore(analyses);
  }

  // Liver health score (based on ALT, AST, ALP, bilirubin)
  if (analyses.alt || analyses.ast || analyses.alp) {
    scores.liverHealth = calculateLiverScore(analyses);
  }

  // Metabolic health score (based on glucose, HbA1c, cholesterol)
  if (analyses.glucose || analyses.hba1c) {
    scores.metabolicHealth = calculateMetabolicScore(analyses);
  }

  return scores;
}

/**
 * Calculate kidney function score
 */
function calculateKidneyScore(analyses) {
  let score = 50; // Base score
  let factors = [];

  if (analyses.egfr && !analyses.egfr.error) {
    const egfrValue = analyses.egfr.statistics.mean;
    if (egfrValue >= 90) {
      score += 20;
      factors.push('Normal eGFR');
    } else if (egfrValue >= 60) {
      score += 10;
      factors.push('Mildly decreased eGFR');
    } else if (egfrValue >= 30) {
      score -= 10;
      factors.push('Moderately decreased eGFR');
    } else {
      score -= 30;
      factors.push('Severely decreased eGFR');
    }
  }

  if (analyses.creatinine && !analyses.creatinine.error) {
    const creatTrend = analyses.creatinine.trends?.overall;
    if (creatTrend) {
      if (creatTrend.direction === 'decreasing' || creatTrend.direction === 'stable') {
        score += 10;
        factors.push('Stable or improving creatinine');
      } else if (creatTrend.direction === 'increasing') {
        score -= 15;
        factors.push('Worsening creatinine trend');
      }
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
    factors
  };
}

/**
 * Calculate liver health score
 */
function calculateLiverScore(analyses) {
  let score = 50;
  let factors = [];

  ['alt', 'ast', 'alp'].forEach(test => {
    if (analyses[test] && !analyses[test].error) {
      const anomalies = analyses[test].anomalies?.statistical;
      if (anomalies && anomalies.totalAnomalies === 0) {
        score += 10;
        factors.push(`Normal ${test.toUpperCase()}`);
      } else if (anomalies && anomalies.totalAnomalies > 0) {
        score -= 10;
        factors.push(`Elevated ${test.toUpperCase()}`);
      }
    }
  });

  return {
    score: Math.max(0, Math.min(100, score)),
    level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
    factors
  };
}

/**
 * Calculate metabolic health score
 */
function calculateMetabolicScore(analyses) {
  let score = 50;
  let factors = [];

  if (analyses.glucose && !analyses.glucose.error) {
    const glucoseMean = analyses.glucose.statistics.mean;
    if (glucoseMean < 100) {
      score += 20;
      factors.push('Normal fasting glucose');
    } else if (glucoseMean < 126) {
      score += 5;
      factors.push('Prediabetic range glucose');
    } else {
      score -= 20;
      factors.push('Diabetic range glucose');
    }
  }

  if (analyses.hba1c && !analyses.hba1c.error) {
    const hba1cMean = analyses.hba1c.statistics.mean;
    if (hba1cMean < 5.7) {
      score += 15;
      factors.push('Normal HbA1c');
    } else if (hba1cMean < 6.5) {
      score += 5;
      factors.push('Prediabetic HbA1c');
    } else {
      score -= 15;
      factors.push('Diabetic HbA1c');
    }
  }

  if (analyses.glucose?.timeInRange) {
    const tir = analyses.glucose.timeInRange.percentage;
    if (tir >= 70) {
      score += 15;
      factors.push('Excellent time in range');
    } else if (tir >= 50) {
      score += 5;
      factors.push('Moderate time in range');
    } else {
      score -= 10;
      factors.push('Low time in range');
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    level: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
    factors
  };
}

/**
 * Generate insights
 */
function generateInsights(data) {
  const insights = [];
  const { statistics, trends, anomalies, predictions, referenceRange, personalizedRange } = data;

  // Statistical insights
  if (statistics) {
    insights.push({
      type: 'statistical',
      category: 'overview',
      message: `Average: ${statistics.mean.toFixed(2)}, Range: ${statistics.minimum.toFixed(2)} - ${statistics.maximum.toFixed(2)}`,
      priority: 'low'
    });
  }

  // Trend insights
  if (trends?.overall) {
    const trend = trends.overall;
    insights.push({
      type: 'trend',
      category: 'direction',
      message: trend.summary,
      priority: trend.strength.level === 'very_strong' ? 'high' : 'medium'
    });
  }

  // Anomaly insights
  if (anomalies?.allAnomalies?.length > 0) {
    const severeAnomalies = anomalies.allAnomalies.filter(a =>
      a.severity === 'extreme' || a.severity === 'high' || a.severity === 'severe'
    );

    if (severeAnomalies.length > 0) {
      insights.push({
        type: 'anomaly',
        category: 'warning',
        message: `${severeAnomalies.length} significant anomalies detected - review recommended`,
        priority: 'high'
      });
    }
  }

  // Prediction insights
  if (predictions?.risk) {
    const risk = predictions.risk;
    if (risk.riskLevel === 'very_high' || risk.riskLevel === 'high') {
      insights.push({
        type: 'risk',
        category: 'alert',
        message: `High risk level detected: ${risk.riskLevel}. ${risk.recommendations[0]?.message || ''}`,
        priority: 'urgent'
      });
    }
  }

  // Warning insights
  if (predictions?.warnings?.totalWarnings > 0) {
    const criticalWarnings = predictions.warnings.warnings.filter(w => w.urgency === 'critical');
    if (criticalWarnings.length > 0) {
      insights.push({
        type: 'warning',
        category: 'prediction',
        message: `${criticalWarnings.length} critical warnings: ${criticalWarnings[0].message}`,
        priority: 'urgent'
      });
    }
  }

  return insights.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Generate summary
 */
function generateSummary(statistics, trends, anomalies, predictions) {
  const parts = [];

  parts.push(`Average: ${statistics.mean.toFixed(2)}`);

  if (trends?.overall) {
    parts.push(`Trend: ${trends.overall.direction}`);
  }

  if (anomalies?.totalCount > 0) {
    parts.push(`${anomalies.totalCount} anomalies`);
  }

  if (predictions?.risk) {
    parts.push(`Risk: ${predictions.risk.riskLevel.replace(/_/g, ' ')}`);
  }

  return parts.join(' | ');
}

/**
 * Generate comparative summary
 */
function generateComparativeSummary(correlations, compositeScores) {
  const parts = [];

  if (correlations.insights?.strongCorrelations?.length > 0) {
    parts.push(`${correlations.insights.strongCorrelations.length} strong correlations`);
  }

  if (correlations.insights?.leadLagRelationships?.length > 0) {
    parts.push(`${correlations.insights.leadLagRelationships.length} lead-lag relationships`);
  }

  if (Object.keys(compositeScores).length > 0) {
    const avgScore = Object.values(compositeScores).reduce((sum, s) => sum + s.score, 0) / Object.keys(compositeScores).length;
    parts.push(`Average health score: ${avgScore.toFixed(0)}/100`);
  }

  return parts.join(' | ') || 'No significant patterns detected';
}

/**
 * Quick insights (for dashboard widgets)
 */
export function getQuickInsights(data, labTestId) {
  try {
    const analysis = analyzeSingleLabTest(data, {
      labTestId,
      includePredictions: false,
      includeTrends: true,
      includeAnomalies: true
    });

    return {
      labTestId,
      currentValue: data[data.length - 1].value,
      average: analysis.statistics.mean,
      trend: analysis.trends.overall.direction,
      trendStrength: analysis.trends.overall.strength.level,
      anomalyCount: analysis.anomalies.totalCount,
      riskLevel: analysis.anomalies.totalCount > 2 ? 'elevated' : 'normal',
      status: analysis.anomalies.totalCount > 2 ? 'attention' : 'ok'
    };
  } catch (error) {
    return {
      labTestId,
      error: error.message
    };
  }
}

// Re-export individual analytics functions for direct use
export {
  calculateDescriptiveStatistics,
  calculateVariabilityMetrics,
  calculateTimeInRange,
  calculateConfidenceInterval,
  analyzeTrends,
  calculateRollingTrends,
  calculateTrendAcceleration,
  analyzeCorrelations,
  calculateLaggedCorrelation,
  calculatePartialCorrelation,
  detectAnomalies,
  detectMultivariateAnomalies,
  performPredictiveAnalysis,
  analyzeWhatIf,
  calculatePersonalizedRange
};

export default {
  analyzeSingleLabTest,
  analyzeMultipleLabTests,
  getQuickInsights,
  calculateCompositeScores
};
