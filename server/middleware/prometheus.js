/**
 * Prometheus Metrics Middleware
 * Production-ready metrics collection for monitoring
 */

import promClient from 'prom-client';

// Create Registry
export const register = new promClient.Registry();

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'analisi_tracker_',
});

// HTTP request duration histogram
export const httpRequestDuration = new promClient.Histogram({
  name: 'analisi_tracker_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// HTTP request count counter
export const httpRequestsTotal = new promClient.Counter({
  name: 'analisi_tracker_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Redis operation duration
export const redisOperationDuration = new promClient.Histogram({
  name: 'analisi_tracker_redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

// Analytics computation duration
export const analyticsComputationDuration = new promClient.Histogram({
  name: 'analisi_tracker_analytics_computation_duration_seconds',
  help: 'Duration of analytics computations in seconds',
  labelNames: ['computation_type', 'data_points'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

// Cache hit/miss ratio
export const cacheHits = new promClient.Counter({
  name: 'analisi_tracker_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
});

export const cacheMisses = new promClient.Counter({
  name: 'analisi_tracker_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
});

// Active connections gauge
export const activeConnections = new promClient.Gauge({
  name: 'analisi_tracker_active_connections',
  help: 'Number of active connections',
});

// Data import operations
export const dataImportOperations = new promClient.Counter({
  name: 'analisi_tracker_data_import_operations_total',
  help: 'Total number of data import operations',
  labelNames: ['source', 'status'],
});

// PDF processing duration
export const pdfProcessingDuration = new promClient.Histogram({
  name: 'analisi_tracker_pdf_processing_duration_seconds',
  help: 'Duration of PDF processing in seconds',
  labelNames: ['pages', 'status'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
});

// Export operations
export const exportOperations = new promClient.Counter({
  name: 'analisi_tracker_export_operations_total',
  help: 'Total number of export operations',
  labelNames: ['format', 'status'],
});

// Middleware to track HTTP requests
export function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });

  next();
}

// Metrics endpoint
export function metricsEndpoint(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

// Helper to track analytics computations
export function trackAnalyticsComputation(type, dataPoints, fn) {
  return new Promise((resolve, reject) => {
    const end = analyticsComputationDuration.startTimer({
      computation_type: type,
      data_points: dataPoints,
    });

    fn()
      .then(result => {
        end();
        resolve(result);
      })
      .catch(error => {
        end();
        reject(error);
      });
  });
}

// Helper to track Redis operations
export function trackRedisOperation(operation, fn) {
  return new Promise((resolve, reject) => {
    const end = redisOperationDuration.startTimer({ operation });

    fn()
      .then(result => {
        end({ status: 'success' });
        resolve(result);
      })
      .catch(error => {
        end({ status: 'error' });
        reject(error);
      });
  });
}

// Helper to track cache operations
export function trackCacheHit(cacheType) {
  cacheHits.labels(cacheType).inc();
}

export function trackCacheMiss(cacheType) {
  cacheMisses.labels(cacheType).inc();
}

// Helper to track data imports
export function trackDataImport(source, status) {
  dataImportOperations.labels(source, status).inc();
}

// Helper to track PDF processing
export function trackPDFProcessing(pages, fn) {
  return new Promise((resolve, reject) => {
    const end = pdfProcessingDuration.startTimer({ pages });

    fn()
      .then(result => {
        end({ status: 'success' });
        resolve(result);
      })
      .catch(error => {
        end({ status: 'error' });
        reject(error);
      });
  });
}

// Helper to track exports
export function trackExport(format, status) {
  exportOperations.labels(format, status).inc();
}

// Health check with metrics
export function healthWithMetrics(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics: {
      httpRequests: httpRequestsTotal.hashMap,
      activeConnections: activeConnections.value,
    },
  };

  res.json(health);
}
