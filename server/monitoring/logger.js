/**
 * Structured Logging System
 * Provides JSON-structured logging with Pino for better observability
 */

import pino from 'pino';
import pinoPretty from 'pino-pretty';

// Log levels
const levels = {
  silent: Number.POSITIVE_INFINITY,
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

// Create logger instance
const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Remove Pio-specific properties in production
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    // Base context for all logs
    base: {
      app: 'analisi-tracker',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    },
    // Redact sensitive fields
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]',
        'req.body.password',
        'req.body.token',
        'req.body.apiKey',
        'req.query.token',
        'req.query.api_key',
      ],
      remove: true,
    },
  },
  // Pretty print in development, JSON in production
  process.env.NODE_ENV === 'development'
    ? pinoPretty({
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: (log, messageKey) => {
          const level = log.level.toUpperCase().padEnd(5);
          const time = log.time;
          const msg = log[messageKey];
          const context = log.context ? `[${log.context}]` : '';
          return `${time} ${level} ${context} ${msg}`;
        },
      })
    : undefined // Use default JSON output in production
);

// Child logger with context
export function createLogger(context) {
  return logger.child({ context });
}

// Specialized loggers for different components
export const loggers = {
  api: createLogger('api'),
  analytics: createLogger('analytics'),
  cache: createLogger('cache'),
  database: createLogger('database'),
  auth: createLogger('auth'),
  scheduler: createLogger('scheduler'),
  monitoring: createLogger('monitoring'),
};

// API request logger
export function logAPIRequest(req, res, next) {
  const startTime = Date.now();

  // Log request
  logger.info({
    type: 'api_request',
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info({
      type: 'api_response',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: duration,
      contentLength: res.get('content-length'),
    });
  });

  next();
}

// Performance logger
export function logPerformance(operation, duration, metadata = {}) {
  logger.info({
    type: 'performance',
    operation,
    duration,
    ...metadata,
  });
}

// Error logger with context
export function logError(error, context = {}) {
  logger.error({
    type: 'error',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    },
    ...context,
  });
}

// Security event logger
export function logSecurityEvent(event, details) {
  logger.warn({
    type: 'security_event',
    event,
    ...details,
  });
}

// Business event logger
export function logBusinessEvent(event, details) {
  logger.info({
    type: 'business_event',
    event,
    ...details,
  });
}

// System health logger
export function logHealthCheck(status, details) {
  logger.info({
    type: 'health_check',
    status,
    ...details,
  });
}

// Database query logger
export function logDatabaseQuery(query, duration, metadata = {}) {
  logger.debug({
    type: 'database_query',
    query: query.substring(0, 100), // Truncate long queries
    duration,
    ...metadata,
  });
}

// Cache operation logger
export function logCacheOperation(operation, key, hit, duration) {
  logger.debug({
    type: 'cache_operation',
    operation,
    key,
    hit,
    duration,
  });
}

// Export default logger
export default logger;
