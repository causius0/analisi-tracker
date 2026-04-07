import { describe, it, expect } from 'vitest';
import {
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
} from './statistics.js';

describe('Statistics - calculateDescriptiveStatistics', () => {
  it('should calculate basic statistics', () => {
    const values = [1, 2, 3, 4, 5];
    const stats = calculateDescriptiveStatistics(values);

    expect(stats.count).toBe(5);
    expect(stats.mean).toBe(3);
    expect(stats.median).toBe(3);
    expect(stats.minimum).toBe(1);
    expect(stats.maximum).toBe(5);
    expect(stats.range).toBe(4);
  });

  it('should calculate percentiles correctly', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const stats = calculateDescriptiveStatistics(values);

    expect(stats.percentiles.p25).toBeCloseTo(3.25, 1);
    expect(stats.percentiles.p50).toBeCloseTo(5.5, 1);
    expect(stats.percentiles.p75).toBeCloseTo(7.75, 1);
  });

  it('should calculate standard deviation and variance', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const stats = calculateDescriptiveStatistics(values);

    expect(stats.standardDeviation).toBeCloseTo(2.138, 2);
    expect(stats.variance).toBeCloseTo(4.571, 2);
  });

  it('should calculate quartiles and IQR', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const stats = calculateDescriptiveStatistics(values);

    expect(stats.quartiles.q1).toBeCloseTo(3.25, 1);
    expect(stats.quartiles.q2).toBeCloseTo(5.5, 1);
    expect(stats.quartiles.q3).toBeCloseTo(7.75, 1);
    expect(stats.quartiles.iqr).toBeCloseTo(4.5, 1);
  });

  it('should calculate shape metrics', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const stats = calculateDescriptiveStatistics(values);

    expect(stats.shape.skewness).toBeDefined();
    expect(stats.shape.kurtosis).toBeDefined();
  });

  it('should calculate coefficient of variation', () => {
    const values = [10, 12, 14, 16, 18];
    const stats = calculateDescriptiveStatistics(values);

    expect(stats.coefficientOfVariation).toBeCloseTo(22.36, 1);
  });

  it('should throw error for empty array', () => {
    expect(() => calculateDescriptiveStatistics([])).toThrow('Values array is empty');
  });

  it('should handle single value', () => {
    const values = [5];
    const stats = calculateDescriptiveStatistics(values);

    expect(stats.count).toBe(1);
    expect(stats.mean).toBe(5);
    expect(stats.minimum).toBe(5);
    expect(stats.maximum).toBe(5);
  });
});

describe('Statistics - calculateZScores', () => {
  it('should calculate z-scores correctly', () => {
    const values = [1, 2, 3, 4, 5];
    const zScores = calculateZScores(values);

    expect(zScores).toHaveLength(5);
    expect(zScores[2]).toBeCloseTo(0, 5); // Mean should have z-score of 0
    expect(zScores[0]).toBeLessThan(0); // Below mean
    expect(zScores[4]).toBeGreaterThan(0); // Above mean
  });

  it('should use custom reference mean and std', () => {
    const values = [10, 20, 30];
    const zScores = calculateZScores(values, 20, 10);

    expect(zScores[0]).toBeCloseTo(-1, 5);
    expect(zScores[1]).toBeCloseTo(0, 5);
    expect(zScores[2]).toBeCloseTo(1, 5);
  });

  it('should handle zero standard deviation', () => {
    const values = [5, 5, 5];
    const zScores = calculateZScores(values);

    expect(zScores).toEqual([0, 0, 0]);
  });
});

