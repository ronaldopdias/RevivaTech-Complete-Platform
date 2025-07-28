// CRM Integration API
// Endpoints for managing CRM integration status and health checks

import { NextRequest } from 'next/server';
import { ApiMiddleware } from '@/lib/api/middleware';
import crmWebhookService from '@/lib/services/crmWebhookService';

// GET /api/crm/integration - Get CRM integration status
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      // Check CRM health
      const healthStatus = await crmWebhookService.checkHealth();
      
      const integrationStatus = {
        service: 'CRM Integration',
        healthy: healthStatus.healthy,
        crmEndpoint: process.env.CRM_WEBHOOK_URL || 'http://localhost:5001/webhooks',
        lastChecked: new Date().toISOString(),
        features: {
          customerRegistration: true,
          bookingNotifications: true,
          paymentNotifications: false, // Not implemented in CRM yet
          customerUpdates: false, // Not implemented in CRM yet
        },
        statistics: {
          // In production, these would come from a database
          totalNotificationsSent: 0,
          successfulNotifications: 0,
          failedNotifications: 0,
          lastSuccessfulNotification: null,
          lastFailedNotification: null,
        }
      };

      if (healthStatus.healthy) {
        integrationStatus.statistics = {
          ...integrationStatus.statistics,
          crmStatus: healthStatus.status
        };
      } else {
        integrationStatus['error'] = healthStatus.error;
      }

      return ApiMiddleware.createResponse(integrationStatus);
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 20 },
  }
);

// POST /api/crm/integration/test - Test CRM integration
export const POST = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const user = (request as any).user;
      
      // Test customer registration webhook
      const testCustomerData = {
        id: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@revivatech.co.uk',
        phone: '+44123456789',
        createdAt: new Date().toISOString(),
        language: 'en',
        preferences: { testMode: true }
      };

      const testResults = {
        customerRegistration: { success: false, error: null, response: null },
        crmHealth: { success: false, error: null, response: null },
        timestamp: new Date().toISOString(),
        testedBy: user.email,
      };

      // Test health check
      try {
        const healthCheck = await crmWebhookService.checkHealth();
        testResults.crmHealth = {
          success: healthCheck.healthy,
          error: healthCheck.error || null,
          response: healthCheck.status || null,
        };
      } catch (error: any) {
        testResults.crmHealth = {
          success: false,
          error: error.message,
          response: null,
        };
      }

      // Test customer registration webhook
      try {
        const webhookResponse = await crmWebhookService.notifyCustomerRegistration(testCustomerData);
        testResults.customerRegistration = {
          success: true,
          error: null,
          response: webhookResponse,
        };
      } catch (error: any) {
        testResults.customerRegistration = {
          success: false,
          error: error.message,
          response: null,
        };
      }

      const overallSuccess = testResults.crmHealth.success && testResults.customerRegistration.success;

      return ApiMiddleware.createResponse(
        {
          success: overallSuccess,
          results: testResults,
          message: overallSuccess 
            ? 'CRM integration test successful' 
            : 'CRM integration test failed - check results for details'
        },
        overallSuccess ? 'Integration test passed' : 'Integration test failed',
        overallSuccess ? 200 : 500
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 5 },
  }
);

// POST /api/crm/integration/retry-failed - Retry failed webhook notifications
export const PATCH = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      // In production, this would retry failed webhooks from a database queue
      // For now, just return a success message
      
      return ApiMiddleware.createResponse(
        {
          message: 'Failed webhook retry not implemented yet',
          note: 'This feature requires a database queue for failed webhooks',
          retriedCount: 0,
          successCount: 0,
          failedCount: 0
        },
        'Retry operation completed'
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 10 },
  }
);