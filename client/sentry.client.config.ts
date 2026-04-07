/**
 * Sentry Client Configuration for Next.js
 * Captures frontend errors and performance data
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV;
const SENTRY_RELEASE = process.env.NEXT_PUBLIC_SENTRY_RELEASE;

// Only initialize Sentry if DSN is configured
if (SENTRY_DSN) {
  try {
    Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT || 'development',
  release: SENTRY_RELEASE,

  // Performance monitoring
  tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  replaysSessionSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1'),
  replaysOnErrorSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE || '1.0'),

  // Error sampling
  sampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_ERROR_SAMPLE_RATE || '1.0'),

  // Integrations
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Tracing options
  tracePropagationTargets: ['localhost', 'analisi-tracker.com', /^\//],

  // Before send error
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['x-api-key'];
    }

    // Filter sensitive URLs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.filter(breadcrumb => {
        if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
          const url = breadcrumb.data?.url || '';
          // Filter out auth and sensitive endpoints
          return !url.includes('/auth/') && !url.includes('/api/auth');
        }
        return true;
      });
    }

    // Add custom context
    event.contexts = {
      ...event.contexts,
      app: {
        name: 'analisi-tracker-client',
        version: process.env.npm_package_version || '1.0.0',
      },
      browser: {
        name: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        online: navigator.onLine,
      },
    };

    return event;
  },

  // Filter sensitive data from breadcrumbs
  beforeBreadcrumb(breadcrumb, hint) {
    if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
      const url = breadcrumb.data?.url || '';

      // Remove sensitive query params
      try {
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.delete('token');
        urlObj.searchParams.delete('api_key');
        urlObj.searchParams.delete('password');
        if (breadcrumb.data) {
          breadcrumb.data.url = urlObj.toString();
        }
      } catch (e) {
        // Invalid URL, keep as is
      }
    }

    return breadcrumb;
  },

  // Set user context (anonymized)
  initialScope: (scope) => {
    // Generate anonymous session ID
    const sessionId = sessionStorage.getItem('sentry_session_id') ||
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('sentry_session_id', sessionId);

    scope.setUser({
      id: sessionId, // Anonymous session ID
      ip_address: '{{auto}}',
    });

    return scope;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Random plugins/extensions
    'top.GLOBALS',
    // Random browser extensions
    /react\W*devtools/i,
    // Facebook flakiness
    /facebook/i,
    // Chrome extensions
    /chrome-extension/i,
    // Network errors that are not actionable
    /Network\s?Error/i,
    /Failed to fetch/i,
  ],

  // Ignore specific URLs
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    // Facebook flakiness
    /graph\.facebook\.com/i,
    // Google flakiness
    /\/(google|googlesyndication)\.com/i,
  ],

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Environment-specific settings
  enabled: !!SENTRY_DSN,

  // Attach stacktrace to all messages
  attachStacktrace: true,

  // Normalize stack traces
  normalizeDepth: 5,

  // Maximum number of breadcrumbs
  maxBreadcrumbs: 50,

  // Send PII defaults
  sendDefaultPii: false,
});
  } catch (error) {
    console.warn('[Sentry] Failed to initialize:', error);
  }
} else {
  console.log('[Sentry] Disabled - No DSN configured');
}

// Export Sentry for manual error tracking
export { Sentry };

// Helper function to capture errors
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
}

// Helper function to capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureMessage(message, level);
  });
}

// Helper function to track user interactions
export function trackUserInteraction(action: string, details?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: 'user',
    message: action,
    level: 'info',
    data: details,
  });
}

// Helper function to set user context
export function setUserContext(user: { id?: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id || anonymousId(),
    email: user.email ? hashEmail(user.email) : undefined,
    username: user.username,
  });
}

// Generate anonymous ID
function anonymousId() {
  let id = localStorage.getItem('anonymous_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('anonymous_id', id);
  }
  return id;
}

// Simple hash function for email (not cryptographically secure)
function hashEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'hashed_' + Math.abs(hash).toString(16);
}

export default Sentry;
