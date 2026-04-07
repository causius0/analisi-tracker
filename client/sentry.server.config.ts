/**
 * Sentry Server Configuration for Next.js
 * Captures server-side errors and performance data
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV;
const SENTRY_RELEASE = process.env.SENTRY_RELEASE;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT || 'development',
  release: SENTRY_RELEASE,

  // Performance monitoring
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

  // Error sampling
  sampleRate: parseFloat(process.env.SENTRY_ERROR_SAMPLE_RATE || '1.0'),

  // Before send error
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['x-api-key'];
    }

    return event;
  },

  // Set user context (anonymized)
  initialScope: (scope) => {
    // In server-side, use session ID if available
    const sessionId = 'server_' + Math.random().toString(36).substring(2, 15);

    scope.setUser({
      id: sessionId,
      ip_address: '{{auto}}',
    });

    return scope;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Network errors that are not actionable
    /Network\s?Error/i,
  ],

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Environment-specific settings
  enabled: !!SENTRY_DSN,

  // Attach stacktrace to all messages
  attachStacktrace: true,

  // Send PII defaults
  sendDefaultPii: false,
});

export { Sentry };