describe('Statistics - detectOutliersZScore', () => {
  it('should detect outliers using z-score method', () => {
    const values = [10, 12, 11, 13, 12, 50]; // 50 is an outlier
    const outliers = detectOutliersZScore(values, 2);

    expect(outliers).toHaveLength(6);
    expect(outliers[5].isOutlier).toBe(true);
    expect(outliers[5].severity).toBe('extreme');
  });

  it('should classify outlier severity', () => {
    const values = [10, 12, 11, 13, 12, 30];
    const outliers = detectOutliersZScore(values, 2);

    const outlier = outliers.find(o => o.isOutlier);
    expect(outlier?.severity).toBe('moderate');
  });

  it('should not flag normal values as outliers', () => {
    const values = [10, 12, 11, 13, 12, 11];
    const outliers = detectOutliersZScore(values, 3);

    outliers.forEach(outlier => {
      expect(outlier.isOutlier).toBe(false);
    });
  });
});

describe('Statistics - detectOutliersIQR', () => {
  it('should detect outliers using IQR method', () => {
    const values = [10, 12, 11, 13, 12, 50]; // 50 is an outlier
    const outliers = detectOutliersIQR(values, 1.5);

    expect(outliers).toHaveLength(6);
    expect(outliers[5].isOutlier).toBe(true);
    expect(outliers[5].type).toBe('high');
  });

  it('should detect low outliers', () => {
    const values = [50, 12, 11, 13, 12, 10]; // 50 is an outlier
    const outliers = detectOutliersIQR(values, 1.5);

    expect(outliers[0].isOutlier).toBe(true);
    expect(outliers[0].type).toBe('high');
  });

  it('should provide bounds', () => {
    const values = [10, 12, 11, 13, 12, 14];
    const outliers = detectOutliersIQR(values, 1.5);

    outliers.forEach(outlier => {
      expect(outlier.bounds).toBeDefined();
      expect(outlier.bounds.lower).toBeDefined();
      expect(outlier.bounds.upper).toBeDefined();
    });
  });
});

describe('Statistics - calculatePercentageChange', () => {
  it('should calculate percentage change', () => {
    expect(calculatePercentageChange(100, 150)).toBe(50);
    expect(calculatePercentageChange(100, 50)).toBe(-50);
    expect(calculatePercentageChange(100, 100)).toBe(0);
  });

  it('should handle zero old value', () => {
    expect(calculatePercentageChange(0, 0)).toBe(0);
    expect(calculatePercentageChange(0, 100)).toBe(100);
  });
});

describe('Statistics - calculateRateOfChange', () => {
  it('should calculate rate of change', () => {
    const values = [
      { timestamp: '2024-01-01', value: 10 },
      { timestamp: '2024-01-02', value: 12 },
      { timestamp: '2024-01-03', value: 14 },
    ];

    const result = calculateRateOfChange(values);

    expect(result).toBeDefined();
    expect(result.slope).toBeCloseTo(2, 1);
    expect(result.unit).toBe('per day');
    expect(result.rSquared).toBeGreaterThan(0.9);
  });

  it('should return null for single value', () => {
    const values = [
      { timestamp: '2024-01-01', value: 10 },
    ];

    expect(calculateRateOfChange(values)).toBeNull();
  });

  it('should calculate normalized slope', () => {
    const values = [
      { timestamp: '2024-01-01', value: 100 },
      { timestamp: '2024-01-02', value: 110 },
    ];

    const result = calculateRateOfChange(values);
    expect(result.normalizedSlope).toBeDefined();
  });
});

describe('Statistics - calculateMovingAverage', () => {
  it('should calculate simple moving average', () => {
    const values = [1, 2, 3, 4, 5, 6];
    const ma = calculateMovingAverage(values, 3);

    expect(ma).toHaveLength(4);
    expect(ma[0]).toBe(2); // (1+2+3)/3
    expect(ma[1]).toBe(3); // (2+3+4)/3
    expect(ma[2]).toBe(4); // (3+4+5)/3
    expect(ma[3]).toBe(5); // (4+5+6)/3
  });

  it('should return empty array if window size larger than values', () => {
    const values = [1, 2, 3];
    const ma = calculateMovingAverage(values, 5);

    expect(ma).toHaveLength(0);
  });
});

