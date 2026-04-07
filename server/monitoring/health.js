/**
 * Health Check System
 * Provides comprehensive health checks for application components
 */

import { createLogger } from './logger.js';
import { getCacheInstance } from '../cache/cache-manager.js';

const logger = createLogger('health');

// Health check registry
const healthChecks = new Map();

// Register a health check
export function registerHealthCheck(name, checkFn) {
  healthChecks.set(name, checkFn);
  logger.info({ type: 'health_check_registered', name });
}

// Run a single health check
async function runHealthCheck(name, checkFn) {
  const startTime = Date.now();

  try {
    const result = await checkFn();
    const duration = Date.now() - startTime;

    return {
      name,
      status: 'healthy',
      duration: duration + 'ms',
      ...result,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error({
      type: 'health_check_failed',
      name,
      error: error.message,
      duration,
    });

    return {
      name,
      status: 'unhealthy',
      duration: duration + 'ms',
      error: error.message,
    };
  }
}

// Run all health checks
export async function runHealthChecks() {
  const results = await Promise.all(
    Array.from(healthChecks.entries()).map(([name, checkFn]) =>
      runHealthCheck(name, checkFn)
    )
  );

  const overallStatus = results.every(r => r.status === 'healthy')
    ? 'healthy'
    : 'degraded';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks: results,
  };
}

// Default health checks

// Memory check
registerHealthCheck('memory', async () => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;

  if (heapUsedMB > 1000) {
    throw new Error(`High memory usage: ${heapUsedMB.toFixed(2)} MB`);
  }

  return {
    heapUsed: heapUsedMB.toFixed(2) + ' MB',
    heapTotal: heapTotalMB.toFixed(2) + ' MB',
    usage: ((heapUsedMB / heapTotalMB) * 100).toFixed(2) + '%',
  };
});

// Event loop check
registerHealthCheck('event_loop', async () => {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    setImmediate(() => {
      const delay = Date.now() - start;

      if (delay > 100) {
        reject(new Error(`High event loop delay: ${delay}ms`));
      } else {
        resolve({ delay: delay + 'ms' });
      }
    });
  });
});

// Disk space check - delegated to external monitoring
registerHealthCheck('disk_space', async () => {
  // Skip disk space check - use external monitoring (Datadog, New Relic, etc.)
  return {
    status: 'skipped',
    reason: 'Use external monitoring service',
  };
});

// Database connection check
registerHealthCheck('database', async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return {
      status: 'skipped',
      reason: 'DATABASE_URL not configured',
      type: 'none',
    };
  }

  // Dynamically import to avoid crashing when DB is not configured
  const { db } = await import('../db/index.js');
  const { sql } = await import('drizzle-orm');

  const start = Date.now();
  await db.execute(sql`SELECT 1`);
  const latency = Date.now() - start;

  return {
    type: 'postgres',
    latency: latency + 'ms',
  };
});

// Cache connection check
registerHealthCheck('cache', async () => {
  const cache = getCacheInstance();

  // Verify read/write with a probe key
  const probeKey = '__health_probe__';
  const probeValue = Date.now();
  cache.set(probeKey, probeValue, 10); // TTL 10s
  const retrieved = cache.get(probeKey);

  if (retrieved !== probeValue) {
    throw new Error('Cache read/write verification failed');
  }

  cache.del(probeKey);
  const stats = cache.getStats();

  return {
    type: 'memory',
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
  };
});

// External API check - validates API keys are configured
registerHealthCheck('external_apis', async () => {
  const apis = [
    { name: 'openai', key: process.env.OPENAI_API_KEY },
    { name: 'anthropic', key: process.env.ANTHROPIC_API_KEY },
  ];

  const results = apis.map(({ name, key }) => ({
    name,
    configured: Boolean(key),
  }));

  const configured = results.filter(a => a.configured);
  const missing = results.filter(a => !a.configured).map(a => a.name);

  if (configured.length === 0) {
    throw new Error(`No AI API keys configured (checked: ${apis.map(a => a.name).join(', ')})`);
  }

  return {
    configured: configured.map(a => a.name),
    ...(missing.length > 0 && { notConfigured: missing }),
  };
});

// Express middleware for health endpoint
export function healthCheckMiddleware(req, res) {
  // Quick health check (doesn't run all checks)
  if (req.query.quick === 'true') {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
    return;
  }

  // Run all health checks (this might take a few seconds)
  runHealthChecks()
    .then(results => {
      const statusCode = results.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(results);
    })
    .catch(error => {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });
}

// Readiness check (for Kubernetes)
export async function readinessCheck(req, res) {
  // Readiness means the app is ready to accept traffic
  // This is simpler than liveness and should return quickly
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
}

// Liveness check (for Kubernetes)
export async function livenessCheck(req, res) {
  // Liveness means the app is still running and not deadlocked
  const startTime = Date.now();

  try {
    // Check if event loop is responsive
    await new Promise((resolve, reject) => {
      setImmediate(() => {
        const delay = Date.now() - startTime;
        if (delay > 5000) {
          reject(new Error('Event loop blocked'));
        } else {
          resolve();
        }
      });
    });

    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'dead',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

export default {
  registerHealthCheck,
  runHealthChecks,
  healthCheckMiddleware,
  readinessCheck,
  livenessCheck,
};
