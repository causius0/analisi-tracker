/**
 * Analytics API Routes
 * Provides REST endpoints for all analytics features.
 * All routes require authentication — results are scoped to the requesting user.
 */

import express from 'express';
import { eq, and, asc } from 'drizzle-orm';
import {
  analyzeSingleLabTest,
  analyzeMultipleLabTests,
  getQuickInsights
} from '../analytics/engine.js';
import { getCacheInstance } from '../cache/cache-manager.js';
import { authenticate } from '../middleware/auth.js';
import { db, labTestResults, patients } from '../db/index.js';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';

const router = express.Router();
const cache = getCacheInstance();

// All analytics routes require authentication
router.use(authenticate);

/**
 * Fetch lab result data for a given labTestDefinitionId, restricted to
 * patients belonging to the authenticated user.
 * Returns [{value, timestamp}] sorted ascending by date.
 */
async function getLabTestData(labTestDefinitionId, userId) {
  const { inArray } = await import('drizzle-orm');

  const userPatients = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.userId, userId));

  if (userPatients.length === 0) return [];

  const patientIds = userPatients.map(p => p.id);

  const results = await db
    .select({ value: labTestResults.value, date: labTestResults.date })
    .from(labTestResults)
    .where(
      and(
        eq(labTestResults.labTestDefinitionId, labTestDefinitionId),
        inArray(labTestResults.patientId, patientIds)
      )
    )
    .orderBy(asc(labTestResults.date));

  return results.map(r => ({
    value: parseFloat(r.value),
    timestamp: r.date.toISOString()
  }));
}

/**
 * GET /api/analytics/trends/:labTestId
 * Get trend analysis for a specific lab test
 */
router.get('/trends/:labTestId', asyncHandler(async (req, res) => {
  const { labTestId } = req.params;
  const { forecastHorizon } = req.query;
  const userId = req.user.id;

  const data = await getLabTestData(labTestId, userId);

  if (!data || data.length === 0) {
    throw new NotFoundError('No data found for this lab test');
  }

  const cacheKey = cache.generateKey('trends', `${userId}:${labTestId}`, { forecastHorizon });
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.json({ ...cached, metadata: { ...cached.metadata, cached: true, cachedAt: new Date().toISOString() } });
  }

  const result = await analyzeSingleLabTest(data, {
    labTestId,
    includeTrends: true,
    includeCorrelations: false,
    includeAnomalies: true,
    includePredictions: true,
    forecastHorizon: parseInt(forecastHorizon) || 30
  });

  await cache.set(cacheKey, result, 'medium', { cacheType: 'trends', userId });

  res.json(result);
}));

/**
 * GET /api/analytics/correlations
 * Get correlation matrix for multiple lab tests
 */
router.get('/correlations', asyncHandler(async (req, res) => {
  const { labTests, includeLagged, includeRolling } = req.query;
  const userId = req.user.id;

  if (!labTests) {
    return res.status(400).json({ error: 'labTests parameter is required' });
  }

  const labTestIds = labTests.split(',');

  const dataByLabTest = {};
  for (const id of labTestIds) {
    const data = await getLabTestData(id, userId);
    if (data && data.length > 0) dataByLabTest[id] = data;
  }

  if (Object.keys(dataByLabTest).length < 2) {
    return res.status(400).json({ error: 'Need at least 2 lab tests with data' });
  }

  const cacheKey = cache.generateKey('correlations', `${userId}:${labTestIds.join(',')}`, { includeLagged, includeRolling });
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.json({ ...cached, metadata: { ...cached.metadata, cached: true } });
  }

  const result = await analyzeMultipleLabTests(dataByLabTest, {
    includeLagged: includeLagged === 'true',
    includeRolling: includeRolling === 'true'
  });

  const response = { correlations: result.correlations, metadata: result.metadata };
  await cache.set(cacheKey, response, 'long', { cacheType: 'correlations', userId });

  res.json(response);
}));

/**
 * GET /api/analytics/anomalies/:labTestId
 * Get anomaly detection for a specific lab test
 */
router.get('/anomalies/:labTestId', asyncHandler(async (req, res) => {
  const { labTestId } = req.params;
  const { referenceMin, referenceMax } = req.query;
  const userId = req.user.id;

  const data = await getLabTestData(labTestId, userId);

  if (!data || data.length === 0) {
    throw new NotFoundError('No data found for this lab test');
  }

  const cacheKey = cache.generateKey('anomalies', `${userId}:${labTestId}`, { referenceMin, referenceMax });
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.json({ ...cached, metadata: { ...cached.metadata, cached: true } });
  }

  const result = await analyzeSingleLabTest(data, {
    labTestId,
    referenceRange: { lower: parseFloat(referenceMin) || 0, upper: parseFloat(referenceMax) || 100 },
    includeAnomalies: true,
    includeTrends: false,
    includeCorrelations: false,
    includePredictions: false
  });

  const response = { anomalies: result.anomalies, metadata: result.metadata };
  await cache.set(cacheKey, response, 'short', { cacheType: 'anomalies', userId });

  res.json(response);
}));

/**
 * GET /api/analytics/predictions/:labTestId
 * Get predictions for a specific lab test
 */
