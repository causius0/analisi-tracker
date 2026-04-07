/**
 * Patients API Routes
 * Multi-patient management
 */

import express from 'express';
import { db, patients } from '../../db/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authenticate } from '../../middleware/auth.js';
import { validateZod, schemas } from '../../middleware/validation.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';
import { asyncHandler, NotFoundError, ValidationError } from '../../middleware/errorHandler.js';
import { logger } from '../../middleware/logger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/patients
 * List all patients for current user
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0, search } = req.query;

    let query = db
      .select()
      .from(patients)
      .where(eq(patients.userId, req.user.id))
      .orderBy(desc(patients.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Add search filter if provided
    if (search) {
      query = query.where(and(
        eq(patients.userId, req.user.id),
        sql`${patients.name} ILIKE ${`%${search}%`}`
      ));
    }

    const patientList = await query;

    // Get total count
    const countResult = await db
      .select({ count: patients.id })
      .from(patients)
      .where(eq(patients.userId, req.user.id));

    res.setHeader('X-Total-Count', countResult.length.toString());

    res.json({
      patients: patientList,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: countResult.length
      }
    });
  })
);

/**
 * GET /api/patients/:patientId
 * Get patient by ID
 */
router.get('/:patientId',
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

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

    res.json({
      patient: patientRecords[0]
    });
  })
);

/**
 * POST /api/patients
 * Create new patient
 */
router.post('/',
  validateZod(schemas.createPatient),
  asyncHandler(async (req, res) => {
    const {
      name,
      dateOfBirth,
      sex,
      bloodType,
      allergies,
      medications,
      conditions,
      isPrimary
    } = req.body;

    // If this is marked as primary, unmark other primary patients
    if (isPrimary) {
      await db
        .update(patients)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(and(
          eq(patients.userId, req.user.id),
          eq(patients.isPrimary, true)
        ));
    }

    // Create patient
    const newPatients = await db
      .insert(patients)
      .values({
        id: crypto.randomUUID(),
        userId: req.user.id,
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        sex,
        bloodType,
        allergies: allergies || [],
        medications: medications || [],
        conditions: conditions || [],
        isPrimary: isPrimary || false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    logger.info('Patient created', { userId: req.user.id, patientId: newPatients[0].id });

    res.status(201).json({
      message: 'Patient created successfully',
      patient: newPatients[0]
    });
  })
);

/**
 * PATCH /api/patients/:patientId
 * Update patient
 */
router.patch('/:patientId',
  validateZod(schemas.updatePatient),
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const {
      name,
      dateOfBirth,
      sex,
      bloodType,
      allergies,
      medications,
      conditions,
      isPrimary
    } = req.body;

    // Check if patient exists and belongs to user
    const existingPatients = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, patientId),
        eq(patients.userId, req.user.id)
      ))
      .limit(1);

    if (existingPatients.length === 0) {
      throw new NotFoundError('Patient not found');
    }

    // If this is marked as primary, unmark other primary patients
    if (isPrimary && !existingPatients[0].isPrimary) {
      await db
        .update(patients)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(and(
          eq(patients.userId, req.user.id),
          eq(patients.isPrimary, true)
        ));
    }

    // Build update object
    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
    if (sex !== undefined) updateData.sex = sex;
    if (bloodType !== undefined) updateData.bloodType = bloodType;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (medications !== undefined) updateData.medications = medications;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;

    const updatedPatients = await db
      .update(patients)
      .set(updateData)
      .where(and(
        eq(patients.id, patientId),
        eq(patients.userId, req.user.id)
      ))
      .returning();

    logger.info('Patient updated', { userId: req.user.id, patientId });

    res.json({
      message: 'Patient updated successfully',
      patient: updatedPatients[0]
    });
  })
);

/**
 * DELETE /api/patients/:patientId
 * Delete patient
 */
router.delete('/:patientId',
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    // Check if patient exists and belongs to user
    const existingPatients = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, patientId),
        eq(patients.userId, req.user.id)
      ))
      .limit(1);

    if (existingPatients.length === 0) {
      throw new NotFoundError('Patient not found');
    }

    // Delete patient
    await db
      .delete(patients)
      .where(and(
        eq(patients.id, patientId),
        eq(patients.userId, req.user.id)
      ));

    logger.info('Patient deleted', { userId: req.user.id, patientId });

    res.json({
      message: 'Patient deleted successfully'
    });
  })
);

/**
 * GET /api/patients/primary
 * Get primary patient
 */
router.get('/primary',
  asyncHandler(async (req, res) => {
    const primaryPatients = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.userId, req.user.id),
        eq(patients.isPrimary, true)
      ))
      .limit(1);

    if (primaryPatients.length === 0) {
      // If no primary patient, return the first patient
      const allPatients = await db
        .select()
        .from(patients)
        .where(eq(patients.userId, req.user.id))
        .orderBy(patients.createdAt)
        .limit(1);

      if (allPatients.length === 0) {
        throw new NotFoundError('No patients found');
      }

      return res.json({
        patient: allPatients[0]
      });
    }

    res.json({
      patient: primaryPatients[0]
    });
  })
);

/**
 * PATCH /api/patients/:patientId/set-primary
 * Set patient as primary
 */
router.patch('/:patientId/set-primary',
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    // Check if patient exists and belongs to user
    const existingPatients = await db
      .select()
      .from(patients)
      .where(and(
        eq(patients.id, patientId),
        eq(patients.userId, req.user.id)
      ))
      .limit(1);

    if (existingPatients.length === 0) {
      throw new NotFoundError('Patient not found');
    }

    // Unmark all other primary patients
    await db
      .update(patients)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(eq(patients.userId, req.user.id));

    // Mark this patient as primary
    await db
      .update(patients)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(eq(patients.id, patientId));

    logger.info('Primary patient set', { userId: req.user.id, patientId });

    res.json({
      message: 'Patient set as primary successfully'
    });
  })
);

export default router;
