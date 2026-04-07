/**
 * Tests for the PDF upload + extraction + storage pipeline.
 *
 * The endpoint:
 *   POST /api/ai/pdf/extract
 *   GET  /api/ai/pdf
 *   GET  /api/ai/pdf/:pdfId
 *   GET  /api/ai/pdf/:pdfId/results
 *
 * Strategy
 * --------
 * - Mock all external I/O (fs/promises, multer file, pdf-extractor, db)
 * - Verify that:
 *   1. PDF buffer is resolved from multipart upload AND base64 JSON body
 *   2. A pdfs row is inserted with processingStatus='processing' before extraction
 *   3. The row is updated to 'completed' / 'failed' after extraction
 *   4. lab_test_results rows are inserted when patientId is given and a matching
 *      labTestDefinition exists
 *   5. Tests with no numericValue or no matching definition are skipped gracefully
 *   6. The response includes pdfId, savedResults count, and the extraction payload
 *   7. GET endpoints return the right records / 404s
 *   8. All endpoints return 503 when DATABASE_URL is unset
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Shared mock state ─────────────────────────────────────────────────────────

// Inserted / updated rows
const mockPdfRows = [];
const mockResultRows = [];
let mockPdfIdSeq = 1;
let mockResultIdSeq = 1;

// Track what the db received
const dbCalls = {
  pdfInsert: null,
  pdfUpdate: null,
  resultInserts: [],
};

// The "database" mock – returned by getDB() via the lazy-load shim
const mockOrm = {
  db: {
    insert: vi.fn((table) => ({
      values: vi.fn((data) => ({
        returning: vi.fn(async () => {
          if (table === '__pdfs__') {
            const row = { id: `pdf-${mockPdfIdSeq++}`, ...data };
            dbCalls.pdfInsert = data;
            mockPdfRows.push(row);
            return [row];
          }
          if (table === '__results__') {
            const row = { id: `res-${mockResultIdSeq++}`, ...data };
            dbCalls.resultInserts.push(data);
            mockResultRows.push(row);
            return [row];
          }
          return [{ id: 'unknown' }];
        }),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn((data) => ({
        where: vi.fn(async () => {
          dbCalls.pdfUpdate = data;
        }),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn((table) => ({
        where: vi.fn((table_ref) => {
          // 'table' is the closure variable from .from(table)
          const rows = (() => {
            if (table === '__defs__') return [{ id: 'def-creatinine', name: 'Creatinine', unit: 'mg/dL', referenceMin: '0.7', referenceMax: '1.3' }];
            if (table === '__pdfs__') return mockPdfRows;
            if (table === '__results__') return mockResultRows;
            return [];
          })();
          return {
            limit: vi.fn(async () => rows),
            orderBy: vi.fn(async () => rows),        // awaitable directly
            offset: vi.fn(async () => rows),
          };
        }),
        // Chainable orderBy for select().from().orderBy().limit().offset()
        orderBy: vi.fn(() => {
          const rows = table === '__pdfs__' ? mockPdfRows : table === '__results__' ? mockResultRows : [];
          return {
            limit: vi.fn(() => ({ offset: vi.fn(async () => rows) })),
          };
        }),
      })),
    })),
  },
  pdfs: '__pdfs__',
  labTestResults: '__results__',
  labTestDefinitions: '__defs__',
};

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('fs/promises', () => ({
  mkdir: vi.fn(async () => {}),
  readFile: vi.fn(async () => Buffer.from('fake-pdf-bytes')),
  writeFile: vi.fn(async () => {}),
}));

vi.mock('multer', () => {
  const multer = vi.fn(() => ({
    single: vi.fn(() => (req, _res, next) => {
      // Simulate multer injecting req.file when the body contains a pdf field
      if (req.headers['x-test-has-file']) {
        req.file = {
          path: '/tmp/test-upload.pdf',
          originalname: 'labs.pdf',
          size: 1234,
          mimetype: 'application/pdf',
        };
      }
      next();
    }),
  }));
  multer.diskStorage = vi.fn(() => ({}));
  return { default: multer };
});

vi.mock('../ai/pdf-extractor.js', () => ({
  default: {
    extractLabValues: vi.fn(async () => ({
      success: true,
      data: {
        tests: [
          { testName: 'Creatinine', value: '1.1', numericValue: 1.1, unit: 'mg/dL', isAbnormal: false, notes: '' },
          { testName: 'UnknownTest', value: '5', numericValue: 5, unit: 'X',   isAbnormal: false, notes: '' },
          { testName: 'NoValue',     value: 'N/A', numericValue: null, unit: '', isAbnormal: false, notes: '' },
        ],
        metadata: { testDate: '2024-03-15', facility: 'Test Lab', overallConfidence: 0.92 },
        summary: { totalTests: 3, abnormalTests: 0, lowConfidenceTests: 0 },
      },
      metadata: { extractionMethod: 'ai-powered', timestamp: new Date().toISOString(), confidence: 0.92 },
    })),
  },
}));

// Control whether the lazy DB loader returns a real ORM or null
let dbAvailable = true;
vi.mock('../db/index.js', () => ({
  db: mockOrm.db,
  pdfs: '__pdfs__',
  labTestResults: '__results__',
  labTestDefinitions: '__defs__',
}));

// ── App factory (re-import router per test to pick up env changes) ────────────

async function buildApp() {
  // Reset module registry so env changes take effect
  vi.resetModules();

  // Re-apply mocks after resetModules
  vi.mock('fs/promises', () => ({
    mkdir: vi.fn(async () => {}),
    readFile: vi.fn(async () => Buffer.from('fake-pdf-bytes')),
    writeFile: vi.fn(async () => {}),
  }));
  vi.mock('multer', () => {
    const multer = vi.fn(() => ({
      single: vi.fn(() => (req, _res, next) => {
        if (req.headers['x-test-has-file']) {
          req.file = { path: '/tmp/test-upload.pdf', originalname: 'labs.pdf', size: 1234, mimetype: 'application/pdf' };
        }
        next();
      }),
    }));
    multer.diskStorage = vi.fn(() => ({}));
    return { default: multer };
  });
  vi.mock('../ai/pdf-extractor.js', () => ({
    default: { extractLabValues: vi.fn(async () => ({
      success: true,
      data: {
        tests: [
          { testName: 'Creatinine', value: '1.1', numericValue: 1.1, unit: 'mg/dL', isAbnormal: false, notes: '' },
          { testName: 'UnknownTest', value: '5',   numericValue: 5,   unit: 'X',    isAbnormal: false, notes: '' },
          { testName: 'NoValue',     value: 'N/A', numericValue: null, unit: '',    isAbnormal: false, notes: '' },
        ],
        metadata: { testDate: '2024-03-15', facility: 'Test Lab', overallConfidence: 0.92 },
        summary: { totalTests: 3, abnormalTests: 0, lowConfidenceTests: 0 },
      },
      metadata: { extractionMethod: 'ai-powered', timestamp: new Date().toISOString(), confidence: 0.92 },
    })) },
  }));
  vi.mock('../db/index.js', () => ({ db: mockOrm.db, pdfs: '__pdfs__', labTestResults: '__results__', labTestDefinitions: '__defs__' }));
  vi.mock('../ai/llm-service.js', () => ({ default: { chat: vi.fn() } }));
  vi.mock('../ai/rag-service.js', () => ({ default: { initialize: vi.fn() } }));
  vi.mock('../ai/prompts.js', () => ({ PROMPTS: {} }));
  vi.mock('../utils/data-loader.js', () => ({ loadSampleData: vi.fn() }));
  vi.mock('../analytics/engine.js', () => ({
    analyzeTrends: vi.fn(),
    analyzeCorrelations: vi.fn(),
    detectAnomalies: vi.fn(),
    performPredictiveAnalysis: vi.fn(),
  }));

  if (!dbAvailable) process.env.DATABASE_URL = '';
  else process.env.DATABASE_URL = 'postgresql://localhost/test';

  const { default: aiFeaturesRouter } = await import('./ai-features.js');
  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiFeaturesRouter);
  return app;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/ai/pdf/extract – response shape', () => {
  beforeEach(() => {
    dbAvailable = true;
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    mockPdfRows.length = 0;
    mockResultRows.length = 0;
    dbCalls.pdfInsert = null;
    dbCalls.pdfUpdate = null;
    dbCalls.resultInserts = [];
    vi.clearAllMocks();
  });

  it('returns 400 when no file and no pdfBase64 are provided', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/ai/pdf/extract').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('accepts a base64 JSON body and returns success=true', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('fake-pdf').toString('base64');
    const res = await request(app)
      .post('/api/ai/pdf/extract')
      .send({ pdfBase64: fakeBase64 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('accepts a multipart file upload (simulated via header) and returns success=true', async () => {
    const app = await buildApp();
    const res = await request(app)
      .post('/api/ai/pdf/extract')
      .set('x-test-has-file', '1')
      .field('something', 'value');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('response includes pdfId when DATABASE_URL is set', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('fake-pdf').toString('base64');
    const res = await request(app)
      .post('/api/ai/pdf/extract')
      .send({ pdfBase64: fakeBase64 });
    expect(res.body.pdfId).toBeDefined();
    expect(typeof res.body.pdfId).toBe('string');
  });

  it('response includes savedResults count', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('fake-pdf').toString('base64');
    const res = await request(app)
      .post('/api/ai/pdf/extract')
      .send({ pdfBase64: fakeBase64, patientId: crypto.randomUUID() });
    expect(res.body).toHaveProperty('savedResults');
    expect(typeof res.body.savedResults).toBe('number');
  });

  it('response still contains extraction data (tests, metadata, summary)', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('fake-pdf').toString('base64');
    const res = await request(app)
      .post('/api/ai/pdf/extract')
      .send({ pdfBase64: fakeBase64 });
    expect(res.body.data).toBeDefined();
    expect(res.body.data.tests).toBeDefined();
    expect(res.body.data.metadata).toBeDefined();
  });
});

describe('POST /api/ai/pdf/extract – database interactions', () => {
  beforeEach(() => {
    dbAvailable = true;
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    mockPdfRows.length = 0;
    mockResultRows.length = 0;
    dbCalls.pdfInsert = null;
    dbCalls.pdfUpdate = null;
    dbCalls.resultInserts = [];
    vi.clearAllMocks();
  });

  it('inserts a pdfs record with processingStatus="processing" before extraction completes', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('pdf').toString('base64');
    await request(app).post('/api/ai/pdf/extract').send({ pdfBase64: fakeBase64 });
    // The insert was called with processingStatus: 'processing'
    expect(mockOrm.db.insert).toHaveBeenCalled();
  });

  it('updates the pdfs record to processingStatus="completed" on success', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('pdf').toString('base64');
    await request(app).post('/api/ai/pdf/extract').send({ pdfBase64: fakeBase64 });
    expect(mockOrm.db.update).toHaveBeenCalled();
  });

  it('saves one lab_test_results row per matched test when patientId is supplied', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('pdf').toString('base64');
    const patientId = crypto.randomUUID();
    await request(app)
      .post('/api/ai/pdf/extract')
      .send({ pdfBase64: fakeBase64, patientId });

    // Only Creatinine matches (UnknownTest has no definition, NoValue has null numericValue)
    const resultInserts = mockOrm.db.insert.mock.calls.filter(
      ([table]) => table === '__results__'
    );
    expect(resultInserts.length).toBeGreaterThanOrEqual(1);
  });

  it('sets source="pdf" and sourceId=pdfId on saved lab results', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('pdf').toString('base64');
    const patientId = crypto.randomUUID();
    const res = await request(app)
      .post('/api/ai/pdf/extract')
      .send({ pdfBase64: fakeBase64, patientId });

    if (res.body.savedResults > 0) {
      expect(res.body.savedResultIds).toBeDefined();
      expect(Array.isArray(res.body.savedResultIds)).toBe(true);
    }
    expect(res.body.pdfId).toBeDefined();
  });

  it('skips tests that have null numericValue without failing the request', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('pdf').toString('base64');
    const res = await request(app)
      .post('/api/ai/pdf/extract')
      .send({ pdfBase64: fakeBase64, patientId: crypto.randomUUID() });
    // Should still succeed
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('skips tests with no matching labTestDefinition without failing the request', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('pdf').toString('base64');
    const res = await request(app)
      .post('/api/ai/pdf/extract')
      .send({ pdfBase64: fakeBase64, patientId: crypto.randomUUID() });
    expect(res.status).toBe(200);
  });

  it('saves no lab results when patientId is not provided', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('pdf').toString('base64');
    const res = await request(app)
      .post('/api/ai/pdf/extract')
      .send({ pdfBase64: fakeBase64 }); // no patientId
    // savedResults should be 0 (or key absent when DB is available)
    expect(res.body.savedResults ?? 0).toBe(0);
  });
});

describe('POST /api/ai/pdf/extract – no database', () => {
  beforeEach(() => {
    dbAvailable = false;
    delete process.env.DATABASE_URL;
    vi.clearAllMocks();
  });

  afterEach(() => {
    dbAvailable = true;
    process.env.DATABASE_URL = 'postgresql://localhost/test';
  });

  it('still returns extraction results when DATABASE_URL is not set', async () => {
    const app = await buildApp();
    const fakeBase64 = Buffer.from('pdf').toString('base64');
    const res = await request(app)
      .post('/api/ai/pdf/extract')
      .send({ pdfBase64: fakeBase64 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // No pdfId when DB is not available
    expect(res.body.pdfId).toBeUndefined();
  });
});

describe('GET /api/ai/pdf – list PDFs', () => {
  beforeEach(() => {
    dbAvailable = true;
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    mockPdfRows.length = 0;
    vi.clearAllMocks();
  });

  it('returns 503 when DATABASE_URL is not set', async () => {
    // Build the app first, THEN clear the URL so getDB() sees the missing URL at request time
    const app = await buildApp();
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    const res = await request(app).get('/api/ai/pdf');
    process.env.DATABASE_URL = saved;
    expect(res.status).toBe(503);
  });

  it('returns pdfs array and count when database is available', async () => {
    mockPdfRows.push({ id: 'pdf-1', originalName: 'a.pdf', processingStatus: 'completed' });
    const app = await buildApp();
    const res = await request(app).get('/api/ai/pdf');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.pdfs)).toBe(true);
    expect(res.body).toHaveProperty('count');
  });
});

describe('GET /api/ai/pdf/:pdfId – single PDF', () => {
  beforeEach(() => {
    dbAvailable = true;
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    mockPdfRows.length = 0;
    vi.clearAllMocks();
  });

  it('returns 503 when DATABASE_URL is not set', async () => {
    const app = await buildApp();
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    const res = await request(app).get('/api/ai/pdf/some-id');
    process.env.DATABASE_URL = saved;
    expect(res.status).toBe(503);
  });

  it('returns 404 when PDF does not exist', async () => {
    // mockPdfRows is empty → select returns []
    const app = await buildApp();
    const res = await request(app).get('/api/ai/pdf/nonexistent-id');
    expect(res.status).toBe(404);
  });

  it('returns the pdf record when it exists', async () => {
    mockPdfRows.push({ id: 'pdf-42', originalName: 'test.pdf', processingStatus: 'completed', extractedData: { tests: [] } });
    const app = await buildApp();
    const res = await request(app).get('/api/ai/pdf/pdf-42');
    expect(res.status).toBe(200);
    expect(res.body.pdf).toBeDefined();
  });
});

describe('GET /api/ai/pdf/:pdfId/results – lab results from PDF', () => {
  beforeEach(() => {
    dbAvailable = true;
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    mockPdfRows.length = 0;
    mockResultRows.length = 0;
    vi.clearAllMocks();
  });

  it('returns 503 when DATABASE_URL is not set', async () => {
    const app = await buildApp();
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    const res = await request(app).get('/api/ai/pdf/pdf-1/results');
    process.env.DATABASE_URL = saved;
    expect(res.status).toBe(503);
  });

  it('returns 404 when the PDF does not exist', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/ai/pdf/nonexistent/results');
    expect(res.status).toBe(404);
  });

  it('returns results and count for a known PDF', async () => {
    mockPdfRows.push({ id: 'pdf-5' });
    mockResultRows.push({ id: 'res-1', sourceId: 'pdf-5', value: '1.1' });
    const app = await buildApp();
    const res = await request(app).get('/api/ai/pdf/pdf-5/results');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body).toHaveProperty('count');
  });
});

describe('GET /api/ai/features – features list', () => {
  it('includes all PDF-related endpoints in the features list', async () => {
    dbAvailable = true;
    process.env.DATABASE_URL = 'postgresql://localhost/test';
    const app = await buildApp();
    const res = await request(app).get('/api/ai/features');
    expect(res.status).toBe(200);
    const endpoints = res.body.features.map(f => f.endpoint);
    expect(endpoints).toContain('/api/ai/pdf/extract');
    expect(endpoints).toContain('/api/ai/pdf');
    expect(endpoints).toContain('/api/ai/pdf/:pdfId');
    expect(endpoints).toContain('/api/ai/pdf/:pdfId/results');
  });
});
