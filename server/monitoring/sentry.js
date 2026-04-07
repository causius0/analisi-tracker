/**
 * Sentry Configuration for Backend Error Tracking
 * Provides error monitoring, performance tracking, and release tracking
 */

import * as Sentry from '@sentry/node';
// Profiling integration is optional and may not be available in all versions
let ProfilingIntegration;
try {
  const profilingModule = await import('@sentry/profiling-node');
  ProfilingIntegration = profilingModule.ProfilingIntegration;
} catch (e) {
  console.warn('⚠️  Sentry profiling not available - continuing without it');
}

// Initialize Sentry
export function initSentry() {
  // Only initialize if DSN is configured and valid
  if (!process.env.SENTRY_DSN || process.env.SENTRY_DSN === 'https://your-sentry-dsn-here') {
    console.warn('⚠️  SENTRY_DSN not configured - Error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.SENTRY_RELEASE || `analisi-tracker@${process.env.npm_package_version || '1.0.0'}`,

      // Performance monitoring
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),

      // Error sampling
      sampleRate: parseFloat(process.env.SENTRY_ERROR_SAMPLE_RATE || '1.0'),

      // Simplified integrations for MVP - removed deprecated integrations
      integrations: [
        // Only add profiling if available
        ...(ProfilingIntegration ? [new ProfilingIntegration()] : []),
      ],

    // Before sending error, filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from request headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Filter sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter(breadcrumb => {
          // Filter out breadcrumbs with sensitive URLs
          if (breadcrumb.category === 'http' && breadcrumb.data?.url) {
            return !breadcrumb.data.url.includes('/api/auth');
          }
          return true;
        });
      }

      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'analisi-tracker',
          version: process.env.npm_package_version || '1.0.0',
          node_version: process.version,
          platform: process.platform,
        },
      };

      return event;
    },

    // Filter sensitive query parameters
    beforeBreadcrumb(breadcrumb, hint) {
      if (breadcrumb.category === 'http' && breadcrumb.data?.url) {
        // Remove sensitive query params from URL
        const url = new URL(breadcrumb.data.url);
        url.searchParams.delete('token');
        url.searchParams.delete('api_key');
        url.searchParams.delete('password');
        breadcrumb.data.url = url.toString();
      }
      return breadcrumb;
    },
    });

    console.log('✅ Sentry error tracking initialized');
  } catch (error) {
    console.warn('⚠️  Sentry initialization failed:', error.message);
    console.warn('   Continuing without error tracking');
  }
}

// Express middleware for request handling
export function setupSentryMiddleware(app) {
  if (!process.env.SENTRY_DSN || process.env.SENTRY_DSN === 'https://your-sentry-dsn-here') {
    return;
  }

  try {
    if (Sentry.Handlers) {
      // Request handler must be first
      if (Sentry.Handlers.requestHandler) {
        app.use(Sentry.Handlers.requestHandler());
      }

      // Tracing handler for performance
      if (Sentry.Handlers.tracingHandler) {
        app.use(Sentry.Handlers.tracingHandler());
      }

      console.log('✅ Sentry Express middleware configured');
    }
  } catch (error) {
    console.warn('⚠️  Sentry middleware setup failed:', error.message);
  }
}

// Error handler (must be last)
export function getSentryErrorHandler() {
  if (!process.env.SENTRY_DSN || process.env.SENTRY_DSN === 'https://your-sentry-dsn-here') {
    return (err, req, res, next) => next(err);
  }
  try {
    if (Sentry.Handlers && Sentry.Handlers.errorHandler) {
      return Sentry.Handlers.errorHandler();
    }
  } catch (error) {
    console.warn('⚠️  Sentry error handler setup failed:', error.message);
  }
  return (err, req, res, next) => next(err);
}

// Capture custom errors with context
export function captureError(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
    console.error('Error:', error);
    return;
  }

  Sentry.withScope((scope) => {
    // Add custom context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });

    // Set severity level
    const level = context.severity || 'error';
    scope.setLevel(level);

    // Add tags
    if (context.tags) {
      Object.keys(context.tags).forEach(key => {
        scope.setTag(key, context.tags[key]);
      });
    }

    // Add user context (anonymized)
    if (context.userId) {
      scope.setUser({
        id: context.userId, // Use anonymized ID
        ip_address: '{{auto}}', // Auto-detect but anonymize
      });
    }

    Sentry.captureException(error);
  });
}

// Capture custom messages
export function captureMessage(message, level = 'info', context = {}) {
  if (!process.env.SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}]`, message);
    return;
  }

  Sentry.withScope((scope) => {
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });

    scope.setLevel(level);

    if (context.tags) {
      Object.keys(context.tags).forEach(key => {
        scope.setTag(key, context.tags[key]);
      });
    }

    Sentry.captureMessage(message, level);
  });
}

// Performance monitoring for async operations
export async function trackPerformance(operationName, fn, context = {}) {
  if (!process.env.SENTRY_DSN) {
    return await fn();
  }

  return await Sentry.startSpan(
    {
      op: operationName,
      description: context.description || operationName,
      data: context,
    },
    async (span) => {
      try {
        const result = await fn();
        span?.setStatus({ code: 1, message: 'success' });
        return result;
      } catch (error) {
        span?.setStatus({ code: 2, message: 'error' });
        throw error;
      }
    }
  );
}

export default {
  initSentry,
  setupSentryMiddleware,
  getSentryErrorHandler,
  captureError,
  captureMessage,
  trackPerformance,
};
