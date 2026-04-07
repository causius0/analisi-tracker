/**
 * Database Schema
 * Drizzle ORM schema definitions for PostgreSQL (Single-User Version)
 */

import { pgTable, text, integer, numeric, timestamp, uuid, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Patients table (single-user: userId removed)
export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
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
  nameIdx: index('patients_name_idx').on(table.name),
}));

// Lab tests definitions
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

// Lab test results
export const labTestResults = pgTable('lab_test_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
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

// PDFs table (single-user: userId removed)
export const pdfs = pgTable('pdfs', {
  id: uuid('id').primaryKey().defaultRandom(),
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
  patientIdIdx: index('pdfs_patient_id_idx').on(table.patientId),
  uploadedAtIdx: index('pdfs_uploaded_at_idx').on(table.uploadedAt),
}));

// Insights and alerts (single-user: userId removed)
export const insights = pgTable('insights', {
  id: uuid('id').primaryKey().defaultRandom(),
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
  patientIdIdx: index('insights_patient_id_idx').on(table.patientId),
  isReadIdx: index('insights_is_read_idx').on(table.isRead),
  createdAtIdx: index('insights_created_at_idx').on(table.createdAt),
}));

// Analytics cache (single-user: userId removed)
export const analyticsCache = pgTable('analytics_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
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
  expiresAtIdx: index('analytics_cache_expires_at_idx').on(table.expiresAt),
}));

// Export jobs (single-user: userId removed)
export const exportJobs = pgTable('export_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
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
  statusIdx: index('export_jobs_status_idx').on(table.status),
  createdAtIdx: index('export_jobs_created_at_idx').on(table.createdAt),
}));
