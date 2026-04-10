/**
 * Lab Tests API Routes
 * Lab test definitions and results management
 */

import express from 'express';
import { db, labTestDefinitions, labTestResults, patients } from '../../db/index.js';
import { eq, and, gte, lte, desc, asc, inArray } from 'drizzle-orm';
import { authenticate } from '../../middleware/auth.js';
import { validateZod, schemas } from '../../middleware/validation.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';
import { asyncHandler, NotFoundError, ValidationError } from '../../middleware/errorHandler.js';
import { logger } from '../../middleware/logger.js';
import { getCacheInstance } from '../../cache/cache-manager.js';
import { analyzeSingleLabTest } from '../../analytics/engine.js';

const cache = getCacheInstance();

/**
 * Invalidate all cached analytics for a given user + labTestDefinitionId, then
 * kick off a background pre-computation so the next request is instant.
 */
function invalidateAndPrefetch(userId, labTestDefinitionId) {
  setImmediate(async () => {
    try {
      await cache.deletePattern(`${userId}:${labTestDefinitionId}`);

      // Fetch current data and pre-warm the trends cache
      const userPatients = await db
        .select({ id: patients.id })
        .from(patients)
        .where(eq(patients.userId, userId));

      if (userPatients.length === 0) return;

      const patientIds = userPatients.map(p => p.id);
      const { inArray: inArr } = await import('drizzle-orm');

      const rows = await db
        .select({ value: labTestResults.value, date: labTestResults.date })
        .from(labTestResults)
        .where(and(
          eq(labTestResults.labTestDefinitionId, labTestDefinitionId),
          inArr(labTestResults.patientId, patientIds)
        ))
        .orderBy(asc(labTestResults.date));

      if (rows.length < 3) return; // Not enough points to trend

      const data = rows.map(r => ({ value: parseFloat(r.value), timestamp: r.date.toISOString() }));
      const result = await analyzeSingleLabTest(data, {
        labTestId: labTestDefinitionId,
        includeTrends: true,
        includeAnomalies: true,
        includePredictions: true,
        forecastHorizon: 30
      });

      const cacheKey = cache.generateKey('trends', `${userId}:${labTestDefinitionId}`, { forecastHorizon: undefined });
      await cache.set(cacheKey, result, 'medium', { cacheType: 'trends', userId });
    } catch (err) {
      logger.warn('Background trend pre-computation failed', { userId, labTestDefinitionId, err: err.message });
    }
  });
}

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Lab Test Definitions

/**
 * GET /api/labs/definitions
 * List all lab test definitions
 */
router.get('/definitions',
  asyncHandler(async (req, res) => {
    const { category, limit = 100, offset = 0 } = req.query;

    let query = db
      .select()
      .from(labTestDefinitions)
      .orderBy(labTestDefinitions.name)
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Filter by category if provided
    if (category) {
      query = db
        .select()
        .from(labTestDefinitions)
        .where(eq(labTestDefinitions.category, category))
        .orderBy(labTestDefinitions.name)
        .limit(parseInt(limit))
        .offset(parseInt(offset));
    }

    const definitions = await query;

    // Get total count
    const countResult = await db
      .select({ count: labTestDefinitions.id })
      .from(labTestDefinitions);

    res.setHeader('X-Total-Count', countResult.length.toString());

    res.json({
      definitions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: countResult.length
      }
    });
  })
);

/**
 * GET /api/labs/definitions/:definitionId
 * Get lab test definition by ID
 */
router.get('/definitions/:definitionId',
  asyncHandler(async (req, res) => {
    const { definitionId } = req.params;

    const definitionRecords = await db
      .select()
      .from(labTestDefinitions)
      .where(eq(labTestDefinitions.id, definitionId))
      .limit(1);

    if (definitionRecords.length === 0) {
      throw new NotFoundError('Lab test definition not found');
    }

    res.json({
      definition: definitionRecords[0]
    });
  })
);

// Lab Test Results

/**
 * GET /api/labs/results
 * List lab test results with filtering
 */
