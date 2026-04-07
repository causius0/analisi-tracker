/**
 * Export API Routes
 * Data export functionality (CSV, JSON, PDF)
 */

import express from 'express';
import { db, exportJobs, labTestResults, patients } from '../../db/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { authenticate } from '../../middleware/auth.js';
import { validateZod, schemas } from '../../middleware/validation.js';
import { exportRateLimiter } from '../../middleware/rateLimiter.js';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler.js';
import { logger } from '../../middleware/logger.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/export/request
 * Create export job
 */
router.post('/request',
  exportRateLimiter,
  validateZod(schemas.exportRequest),
  asyncHandler(async (req, res) => {
    const { type, format, filters } = req.body;

    // Create export job
    const newJobs = await db
      .insert(exportJobs)
      .values({
        id: crypto.randomUUID(),
        userId: req.user.id,
        type,
        format: format || 'standard',
        status: 'pending',
        filters: filters || {},
        createdAt: new Date()
      })
      .returning();

    logger.info('Export job created', {
      userId: req.user.id,
      jobId: newJobs[0].id,
      type
    });

    // Process export asynchronously
    processExport(newJobs[0].id).catch(error => {
      logger.error('Export processing failed', {
        jobId: newJobs[0].id,
        error: error.message
      });
    });

    res.status(201).json({
      message: 'Export job created successfully',
      job: newJobs[0]
    });
  })
);

/**
 * GET /api/export/jobs
 * List export jobs
 */
router.get('/jobs',
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0, status } = req.query;

    const conditions = [eq(exportJobs.userId, req.user.id)];

    if (status) {
      conditions.push(eq(exportJobs.status, status));
    }

    const jobs = await db
      .select()
      .from(exportJobs)
      .where(and(...conditions))
      .orderBy(desc(exportJobs.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Get total count
    const countResult = await db
      .select({ count: exportJobs.id })
      .from(exportJobs)
      .where(and(...conditions));

    res.setHeader('X-Total-Count', countResult.length.toString());

    res.json({
      jobs,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: countResult.length
      }
    });
  })
);

/**
 * GET /api/export/jobs/:jobId
 * Get export job status
 */
router.get('/jobs/:jobId',
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const jobRecords = await db
      .select()
      .from(exportJobs)
      .where(and(
        eq(exportJobs.id, jobId),
        eq(exportJobs.userId, req.user.id)
      ))
      .limit(1);

    if (jobRecords.length === 0) {
      throw new ValidationError('Export job not found');
    }

    res.json({
      job: jobRecords[0]
    });
  })
);

/**
 * GET /api/export/jobs/:jobId/download
 * Download exported file
 */
router.get('/jobs/:jobId/download',
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const jobRecords = await db
      .select()
      .from(exportJobs)
      .where(and(
        eq(exportJobs.id, jobId),
        eq(exportJobs.userId, req.user.id)
      ))
      .limit(1);

    if (jobRecords.length === 0) {
      throw new ValidationError('Export job not found');
    }

    const job = jobRecords[0];

    if (job.status !== 'completed') {
      throw new ValidationError('Export is not ready for download');
    }

    if (!job.filePath) {
      throw new ValidationError('Export file not found');
    }

    // Check if file exists
    try {
      await fs.access(job.filePath);
    } catch (error) {
      throw new ValidationError('Export file not available');
    }

    // Determine content type
    let contentType = 'application/octet-stream';
    if (job.type === 'csv') contentType = 'text/csv';
    else if (job.type === 'json') contentType = 'application/json';
    else if (job.type === 'pdf') contentType = 'application/pdf';

    // Send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(job.filePath)}"`);

    res.sendFile(job.filePath);

    logger.info('Export downloaded', {
      userId: req.user.id,
      jobId,
      filePath: job.filePath
    });
  })
);

/**
 * DELETE /api/export/jobs/:jobId
 * Delete export job and file
 */
router.delete('/jobs/:jobId',
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const jobRecords = await db
      .select()
      .from(exportJobs)
      .where(and(
        eq(exportJobs.id, jobId),
        eq(exportJobs.userId, req.user.id)
      ))
      .limit(1);

    if (jobRecords.length === 0) {
      throw new ValidationError('Export job not found');
    }

    const job = jobRecords[0];

    // Delete file if exists
    if (job.filePath) {
      try {
        await fs.unlink(job.filePath);
      } catch (error) {
        // File doesn't exist, continue
      }
    }

    // Delete job record
    await db
      .delete(exportJobs)
      .where(eq(exportJobs.id, jobId));

    logger.info('Export job deleted', {
      userId: req.user.id,
      jobId
    });

    res.json({
      message: 'Export job deleted successfully'
    });
  })
);

