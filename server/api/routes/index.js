/**
 * API Routes Index
 * Central export for all API routes
 */

import patientsRouter from './patients.js';
import labsRouter from './labs.js';
import insightsRouter from './insights.js';
import exportRouter from './export.js';
import analyticsRouter from '../analytics.js';

export {
  patientsRouter,
  labsRouter,
  insightsRouter,
  exportRouter,
  analyticsRouter
};
