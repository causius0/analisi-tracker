/**
 * Sentry Error Tracking Middleware
 * Production-ready error monitoring and performance tracking
 */

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Initialize Sentry
export function initSentry() {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      integrations: [
        nodeProfilingIntegration(),
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware
        new Sentry.Integrations.Express({ app }),
        // Enable performance monitoring
        new Sentry.Integrations.Mongo({ useMongoose: true }),
      ],
      // Performance monitoring
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1,
      // Session replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-api-key'];
        }
        // Filter sensitive query parameters
        if (event.request?.query_string) {
          event.request.query_string = event.request.query_string
            .split('&')
            .filter(param => !param.startsWith('password=') && !param.startsWith('token='))
            .join('&');
        }
        return event;
      },
      // Attach stack traces
      stackParser: Sentry.defaultStackParser,
      // Environment
      environment: process.env.NODE_ENV,
      // Release version
      release: process.env.HEROKU_RELEASE_VERSION || process.env.VERCEL_GIT_COMMIT_SHA || '1.0.0',
      // Tags
      tags: {
        service: 'analisi-tracker-api',
        region: process.env.VERCEL_REGION || process.env.AWS_REGION || 'unknown',
      },
    });

    console.log('Sentry initialized successfully');
  } else {
    console.log('Sentry disabled (no DSN or not in production)');
  }
}

// Request handler middleware
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler();
}

// Error handler middleware
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler();
}

// Performance monitoring middleware
export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

// Capture error helper
export function captureError(error, context = {}) {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      level: 'error',
      extra: context,
    });
  } else {
    console.error('Error:', error, context);
  }
}

// Capture message helper
export function captureMessage(message, level = 'info', context = {}) {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console.log(`[${level.toUpperCase()}]`, message, context);
  }
}

// Performance tracking helper
export function startTransaction(name, op = 'function') {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    return Sentry.startTransaction({ name, op });
  }
  return { finish: () => {} };
}
