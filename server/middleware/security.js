/**
 * Security Middleware
 * Helmet, CORS, and other security measures
 */

import helmet from 'helmet';
import cors from 'cors';

/**
 * Configure Helmet for security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * Configure CORS
 */
export const corsConfig = cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:5173'];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
});

/**
 * Request size limiter
 */
export const requestSizeLimiter = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB

  req.on('data', (chunk) => {
    if (req.headers['content-length'] > maxSize) {
      return res.status(413).json({
        error: 'Payload too large',
        message: `Request body exceeds ${maxSize / 1024 / 1024}MB limit`
      });
    }
  });

  next();
};

/**
 * Remove sensitive data from responses
 */
export function sanitizeResponse(req, res, next) {
  const originalSend = res.json;

  res.json = function (data) {
    // Remove sensitive fields from response
    if (data.passwordHash) delete data.passwordHash;
    if (data.password) delete data.password;
    if (data.token) delete data.token;
    if (data.refreshToken) delete data.refreshToken;

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Prevent parameter pollution
 */
export function preventParameterPollution(req, res, next) {
  const whitelist = ['sort', 'fields', 'labTests'];

  for (const key in req.query) {
    if (!whitelist.includes(key) && Array.isArray(req.query[key])) {
      req.query[key] = req.query[key][0];
    }
  }

  next();
}

/**
 * Add security headers
 */
export function addSecurityHeaders(req, res, next) {
  // Add additional custom headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
}