router.get('/predictions/:labTestId', asyncHandler(async (req, res) => {
  const { labTestId } = req.params;
  const { forecastHorizon, referenceMin, referenceMax } = req.query;
  const userId = req.user.id;

  const data = await getLabTestData(labTestId, userId);

  if (!data || data.length === 0) {
    throw new NotFoundError('No data found for this lab test');
  }

  const cacheKey = cache.generateKey('predictions', `${userId}:${labTestId}`, { forecastHorizon, referenceMin, referenceMax });
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.json({ ...cached, metadata: { ...cached.metadata, cached: true } });
  }

  const result = await analyzeSingleLabTest(data, {
    labTestId,
    referenceRange: { lower: parseFloat(referenceMin) || 0, upper: parseFloat(referenceMax) || 100 },
    forecastHorizon: parseInt(forecastHorizon) || 30,
    includePredictions: true,
    includeTrends: false,
    includeCorrelations: false,
    includeAnomalies: false
  });

  const response = { predictions: result.predictions, metadata: result.metadata };
  await cache.set(cacheKey, response, 'short', { cacheType: 'predictions', userId });

  res.json(response);
}));

/**
 * GET /api/analytics/statistics/:labTestId
 * Get descriptive statistics for a specific lab test
 */
router.get('/statistics/:labTestId', asyncHandler(async (req, res) => {
  const { labTestId } = req.params;
  const userId = req.user.id;

  const data = await getLabTestData(labTestId, userId);

  if (!data || data.length === 0) {
    throw new NotFoundError('No data found for this lab test');
  }

  const cacheKey = cache.generateKey('statistics', `${userId}:${labTestId}`);
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.json({ ...cached, metadata: { ...cached.metadata, cached: true } });
  }

  const result = await analyzeSingleLabTest(data, {
    labTestId,
    includeTrends: false,
    includeCorrelations: false,
    includeAnomalies: false,
    includePredictions: false
  });

  const response = {
    statistics: result.statistics,
    variability: result.variability,
    confidenceInterval: result.confidenceInterval,
    personalizedRange: result.personalizedRange,
    metadata: result.metadata
  };

  await cache.set(cacheKey, response, 'long', { cacheType: 'statistics', userId });

  res.json(response);
}));

/**
 * GET /api/analytics/insights
 * Get all insights for one or more lab tests
 */
router.get('/insights', asyncHandler(async (req, res) => {
  const { labTests, type = 'quick' } = req.query;
  const userId = req.user.id;

  if (!labTests) {
    return res.status(400).json({ error: 'labTests parameter is required' });
  }

  const labTestIds = labTests.split(',');

  if (type === 'quick') {
    const insights = [];
    for (const id of labTestIds) {
      const data = await getLabTestData(id, userId);
      if (data && data.length > 0) insights.push(getQuickInsights(data, id));
    }

    return res.json({
      insights,
      metadata: { type: 'quick', labTestCount: insights.length, timestamp: new Date().toISOString() }
    });
  }

  const dataByLabTest = {};
  for (const id of labTestIds) {
    const data = await getLabTestData(id, userId);
    if (data && data.length > 0) dataByLabTest[id] = data;
  }

  const result = await analyzeMultipleLabTests(dataByLabTest);

  res.json({
    insights: result.individualAnalyses,
    compositeScores: result.compositeScores,
    metadata: result.metadata
  });
}));

/**
 * GET /api/analytics/comprehensive/:labTestId
 * Get comprehensive analysis for a specific lab test
 */
router.get('/comprehensive/:labTestId', asyncHandler(async (req, res) => {
  const { labTestId } = req.params;
  const { referenceMin, referenceMax, targetMin, targetMax, forecastHorizon } = req.query;
  const userId = req.user.id;

  const data = await getLabTestData(labTestId, userId);

  if (!data || data.length === 0) {
    throw new NotFoundError('No data found for this lab test');
  }

  const cacheKey = cache.generateKey('comprehensive', `${userId}:${labTestId}`, {
    referenceMin, referenceMax, targetMin, targetMax, forecastHorizon
  });
  const cached = await cache.get(cacheKey);

  if (cached) {
    return res.json({ ...cached, metadata: { ...cached.metadata, cached: true } });
  }

  const result = await analyzeSingleLabTest(data, {
    labTestId,
    referenceRange: { lower: parseFloat(referenceMin) || 0, upper: parseFloat(referenceMax) || 100 },
    targetRange: targetMin && targetMax ? { min: parseFloat(targetMin), max: parseFloat(targetMax) } : null,
    forecastHorizon: parseInt(forecastHorizon) || 30,
    includeTrends: true,
    includeAnomalies: true,
    includePredictions: true
  });

  await cache.set(cacheKey, result, 'medium', { cacheType: 'comprehensive', userId });

  res.json(result);
}));

/**
 * POST /api/analytics/cache/clear
 * Clear cache for specific lab test or all (scoped to current user)
 */
router.post('/cache/clear', asyncHandler(async (req, res) => {
  const { labTestId, pattern } = req.body;
  const userId = req.user.id;

  if (labTestId) {
    const deleted = await cache.deletePattern(`${userId}:${labTestId}`);
    return res.json({ message: `Cleared ${deleted} cache entries for ${labTestId}`, deleted });
  } else if (pattern) {
    const deleted = await cache.deletePattern(`${userId}:${pattern}`);
    return res.json({ message: `Cleared ${deleted} cache entries matching pattern`, deleted });
  } else {
    await cache.deletePattern(userId);
    return res.json({ message: 'Cleared all cache for current user', deleted: 'all' });
  }
}));

/**
 * GET /api/analytics/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', asyncHandler(async (req, res) => {
  const stats = cache.getStats();
  res.json(stats);
}));

export default router;
