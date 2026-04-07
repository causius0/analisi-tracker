/**
 * AI Features API Endpoints
 * Health summaries, predictions, medication analysis, etc.
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { eq, ilike, desc } from 'drizzle-orm';
import llmService from '../ai/llm-service.js';
import ragService from '../ai/rag-service.js';
import { PROMPTS } from '../ai/prompts.js';
import { loadSampleData } from '../utils/data-loader.js';
import {
  analyzeTrends,
  analyzeCorrelations,
  detectAnomalies,
  performPredictiveAnalysis
} from '../analytics/engine.js';

// ── PDF upload storage setup ──────────────────────────────────────────────────

const PDF_UPLOAD_DIR = process.env.PDF_UPLOAD_DIR || './uploads/pdfs';
await mkdir(PDF_UPLOAD_DIR, { recursive: true });

const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PDF_UPLOAD_DIR),
  filename: (_req, file, cb) =>
    cb(null, `${crypto.randomUUID()}-${file.originalname}`),
});

const uploadPDF = multer({
  storage: pdfStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed'));
  },
});

// Lazy-load DB to avoid crashing when DATABASE_URL is not configured
let _db, _pdfs, _labTestResults, _labTestDefinitions;
async function getDB() {
  if (!process.env.DATABASE_URL) return null;
  if (!_db) {
    const mod = await import('../db/index.js');
    _db = mod.db;
    _pdfs = mod.pdfs;
    _labTestResults = mod.labTestResults;
    _labTestDefinitions = mod.labTestDefinitions;
  }
  return { db: _db, pdfs: _pdfs, labTestResults: _labTestResults, labTestDefinitions: _labTestDefinitions };
}

// ─────────────────────────────────────────────────────────────────────────────

const router = express.Router();

// Initialize RAG service
await ragService.initialize();

/**
 * POST /api/ai/summary
 * Generate health summary
 */
