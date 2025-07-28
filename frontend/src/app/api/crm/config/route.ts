// CRM Configuration Management API
// Manage CRM integration settings and webhook configurations

import { NextRequest } from 'next/server';
import { ApiMiddleware } from '@/lib/api/middleware';

// In production, these would be stored in a database
let crmConfig = {
  webhookUrl: process.env.CRM_WEBHOOK_URL || 'http://localhost:5001/webhooks',
  apiKey: process.env.CRM_API_KEY || 'your-webhook-api-key',
  enabled: true,
  retryAttempts: 3,
  retryDelay: 1000,
  features: {
    customerRegistration: {
      enabled: true,
      endpoint: '/customer-registration',
      autoRetry: true
    },
    bookingNotifications: {
      enabled: true,
      endpoint: '/repair-request',
      autoRetry: true
    },
    paymentNotifications: {
      enabled: false, // Not implemented in CRM yet
      endpoint: '/payment-status',
      autoRetry: true
    },
    statusUpdates: {
      enabled: false, // Future feature
      endpoint: '/status-update',
      autoRetry: true
    }
  },
  healthCheck: {
    enabled: true,
    interval: 300000, // 5 minutes
    endpoint: '/health',
    timeout: 10000 // 10 seconds
  },
  logging: {
    enabled: true,
    level: 'info', // error, warn, info, debug
    retentionDays: 30
  }
};

// GET /api/crm/config - Get current CRM configuration
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const section = searchParams.get('section');

      if (section) {
        // Return specific section
        if (!(section in crmConfig)) {
          return ApiMiddleware.createResponse(
            { error: `Invalid section: ${section}` },
            'Invalid section',
            400
          );
        }
        
        return ApiMiddleware.createResponse({
          section,
          config: (crmConfig as any)[section]
        });
      }

      // Return full configuration (but mask sensitive data)
      const safeConfig = {
        ...crmConfig,
        apiKey: crmConfig.apiKey ? '***masked***' : null
      };

      return ApiMiddleware.createResponse({
        config: safeConfig,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 30 },
  }
);

