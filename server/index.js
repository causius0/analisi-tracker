/**
 * Main Express Server
 * Entry point for the analisi-tracker application
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import analyticsRouter from './api/analytics.js';
import aiChatRouter from './api/ai-chat.js';
import aiFeaturesRouter from './api/ai-features.js';
import { initSentry, setupSentryMiddleware, getSentryErrorHandler } from './monitoring/sentry.js';
import { logAPIRequest, logError } from './monitoring/logger.js';
import { trackAPIRequest, startMemoryMonitoring, startEventLoopMonitoring } from './monitoring/performance.js';
import { healthCheckMiddleware, readinessCheck, livenessCheck } from './monitoring/health.js';

// Load environment variables
dotenv.config();

// Initialize monitoring
initSentry();
startMemoryMonitoring();
startEventLoopMonitoring();

const app = express();
const PORT = process.env.PORT || 3000;

// Sentry middleware (must be first)
setupSentryMiddleware(app);

// Compression middleware (gzip/brotli)
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6, // Compression level (1-9, 6 is default)
}));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance tracking middleware
app.use(trackAPIRequest);

// Request logging middleware
app.use(logAPIRequest);

// Health check endpoints
app.get('/health', healthCheckMiddleware);
app.get('/health/ready', readinessCheck);
app.get('/health/live', livenessCheck);

// Monitoring endpoints
app.get('/api/monitoring/metrics', (req, res) => {
  const { getAllMetrics } = require('./monitoring/performance.js');
  res.json(getAllMetrics());
});

app.post('/api/monitoring/metrics/reset', (req, res) => {
  const { resetMetrics } = require('./monitoring/performance.js');
  resetMetrics();
  res.json({ message: 'Metrics reset successfully' });
});

// API routes
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiChatRouter);
app.use('/api/ai', aiFeaturesRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Analisi Tracker Analytics API',
    version: '2.0.0',
    description: 'Advanced medical lab test analytics platform with AI-powered insights',
    endpoints: {
      health: '/health',
      analytics: {
        trends: '/api/analytics/trends/:labTestId',
        correlations: '/api/analytics/correlations',
        anomalies: '/api/analytics/anomalies/:labTestId',
        predictions: '/api/analytics/predictions/:labTestId',
        statistics: '/api/analytics/statistics/:labTestId',
        insights: '/api/analytics/insights',
        comprehensive: '/api/analytics/comprehensive/:labTestId'
      },
      ai: {
        chat: 'POST /api/ai/chat',
        chatStream: 'POST /api/ai/chat/stream',
        summary: 'POST /api/ai/summary',
        predictionExplain: 'POST /api/ai/prediction/explain',
        anomalyExplain: 'POST /api/ai/anomaly/explain',
        medicationAnalyze: 'POST /api/ai/medication/analyze',
        query: 'POST /api/ai/query',
        pdfExtract: 'POST /api/ai/pdf/extract',
        features: 'GET /api/ai/features'
      },
      cache: {
        clear: 'POST /api/analytics/cache/clear',
        stats: '/api/analytics/cache/stats'
      }
    },
    features: [
      'Trend Analysis',
      'Correlation Detection',
      'Anomaly Detection',
      'Predictive Analytics',
      'AI-Powered Chat',
      'Health Summaries',
      'PDF Extraction',
      'Medication Analysis',
      'Natural Language Queries'
    ],
    documentation: 'https://github.com/yourusername/analisi-tracker'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handler (Sentry must be last)
app.use(getSentryErrorHandler());
app.use((err, req, res, next) => {
  logError(err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                            ║
║          Analisi Tracker Analytics Server                  ║
║          with AI-Powered Insights                          ║
║                                                            ║
║          Server running on port ${PORT}                      ║
║                                                            ║
║          API Documentation: http://localhost:${PORT}/        ║
║                                                            ║
║          Analytics Endpoints:                              ║
║            - Trends: /api/analytics/trends/:id             ║
║            - Correlations: /api/analytics/correlations     ║
║            - Anomalies: /api/analytics/anomalies/:id       ║
║            - Predictions: /api/analytics/predictions/:id   ║
║            - Statistics: /api/analytics/statistics/:id     ║
║            - Insights: /api/analytics/insights             ║
║                                                            ║
║          AI Endpoints:                                     ║
║            - Chat: POST /api/ai/chat                       ║
║            - Summary: POST /api/ai/summary                 ║
║            - Query: POST /api/ai/query                     ║
║            - PDF Extract: POST /api/ai/pdf/extract         ║
║            - Features: GET /api/ai/features                ║
║                                                            ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