router.get('/results',
  validateZod(schemas.labTestQuery),
  asyncHandler(async (req, res) => {
    const { patientId, labTestDefinitionId, startDate, endDate, limit = 50, offset = 0 } = req.query;

    // Build query conditions
    const conditions = [];

    // Get all patients for current user
    const userPatients = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, req.user.id));

    const patientIds = userPatients.map(p => p.id);
    conditions.push(inArray(labTestResults.patientId, patientIds));

    if (patientId) {
      // Verify patient belongs to user
      const patient = userPatients.find(p => p.id === patientId);
      if (!patient) {
        throw new ValidationError('Patient not found or access denied');
      }
      conditions.push(eq(labTestResults.patientId, patientId));
    }

    if (labTestDefinitionId) {
      conditions.push(eq(labTestResults.labTestDefinitionId, labTestDefinitionId));
    }

    if (startDate) {
      conditions.push(gte(labTestResults.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(labTestResults.date, new Date(endDate)));
    }

    // Execute query
    let query = db
      .select()
      .from(labTestResults)
      .where(and(...conditions))
      .orderBy(desc(labTestResults.date))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const results = await query;

    // Get total count
    const countQuery = db
      .select({ count: labTestResults.id })
      .from(labTestResults)
      .where(and(...conditions));

    const countResult = await countQuery;

    res.setHeader('X-Total-Count', countResult.length.toString());

    res.json({
      results,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: countResult.length
      }
    });
  })
);

/**
 * GET /api/labs/results/:resultId
 * Get lab test result by ID
 */
router.get('/results/:resultId',
  asyncHandler(async (req, res) => {
    const { resultId } = req.params;

    // Get all patients for current user
    const userPatients = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, req.user.id));

    const patientIds = userPatients.map(p => p.id);

    const resultRecords = await db
      .select()
      .from(labTestResults)
      .where(and(
        eq(labTestResults.id, resultId),
        inArray(labTestResults.patientId, patientIds)
      ))
      .limit(1);

    if (resultRecords.length === 0) {
      throw new NotFoundError('Lab test result not found');
    }

    res.json({
      result: resultRecords[0]
    });
  })
);

/**
 * POST /api/labs/results
 * Create new lab test result
 */
router.post('/results',
  validateZod(schemas.createLabResult),
  asyncHandler(async (req, res) => {
    const {
      patientId,
      labTestDefinitionId,
      value,
      unit,
      date,
      notes
    } = req.body;

    // Verify patient belongs to user
    const patientRecords = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, patientId),
        eq(patients.userId, req.user.id)
      ))
      .limit(1);

    if (patientRecords.length === 0) {
      throw new ValidationError('Patient not found or access denied');
    }

    // Get lab test definition to determine if value is abnormal
    const definitionRecords = await db
      .select({
        id: labTestDefinitions.id,
        referenceMin: labTestDefinitions.referenceMin,
        referenceMax: labTestDefinitions.referenceMax
      })
      .from(labTestDefinitions)
      .where(eq(labTestDefinitions.id, labTestDefinitionId))
      .limit(1);

    if (definitionRecords.length === 0) {
      throw new ValidationError('Lab test definition not found');
    }

    const definition = definitionRecords[0];

    // Determine if value is abnormal
    let isAbnormal = false;
    if (definition.referenceMin !== null && definition.referenceMax !== null) {
      const numValue = parseFloat(value);
      const minRef = parseFloat(definition.referenceMin);
      const maxRef = parseFloat(definition.referenceMax);
      isAbnormal = numValue < minRef || numValue > maxRef;
    }

    // Create lab test result
    const newResults = await db
      .insert(labTestResults)
      .values({
        id: crypto.randomUUID(),
        patientId,
        labTestDefinitionId,
        value: value.toString(),
        unit,
        date: new Date(date),
        isAbnormal,
        notes: notes || null,
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    logger.info('Lab test result created', {
      userId: req.user.id,
      patientId,
      resultId: newResults[0].id
    });

    invalidateAndPrefetch(req.user.id, labTestDefinitionId);

    res.status(201).json({
      message: 'Lab test result created successfully',
      result: newResults[0]
    });
  })
);

/**
 * PATCH /api/labs/results/:resultId
 * Update lab test result
 */
