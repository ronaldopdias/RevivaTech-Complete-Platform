// CRM Status Check API
// Public endpoint for basic CRM integration status (no auth required)

import { NextRequest } from 'next/server';
import { ApiMiddleware } from '@/lib/api/middleware';
import crmWebhookService from '@/lib/services/crmWebhookService';

// GET /api/crm/status - Get basic CRM integration status (public endpoint)
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      // Check CRM health without exposing sensitive information
      const healthStatus = await crmWebhookService.checkHealth();
      
      const publicStatus = {
        service: 'CRM Integration',
        healthy: healthStatus.healthy,
        lastChecked: new Date().toISOString(),
        version: '1.0.0',
        features: {
          customerRegistration: true,
          bookingNotifications: true,
          paymentNotifications: false,
          customerUpdates: false,
        }
      };

      // Add error info if not healthy (but don't expose sensitive details)
      if (!healthStatus.healthy) {
        publicStatus['status'] = 'unhealthy';
        publicStatus['message'] = 'CRM connection issues detected';
      } else {
        publicStatus['status'] = 'healthy';
        publicStatus['message'] = 'CRM integration operational';
      }

      return ApiMiddleware.createResponse(publicStatus);
    } catch (error) {
      return ApiMiddleware.createResponse({
        service: 'CRM Integration',
        healthy: false,
        status: 'error',
        message: 'CRM integration service unavailable',
        lastChecked: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  },
  {
    requireAuth: false, // Public endpoint
    rateLimit: { windowMs: 60000, maxRequests: 100 },
  }
);

// POST /api/crm/status/webhook-test - Test webhook delivery (public for testing)
export const POST = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { type = 'test', testData } = body;

      // Only allow test webhooks from this public endpoint
      if (type !== 'test') {
        return ApiMiddleware.createResponse(
          { error: 'Only test webhooks allowed from public endpoint' },
          'Invalid request',
          400
        );
      }

      const testResult = {
        webhookType: type,
        timestamp: new Date().toISOString(),
        success: false,
        message: '',
        duration: 0
      };

      const startTime = Date.now();

      try {
        // Send a simple test webhook
        const testCustomerData = {
          id: 'test-customer-' + Date.now(),
          firstName: 'Test',
          lastName: 'Customer',
          email: 'test@example.com',
          phone: '+44123456789',
          createdAt: new Date().toISOString(),
          language: 'en',
          preferences: { testMode: true }
        };

        const result = await crmWebhookService.notifyCustomerRegistration(testCustomerData);
        
        testResult.success = true;
        testResult.message = 'Test webhook sent successfully';
        testResult.duration = Date.now() - startTime;

      } catch (error: any) {
        testResult.success = false;
        testResult.message = `Test webhook failed: ${error.message}`;
        testResult.duration = Date.now() - startTime;
      }

      return ApiMiddleware.createResponse(testResult);
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: false, // Public endpoint for testing
    rateLimit: { windowMs: 60000, maxRequests: 10 },
  }
);