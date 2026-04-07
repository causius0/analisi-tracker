/**
 * Performance Monitoring
 * Tracks API response times, database queries, and system metrics
 */

import { createLogger } from './logger.js';

const logger = createLogger('performance');

// Performance metrics storage
const metrics = {
  api: {
    requests: new Map(), // path -> { count, totalDuration, errors, statusCodes }
  },
  database: {
    queries: new Map(), // operation -> { count, totalDuration }
  },
  cache: {
    operations: new Map(), // operation -> { count, hits, misses, totalDuration }
  },
  system: {
    memory: [],
    cpu: [],
    eventLoopDelay: [],
  },
};

// Track API request
export function trackAPIRequest(req, res, next) {
  const startTime = Date.now();
  const path = req.route?.path || req.path;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Store metrics
    if (!metrics.api.requests.has(path)) {
      metrics.api.requests.set(path, {
        count: 0,
        totalDuration: 0,
        errors: 0,
        statusCodes: {},
      });
    }

    const pathMetrics = metrics.api.requests.get(path);
    pathMetrics.count++;
    pathMetrics.totalDuration += duration;

    if (statusCode >= 400) {
      pathMetrics.errors++;
    }

    pathMetrics.statusCodes[statusCode] = (pathMetrics.statusCodes[statusCode] || 0) + 1;

    // Log slow requests
    if (duration > 1000) {
      logger.warn({
        type: 'slow_request',
        path,
        method: req.method,
        duration,
        statusCode,
      });
    }
  });

  next();
}

// Track database query
export function trackDatabaseQuery(operation, query, duration) {
  if (!metrics.database.queries.has(operation)) {
    metrics.database.queries.set(operation, {
      count: 0,
      totalDuration: 0,
    });
  }

  const opMetrics = metrics.database.queries.get(operation);
  opMetrics.count++;
  opMetrics.totalDuration += duration;

  // Log slow queries
  if (duration > 500) {
    logger.warn({
      type: 'slow_query',
      operation,
      query: query.substring(0, 100),
      duration,
    });
  }
}

// Track cache operation
export function trackCacheOperation(operation, key, hit, duration) {
  if (!metrics.cache.operations.has(operation)) {
    metrics.cache.operations.set(operation, {
      count: 0,
      hits: 0,
      misses: 0,
      totalDuration: 0,
    });
  }

  const cacheMetrics = metrics.cache.operations.get(operation);
  cacheMetrics.count++;
  cacheMetrics.totalDuration += duration;

  if (hit) {
    cacheMetrics.hits++;
  } else {
    cacheMetrics.misses++;
  }
}

// Calculate percentiles
function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

// Get API metrics
export function getAPIMetrics() {
  const results = [];

  for (const [path, data] of metrics.api.requests.entries()) {
    const avgDuration = data.totalDuration / data.count;
    const errorRate = (data.errors / data.count) * 100;

    results.push({
      path,
      requests: data.count,
      avgDuration: Math.round(avgDuration),
      totalDuration: data.totalDuration,
      errors: data.errors,
      errorRate: errorRate.toFixed(2) + '%',
      statusCodes: data.statusCodes,
    });
  }

  // Sort by total duration (slowest first)
  return results.sort((a, b) => b.totalDuration - a.totalDuration);
}

// Get database metrics
export function getDatabaseMetrics() {
  const results = [];

  for (const [operation, data] of metrics.database.queries.entries()) {
    const avgDuration = data.totalDuration / data.count;

    results.push({
      operation,
      queries: data.count,
      avgDuration: Math.round(avgDuration),
      totalDuration: data.totalDuration,
    });
  }

  return results.sort((a, b) => b.totalDuration - a.totalDuration);
}

// Get cache metrics
export function getCacheMetrics() {
  const results = [];

  for (const [operation, data] of metrics.cache.operations.entries()) {
    const hitRate = data.count > 0 ? (data.hits / data.count) * 100 : 0;
    const avgDuration = data.totalDuration / data.count;

    results.push({
      operation,
      operations: data.count,
      hits: data.hits,
      misses: data.misses,
      hitRate: hitRate.toFixed(2) + '%',
      avgDuration: Math.round(avgDuration),
    });
  }

  return results;
}