router.patch('/results/:resultId',
  validateZod(schemas.updateLabResult),
  asyncHandler(async (req, res) => {
    const { resultId } = req.params;
    const { value, unit, date, notes } = req.body;

    // Get all patients for current user
    const userPatients = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, req.user.id));

    const patientIds = userPatients.map(p => p.id);

    // Check if result exists and belongs to user's patients
    const existingResults = await db
      .select()
      .from(labTestResults)
      .where(and(
        eq(labTestResults.id, resultId),
        inArray(labTestResults.patientId, patientIds)
      ))
      .limit(1);

    if (existingResults.length === 0) {
      throw new NotFoundError('Lab test result not found');
    }

    // Build update object
    const updateData = { updatedAt: new Date() };
    if (value !== undefined) updateData.value = value.toString();
    if (unit !== undefined) updateData.unit = unit;
    if (date !== undefined) updateData.date = new Date(date);
    if (notes !== undefined) updateData.notes = notes;

    // Update result
    const updatedResults = await db
      .update(labTestResults)
      .set(updateData)
      .where(eq(labTestResults.id, resultId))
      .returning();

    logger.info('Lab test result updated', {
      userId: req.user.id,
      resultId
    });

    invalidateAndPrefetch(req.user.id, existingResults[0].labTestDefinitionId);

    res.json({
      message: 'Lab test result updated successfully',
      result: updatedResults[0]
    });
  })
);

/**
 * DELETE /api/labs/results/:resultId
 * Delete lab test result
 */
router.delete('/results/:resultId',
  asyncHandler(async (req, res) => {
    const { resultId } = req.params;

    // Get all patients for current user
    const userPatients = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, req.user.id));

    const patientIds = userPatients.map(p => p.id);

    // Check if result exists and belongs to user's patients
    const existingResults = await db
      .select()
      .from(labTestResults)
      .where(and(
        eq(labTestResults.id, resultId),
        inArray(labTestResults.patientId, patientIds)
      ))
      .limit(1);

    if (existingResults.length === 0) {
      throw new NotFoundError('Lab test result not found');
    }

    // Delete result
    await db
      .delete(labTestResults)
      .where(eq(labTestResults.id, resultId));

    logger.info('Lab test result deleted', {
      userId: req.user.id,
      resultId
    });

    invalidateAndPrefetch(req.user.id, existingResults[0].labTestDefinitionId);

    res.json({
      message: 'Lab test result deleted successfully'
    });
  })
);

/**
 * GET /api/labs/results/patient/:patientId
 * Get all lab test results for a patient
 */
router.get('/results/patient/:patientId',
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    // Verify patient belongs to user
    const patientRecords = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, patientId),
        eq(patients.userId, req.user.id)
      ))
      .limit(1);

    if (patientRecords.length === 0) {
      throw new ValidationError('Patient not found or access denied');
    }

    // Get results
    const results = await db
      .select()
      .from(labTestResults)
      .where(eq(labTestResults.patientId, patientId))
      .orderBy(desc(labTestResults.date))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Get total count
    const countResult = await db
      .select({ count: labTestResults.id })
      .from(labTestResults)
      .where(eq(labTestResults.patientId, patientId));

    res.setHeader('X-Total-Count', countResult.length.toString());

    res.json({
      results,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: countResult.length
      }
    });
  })
);

/**
 * GET /api/labs/results/patient/:patientId/abnormal
 * Get abnormal lab test results for a patient
 */
router.get('/results/patient/:patientId/abnormal',
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    // Verify patient belongs to user
    const patientRecords = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, patientId),
        eq(patients.userId, req.user.id)
      ))
      .limit(1);

    if (patientRecords.length === 0) {
      throw new ValidationError('Patient not found or access denied');
    }

    // Get abnormal results
    const results = await db
      .select()
      .from(labTestResults)
      .where(and(
        eq(labTestResults.patientId, patientId),
        eq(labTestResults.isAbnormal, true)
      ))
      .orderBy(desc(labTestResults.date));

    res.json({
      results,
      total: results.length
    });
  })
);

export default router;
