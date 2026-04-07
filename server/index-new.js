/**
 * Main Express Server - Production API
 * Entry point for the analisi-tracker application
 */

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import compression from 'compression';
import dotenv from 'dotenv';
import {
  securityHeaders,
  corsConfig,
  sanitizeResponse,
  preventParameterPollution,
  addSecurityHeaders
} from './middleware/security.js';
import {
  generalRateLimiter,
  slowDownMiddleware
} from './middleware/rateLimiter.js';
import { requestLogger, errorLogger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { swaggerSpec } from './config/swagger.js';
import {
  patientsRouter,
  labsRouter,
  insightsRouter,
  exportRouter,
  analyticsRouter
} from './api/routes/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(corsConfig);
app.use(addSecurityHeaders);
app.use(sanitizeResponse);
app.use(preventParameterPollution);

// Compression middleware (gzip)
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalRateLimiter);
app.use(slowDownMiddleware);

// Request logging
app.use(requestLogger);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Documentation (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Analisi Tracker API Documentation'
}));

// API Routes
app.use('/api/patients', patientsRouter);
app.use('/api/labs', labsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/export', exportRouter);
app.use('/api/analytics', analyticsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Analisi Tracker Analytics API',
    version: '2.0.0',
    description: 'Advanced medical lab test analytics platform with multi-patient management and advanced analytics',
    endpoints: {
      health: '/health',
      documentation: '/api-docs',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        refresh: 'POST /api/auth/refresh',
        me: 'GET /api/auth/me'
      },
      users: {
        profile: 'GET /api/users/profile',
        updateProfile: 'PATCH /api/users/profile',
        changePassword: 'POST /api/users/change-password',
        preferences: 'GET /api/users/preferences',
        updatePreferences: 'PUT /api/users/preferences'
      },
      patients: {
        list: 'GET /api/patients',
        create: 'POST /api/patients',
        get: 'GET /api/patients/:patientId',
        update: 'PATCH /api/patients/:patientId',
        delete: 'DELETE /api/patients/:patientId',
        setPrimary: 'PATCH /api/patients/:patientId/set-primary'
      },
      labs: {
        definitions: 'GET /api/labs/definitions',
        results: 'GET /api/labs/results',
        createResult: 'POST /api/labs/results',
        updateResult: 'PATCH /api/labs/results/:resultId',
        deleteResult: 'DELETE /api/labs/results/:resultId',
        patientResults: 'GET /api/labs/results/patient/:patientId',
        abnormalResults: 'GET /api/labs/results/patient/:patientId/abnormal'
      },
      insights: {
        list: 'GET /api/insights',
        get: 'GET /api/insights/:insightId',
        markRead: 'PATCH /api/insights/:insightId/read',
        dismiss: 'PATCH /api/insights/:insightId/dismiss',
        unreadCount: 'GET /api/insights/unread-count',
        markAllRead: 'PATCH /api/insights/mark-all-read'
      },
      export: {
        request: 'POST /api/export/request',
        jobs: 'GET /api/export/jobs',
        download: 'GET /api/export/jobs/:jobId/download'
      },
      analytics: {
        trends: '/api/analytics/trends/:labTestId',
        correlations: '/api/analytics/correlations',
        anomalies: '/api/analytics/anomalies/:labTestId',
        predictions: '/api/analytics/predictions/:labTestId',
        statistics: '/api/analytics/statistics/:labTestId',
        insights: '/api/analytics/insights',
        comprehensive: '/api/analytics/comprehensive/:labTestId'
      }
    },
    features: [
      'Multi-Patient Management',
      'Advanced Analytics',
      'Trend Analysis',
      'Correlation Detection',
      'Anomaly Detection',
      'Predictive Analytics',
      'PDF Upload & Extraction',
      'Data Export (CSV, JSON, PDF)',
      'Real-time Insights & Alerts',
      'JWT Authentication',
      'Role-Based Access Control',
      'Rate Limiting',
      'Request Validation',
      'Comprehensive Logging'
    ],
    documentation: 'https://github.com/yourusername/analisi-tracker',
    swagger: '/api-docs'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error logger
app.use(errorLogger);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                            ║
║          Analisi Tracker Analytics API v2.0.0              ║
║          Production-Ready Backend Infrastructure             ║
║                                                            ║
║          Server running on port ${PORT}                      ║
║          Environment: ${process.env.NODE_ENV || 'development'}                      ║
║                                                            ║
║          Quick Links:                                      ║
║            - API Docs: http://localhost:${PORT}/api-docs        ║
║            - Health: http://localhost:${PORT}/health             ║
║                                                            ║
║          Authentication Endpoints:                         ║
║            - POST /api/auth/register                       ║
║            - POST /api/auth/login                          ║
║            - POST /api/auth/refresh                        ║
║                                                            ║
║          Core API Endpoints:                               ║
║            - Users: /api/users/*                           ║
║            - Patients: /api/patients/*                     ║
║            - Labs: /api/labs/*                             ║
║            - Insights: /api/insights/*                     ║
║            - Export: /api/export/*                         ║
║            - Analytics: /api/analytics/*                   ║
║                                                            ║
║          Features:                                         ║
║            ✓ Multi-patient management                      ║
║            ✓ JWT authentication & authorization             ║
║            ✓ Request validation & rate limiting             ║
║            ✓ Comprehensive error handling                   ║
║            ✓ Structured logging                            ║
║            ✓ OpenAPI/Swagger documentation                 ║
║            ✓ PostgreSQL with Drizzle ORM                    ║
║            ✓ Database migrations                           ║
║                                                            ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
