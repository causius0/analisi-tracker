/**
 * Sentry Edge Configuration for Next.js
 * Captures edge runtime errors
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT || 'development',

  // Performance monitoring
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

  // Error sampling
  sampleRate: parseFloat(process.env.SENTRY_ERROR_SAMPLE_RATE || '1.0'),

  // Before send error
  beforeSend(event) {
    // Remove sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    return event;
  },

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Environment-specific settings
  enabled: !!SENTRY_DSN,
});

export { Sentry };
