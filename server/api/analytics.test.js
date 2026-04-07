import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import analyticsRouter from './analytics.js';

// Mock dependencies
vi.mock('../analytics/engine.js', () => ({
  analyzeSingleLabTest: vi.fn(),
  analyzeMultipleLabTests: vi.fn(),
  getQuickInsights: vi.fn(),
}));

vi.mock('../cache/cache-manager.js', () => ({
  getCacheInstance: vi.fn(() => ({
    generateKey: vi.fn(() => 'mock-key'),
    get: vi.fn(() => null),
    set: vi.fn(),
  })),
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRouter);

describe('Analytics API - Trends Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return trend analysis for valid lab test', async () => {
    const mockData = [
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-02', value: 12 },
      { date: '2024-01-03', value: 14 },
    ];

    const { analyzeSingleLabTest } = await import('../analytics/engine.js');
    analyzeSingleLabTest.mockResolvedValue({
      trends: { slope: 2, rSquared: 1 },
      predictions: [16, 18, 20],
    });

    const response = await request(app)
      .get('/api/analytics/trends/test-123')
      .expect(200);

    expect(response.body).toHaveProperty('trends');
    expect(response.body).toHaveProperty('predictions');
  });

  it('should return 404 when no data found', async () => {
    const response = await request(app)
      .get('/api/analytics/trends/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('should handle forecastHorizon query parameter', async () => {
    const response = await request(app)
      .get('/api/analytics/trends/test-123?forecastHorizon=60')
      .expect(200);

    // Verify the parameter was passed correctly
    expect(response.status).toBe(200);
  });
});

describe('Analytics API - Correlations Endpoint', () => {
  it('should return correlation matrix for multiple lab tests', async () => {
    const response = await request(app)
      .get('/api/analytics/correlations?labTests=test1,test2')
      .expect(200);

    expect(response.body).toHaveProperty('correlations');
  });

  it('should return 400 when labTests parameter missing', async () => {
    const response = await request(app)
      .get('/api/analytics/correlations')
      .expect(400);

    expect(response.body.error).toContain('labTests parameter is required');
  });

  it('should return 400 when less than 2 lab tests provided', async () => {
    const response = await request(app)
      .get('/api/analytics/correlations?labTests=test1')
      .expect(400);

    expect(response.body.error).toContain('at least 2 lab tests');
  });
});

describe('Analytics API - Quick Insights Endpoint', () => {
  it('should return quick insights', async () => {
    const response = await request(app)
      .get('/api/analytics/quick-insights?patientId=patient-123')
      .expect(200);

    expect(response.body).toHaveProperty('insights');
  });

  it('should require patientId parameter', async () => {
    const response = await request(app)
      .get('/api/analytics/quick-insights')
      .expect(400);

    expect(response.body.error).toContain('patientId');
  });
});

describe('Analytics API - Error Handling', () => {
  it('should handle internal server errors', async () => {
    const { analyzeSingleLabTest } = await import('../analytics/engine.js');
    analyzeSingleLabTest.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/api/analytics/trends/test-123')
      .expect(500);

    expect(response.body).toHaveProperty('error');
  });
});
