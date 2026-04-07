/**
 * AI Features API Endpoints
 * Health summaries, predictions, medication analysis, etc.
 */

import express from 'express';
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
 * Extract lab values from PDF
 */
router.post('/pdf/extract', async (req, res) => {
  try {
    // Note: This endpoint expects the PDF as multipart/form-data
    // For simplicity, we'll assume base64 encoding in JSON body
    const { pdfBase64, options = {} } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({
        error: 'PDF data is required (base64 encoded)'
      });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Import pdfExtractor
    const pdfExtractor = (await import('../ai/pdf-extractor.js')).default;

    // Perform extraction
    const result = await pdfExtractor.extractLabValues(pdfBuffer, options);

    res.json(result);

  } catch (error) {
    console.error('PDF extraction error:', error);
    res.status(500).json({
      error: 'Failed to extract from PDF',
      message: error.message
    });
  }
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
      description: 'Extract lab values from PDF documents using AI',
      methods: ['POST']
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
