/**
 * Authentication API Integration Tests
 */

import request from 'supertest';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../../server/index-new.js';
import { db, users, refreshTokens } from '../../server/db/index.js';
import { eq } from 'drizzle-orm';

describe('Authentication API', () => {
  let testUserId;

  beforeAll(async () => {
    // Clean up test data
    await db.delete(users).where(eq(users.email, 'testauth@example.com'));
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(users).where(eq(users.email, 'testauth@example.com'));
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testauth@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'Auth'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'testauth@example.com');
      expect(response.body.user).not.toHaveProperty('passwordHash');

      testUserId = response.body.user.id;
    });

    test('should fail with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testauth@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'Auth'
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });

    test('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'Auth'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    test('should fail with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'Auth'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testauth@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', 'testauth@example.com');
    });

    test('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testauth@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken;

    beforeAll(async () => {
      // Login to get access token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testauth@example.com',
          password: 'password123'
        });

      accessToken = response.body.accessToken;
    });

    test('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'testauth@example.com');
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
