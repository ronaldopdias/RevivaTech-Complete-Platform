import { ServiceConfig } from '@/lib/services/types';

// Dynamic API base URL detection based on current hostname
const getApiBaseUrl = (): string => {
  // Server-side rendering: always use local backend
  if (typeof window === 'undefined') {
    return 'http://localhost:3011';
  }
  
  // Client-side: detect hostname and use appropriate backend URL
  const hostname = window.location.hostname;
  
  // Dynamic hostname detection - use localhost for private IPs
  if (hostname.match(/^100\.\d+\.\d+\.\d+$/)) {
    return 'http://localhost:3011';
  }
  
  // External domain access - use API subdomain through Cloudflare tunnel
  if (hostname === 'revivatech.co.uk' || hostname === 'www.revivatech.co.uk') {
    return 'https://api.revivatech.co.uk';
  }
  
  if (hostname === 'revivatech.com.br' || hostname === 'www.revivatech.com.br') {
    return 'https://api.revivatech.com.br';
  }
  
  // Tailscale serve hostname (development) - use local backend
  if (hostname.includes('.tail1168f5.ts.net')) {
    return 'http://localhost:3011';
  }
  
  // Default/localhost access - use local backend
  return 'http://localhost:3011';
};

// Base API configuration
export const baseApiConfig: ServiceConfig = {
  baseUrl: getApiBaseUrl(),
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client': 'revivatech-web',
    'X-Version': '1.0.0',
  },
  auth: {
    type: 'bearer',
    // Token will be set dynamically from auth context
  },
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes default
    maxSize: 100,
  },
  rateLimiting: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
};

// Booking service configuration
export const bookingServiceConfig: ServiceConfig = {
  ...baseApiConfig,
  baseUrl: `${baseApiConfig.baseUrl}/api/bookings`,
  timeout: 45000, // Longer timeout for booking operations
  cache: {
    enabled: false, // Don't cache booking operations
    ttl: 0,
    maxSize: 0,
  },
};

// Customer service configuration
export const customerServiceConfig: ServiceConfig = {
  ...baseApiConfig,
  baseUrl: `${baseApiConfig.baseUrl}/api/customers`,
  cache: {
    enabled: true,
    ttl: 600, // 10 minutes for customer data
    maxSize: 50,
  },
};

// Device service configuration
export const deviceServiceConfig: ServiceConfig = {
  ...baseApiConfig,
  baseUrl: `${baseApiConfig.baseUrl}/api/devices`,
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour for device data (rarely changes)
    maxSize: 200,
  },
  rateLimiting: {
    enabled: true,
    maxRequests: 200, // Higher limit for device browsing
    windowMs: 60000,
  },
};

// Auth service configuration
export const authServiceConfig: ServiceConfig = {
  ...baseApiConfig,
  baseUrl: `${baseApiConfig.baseUrl}/api/auth`,
  timeout: 30000, // 30 seconds for auth operations
  cache: {
    enabled: false, // Don't cache auth operations
    ttl: 0,
    maxSize: 0,
  },
  rateLimiting: {
    enabled: true,
    maxRequests: 20, // Conservative limit for auth
    windowMs: 60000,
  },
};

// CRM service configuration
export const crmServiceConfig: ServiceConfig = {
  ...baseApiConfig,
  baseUrl: process.env.NEXT_PUBLIC_CRM_API_URL || `${baseApiConfig.baseUrl}/api/crm`,
  timeout: 60000, // 1 minute for CRM operations
  auth: {
    type: 'apiKey',
    apiKey: process.env.NEXT_PUBLIC_CRM_API_KEY,
  },
  cache: {
    enabled: false, // Don't cache CRM operations
    ttl: 0,
    maxSize: 0,
  },
};

// Payment service configuration (Stripe)
export const paymentServiceConfig: ServiceConfig = {
  baseUrl: 'https://api.stripe.com/v1',
  timeout: 30000,
  retryAttempts: 2,
  retryDelay: 2000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  },
  auth: {
    type: 'bearer',
    token: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  cache: {
    enabled: false,
    ttl: 0,
    maxSize: 0,
  },
  rateLimiting: {
    enabled: true,
    maxRequests: 50,
    windowMs: 60000,
  },
};

// Notification service configuration
export const notificationServiceConfig: ServiceConfig = {
  ...baseApiConfig,
  baseUrl: `${baseApiConfig.baseUrl}/api/notifications`,
  timeout: 15000, // Quick timeout for notifications
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes for notification history
    maxSize: 20,
  },
};

// Mock service configuration (for development/testing)
export const mockServiceConfig: ServiceConfig = {
  baseUrl: '/api/mock',
  timeout: 1000, // Fast responses for mocks
  retryAttempts: 1,
  retryDelay: 500,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Mock': 'true',
  },
  cache: {
    enabled: true,
    ttl: 60, // Short cache for development
    maxSize: 50,
  },
  rateLimiting: {
    enabled: false, // No rate limiting for mocks
    maxRequests: 1000,
    windowMs: 60000,
  },
};

// Service configuration selector based on environment
export const getServiceConfig = (serviceName: string, environment: string = 'development'): ServiceConfig => {
  const configs: Record<string, Record<string, ServiceConfig>> = {
    development: {
      booking: bookingServiceConfig,  // Use real API
      customer: customerServiceConfig,  // Use real API
      device: deviceServiceConfig,  // Use real API
      auth: authServiceConfig,  // Use real API
      crm: crmServiceConfig,  // Use real API
      payment: paymentServiceConfig,
      notification: notificationServiceConfig,  // Use real API
    },
    staging: {
      booking: bookingServiceConfig,
      customer: customerServiceConfig,
      device: deviceServiceConfig,
      auth: authServiceConfig,
      crm: crmServiceConfig,
      payment: paymentServiceConfig,
      notification: notificationServiceConfig,
    },
    production: {
      booking: {
        ...bookingServiceConfig,
        retryAttempts: 5,
        timeout: 60000,
        rateLimiting: {
          enabled: true,
          maxRequests: 50,
          windowMs: 60000,
        },
      },
      customer: {
        ...customerServiceConfig,
        cache: {
          enabled: true,
          ttl: 1800, // 30 minutes in production
          maxSize: 100,
        },
      },
      device: {
        ...deviceServiceConfig,
        cache: {
          enabled: true,
          ttl: 7200, // 2 hours in production
          maxSize: 500,
        },
      },
      auth: {
        ...authServiceConfig,
        retryAttempts: 2, // Limited retries for auth
        rateLimiting: {
          enabled: true,
          maxRequests: 10, // Stricter limits in production
          windowMs: 60000,
        },
      },
      crm: {
        ...crmServiceConfig,
        retryAttempts: 5,
        timeout: 120000, // 2 minutes for production CRM
      },
      payment: {
        ...paymentServiceConfig,
        retryAttempts: 1, // Don't retry payments
        rateLimiting: {
          enabled: true,
          maxRequests: 20,
          windowMs: 60000,
        },
      },
      notification: notificationServiceConfig,
    },
  };

  const envConfigs = configs[environment] || configs.development;
  return envConfigs[serviceName] || baseApiConfig;
};

export default {
  base: baseApiConfig,
  booking: bookingServiceConfig,
  customer: customerServiceConfig,
  device: deviceServiceConfig,
  auth: authServiceConfig,
  crm: crmServiceConfig,
  payment: paymentServiceConfig,
  notification: notificationServiceConfig,
  mock: mockServiceConfig,
  getServiceConfig,
};