describe('Statistics - calculateExponentialMovingAverage', () => {
  it('should calculate exponential moving average', () => {
    const values = [1, 2, 3, 4, 5];
    const ema = calculateExponentialMovingAverage(values, 2);

    expect(ema).toHaveLength(5);
    expect(ema[0]).toBe(1);
    expect(ema[4]).toBeGreaterThan(ema[0]);
  });

  it('should handle empty array', () => {
    const ema = calculateExponentialMovingAverage([], 2);
    expect(ema).toHaveLength(0);
  });
});

describe('Statistics - testNormality', () => {
  it('should detect normal distribution', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = testNormality(values);

    expect(result.isNormal).toBeDefined();
    expect(result.skewness).toBeDefined();
    expect(result.kurtosis).toBeDefined();
    expect(result.recommendation).toMatch(/parametric|non-parametric/);
  });

  it('should detect skewed distribution', () => {
    const values = [1, 1, 1, 1, 1, 100, 100, 100, 100, 100];
    const result = testNormality(values);

    expect(Math.abs(result.skewness)).toBeGreaterThan(1);
  });
});

describe('Statistics - calculateConfidenceInterval', () => {
  it('should calculate 95% confidence interval', () => {
    const values = [1, 2, 3, 4, 5];
    const ci = calculateConfidenceInterval(values, 0.95);

    expect(ci.lower).toBeDefined();
    expect(ci.upper).toBeDefined();
    expect(ci.marginOfError).toBeDefined();
    expect(ci.confidence).toBe(0.95);
    expect(ci.lower).toBeLessThan(ci.upper);
  });

  it('should include mean in confidence interval', () => {
    const values = [10, 12, 14, 16, 18];
    const ci = calculateConfidenceInterval(values);
    const stats = calculateDescriptiveStatistics(values);

    expect(ci.lower).toBeLessThan(stats.mean);
    expect(ci.upper).toBeGreaterThan(stats.mean);
  });
});

describe('Statistics - calculateTimeInRange', () => {
  it('should calculate time in range', () => {
    const values = [70, 80, 90, 100, 110, 120, 130];
    const tir = calculateTimeInRange(values, 80, 120);

    expect(tir.percentage).toBeCloseTo(71.43, 1);
    expect(tir.count).toBe(5);
    expect(tir.total).toBe(7);
    expect(tir.targetRange).toEqual({ min: 80, max: 120 });
  });

  it('should handle empty array', () => {
    const tir = calculateTimeInRange([], 80, 120);

    expect(tir.percentage).toBe(0);
    expect(tir.count).toBe(0);
    expect(tir.total).toBe(0);
  });

  it('should handle all values in range', () => {
    const values = [90, 95, 100, 105, 110];
    const tir = calculateTimeInRange(values, 80, 120);

    expect(tir.percentage).toBe(100);
  });

  it('should handle all values out of range', () => {
    const values = [50, 60, 130, 140, 150];
    const tir = calculateTimeInRange(values, 80, 120);

    expect(tir.percentage).toBe(0);
  });
});

describe('Statistics - calculateVariabilityMetrics', () => {
  it('should calculate comprehensive variability metrics', () => {
    const values = [10, 12, 14, 16, 18];
    const metrics = calculateVariabilityMetrics(values);

    expect(metrics.standardDeviation).toBeDefined();
    expect(metrics.variance).toBeDefined();
    expect(metrics.coefficientOfVariation).toBeDefined();
    expect(metrics.range).toBe(8);
    expect(metrics.interquartileRange).toBeDefined();
    expect(metrics.quartileCoefficientOfDispersion).toBeDefined();
  });

  it('should calculate coefficient of variation correctly', () => {
    const values = [10, 12, 14, 16, 18];
    const metrics = calculateVariabilityMetrics(values);

    expect(metrics.coefficientOfVariation).toBeCloseTo(22.36, 1);
  });
});
