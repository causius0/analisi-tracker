/**
 * Authentication Middleware
 * JWT-based authentication and authorization
 * SINGLE-USER VERSION (no database user table)
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

// For single-user mode, use a fixed user ID
const SINGLE_USER_ID = process.env.SINGLE_USER_ID || '00000000-0000-0000-0000-000000000001';

/**
 * Generate access token
 */
export function generateAccessToken(userId = SINGLE_USER_ID) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '15m' } // Access tokens expire in 15 minutes
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId = SINGLE_USER_ID) {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // Refresh tokens expire in 7 days
  );
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Authentication middleware for Express routes
 * Validates JWT token and attaches user to request
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please provide a valid access token'
    });
  }

  try {
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Your access token is invalid or expired'
      });
    }

    // Attach user info to request
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Token verification failed',
      message: error.message
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token present, but doesn't require it
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.userId = decoded.userId;
      }
    } catch (error) {
      // Ignore errors in optional auth
    }
  }

  next();
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(userId = SINGLE_USER_ID) {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(refreshToken) {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return null;
    }

    return generateAccessToken(decoded.userId);
  } catch (error) {
    return null;
  }
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  authenticateToken,
  optionalAuth,
  generateTokenPair,
  refreshAccessToken,
};
