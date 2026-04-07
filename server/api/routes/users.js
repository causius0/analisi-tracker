/**
 * Users API Routes
 * User profile and preferences management
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { db, users, userPreferences } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateZod, schemas } from '../../middleware/validation.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';
import { asyncHandler, ValidationError, NotFoundError } from '../../middleware/errorHandler.js';
import { logger } from '../../middleware/logger.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile',
  asyncHandler(async (req, res) => {
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
      throw new NotFoundError('User not found');
    }

    res.json({
      user: userRecords[0]
    });
  })
);

/**
 * PATCH /api/users/profile
 * Update current user profile
 */
router.patch('/profile',
  validateZod(schemas.updateUser),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUsers.length > 0) {
        throw new ValidationError('Email already in use');
      }
    }

    // Update user
    const updatedUsers = await db
      .update(users)
      .set({
        firstName: firstName || req.user.firstName,
        lastName: lastName || req.user.lastName,
        email: email || req.user.email,
        updatedAt: new Date()
      })
      .where(eq(users.id, req.user.id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        updatedAt: users.updatedAt
      });

    logger.info('User profile updated', { userId: req.user.id });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUsers[0]
    });
  })
);

/**
 * POST /api/users/change-password
 * Change user password
 */
router.post('/change-password',
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long');
    }

    // Get current user with password hash
    const userRecords = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (userRecords.length === 0) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userRecords[0].passwordHash);

    if (!isValidPassword) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, req.user.id));

    logger.info('User password changed', { userId: req.user.id });

    res.json({
      message: 'Password changed successfully'
    });
  })
);

/**
 * GET /api/users/preferences
 * Get user preferences
 */
router.get('/preferences',
  asyncHandler(async (req, res) => {
    const prefRecords = await db
      .select({
        id: userPreferences.id,
        preferences: userPreferences.preferences,
        updatedAt: userPreferences.updatedAt
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, req.user.id))
      .limit(1);

    if (prefRecords.length === 0) {
      // Return default preferences if none exist
      return res.json({
        preferences: {
          theme: 'light',
          language: 'en',
          units: 'metric',
          dateFormat: 'MM/DD/YYYY',
          notifications: {
            email: true,
            push: false,
            insights: true
          }
        }
      });
    }

    res.json({
      preferences: prefRecords[0].preferences
    });
  })
);

/**
 * PUT /api/users/preferences
 * Update user preferences
 */
router.put('/preferences',
  validateZod(schemas.updatePreferences),
  asyncHandler(async (req, res) => {
    const { preferences } = req.body;

    // Check if preferences exist
    const existingPrefs = await db
      .select({ id: userPreferences.id })
      .from(userPreferences)
      .where(eq(userPreferences.userId, req.user.id))
      .limit(1);

    let result;

    if (existingPrefs.length === 0) {
      // Create new preferences
      const newPrefs = await db
        .insert(userPreferences)
        .values({
          id: crypto.randomUUID(),
          userId: req.user.id,
          preferences,
          updatedAt: new Date()
        })
        .returning();

      result = newPrefs[0];
    } else {
      // Update existing preferences
      const updatedPrefs = await db
        .update(userPreferences)
        .set({
          preferences,
          updatedAt: new Date()
        })
        .where(eq(userPreferences.userId, req.user.id))
        .returning();

      result = updatedPrefs[0];
    }

    logger.info('User preferences updated', { userId: req.user.id });

    res.json({
      message: 'Preferences updated successfully',
      preferences: result.preferences
    });
  })
);

/**
 * DELETE /api/users/account
 * Delete user account (soft delete by setting isActive to false)
 */
router.delete('/account',
  asyncHandler(async (req, res) => {
    // Soft delete (set isActive to false)
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, req.user.id));

    logger.info('User account deactivated', { userId: req.user.id });

    res.json({
      message: 'Account deactivated successfully'
    });
  })
);

/**
 * GET /api/users/:userId
 * Get user by ID (admin only)
 */
router.get('/:userId',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

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
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecords.length === 0) {
      throw new NotFoundError('User not found');
    }

    res.json({
      user: userRecords[0]
    });
  })
);

/**
 * PATCH /api/users/:userId
 * Update user by ID (admin only)
 */
router.patch('/:userId',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role, isActive, emailVerified } = req.body;

    // Build update object
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;
    updateData.updatedAt = new Date();

    const updatedUsers = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        updatedAt: users.updatedAt
      });

    if (updatedUsers.length === 0) {
      throw new NotFoundError('User not found');
    }

    logger.info('User updated by admin', { userId, adminId: req.user.id });

    res.json({
      message: 'User updated successfully',
      user: updatedUsers[0]
    });
  })
);

/**
 * GET /api/users
 * List all users (admin only)
 */
router.get('/',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;

    const allUsers = await db
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
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    // Get total count
    const countResult = await db
      .select({ count: users.id })
      .from(users);

    res.setHeader('X-Total-Count', countResult.length.toString());

    res.json({
      users: allUsers,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: countResult.length
      }
    });
  })
);

export default router;