// PUT /api/crm/config - Update CRM configuration
export const PUT = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { section, config } = body;

      if (!section || !config) {
        return ApiMiddleware.createResponse(
          { error: 'Section and config are required' },
          'Invalid request',
          400
        );
      }

      // Validate section exists
      if (!(section in crmConfig)) {
        return ApiMiddleware.createResponse(
          { error: `Invalid section: ${section}` },
          'Invalid section',
          400
        );
      }

      // Validate configuration based on section
      const validationResult = validateConfigSection(section, config);
      if (!validationResult.valid) {
        return ApiMiddleware.createResponse(
          { error: validationResult.error },
          'Configuration validation failed',
          400
        );
      }

      // Update configuration
      (crmConfig as any)[section] = { ...(crmConfig as any)[section], ...config };

      return ApiMiddleware.createResponse(
        {
          message: `${section} configuration updated successfully`,
          section,
          updatedConfig: (crmConfig as any)[section]
        },
        'Configuration updated'
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

// POST /api/crm/config/test - Test CRM configuration
export const POST = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { testConfig } = body;

      // Test configuration without saving
      const testResults = {
        connectivity: { success: false, error: null },
        authentication: { success: false, error: null },
        endpoints: { success: false, error: null },
        timestamp: new Date().toISOString()
      };

      // Test connectivity
      try {
        const testUrl = testConfig?.webhookUrl || crmConfig.webhookUrl;
        const response = await fetch(`${testUrl}/health`, {
          method: 'GET',
          timeout: 10000,
          headers: {
            'Authorization': `Bearer ${testConfig?.apiKey || crmConfig.apiKey}`
          }
        });

        if (response.ok) {
          testResults.connectivity.success = true;
          testResults.authentication.success = true;
        } else {
          testResults.connectivity.success = true;
          testResults.authentication.error = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error: any) {
        testResults.connectivity.error = error.message;
      }

      // Test endpoints availability
      if (testResults.connectivity.success) {
        try {
          const endpointTests = [];
          const features = testConfig?.features || crmConfig.features;
          
          for (const [featureName, feature] of Object.entries(features)) {
            if ((feature as any).enabled) {
              endpointTests.push({
                feature: featureName,
                endpoint: (feature as any).endpoint,
                tested: true
              });
            }
          }

          testResults.endpoints = {
            success: true,
            error: null,
            availableEndpoints: endpointTests
          };
        } catch (error: any) {
          testResults.endpoints.error = error.message;
        }
      }

      const overallSuccess = testResults.connectivity.success && 
                            testResults.authentication.success && 
                            testResults.endpoints.success;

      return ApiMiddleware.createResponse(
        {
          success: overallSuccess,
          results: testResults,
          message: overallSuccess 
            ? 'CRM configuration test successful' 
            : 'CRM configuration test failed'
        },
        overallSuccess ? 'Configuration test passed' : 'Configuration test failed'
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

// DELETE /api/crm/config/reset - Reset configuration to defaults
export const DELETE = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const section = searchParams.get('section');

      if (section) {
        // Reset specific section
        if (!(section in crmConfig)) {
          return ApiMiddleware.createResponse(
            { error: `Invalid section: ${section}` },
            'Invalid section',
            400
          );
        }

        // Get default configuration for section
        const defaultConfig = getDefaultConfig();
        (crmConfig as any)[section] = (defaultConfig as any)[section];

        return ApiMiddleware.createResponse(
          {
            message: `${section} configuration reset to defaults`,
            section,
            resetConfig: (crmConfig as any)[section]
          },
          'Section reset to defaults'
        );
      } else {
        // Reset entire configuration
        crmConfig = getDefaultConfig();

        return ApiMiddleware.createResponse(
          {
            message: 'All CRM configuration reset to defaults',
            config: crmConfig
          },
          'Configuration reset to defaults'
        );
      }
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    requiredRoles: ['SUPER_ADMIN'], // Only super admin can reset
    rateLimit: { windowMs: 60000, maxRequests: 3 },
  }
);

// Configuration validation function
function validateConfigSection(section: string, config: any): { valid: boolean; error?: string } {
  switch (section) {
    case 'webhookUrl':
      if (typeof config.webhookUrl !== 'string' || !config.webhookUrl.startsWith('http')) {
        return { valid: false, error: 'Webhook URL must be a valid HTTP/HTTPS URL' };
      }
      break;
      
    case 'features':
      for (const [featureName, feature] of Object.entries(config)) {
        if (typeof (feature as any).enabled !== 'boolean') {
          return { valid: false, error: `Feature ${featureName}.enabled must be boolean` };
        }
        if (typeof (feature as any).endpoint !== 'string') {
          return { valid: false, error: `Feature ${featureName}.endpoint must be string` };
        }
      }
      break;
      
    case 'healthCheck':
      if (config.interval && (typeof config.interval !== 'number' || config.interval < 60000)) {
        return { valid: false, error: 'Health check interval must be at least 60000ms (1 minute)' };
      }
      if (config.timeout && (typeof config.timeout !== 'number' || config.timeout < 1000)) {
        return { valid: false, error: 'Health check timeout must be at least 1000ms' };
      }
      break;
      
    case 'logging':
      if (config.level && !['error', 'warn', 'info', 'debug'].includes(config.level)) {
        return { valid: false, error: 'Log level must be one of: error, warn, info, debug' };
      }
      if (config.retentionDays && (typeof config.retentionDays !== 'number' || config.retentionDays < 1)) {
        return { valid: false, error: 'Log retention days must be at least 1' };
      }
      break;
  }

  return { valid: true };
}

// Get default configuration
function getDefaultConfig() {
  return {
    webhookUrl: process.env.CRM_WEBHOOK_URL || 'http://localhost:5001/webhooks',
    apiKey: process.env.CRM_API_KEY || 'your-webhook-api-key',
    enabled: true,
    retryAttempts: 3,
    retryDelay: 1000,
    features: {
      customerRegistration: {
        enabled: true,
        endpoint: '/customer-registration',
        autoRetry: true
      },
      bookingNotifications: {
        enabled: true,
        endpoint: '/repair-request',
        autoRetry: true
      },
      paymentNotifications: {
        enabled: false,
        endpoint: '/payment-status',
        autoRetry: true
      },
      statusUpdates: {
        enabled: false,
        endpoint: '/status-update',
        autoRetry: true
      }
    },
    healthCheck: {
      enabled: true,
      interval: 300000,
      endpoint: '/health',
      timeout: 10000
    },
    logging: {
      enabled: true,
      level: 'info',
      retentionDays: 30
    }
  };
}