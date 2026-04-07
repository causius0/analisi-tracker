/**
 * Rate Limiting Middleware
 * Express rate limiter and slow down protection
 */

import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

/**
 * General rate limiter
 * Applied to all routes
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many authentication attempts from this IP, please try again later'
  },
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * API rate limiter
 * More lenient for authenticated API calls
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  message: {
    error: 'Too many API requests',
    message: 'Too many API requests from this IP, please try again later'
  }
});

/**
 * Upload rate limiter
 * Very strict for file uploads
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: {
    error: 'Too many uploads',
    message: 'Too many file uploads from this IP, please try again later'
  }
});

/**
 * Export rate limiter
 * Strict for data exports
 */
export const exportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 exports per hour
  message: {
    error: 'Too many exports',
    message: 'Too many export requests from this IP, please try again later'
  }
});

/**
 * Slow down middleware
 * Gradually slows down responses instead of blocking
 */
export const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  skip: (req) => {
    // Skip for health checks
    return req.path === '/health';
  }
});

/**
 * User-specific rate limiter
 * Limits requests per user (requires authentication)
 */
export function createUserRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    skipSuccessfulRequests = false
  } = options;

  // Store request counts per user in memory
  const userRequests = new Map();

  return async (req, res, next) => {
    if (!req.user) {
      return next(); // Skip if not authenticated
    }

    const userId = req.user.id;
    const now = Date.now();

    // Clean old entries
    for (const [key, value] of userRequests.entries()) {
      if (now - value.timestamp > windowMs) {
        userRequests.delete(key);
      }
    }

    // Get or create user record
    const userKey = `${userId}-${Math.floor(now / windowMs)}`;
    const userRecord = userRequests.get(userKey) || { count: 0, timestamp: now };

    // Check if limit exceeded
    if (userRecord.count >= max) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `User rate limit exceeded. Maximum ${max} requests per ${windowMs / 60000} minutes.`
      });
    }

    // Increment counter
    userRecord.count++;
    userRequests.set(userKey, userRecord);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - userRecord.count);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
}