/**
 * Process export job asynchronously
 */
async function processExport(jobId) {
  try {
    // Update job status to processing
    await db
      .update(exportJobs)
      .set({ status: 'processing' })
      .where(eq(exportJobs.id, jobId));

    // Get job details
    const jobRecords = await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.id, jobId))
      .limit(1);

    const job = jobRecords[0];

    // Get data based on filters
    const userPatients = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, job.userId));

    const patientIds = userPatients.map(p => p.id);

    const conditions = [inArray(labTestResults.patientId, patientIds)];

    if (job.filters?.patientId) {
      conditions.push(eq(labTestResults.patientId, job.filters.patientId));
    }

    if (job.filters?.labTestDefinitionId) {
      conditions.push(eq(labTestResults.labTestDefinitionId, job.filters.labTestDefinitionId));
    }

    if (job.filters?.startDate) {
      conditions.push(gte(labTestResults.date, new Date(job.filters.startDate)));
    }

    if (job.filters?.endDate) {
      conditions.push(lte(labTestResults.date, new Date(job.filters.endDate)));
    }

    if (job.filters?.includeAbnormalOnly) {
      conditions.push(eq(labTestResults.isAbnormal, true));
    }

    const results = await db
      .select()
      .from(labTestResults)
      .where(and(...conditions))
      .orderBy(desc(labTestResults.date))
      .limit(10000); // Max 10,000 records

    // Generate export file
    const exportDir = path.join(process.cwd(), 'exports');
    await fs.mkdir(exportDir, { recursive: true });

    const fileName = `export_${jobId}_${Date.now()}.${job.type}`;
    const filePath = path.join(exportDir, fileName);

    if (job.type === 'csv') {
      await generateCSV(results, filePath);
    } else if (job.type === 'json') {
      await generateJSON(results, filePath);
    } else if (job.type === 'pdf') {
      await generatePDF(results, filePath);
    }

    // Get file stats
    const fileStats = await fs.stat(filePath);

    // Update job as completed
    await db
      .update(exportJobs)
      .set({
        status: 'completed',
        filePath,
        fileSize: fileStats.size,
        recordCount: results.length,
        completedAt: new Date()
      })
      .where(eq(exportJobs.id, jobId));

    logger.info('Export job completed', {
      jobId,
      recordCount: results.length,
      fileSize: fileStats.size
    });

  } catch (error) {
    // Update job as failed
    await db
      .update(exportJobs)
      .set({
        status: 'failed',
        error: error.message
      })
      .where(eq(exportJobs.id, jobId));

    logger.error('Export job failed', {
      jobId,
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Generate CSV export
 */
async function generateCSV(results, filePath) {
  const csvHeaders = ['ID', 'Patient ID', 'Lab Test Definition ID', 'Value', 'Unit', 'Date', 'Is Abnormal', 'Notes'];
  const csvRows = results.map(r => [
    r.id,
    r.patientId,
    r.labTestDefinitionId,
    r.value,
    r.unit,
    r.date.toISOString(),
    r.isAbnormal,
    r.notes || ''
  ]);

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  await fs.writeFile(filePath, csvContent, 'utf-8');
}

/**
 * Generate JSON export
 */
async function generateJSON(results, filePath) {
  const jsonContent = JSON.stringify(results, null, 2);
  await fs.writeFile(filePath, jsonContent, 'utf-8');
}

/**
 * Generate PDF export
 */
async function generatePDF(results, filePath) {
  // For PDF generation, you would typically use a library like jsPDF or PDFKit
  // For now, we'll create a simple text-based PDF
  const pdfContent = results.map(r =>
    `Date: ${r.date}\nValue: ${r.value} ${r.unit}\nAbnormal: ${r.isAbnormal}\nNotes: ${r.notes || 'N/A'}\n\n`
  ).join('---\n\n');

  await fs.writeFile(filePath, pdfContent, 'utf-8');
}

export default router;
