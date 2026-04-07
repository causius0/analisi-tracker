/**
 * Analytics API Routes
 * Provides REST endpoints for all analytics features
 */

import express from 'express';
import {
  analyzeSingleLabTest,
  analyzeMultipleLabTests,
  getQuickInsights
} from '../analytics/engine.js';

import { getCacheInstance } from '../cache/cache-manager.js';

const router = express.Router();
const cache = getCacheInstance();

/**
 * GET /api/analytics/trends/:labTestId
 * Get trend analysis for a specific lab test
 */
router.get('/trends/:labTestId', async (req, res) => {
  try {
    const { labTestId } = req.params;
    const { forecastHorizon } = req.query;

    // Get data (would come from database in production)
    const data = await getLabTestData(labTestId);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data found for this lab test' });
    }

    // Check cache
    const cacheKey = cache.generateKey('trends', labTestId, { forecastHorizon });
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
          cachedAt: new Date().toISOString()
        }
      });
    }

    // Perform analysis
    const result = await analyzeSingleLabTest(data, {
      labTestId,
      includeTrends: true,
      includeCorrelations: false,
      includeAnomalies: true,
      includePredictions: true,
      forecastHorizon: parseInt(forecastHorizon) || 30
    });

    // Cache result
    cache.set(cacheKey, result, 'medium');

    res.json(result);

  } catch (error) {
    console.error('Error in trends endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/correlations
 * Get correlation matrix for multiple lab tests
 */
router.get('/correlations', async (req, res) => {
  try {
    const { labTests, includeLagged, includeRolling } = req.query;

    if (!labTests) {
      return res.status(400).json({ error: 'labTests parameter is required' });
    }

    const labTestIds = labTests.split(',');

    // Get data for all lab tests
    const dataByLabTest = {};
    for (const id of labTestIds) {
      const data = await getLabTestData(id);
      if (data && data.length > 0) {
        dataByLabTest[id] = data;
      }
    }

    if (Object.keys(dataByLabTest).length < 2) {
      return res.status(400).json({ error: 'Need at least 2 lab tests with data' });
    }

    // Check cache
    const cacheKey = cache.generateKey('correlations', labTestIds.join(','), {
      includeLagged,
      includeRolling
    });
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true
        }
      });
    }

    // Perform analysis
    const result = await analyzeMultipleLabTests(dataByLabTest, {
      includeLagged: includeLagged === 'true',
      includeRolling: includeRolling === 'true'
    });

    // We only need correlations from this endpoint
    const response = {
      correlations: result.correlations,
      metadata: result.metadata
    };

    // Cache result
    cache.set(cacheKey, response, 'long');

    res.json(response);

  } catch (error) {
    console.error('Error in correlations endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/anomalies/:labTestId
 * Get anomaly detection for a specific lab test
 */
router.get('/anomalies/:labTestId', async (req, res) => {
  try {
    const { labTestId } = req.params;
    const { referenceMin, referenceMax } = req.query;

    // Get data
    const data = await getLabTestData(labTestId);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data found for this lab test' });
    }

    // Check cache
    const cacheKey = cache.generateKey('anomalies', labTestId, {
      referenceMin,
      referenceMax
    });
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true
        }
      });
    }

    // Perform analysis
    const result = await analyzeSingleLabTest(data, {
      labTestId,
      referenceRange: {
        lower: parseFloat(referenceMin) || 0,
        upper: parseFloat(referenceMax) || 100
      },
      includeAnomalies: true,
      includeTrends: false,
      includeCorrelations: false,
      includePredictions: false
    });

    // We only need anomalies from this endpoint
    const response = {
      anomalies: result.anomalies,
      metadata: result.metadata
    };

    // Cache result
    cache.set(cacheKey, response, 'short');

    res.json(response);

  } catch (error) {
    console.error('Error in anomalies endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/predictions/:labTestId
 * Get predictions for a specific lab test
 */
router.get('/predictions/:labTestId', async (req, res) => {
  try {
    const { labTestId } = req.params;
    const { forecastHorizon, referenceMin, referenceMax } = req.query;

    // Get data
    const data = await getLabTestData(labTestId);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data found for this lab test' });
    }

    // Check cache
    const cacheKey = cache.generateKey('predictions', labTestId, {
      forecastHorizon,
      referenceMin,
      referenceMax
    });
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true
        }
      });
    }

    // Perform analysis
    const result = await analyzeSingleLabTest(data, {
      labTestId,
      referenceRange: {
        lower: parseFloat(referenceMin) || 0,
        upper: parseFloat(referenceMax) || 100
      },
      forecastHorizon: parseInt(forecastHorizon) || 30,
      includePredictions: true,
      includeTrends: false,
      includeCorrelations: false,
      includeAnomalies: false
    });

    // We only need predictions from this endpoint
    const response = {
      predictions: result.predictions,
      metadata: result.metadata
    };

    // Cache result
    cache.set(cacheKey, response, 'short');

    res.json(response);

  } catch (error) {
    console.error('Error in predictions endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/statistics/:labTestId
 * Get descriptive statistics for a specific lab test
 */
router.get('/statistics/:labTestId', async (req, res) => {
  try {
    const { labTestId } = req.params;

    // Get data
    const data = await getLabTestData(labTestId);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data found for this lab test' });
    }

    // Check cache
    const cacheKey = cache.generateKey('statistics', labTestId);
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true
        }
      });
    }

    // Perform analysis
    const result = await analyzeSingleLabTest(data, {
      labTestId,
      includeTrends: false,
      includeCorrelations: false,
      includeAnomalies: false,
      includePredictions: false
    });

    // We only need statistics from this endpoint
    const response = {
      statistics: result.statistics,
      variability: result.variability,
      confidenceInterval: result.confidenceInterval,
      personalizedRange: result.personalizedRange,
      metadata: result.metadata
    };

    // Cache result
    cache.set(cacheKey, response, 'long');

    res.json(response);

  } catch (error) {
    console.error('Error in statistics endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/insights
 * Get all insights for a lab test or multiple lab tests
 */
router.get('/insights', async (req, res) => {
  try {
    const { labTests, type = 'quick' } = req.query;

    if (!labTests) {
      return res.status(400).json({ error: 'labTests parameter is required' });
    }

    const labTestIds = labTests.split(',');

    if (type === 'quick') {
      // Get quick insights for dashboard
      const insights = [];

      for (const id of labTestIds) {
        const data = await getLabTestData(id);
        if (data && data.length > 0) {
          const insight = getQuickInsights(data, id);
          insights.push(insight);
        }
      }

      return res.json({
        insights,
        metadata: {
          type: 'quick',
          labTestCount: insights.length,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // Get detailed insights
      const dataByLabTest = {};
      for (const id of labTestIds) {
        const data = await getLabTestData(id);
        if (data && data.length > 0) {
          dataByLabTest[id] = data;
        }
      }

      const result = await analyzeMultipleLabTests(dataByLabTest);

      return res.json({
        insights: result.individualAnalyses,
        compositeScores: result.compositeScores,
        metadata: result.metadata
      });
    }

  } catch (error) {
    console.error('Error in insights endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/comprehensive/:labTestId
 * Get comprehensive analysis for a specific lab test
 */
router.get('/comprehensive/:labTestId', async (req, res) => {
  try {
    const { labTestId } = req.params;
    const {
      referenceMin,
      referenceMax,
      targetMin,
      targetMax,
      forecastHorizon
    } = req.query;

    // Get data
    const data = await getLabTestData(labTestId);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data found for this lab test' });
    }

    // Check cache
    const cacheKey = cache.generateKey('comprehensive', labTestId, {
      referenceMin,
      referenceMax,
      targetMin,
      targetMax,
      forecastHorizon
    });
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true
        }
      });
    }

    // Perform comprehensive analysis
    const result = await analyzeSingleLabTest(data, {
      labTestId,
      referenceRange: {
        lower: parseFloat(referenceMin) || 0,
        upper: parseFloat(referenceMax) || 100
      },
      targetRange: targetMin && targetMax ? {
        min: parseFloat(targetMin),
        max: parseFloat(targetMax)
      } : null,
      forecastHorizon: parseInt(forecastHorizon) || 30,
      includeTrends: true,
      includeAnomalies: true,
      includePredictions: true
    });

    // Cache result
    cache.set(cacheKey, result, 'medium');

    res.json(result);

  } catch (error) {
    console.error('Error in comprehensive endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/analytics/cache/clear
 * Clear cache for specific lab test or all
 */
router.post('/cache/clear', async (req, res) => {
  try {
    const { labTestId, pattern } = req.body;

    if (labTestId) {
      // Clear all cache keys for this lab test
      const deleted = cache.deletePattern(labTestId);
      return res.json({
        message: `Cleared ${deleted} cache entries for ${labTestId}`,
        deleted
      });
    } else if (pattern) {
      // Clear all cache keys matching pattern
      const deleted = cache.deletePattern(pattern);
      return res.json({
        message: `Cleared ${deleted} cache entries matching pattern`,
        deleted
      });
    } else {
      // Clear all cache
      cache.flushAll();
      return res.json({
        message: 'Cleared all cache',
        deleted: 'all'
      });
    }

  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = cache.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to get lab test data
 * In production, this would query the database
 */
async function getLabTestData(labTestId) {
  // Mock data - replace with actual database query
  const mockData = {
    creatinine: [
      { timestamp: '2024-01-01', value: 1.2 },
      { timestamp: '2024-01-15', value: 1.1 },
      { timestamp: '2024-02-01', value: 1.0 },
      { timestamp: '2024-02-15', value: 0.9 },
      { timestamp: '2024-03-01', value: 0.95 },
      { timestamp: '2024-03-15', value: 0.85 },
      { timestamp: '2024-04-01', value: 0.8 }
    ],
    glucose: [
      { timestamp: '2024-01-01', value: 110 },
      { timestamp: '2024-01-15', value: 105 },
      { timestamp: '2024-02-01', value: 102 },
      { timestamp: '2024-02-15', value: 98 },
      { timestamp: '2024-03-01', value: 95 },
      { timestamp: '2024-03-15', value: 93 },
      { timestamp: '2024-04-01', value: 90 }
    ],
    egfr: [
      { timestamp: '2024-01-01', value: 75 },
      { timestamp: '2024-01-15', value: 78 },
      { timestamp: '2024-02-01', value: 80 },
      { timestamp: '2024-02-15', value: 82 },
      { timestamp: '2024-03-01', value: 85 },
      { timestamp: '2024-03-15', value: 88 },
      { timestamp: '2024-04-01', value: 90 }
    ]
  };

  return mockData[labTestId] || [];
}

export default router;