// Get system metrics
export function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
    },
    cpu: {
      user: cpuUsage.user + ' μs',
      system: cpuUsage.system + ' μs',
    },
    uptime: Math.round(process.uptime()) + ' s',
    pid: process.pid,
  };
}

// Get all metrics
export function getAllMetrics() {
  return {
    api: getAPIMetrics(),
    database: getDatabaseMetrics(),
    cache: getCacheMetrics(),
    system: getSystemMetrics(),
  };
}

// Reset metrics
export function resetMetrics() {
  metrics.api.requests.clear();
  metrics.database.queries.clear();
  metrics.cache.operations.clear();
  metrics.system.memory = [];
  metrics.system.cpu = [];
  metrics.system.eventLoopDelay = [];
}

// Monitor event loop delay
export function startEventLoopMonitoring() {
  let lastTime = Date.now();

  setInterval(() => {
    const now = Date.now();
    const delay = now - lastTime - 100; // Expected 100ms interval

    metrics.system.eventLoopDelay.push(delay);

    // Keep only last 100 measurements
    if (metrics.system.eventLoopDelay.length > 100) {
      metrics.system.eventLoopDelay.shift();
    }

    // Alert on high delay
    if (delay > 100) {
      logger.warn({
        type: 'high_event_loop_delay',
        delay,
      });
    }

    lastTime = now;
  }, 100).unref();
}

// Monitor memory usage
export function startMemoryMonitoring() {
  setInterval(() => {
    const memUsage = process.memoryUsage();

    metrics.system.memory.push({
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      timestamp: Date.now(),
    });

    // Keep only last 100 measurements
    if (metrics.system.memory.length > 100) {
      metrics.system.memory.shift();
    }

    // Alert on high memory usage
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      logger.warn({
        type: 'high_memory_usage',
        heapUsed: heapUsedMB.toFixed(2) + ' MB',
      });
    }
  }, 5000).unref(); // Every 5 seconds
}

// Get performance summary
export function getPerformanceSummary() {
  const apiMetrics = getAPIMetrics();
  const dbMetrics = getDatabaseMetrics();
  const cacheMetrics = getCacheMetrics();
  const sysMetrics = getSystemMetrics();

  const totalRequests = apiMetrics.reduce((sum, m) => sum + m.requests, 0);
  const totalErrors = apiMetrics.reduce((sum, m) => sum + m.errors, 0);
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  const avgResponseTime = apiMetrics.length > 0
    ? apiMetrics.reduce((sum, m) => sum + m.avgDuration, 0) / apiMetrics.length
    : 0;

  const cacheHits = cacheMetrics.reduce((sum, m) => sum + m.hits, 0);
  const cacheMisses = cacheMetrics.reduce((sum, m) => sum + m.misses, 0);
  const cacheHitRate = (cacheHits + cacheMisses) > 0
    ? (cacheHits / (cacheHits + cacheMisses)) * 100
    : 0;

  return {
    api: {
      totalRequests,
      totalErrors,
      errorRate: errorRate.toFixed(2) + '%',
      avgResponseTime: Math.round(avgResponseTime) + ' ms',
      endpoints: apiMetrics.length,
    },
    database: {
      totalQueries: dbMetrics.reduce((sum, m) => sum + m.queries, 0),
      avgQueryTime: Math.round(
        dbMetrics.reduce((sum, m) => sum + m.avgDuration, 0) / (dbMetrics.length || 1)
      ) + ' ms',
    },
    cache: {
      hitRate: cacheHitRate.toFixed(2) + '%',
      totalOperations: cacheHits + cacheMisses,
    },
    system: sysMetrics,
  };
}

export default {
  trackAPIRequest,
  trackDatabaseQuery,
  trackCacheOperation,
  getAPIMetrics,
  getDatabaseMetrics,
  getCacheMetrics,
  getSystemMetrics,
  getAllMetrics,
  resetMetrics,
  startEventLoopMonitoring,
  startMemoryMonitoring,
  getPerformanceSummary,
};
