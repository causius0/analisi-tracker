# File-by-File Modification Guide

This document provides detailed, copy-paste-ready modifications for each file that needs to be updated when simplifying analisi-tracker to single-user mode.

---

## Table of Contents

1. [Database Schema](#1-database-schema-serversdbschemajs)
2. [API Routes](#2-api-routes)
3. [Server Entry Point](#3-server-entry-point-serverindexjs)
4. [Middleware](#4-middleware)
5. [Client Components](#5-client-components)
6. [Cache Manager](#6-cache-manager-servercachecache-managerjs)

---

## 1. Database Schema (`/server/db/schema.js`)

### Current File (Keep These Tables)
```javascript
// KEEP these tables (no changes needed):
// - labTestDefinitions
// - insights (but remove userId - see below)
// - analyticsCache (but remove userId - see below)
// - exportJobs (but remove userId - see below)
```

### Modified Schema
```javascript
/**
 * Database Schema - Single User Edition
 * Drizzle ORM schema definitions for PostgreSQL
 *
 * Multi-user tables removed: users, userPreferences, refreshTokens, auditLog
 * Foreign key userId removed from: patients, pdfs, insights, analyticsCache, exportJobs
 */

import { pgTable, text, integer, numeric, timestamp, uuid, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// REMOVED TABLES (do not include these):
// - users
// - userPreferences
// - refreshTokens
// - auditLog
// ============================================================================

// Patients table (SINGLE PATIENT - no userId)
export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  // REMOVED: userId - single user application
  name: text('name').notNull(),
  dateOfBirth: timestamp('date_of_birth'),
  sex: text('sex'), // 'male', 'female', 'other'
  bloodType: text('blood_type'),
  allergies: jsonb('allergies').default([]), // Array of allergy objects
  medications: jsonb('medications').default([]), // Array of medication objects
  conditions: jsonb('conditions').default([]), // Array of medical conditions
  isPrimary: boolean('is_primary').notNull().default(false), // Mark primary patient
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // REMOVED: userIdIdx
  nameIdx: index('patients_name_idx').on(table.name),
}));

// Lab tests definitions (UNCHANGED)
export const labTestDefinitions = pgTable('lab_test_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  category: text('category').notNull(), // 'kidney', 'liver', 'metabolic', etc.
  unit: text('unit').notNull(),
  referenceMin: numeric('reference_min'), // Lower bound of normal range
  referenceMax: numeric('reference_max'), // Upper bound of normal range
  description: text('description'),
  clinicalInfo: text('clinical_info'), // Clinical interpretation info
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  nameIdx: index('lab_test_definitions_name_idx').on(table.name),
  categoryIdx: index('lab_test_definitions_category_idx').on(table.category),
}));

// Lab test results (SINGLE USER - patientId optional or hardcoded)
export const labTestResults = pgTable('lab_test_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }),
  labTestDefinitionId: uuid('lab_test_definition_id').notNull().references(() => labTestDefinitions.id),
  value: numeric('value').notNull(),
  unit: text('unit').notNull(),
  date: timestamp('date').notNull(),
  isAbnormal: boolean('is_abnormal').notNull().default(false),
  notes: text('notes'),
  source: text('source').notNull().default('manual'), // 'manual', 'pdf', 'import'
  sourceId: text('source_id'), // ID of PDF or import batch
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  patientIdIdx: index('lab_test_results_patient_id_idx').on(table.patientId),
  labTestDefinitionIdIdx: index('lab_test_results_lab_test_definition_id_idx').on(table.labTestDefinitionId),
  dateIdx: index('lab_test_results_date_idx').on(table.date),
  patientDateIdx: index('lab_test_results_patient_date_idx').on(table.patientId, table.date),
}));

// PDFs table (SINGLE USER - userId removed)
export const pdfs = pgTable('pdfs', {
  id: uuid('id').primaryKey().defaultRandom(),
  // REMOVED: userId - single user owns all PDFs
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'set null' }),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  mimeType: text('mime_type').notNull().default('application/pdf'),
  storagePath: text('storage_path').notNull(), // Path to stored file
  pageCount: integer('page_count'),
  isProcessed: boolean('is_processed').notNull().default(false),
  processingStatus: text('processing_status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  extractedData: jsonb('extracted_data'), // Structured data extracted from PDF
  processingError: text('processing_error'),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // REMOVED: userIdIdx
  patientIdIdx: index('pdfs_patient_id_idx').on(table.patientId),
  uploadedAtIdx: index('pdfs_uploaded_at_idx').on(table.uploadedAt),
}));

// Insights and alerts (SINGLE USER - userId removed)
export const insights = pgTable('insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  // REMOVED: userId
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'trend', 'anomaly', 'correlation', 'prediction', 'alert'
  severity: text('severity').notNull(), // 'info', 'warning', 'critical'
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data'), // Additional structured data
  isRead: boolean('is_read').notNull().default(false),
  isDismissed: boolean('is_dismissed').notNull().default(false),
  validUntil: timestamp('valid_until'), // Insight validity period
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // REMOVED: userIdIdx
  patientIdIdx: index('insights_patient_id_idx').on(table.patientId),
  isReadIdx: index('insights_is_read_idx').on(table.isRead),
  createdAtIdx: index('insights_created_at_idx').on(table.createdAt),
}));

// Analytics cache (SINGLE USER - userId removed)
export const analyticsCache = pgTable('analytics_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  // REMOVED: userId
  cacheKey: text('cache_key').notNull().unique(),
  cacheType: text('cache_type').notNull(), // 'trends', 'correlations', 'predictions', etc.
  patientId: uuid('patient_id').references(() => patients.id),
  data: jsonb('data').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  accessedAt: timestamp('accessed_at'), // Last access time
  accessCount: integer('access_count').notNull().default(0),
}, (table) => ({
  cacheKeyIdx: index('analytics_cache_cache_key_idx').on(table.cacheKey),
  // REMOVED: userIdIdx
  expiresAtIdx: index('analytics_cache_expires_at_idx').on(table.expiresAt),
}));

// Export jobs (SINGLE USER - userId removed)
export const exportJobs = pgTable('export_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  // REMOVED: userId
  type: text('type').notNull(), // 'csv', 'json', 'pdf'
  format: text('format').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  filters: jsonb('filters'), // Export filters applied
  filePath: text('file_path'), // Path to exported file
  fileSize: integer('file_size'), // in bytes
  recordCount: integer('record_count'), // Number of records exported
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  // REMOVED: userIdIdx
  statusIdx: index('export_jobs_status_idx').on(table.status),
  createdAtIdx: index('export_jobs_created_at_idx').on(table.createdAt),
}));
```

---

## 2. API Routes

### 2.1 `/server/api/routes/labs.js`

**Remove authentication middleware and simplify patient filtering:**

```javascript
/**
 * Lab Data API Routes - Single User Edition
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, labTestResults, labTestDefinitions, patients } from '../../db/index.js';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';
import { validateZod, schemas } from '../../middleware/validation.js';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler.js';
import { logger } from '../../middleware/logger.js';

const router = express.Router();

// HARDCODED single patient ID (or remove patient filtering entirely)
const SINGLE_PATIENT_ID = process.env.SINGLE_PATIENT_ID || null;

/**
 * GET /api/labs
 * Get all lab tests (optionally filtered by single patient)
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const { limit = 100, offset = 0, patientId } = req.query;

    // Build query - remove userId filtering
    let query = db
      .select({
        id: labTestResults.id,
        patientId: labTestResults.patientId,
        labTestDefinitionId: labTestResults.labTestDefinitionId,
        value: labTestResults.value,
        unit: labTestResults.unit,
        date: labTestResults.date,
        isAbnormal: labTestResults.isAbnormal,
        notes: labTestResults.notes,
        source: labTestResults.source,
        sourceId: labTestResults.sourceId,
        createdAt: labTestResults.createdAt
      })
      .from(labTestResults);

    // Apply single patient filter if configured
    const effectivePatientId = patientId || SINGLE_PATIENT_ID;
    if (effectivePatientId) {
      query = query.where(eq(labTestResults.patientId, effectivePatientId));
    }

    query = query
      .orderBy(desc(labTestResults.date))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const results = await query;

    res.json({
      labResults: results,
      count: results.length
    });
  })
);

/**
 * GET /api/labs/:id
 * Get single lab test result
 */
router.get('/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const results = await db
      .select()
      .from(labTestResults)
      .where(eq(labTestResults.id, id))
      .limit(1);

    if (results.length === 0) {
      throw new ValidationError('Lab result not found');
    }

    res.json({ labResult: results[0] });
  })
);

/**
 * POST /api/labs
 * Add new lab test result
 */
router.post('/',
  validateZod(schemas.labResult),
  asyncHandler(async (req, res) => {
    const {
      patientId,
      labTestDefinitionId,
      value,
      unit,
      date,
      notes,
      source,
      sourceId
    } = req.body;

    // Use single patient ID if not provided
    const effectivePatientId = patientId || SINGLE_PATIENT_ID;

    const newResult = await db
      .insert(labTestResults)
      .values({
        id: uuidv4(),
        patientId: effectivePatientId,
        labTestDefinitionId,
        value,
        unit,
        date: new Date(date),
        notes,
        source: source || 'manual',
        sourceId,
        isAbnormal: false, // Will be calculated based on reference ranges
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    logger.info('Lab result created', { labResultId: newResult[0].id });

    res.status(201).json({
      message: 'Lab result created successfully',
      labResult: newResult[0]
    });
  })
);

/**
 * PUT /api/labs/:id
 * Update lab test result
 */
router.put('/:id',
  validateZod(schemas.labResultUpdate),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const results = await db
      .update(labTestResults)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(labTestResults.id, id))
      .returning();

    if (results.length === 0) {
      throw new ValidationError('Lab result not found');
    }

    logger.info('Lab result updated', { labResultId: id });

    res.json({
      message: 'Lab result updated successfully',
      labResult: results[0]
    });
  })
);

/**
 * DELETE /api/labs/:id
 * Delete lab test result
 */
router.delete('/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const results = await db
      .delete(labTestResults)
      .where(eq(labTestResults.id, id))
      .returning();

    if (results.length === 0) {
      throw new ValidationError('Lab result not found');
    }

    logger.info('Lab result deleted', { labResultId: id });

    res.json({
      message: 'Lab result deleted successfully'
    });
  })
);

export default router;
```

### 2.2 `/server/api/routes/patients.js`

**Simplify to single patient or remove entirely:**

```javascript
/**
 * Patients API Routes - Single User Edition
 * Simplified for single-patient use case
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, patients } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { validateZod, schemas } from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { logger } from '../../middleware/logger.js';

const router = express.Router();

/**
 * GET /api/patients
 * Get all patients (should be 1 or very few in single-user mode)
 */
router.get('/',
  asyncHandler(async (req, res) => {
    // REMOVED: userId filtering
    const allPatients = await db
      .select()
      .from(patients)
      .orderBy(patients.createdAt);

    res.json({ patients: allPatients });
  })
);

/**
 * GET /api/patients/:id
 * Get single patient
 */
router.get('/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const results = await db
      .select()
      .from(patients)
      .where(eq(patients.id, id))
      .limit(1);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ patient: results[0] });
  })
);

/**
 * POST /api/patients
 * Create new patient (use sparingly in single-user mode)
 */
router.post('/',
  validateZod(schemas.patient),
  asyncHandler(async (req, res) => {
    const { name, dateOfBirth, sex, bloodType, allergies, medications, conditions } = req.body;

    const newPatient = await db
      .insert(patients)
      .values({
        id: uuidv4(),
        // REMOVED: userId
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        sex,
        bloodType,
        allergies: allergies || [],
        medications: medications || [],
        conditions: conditions || [],
        isPrimary: false, // First patient is set to primary manually
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    logger.info('Patient created', { patientId: newPatient[0].id });

    res.status(201).json({
      message: 'Patient created successfully',
      patient: newPatient[0]
    });
  })
);

export default router;
```

### 2.3 `/server/api/routes/analytics.js`

**Remove authentication and simplify patient filtering:**

```javascript
/**
 * Analytics API Routes - Single User Edition
 */

import express from 'express';
import { db, labTestResults, insights, patients } from '../../db/index.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler.js';
import { logger } from '../../middleware/logger.js';
import analyticsEngine from '../analytics/engine.js';

const router = express.Router();

// HARDCODED single patient ID
const SINGLE_PATIENT_ID = process.env.SINGLE_PATIENT_ID || null;

/**
 * GET /api/analytics/trends/:labTestDefinitionId
 * Get trend analysis for a specific lab test
 */
router.get('/trends/:labTestDefinitionId',
  asyncHandler(async (req, res) => {
    const { labTestDefinitionId } = req.params;
    const { patientId, startDate, endDate } = req.query;

    const effectivePatientId = patientId || SINGLE_PATIENT_ID;

    // Fetch lab results
    let whereConditions = [eq(labTestResults.labTestDefinitionId, labTestDefinitionId)];

    if (effectivePatientId) {
      whereConditions.push(eq(labTestResults.patientId, effectivePatientId));
    }

    if (startDate) {
      whereConditions.push(gte(labTestResults.date, new Date(startDate)));
    }

    if (endDate) {
      whereConditions.push(lte(labTestResults.date, new Date(endDate)));
    }

    const results = await db
      .select()
      .from(labTestResults)
      .where(and(...whereConditions))
      .orderBy(desc(labTestResults.date));

    if (results.length < 5) {
      throw new ValidationError('Insufficient data points for trend analysis (minimum 5 required)');
    }

    // Calculate trends
    const trends = analyticsEngine.calculateTrends(results);

    res.json({
      labTestDefinitionId,
      patientId: effectivePatientId,
      dataPoints: results.length,
      trends
    });
  })
);

/**
 * GET /api/analytics/insights
 * Get all insights for patient
 */
router.get('/insights',
  asyncHandler(async (req, res) => {
    const { patientId } = req.query;
    const effectivePatientId = patientId || SINGLE_PATIENT_ID;

    const allInsights = await db
      .select()
      .from(insights)
      .where(eq(insights.patientId, effectivePatientId))
      .orderBy(desc(insights.createdAt))
      .limit(50);

    res.json({ insights: allInsights });
  })
);

export default router;
```

---

## 3. Server Entry Point (`/server/index.js` or `/server/index-new.js`)

**Remove authentication routes and middleware:**

```javascript
/**
 * Analisi Tracker Server - Single User Edition
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import pino from 'pino';
import expressPinoLogger from 'express-pino-logger';
import dotenv from 'dotenv';

// Import routes
import analyticsRoutes from './api/analytics.js';
import labRoutes from './api/routes/labs.js';
import patientRoutes from './api/routes/patients.js';
import insightRoutes from './api/routes/insights.js';
import exportRoutes from './api/routes/export.js';
import aiFeatureRoutes from './api/ai-features.js';
import aiChatRoutes from './api/ai-chat.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';

// REMOVED: import authRoutes from './api/routes/auth.js';
// REMOVED: import userRoutes from './api/routes/users.js';
// REMOVED: import { authenticate, authorize } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : '*',
  credentials: false // REMOVED: credentials (no cookies/tokens needed)
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(expressPinoLogger({ logger }));
}

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: 'single-user',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/ai/features', aiFeatureRoutes);
app.use('/api/ai/chat', aiChatRoutes);

// REMOVED: Authentication routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Analisi Tracker (Single-User Edition) running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Mode: single-user (no authentication)`);
  });
}

export default app;
```

---

## 4. Middleware

### 4.1 `/server/middleware/index.js`

**Remove authentication middleware exports:**

```javascript
/**
 * Middleware Index - Single User Edition
 */

// Error handling
export { errorHandler, asyncHandler, ValidationError, ConflictError, AuthenticationError } from './errorHandler.js';

// Logging
export { logger } from './logger.js';

// Validation (optional - keep if using)
export { validateZod, schemas } from './validation.js';

// REMOVED: Authentication and authorization
// export { authenticate, authorize, optionalAuth, generateAccessToken, generateRefreshToken } from './auth.js';

// REMOVED: Rate limiting
// export { authRateLimiter, apiRateLimiter } from './rateLimiter.js';

// Security (keep basic security, remove auth-related)
export { cspMiddleware } from './security.js';
```

---

## 5. Client Components

### 5.1 Remove Auth Context (if exists)

**File: `/client/src/contexts/AuthContext.jsx`** - DELETE THIS FILE

```bash
DELETE: /client/src/contexts/AuthContext.jsx
DELETE: /client/src/hooks/useAuth.js
DELETE: /client/src/services/auth.js
```

### 5.2 Update API Calls

**File: `/client/src/services/api.js`** (or similar)

Remove Authorization headers:

```javascript
/**
 * API Service - Single User Edition
 * No authentication required
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Make API request without authentication
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // REMOVED: 'Authorization': `Bearer ${token}`
      ...options.headers
    }
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

/**
 * Lab results API
 */
export const labsApi = {
  getAll: (params) => apiRequest('/api/labs', { method: 'GET', params }),
  getById: (id) => apiRequest(`/api/labs/${id}`),
  create: (data) => apiRequest('/api/labs', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/api/labs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/api/labs/${id}`, { method: 'DELETE' })
};

/**
 * Analytics API
 */
export const analyticsApi = {
  getTrends: (labTestId, params) =>
    apiRequest(`/api/analytics/trends/${labTestId}`, { params }),
  getInsights: (params) =>
    apiRequest('/api/analytics/insights', { params })
};

// REMOVED: authApi - no authentication endpoints

export default apiRequest;
```

### 5.3 Remove Login Page (if exists)

```bash
DELETE: /client/src/pages/Login.jsx
DELETE: /client/src/pages/Register.jsx
DELETE: /client/src/components/LoginForm.jsx
```

---

## 6. Cache Manager (`/server/cache/cache-manager.js`)

**Replace Redis with in-memory cache:**

```javascript
/**
 * Cache Manager - Single User Edition
 * Using in-memory NodeCache instead of Redis
 */

import NodeCache from 'node-cache';
import { logger } from '../middleware/logger.js';

// Create in-memory cache
const cache = new NodeCache({
  stdTTL: 3600, // Default TTL: 1 hour
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Performance optimization
});

/**
 * Get cached value
 */
export async function get(key) {
  try {
    const value = cache.get(key);
    if (value) {
      logger.debug('Cache hit', { key });
      return value;
    }
    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    logger.error('Cache get error', { key, error: error.message });
    return null;
  }
}

/**
 * Set cached value with TTL
 */
export async function set(key, value, ttl = 3600) {
  try {
    cache.set(key, value, ttl);
    logger.debug('Cache set', { key, ttl });
    return true;
  } catch (error) {
    logger.error('Cache set error', { key, error: error.message });
    return false;
  }
}

/**
 * Delete cached value
 */
export async function del(key) {
  try {
    cache.del(key);
    logger.debug('Cache deleted', { key });
    return true;
  } catch (error) {
    logger.error('Cache delete error', { key, error: error.message });
    return false;
  }
}

/**
 * Clear all cache
 */
export async function flush() {
  try {
    cache.flushAll();
    logger.info('Cache flushed');
    return true;
  } catch (error) {
    logger.error('Cache flush error', { error: error.message });
    return false;
  }
}

/**
 * Get cache statistics
 */
export function getStats() {
  const stats = cache.getStats();
  return {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    ksize: stats.ksize,
    vsize: stats.vsize
  };
}

export default {
  get,
  set,
  del,
  flush,
  getStats
};
```

---

## 7. Environment Configuration

### `.env.single-user`

Create simplified environment file:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database (Optional - remove if using JSON storage)
DATABASE_URL=postgresql://postgres:password@localhost:5432/analisi

# Single Patient Configuration
# Leave empty to use first patient, or set specific patient ID
SINGLE_PATIENT_ID=

# AI/LLM Configuration
GEMINI_API_KEY=
OPENAI_API_KEY=

# Analytics Configuration
MIN_DATA_POINTS=5
ANOMALY_Z_SCORE_THRESHOLD=3

# Export Configuration
EXPORT_MAX_ROWS=10000

# Logging
LOG_LEVEL=info

# Feature Flags
ENABLE_AI_CHAT=true
ENABLE_AI_PDF_EXTRACTION=true
```

---

## 8. Quick Reference: Changes Summary

### Files to DELETE
```
/server/middleware/auth.js
/server/middleware/rateLimiter.js
/server/api/routes/auth.js
/server/api/routes/users.js
/client/src/contexts/AuthContext.jsx (if exists)
/client/src/hooks/useAuth.js (if exists)
/client/src/services/auth.js (if exists)
```

### Files to MODIFY
```
/server/db/schema.js - Remove user tables and userId foreign keys
/server/index.js - Remove auth routes and middleware
/server/api/routes/labs.js - Remove authenticate(), userId filtering
/server/api/routes/patients.js - Remove userId filtering
/server/api/routes/analytics.js - Remove authenticate(), userId filtering
/server/middleware/index.js - Remove auth exports
/server/cache/cache-manager.js - Replace Redis with NodeCache
/client/src/services/api.js - Remove Authorization headers
```

### Database Tables to DROP
```sql
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

### Database Columns to Remove
```sql
ALTER TABLE patients DROP COLUMN user_id;
ALTER TABLE pdfs DROP COLUMN user_id;
ALTER TABLE insights DROP COLUMN user_id;
ALTER TABLE analytics_cache DROP COLUMN user_id;
ALTER TABLE export_jobs DROP COLUMN user_id;
```

### NPM Packages to Remove
```bash
npm uninstall jsonwebtoken bcryptjs ioredis bull express-rate-limit express-slow-down
```

---

## 9. Testing Your Changes

After making these changes, test:

```bash
# 1. Start server
npm run dev

# 2. Test API endpoints (no auth required)
curl http://localhost:3000/api/labs
curl http://localhost:3000/api/patients
curl http://localhost:3000/health

# 3. Check for errors in logs
tail -f logs/combined.log

# 4. Run tests
npm test

# 5. Test client (remove login redirects)
npm run client:dev
```

---

## 10. Common Issues and Fixes

### Issue: "userId does not exist" error
**Fix**: Search for all references to `userId` in your codebase and remove them

### Issue: "authenticate is not defined" error
**Fix**: Remove `authenticate` from all route handlers

### Issue: "Relation 'users' does not exist" error
**Fix**: Run the database migration script to drop user tables

### Issue: Redis connection error
**Fix**: Updated cache-manager.js to use NodeCache (in-memory)

---

This guide provides copy-paste-ready code for all necessary modifications. Follow each section carefully and test after each major change.
