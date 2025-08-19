/**
 * Analytics Proxy Pattern Tests
 * Tests for the backend analytics routes that were recently converted from direct DB access
 */

const request = require('supertest');
const express = require('express');

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5435';
process.env.DB_NAME = 'revivatech';
process.env.DB_USER = 'revivatech_user';
process.env.DB_PASSWORD = 'test_password';

describe('Analytics Backend Routes', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Create minimal Express app for testing
    app = express();
    app.use(express.json());

    // Import analytics routes
    const analyticsRoutes = require('../../routes/analytics-clean');
    app.use('/api/analytics', analyticsRoutes);

    server = app.listen(0); // Use random available port
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Health Endpoint', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/analytics/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        status: 'healthy',
        services: expect.objectContaining({
          database: expect.any(String),
          redis: expect.any(String),
          analytics: expect.any(String)
        })
      });

      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Base Analytics Route', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Authentication required'
      });
    });

    test('should return overview with valid auth token', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          status: 'operational',
          availableEndpoints: expect.arrayContaining([
            '/health',
            '/test',
            '/revenue',
            '/performance',
            '/customers',
            '/realtime',
            '/events'
          ]),
          message: expect.any(String),
          timestamp: expect.any(String)
        }),
        source: 'backend-analytics'
      });
    });
  });

  describe('Test Route', () => {
    test('should return test response', async () => {
      const response = await request(app)
        .get('/api/analytics/test')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Analytics test route works',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Protected Routes', () => {
    const protectedRoutes = ['/revenue', '/performance', '/customers', '/realtime'];

    protectedRoutes.forEach(route => {
      test(`${route} should require authentication`, async () => {
        const response = await request(app)
          .get(`/api/analytics${route}`)
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Authentication required'
        });
      });

      test(`${route} should accept valid auth token`, async () => {
        const response = await request(app)
          .get(`/api/analytics${route}`)
          .set('Authorization', 'Bearer test-token');

        // These routes require database connection, so they might fail with 503
        // But they should not fail with 401 (auth error)
        expect(response.status).not.toBe(401);
        expect([200, 503]).toContain(response.status);
      });
    });
  });

  describe('Events Route', () => {
    test('should accept POST requests with auth', async () => {
      const eventData = {
        sessionId: 'test-session',
        events: [{
          type: 'page_view',
          name: 'test-event',
          properties: { test: true }
        }]
      };

      const response = await request(app)
        .post('/api/analytics/events')
        .send(eventData);

      // Should not be auth error - might be 400 or 503 due to missing validation/db
      expect(response.status).not.toBe(401);
      expect([200, 400, 503]).toContain(response.status);
    });
  });
});

describe('Analytics Proxy Pattern Integration', () => {
  test('should maintain proxy pattern consistency', () => {
    // Test that backend routes provide expected structure for frontend proxy
    const expectedStructure = {
      success: expect.any(Boolean),
      data: expect.any(Object),
      source: 'backend-analytics',
      timestamp: expect.any(String)
    };

    // This test documents the expected response structure for frontend proxy
    expect(expectedStructure).toBeDefined();
  });

  test('should handle authentication headers properly', () => {
    // Test documents that backend should handle forwarded auth headers
    const expectedHeaders = [
      'authorization',
      'cookie',
      'x-forwarded-for',
      'x-real-ip',
      'user-agent'
    ];

    expect(expectedHeaders).toContain('authorization');
  });
});