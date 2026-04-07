/**
 * Insights API Routes
 * Quick insights, alerts, and notifications
 */

import express from 'express';
import { db, insights, patients } from '../../db/index.js';
import { eq, and, desc, lte } from 'drizzle-orm';
import { authenticate } from '../../middleware/auth.js';
import { validateZod, schemas } from '../../middleware/validation.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';
import { asyncHandler, NotFoundError } from '../../middleware/errorHandler.js';
import { logger } from '../../middleware/logger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/insights
 * List insights with filtering
 */
router.get('/',
  validateZod(schemas.insightsQuery),
  asyncHandler(async (req, res) => {
    const { patientId, type, severity, isRead, limit = 50, offset = 0 } = req.query;

    // Get all patients for current user
    const userPatients = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, req.user.id));

    const patientIds = userPatients.map(p => p.id);

    // Build query conditions
    const conditions = [
      eq(insights.userId, req.user.id),
      inArray(insights.patientId, patientIds)
    ];

    if (patientId) {
      conditions.push(eq(insights.patientId, patientId));
    }

    if (type) {
      conditions.push(eq(insights.type, type));
    }

    if (severity) {
      conditions.push(eq(insights.severity, severity));
    }

    if (isRead !== undefined) {
      conditions.push(eq(insights.isRead, isRead === 'true'));
    }

    // Execute query
    const insightsList = await db
      .select()
      .from(insights)
      .where(and(...conditions))
      .orderBy(desc(insights.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Get total count
    const countQuery = db
      .select({ count: insights.id })
      .from(insights)
      .where(and(...conditions));

    const countResult = await countQuery;

    res.setHeader('X-Total-Count', countResult.length.toString());

    res.json({
      insights: insightsList,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: countResult.length
      }
    });
  })
);

/**
 * GET /api/insights/:insightId
 * Get insight by ID
 */
router.get('/:insightId',
  asyncHandler(async (req, res) => {
    const { insightId } = req.params;

    const insightRecords = await db
      .select()
      .from(insights)
      .where(and(
        eq(insights.id, insightId),
        eq(insights.userId, req.user.id)
      ))
      .limit(1);

    if (insightRecords.length === 0) {
      throw new NotFoundError('Insight not found');
    }

    res.json({
      insight: insightRecords[0]
    });
  })
);

/**
 * PATCH /api/insights/:insightId/read
 * Mark insight as read
 */
router.patch('/:insightId/read',
  validateZod(schemas.markInsightRead),
  asyncHandler(async (req, res) => {
    const { insightId } = req.params;

    // Check if insight exists and belongs to user
    const existingInsights = await db
      .select()
      .from(insights)
      .where(and(
        eq(insights.id, insightId),
        eq(insights.userId, req.user.id)
      ))
      .limit(1);

    if (existingInsights.length === 0) {
      throw new NotFoundError('Insight not found');
    }

    // Mark as read
    await db
      .update(insights)
      .set({ isRead: true })
      .where(eq(insights.id, insightId));

    logger.info('Insight marked as read', {
      userId: req.user.id,
      insightId
    });

    res.json({
      message: 'Insight marked as read successfully'
    });
  })
);

/**
 * PATCH /api/insights/:insightId/dismiss
 * Dismiss insight
 */
router.patch('/:insightId/dismiss',
  validateZod(schemas.dismissInsight),
  asyncHandler(async (req, res) => {
    const { insightId } = req.params;

    // Check if insight exists and belongs to user
    const existingInsights = await db
      .select()
      .from(insights)
      .where(and(
        eq(insights.id, insightId),
        eq(insights.userId, req.user.id)
      ))
      .limit(1);

    if (existingInsights.length === 0) {
      throw new NotFoundError('Insight not found');
    }

    // Dismiss insight
    await db
      .update(insights)
      .set({ isDismissed: true })
      .where(eq(insights.id, insightId));

    logger.info('Insight dismissed', {
      userId: req.user.id,
      insightId
    });

    res.json({
      message: 'Insight dismissed successfully'
    });
  })
);

/**
 * PATCH /api/insights/mark-all-read
 * Mark all insights as read
 */
router.patch('/mark-all-read',
  asyncHandler(async (req, res) => {
    const { patientId } = req.query;

    // Build conditions
    const conditions = [eq(insights.userId, req.user.id)];

    if (patientId) {
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
        throw new NotFoundError('Patient not found');
      }

      conditions.push(eq(insights.patientId, patientId));
    }

    // Mark all as read
    await db
      .update(insights)
      .set({ isRead: true })
      .where(and(...conditions));

    logger.info('All insights marked as read', {
      userId: req.user.id,
      patientId
    });

    res.json({
      message: 'All insights marked as read successfully'
    });
  })
);

/**
 * GET /api/insights/unread-count
 * Get count of unread insights
 */
router.get('/unread-count',
  asyncHandler(async (req, res) => {
    const { patientId } = req.query;

    // Build conditions
    const conditions = [
      eq(insights.userId, req.user.id),
      eq(insights.isRead, false),
      eq(insights.isDismissed, false)
    ];

    if (patientId) {
      conditions.push(eq(insights.patientId, patientId));
    }

    // Get count
    const countResult = await db
      .select({ count: insights.id })
      .from(insights)
      .where(and(...conditions));

    res.json({
      unreadCount: countResult.length
    });
  })
);

/**
 * DELETE /api/insights/cleanup
 * Delete expired and dismissed insights
 */
router.delete('/cleanup',
  asyncHandler(async (req, res) => {
    const now = new Date();

    // Delete expired or dismissed insights
    const deletedInsights = await db
      .delete(insights)
      .where(and(
        eq(insights.userId, req.user.id),
        eq(insights.isDismissed, true)
      ))
      .returning();

    logger.info('Insights cleanup completed', {
      userId: req.user.id,
      deletedCount: deletedInsights.length
    });

    res.json({
      message: 'Insights cleanup completed',
      deletedCount: deletedInsights.length
    });
  })
);

export default router;