router.post('/summary', async (req, res) => {
  try {
    const {
      patientId = 'sample',
      includeTrends = true,
      includeAnomalies = true,
      includePredictions = false
    } = req.body;

    // Load patient data
    const data = await loadSampleData();

    // Build context
    const context = {
      labResults: data.labResults,
      medications: data.medications,
      events: data.events
    };

    // Run analytics
    const analytics = {};
    let analyticsText = '';

    if (includeTrends) {
      for (const [testName, testData] of Object.entries(data.labResults)) {
        const trends = await analyzeTrends(testData, { labTestId: testName });
        analytics[testName] = { trends };
      }
      analyticsText += `\n\nTRENDS:\n${JSON.stringify(analytics, null, 2)}`;
    }

    if (includeAnomalies) {
      const anomalies = {};
      for (const [testName, testData] of Object.entries(data.labResults)) {
        anomalies[testName] = await detectAnomalies(testData, { labTestId: testName });
      }
      analyticsText += `\n\nANOMALIES:\n${JSON.stringify(anomalies, null, 2)}`;
    }

    // Generate summary using LLM
    const messages = [
      {
        role: 'system',
        content: PROMPTS.HEALTH_SUMMARY
      },
      {
        role: 'user',
        content: `Generate a comprehensive health summary based on this data:

LAB RESULTS:
${JSON.stringify(data.labResults, null, 2)}

ANALYTICS:
${analyticsText}

MEDICATIONS:
${JSON.stringify(data.medications, null, 2)}

EVENTS:
${JSON.stringify(data.events, null, 2)}

Generate the summary following the format specified in the system prompt.`
      }
    ];

    const response = await llmService.chat(messages, {
      temperature: 0.7,
      maxTokens: 3000
    });

    // Validate for safety
    const validation = llmService.validateMedicalResponse(response.content);

    res.json({
      summary: response.content,
      safe: validation.safe,
      validationWarning: validation.reason,
      usage: response.usage,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({
      error: 'Failed to generate health summary',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/prediction/explain
 * Explain predictions in natural language
 */
router.post('/prediction/explain', async (req, res) => {
  try {
    const { labTestId, forecastHorizon = 30 } = req.body;

    if (!labTestId) {
      return res.status(400).json({
        error: 'labTestId is required'
      });
    }

    // Load data and generate predictions
    const data = await loadSampleData();
    const testData = data.labResults[labTestId];

    if (!testData) {
      return res.status(404).json({
        error: 'Lab test not found'
      });
    }

    const predictions = await performPredictiveAnalysis(testData, {
      labTestId,
      forecastHorizon
    });

    // Generate explanation using LLM
    const messages = [
      {
        role: 'system',
        content: PROMPTS.PREDICTION_EXPLANATION
      },
      {
        role: 'user',
        content: `Explain this prediction to the patient:

LAB TEST: ${labTestId}
HISTORICAL DATA:
${JSON.stringify(testData.slice(-5), null, 2)}

PREDICTIONS:
${JSON.stringify(predictions, null, 2)}

Provide a clear, accessible explanation following the system prompt format.`
      }
    ];

    const response = await llmService.chat(messages, {
      temperature: 0.7,
      maxTokens: 1500
    });

    res.json({
      explanation: response.content,
      predictions: predictions.ensemble,
      confidence: predictions.ensemble?.confidence,
      usage: response.usage
    });

  } catch (error) {
    console.error('Prediction explanation error:', error);
    res.status(500).json({
      error: 'Failed to explain predictions',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/anomaly/explain
 * Explain anomalies in natural language
 */
router.post('/anomaly/explain', async (req, res) => {
  try {
    const { labTestId } = req.body;

    if (!labTestId) {
      return res.status(400).json({
        error: 'labTestId is required'
      });
    }

    // Load data and detect anomalies
    const data = await loadSampleData();
    const testData = data.labResults[labTestId];

    if (!testData) {
      return res.status(404).json({
        error: 'Lab test not found'
      });
    }

    const anomalies = await detectAnomalies(testData, { labTestId });

    // If no anomalies, return early
    if (anomalies.anomalies.length === 0) {
      return res.json({
        explanation: `Good news! No anomalies were detected in your ${labTestId} values. All values are within the expected range based on your historical patterns.`,
        anomalies: []
      });
    }

    // Generate explanation using LLM
    const messages = [
      {
        role: 'system',
        content: PROMPTS.ANOMALY_EXPLANATION
      },
      {
        role: 'user',
        content: `Explain these anomalies to the patient:

LAB TEST: ${labTestId}
ANOMALIES DETECTED:
${JSON.stringify(anomalies.anomalies, null, 2)}

STATISTICS:
${JSON.stringify(anomalies.statistics, null, 2)}

Provide a clear, reassuring explanation following the system prompt format.`
      }
    ];

    const response = await llmService.chat(messages, {
      temperature: 0.7,
      maxTokens: 1500
    });

    res.json({
      explanation: response.content,
      anomalies: anomalies.anomalies,
      severity: anomalies.anomalies.map(a => a.severity),
      usage: response.usage
    });

  } catch (error) {
    console.error('Anomaly explanation error:', error);
    res.status(500).json({
      error: 'Failed to explain anomalies',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/medication/analyze
 * Analyze medication impact on lab values
 */
router.post('/medication/analyze', async (req, res) => {
  try {
    const { medicationName, labTestId } = req.body;

    if (!medicationName) {
      return res.status(400).json({
        error: 'medicationName is required'
      });
    }

    // Load data
    const data = await loadSampleData();

    // Get medication info
    const medication = data.medications?.find(m =>
      m.name.toLowerCase().includes(medicationName.toLowerCase())
    );

    if (!medication) {
      return res.status(404).json({
        error: 'Medication not found'
      });
    }

    // Get lab data
    const labData = labTestId ? data.labResults[labTestId] : null;

    // Analyze impact
    const messages = [
      {
        role: 'system',
        content: PROMPTS.MEDICATION_ANALYSIS
      },
      {
        role: 'user',
        content: `Analyze the potential impact of this medication:

MEDICATION:
${JSON.stringify(medication, null, 2)}

${labData ? `LAB TEST DATA (${labTestId}):\n${JSON.stringify(labData, null, 2)}` : ''}

CONTEXT:
${JSON.stringify(data.events, null, 2)}

Provide a comprehensive analysis following the system prompt format.`
      }
    ];

    const response = await llmService.chat(messages, {
      temperature: 0.7,
      maxTokens: 2000
    });

    res.json({
      analysis: response.content,
      medication: medication.name,
      usage: response.usage,
      disclaimer: 'This analysis identifies patterns for discussion with healthcare providers. It does not establish causation or provide medical advice.'
    });

  } catch (error) {
    console.error('Medication analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze medication impact',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/query
 * Natural language query to analytics data
 */
router.post('/query', async (req, res) => {
  try {
    const { query, patientId = 'sample' } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    // First, use LLM to understand the query intent
    const understandingMessages = [
      {
        role: 'system',
        content: PROMPTS.QUERY_PROCESSING
      },
      {
        role: 'user',
        content: query
      }
    ];

    const understanding = await llmService.chat(understandingMessages, {
      temperature: 0.3,
      maxTokens: 1000
    });

    // Parse the intent
    const intentMatch = understanding.content.match(/\{[\s\S]*\}/);
    if (!intentMatch) {
      return res.status(500).json({
        error: 'Failed to understand query'
      });
    }

    const intent = JSON.parse(intentMatch[0]);

    // Execute the query based on intent
    const result = await executeQuery(intent, patientId);

    // Generate natural language response
    const responseMessages = [
      {
        role: 'system',
        content: PROMPTS.CHAT_SYSTEM
      },
      {
        role: 'user',
        content: `Query: ${query}\n\nResult: ${JSON.stringify(result, null, 2)}\n\nProvide a clear, helpful response to the user's question based on this data.`
      }
    ];

    const response = await llmService.chat(responseMessages, {
      temperature: 0.7,
      maxTokens: 1500
    });

    res.json({
      response: response.content,
      intent,
      data: result,
      usage: response.usage
    });

  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/pdf/extract
 * Upload a PDF, extract lab values via AI, persist results to the database.
 *
 * Accepts EITHER:
 *   - multipart/form-data with field "pdf" (preferred)
 *   - application/json with { pdfBase64, filename, patientId, options }
 *
 * Optional body fields (both modes):
 *   - patientId  – UUID; when supplied, extracted values are written to lab_test_results
 *   - options    – extraction options forwarded to pdfExtractor
 */
router.post('/pdf/extract', uploadPDF.single('pdf'), async (req, res) => {
  let storagePath = null;

  try {
    // ── Resolve PDF buffer + file metadata ──────────────────────────────────
    let pdfBuffer, originalName, fileSize;

    if (req.file) {
      // Multipart upload – file already on disk
      storagePath = req.file.path;
      originalName = req.file.originalname;
      fileSize = req.file.size;
      pdfBuffer = await readFile(storagePath);
    } else if (req.body?.pdfBase64) {
      // Legacy base64 JSON body – save to disk so we have a storagePath
      pdfBuffer = Buffer.from(req.body.pdfBase64, 'base64');
      originalName = req.body.filename || 'upload.pdf';
      fileSize = pdfBuffer.length;
      const filename = `${crypto.randomUUID()}-${originalName}`;
      storagePath = path.join(PDF_UPLOAD_DIR, filename);
      await writeFile(storagePath, pdfBuffer);
    } else {
      return res.status(400).json({
        error: 'A PDF is required: send a multipart "pdf" field or a "pdfBase64" JSON body',
      });
    }

    const patientId = req.body?.patientId || null;
    const options = req.body?.options
      ? (typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options)
      : {};

    // ── Persist PDF record (if DB is available) ─────────────────────────────
    const orm = await getDB();
    let pdfRecord = null;

    if (orm) {
      const [inserted] = await orm.db
        .insert(orm.pdfs)
        .values({
          patientId: patientId || null,
          filename: path.basename(storagePath),
          originalName,
          fileSize,
          storagePath,
          processingStatus: 'processing',
        })
        .returning();
      pdfRecord = inserted;
    }

    // ── Run AI extraction ────────────────────────────────────────────────────
    const pdfExtractor = (await import('../ai/pdf-extractor.js')).default;
    const result = await pdfExtractor.extractLabValues(pdfBuffer, options);

    // ── Persist extraction results ───────────────────────────────────────────
    const savedResults = [];

    if (orm && pdfRecord) {
      // Update PDF record with extracted data
      await orm.db
        .update(orm.pdfs)
        .set({
          extractedData: result.success ? result.data : null,
          isProcessed: result.success,
          processingStatus: result.success ? 'completed' : 'failed',
          processingError: result.success ? null : (result.error || null),
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orm.pdfs.id, pdfRecord.id));

      // Save individual lab test results when patientId is provided
      if (result.success && patientId && result.data?.tests?.length > 0) {
        const testDate = result.data.metadata?.testDate
          ? new Date(result.data.metadata.testDate)
          : new Date();

        for (const test of result.data.tests) {
          // Must have a usable numeric value
          if (test.numericValue == null || Number.isNaN(test.numericValue)) continue;

          // Find matching lab test definition (case-insensitive)
          const defs = await orm.db
            .select()
            .from(orm.labTestDefinitions)
            .where(ilike(orm.labTestDefinitions.name, test.testName))
            .limit(1);

          if (defs.length === 0) continue; // Unknown test – skip, don't fail

          const def = defs[0];
          const isAbnormal = test.isAbnormal ?? (
            def.referenceMin !== null &&
            def.referenceMax !== null &&
            (test.numericValue < parseFloat(def.referenceMin) ||
             test.numericValue > parseFloat(def.referenceMax))
          );

          const [saved] = await orm.db
            .insert(orm.labTestResults)
            .values({
              patientId,
              labTestDefinitionId: def.id,
              value: test.numericValue.toString(),
              unit: test.unit || def.unit,
              date: testDate,
              isAbnormal,
              notes: test.notes || null,
              source: 'pdf',
              sourceId: pdfRecord.id,
            })
            .returning();

          savedResults.push(saved);
        }
      }
    }

    return res.json({
      ...result,
      ...(pdfRecord && {
        pdfId: pdfRecord.id,
        savedResults: savedResults.length,
        savedResultIds: savedResults.map(r => r.id),
      }),
    });

  } catch (error) {
    // Mark PDF record as failed if we created one
    try {
      const orm = await getDB();
      if (orm) {
        // Find the most recently inserted record for this file
        if (storagePath) {
          await orm.db
            .update(orm.pdfs)
            .set({
              processingStatus: 'failed',
              processingError: error.message,
              updatedAt: new Date(),
            })
            .where(eq(orm.pdfs.storagePath, storagePath));
        }
      }
    } catch { /* best-effort */ }

    console.error('PDF extraction error:', error);
    res.status(500).json({
      error: 'Failed to extract from PDF',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/pdf
 * List uploaded PDFs (most recent first).
 * Query: ?patientId=<uuid>&limit=20&offset=0
 */
router.get('/pdf', async (req, res) => {
  const orm = await getDB();
  if (!orm) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  let rows;
  if (req.query.patientId) {
    rows = await orm.db
      .select()
      .from(orm.pdfs)
      .where(eq(orm.pdfs.patientId, req.query.patientId))
      .orderBy(desc(orm.pdfs.uploadedAt))
      .limit(limit)
      .offset(offset);
  } else {
    rows = await orm.db
      .select()
      .from(orm.pdfs)
      .orderBy(desc(orm.pdfs.uploadedAt))
      .limit(limit)
      .offset(offset);
  }

  res.json({ pdfs: rows, count: rows.length });
});

/**
 * GET /api/ai/pdf/:pdfId
 * Retrieve a single PDF record including its extractedData.
 */
router.get('/pdf/:pdfId', async (req, res) => {
  const orm = await getDB();
  if (!orm) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const rows = await orm.db
    .select()
    .from(orm.pdfs)
    .where(eq(orm.pdfs.id, req.params.pdfId))
    .limit(1);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'PDF not found' });
  }

  res.json({ pdf: rows[0] });
});

/**
 * GET /api/ai/pdf/:pdfId/results
 * Retrieve the lab test results that were created from a specific PDF.
 */
router.get('/pdf/:pdfId/results', async (req, res) => {
  const orm = await getDB();
  if (!orm) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  // Verify the PDF exists
  const pdfRows = await orm.db
    .select({ id: orm.pdfs.id })
    .from(orm.pdfs)
    .where(eq(orm.pdfs.id, req.params.pdfId))
    .limit(1);

  if (pdfRows.length === 0) {
    return res.status(404).json({ error: 'PDF not found' });
  }

  const results = await orm.db
    .select()
    .from(orm.labTestResults)
    .where(eq(orm.labTestResults.sourceId, req.params.pdfId))
    .orderBy(desc(orm.labTestResults.date));

  res.json({ results, count: results.length });
});

/**
 * GET /api/ai/features
 * List available AI features
 */
router.get('/features', (req, res) => {
  const features = [
    {
      name: 'Natural Language Chat',
      endpoint: '/api/ai/chat',
      description: 'Ask questions about your health data in plain English',
      methods: ['POST']
    },
    {
      name: 'Health Summary',
      endpoint: '/api/ai/summary',
      description: 'Generate a comprehensive health summary',
      methods: ['POST']
    },
    {
      name: 'Prediction Explanation',
      endpoint: '/api/ai/prediction/explain',
      description: 'Get plain-language explanations of predictions',
      methods: ['POST']
    },
    {
      name: 'Anomaly Explanation',
      endpoint: '/api/ai/anomaly/explain',
      description: 'Understand what anomalies mean for your health',
      methods: ['POST']
    },
    {
      name: 'Medication Impact Analysis',
      endpoint: '/api/ai/medication/analyze',
      description: 'Analyze relationships between medications and lab values',
      methods: ['POST']
    },
    {
      name: 'Natural Language Query',
      endpoint: '/api/ai/query',
      description: 'Query your data using natural language',
      methods: ['POST']
    },
    {
      name: 'PDF Lab Extraction',
      endpoint: '/api/ai/pdf/extract',
      description: 'Upload a PDF, extract lab values via AI, and persist results to the database',
      methods: ['POST']
    },
    {
      name: 'List PDFs',
      endpoint: '/api/ai/pdf',
      description: 'List all uploaded PDFs',
      methods: ['GET']
    },
    {
      name: 'Get PDF',
      endpoint: '/api/ai/pdf/:pdfId',
      description: 'Retrieve a PDF record and its extracted data',
      methods: ['GET']
    },
    {
      name: 'PDF Lab Results',
      endpoint: '/api/ai/pdf/:pdfId/results',
      description: 'Retrieve the lab test results created from a PDF',
      methods: ['GET']
    }
  ];

  res.json({ features });
});

// Helper functions

/**
 * Execute query based on intent
 */
async function executeQuery(intent, patientId) {
  const data = await loadSampleData();

  switch (intent.intent) {
    case 'trends':
      const testName = intent.labTest;
      if (!data.labResults[testName]) {
        throw new Error(`Lab test ${testName} not found`);
      }
      return await analyzeTrends(data.labResults[testName], { labTestId: testName });

    case 'statistics':
      const statsTest = intent.labTest;
      if (!data.labResults[statsTest]) {
        throw new Error(`Lab test ${statsTest} not found`);
      }
      const values = data.labResults[statsTest].map(d => d.value);
      return {
        test: statsTest,
        count: values.length,
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1]
      };

    case 'anomalies':
      const anomTest = intent.labTest;
      if (!data.labResults[anomTest]) {
        throw new Error(`Lab test ${anomTest} not found`);
      }
      return await detectAnomalies(data.labResults[anomTest], { labTestId: anomTest });

    case 'correlation':
      const tests = intent.parameters?.tests || [];
      if (tests.length !== 2) {
        throw new Error('Correlation requires exactly 2 tests');
      }
      const corrData = {};
      for (const test of tests) {
        if (!data.labResults[test]) {
          throw new Error(`Lab test ${test} not found`);
        }
        corrData[test] = data.labResults[test];
      }
      return await analyzeCorrelations(corrData);

    case 'prediction':
      const predTest = intent.labTest;
      if (!data.labResults[predTest]) {
        throw new Error(`Lab test ${predTest} not found`);
      }
      const horizon = intent.timeRange?.duration ?
        parseInt(intent.timeRange.duration) || 30 : 30;
      return await performPredictiveAnalysis(data.labResults[predTest], {
        labTestId: predTest,
        forecastHorizon: horizon
      });

    default:
      throw new Error(`Intent ${intent.intent} not yet implemented`);
  }
}

export default router;
