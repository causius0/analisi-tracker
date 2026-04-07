/**
 * Authentication API Routes
 * User registration, login, logout, and token management
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, users, refreshTokens } from '../../db/index.js';
import { eq, and } from 'drizzle-orm';
import {
  authenticate,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../../middleware/auth.js';
import { validateZod, schemas } from '../../middleware/validation.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import { asyncHandler, ValidationError, ConflictError, AuthenticationError } from '../../middleware/errorHandler.js';
import { logger } from '../../middleware/logger.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  authRateLimiter,
  validateZod(schemas.register),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        id: uuidv4(),
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'user',
        isActive: true,
        emailVerified: false
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt
      });

    logger.info('User registered', { userId: newUser[0].id, email });

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser[0]
    });
  })
);

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login',
  authRateLimiter,
  validateZod(schemas.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userRecords.length === 0) {
      throw new AuthenticationError('Invalid email or password');
    }

    const user = userRecords[0];

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('User account is inactive');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await db.insert(refreshTokens).values({
      id: uuidv4(),
      userId: user.id,
      token: refreshToken,
      expiresAt: expiresAt
    });

    // Update last login
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    logger.info('User logged in', { userId: user.id, email });

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  })
);

/**
 * POST /api/auth/logout
 * Logout user and revoke refresh token
 */
router.post('/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    // Revoke refresh token if provided
    if (refreshToken) {
      await db
        .update(refreshTokens)
        .set({
          isRevoked: true,
          revokedAt: new Date()
        })
        .where(eq(refreshTokens.token, refreshToken));
    }

    logger.info('User logged out', { userId: req.user.id });

    res.json({
      message: 'Logout successful'
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
  authRateLimiter,
  validateZod(schemas.refreshToken),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Check if refresh token exists in database and is not revoked
    const tokenRecords = await db
      .select({
        id: refreshTokens.id,
        userId: refreshTokens.userId,
        isRevoked: refreshTokens.isRevoked,
        expiresAt: refreshTokens.expiresAt
      })
      .from(refreshTokens)
      .where(and(
        eq(refreshTokens.token, refreshToken),
        eq(refreshTokens.userId, decoded.userId)
      ))
      .limit(1);

    if (tokenRecords.length === 0) {
      throw new AuthenticationError('Invalid refresh token');
    }

    const tokenRecord = tokenRecords[0];

    // Check if token is revoked
    if (tokenRecord.isRevoked) {
      throw new AuthenticationError('Refresh token has been revoked');
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      throw new AuthenticationError('Refresh token has expired');
    }

    // Get user
    const userRecords = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive
      })
      .from(users)
      .where(eq(users.id, tokenRecord.userId))
      .limit(1);

    if (userRecords.length === 0 || !userRecords[0].isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Generate new access token
    const accessToken = generateAccessToken(userRecords[0].id);

    logger.info('Access token refreshed', { userId: userRecords[0].id });

    res.json({
      message: 'Token refreshed successfully',
      accessToken
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req, res) => {
    // Get full user information
    const userRecords = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (userRecords.length === 0) {
      throw new AuthenticationError('User not found');
    }

    res.json({
      user: userRecords[0]
    });
  })
);

/**
 * POST /api/auth/revoke
 * Revoke all refresh tokens for current user
 */
router.post('/revoke',
  authenticate,
  asyncHandler(async (req, res) => {
    // Revoke all tokens for user
    await db
      .update(refreshTokens)
      .set({
        isRevoked: true,
        revokedAt: new Date()
      })
      .where(eq(refreshTokens.userId, req.user.id));

    logger.info('All tokens revoked for user', { userId: req.user.id });

    res.json({
      message: 'All tokens revoked successfully'
    });
  })
);

export default router;
