/**
 * API Contract Definitions for RevivaTech
 * 
 * This file defines the API endpoints, request/response types, and validation schemas
 * to ensure consistency between frontend and backend implementations.
 */

import {
  User,
  Booking,
  BookingWithRelations,
  DeviceCategory,
  DeviceBrand,
  DeviceModel,
  DeviceWithRelations,
  PricingRule,
  EmailTemplate,
  CreateUserRequest,
  LoginRequest,
  AuthResponse,
  CreateBookingRequest,
  SendEmailRequest,
  ApiResponse,
  PaginatedResponse,
  ListQueryParams,
  AnalyticsOverview,
  PriceCalculation
} from './shared';

// ============================================================================
// Authentication API Contracts
// ============================================================================

export interface AuthAPIContracts {
  // POST /api/auth/register
  register: {
    request: CreateUserRequest;
    response: ApiResponse<AuthResponse>;
  };

  // POST /api/auth/login
  login: {
    request: LoginRequest;
    response: ApiResponse<AuthResponse>;
  };

  // POST /api/auth/logout
  logout: {
    request: {};
    response: ApiResponse<{ message: string }>;
  };

  // GET /api/auth/me
  me: {
    request: {};
    response: ApiResponse<User>;
  };

  // PUT /api/auth/me
  updateProfile: {
    request: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>;
    response: ApiResponse<User>;
  };

  // POST /api/auth/refresh
  refresh: {
    request: { refreshToken: string };
    response: ApiResponse<{ token: string; expiresIn: number }>;
  };
}

// ============================================================================
// Device Catalog API Contracts
// ============================================================================

export interface DeviceAPIContracts {
  // GET /api/devices/categories
  getCategories: {
    request: ListQueryParams;
    response: PaginatedResponse<DeviceCategory[]>;
  };

  // GET /api/devices/categories/:id/brands
  getBrandsByCategory: {
    request: { categoryId: string } & ListQueryParams;
    response: PaginatedResponse<DeviceBrand[]>;
  };

  // GET /api/devices/brands
  getAllBrands: {
    request: ListQueryParams;
    response: PaginatedResponse<DeviceBrand[]>;
  };

  // GET /api/devices/models
  getModels: {
    request: {
      brandId?: string;
      categoryId?: string;
      year?: number;
      search?: string;
    } & ListQueryParams;
    response: PaginatedResponse<DeviceWithRelations[]>;
  };

  // GET /api/devices/models/:id
  getModelById: {
    request: { id: string };
    response: ApiResponse<DeviceWithRelations>;
  };

  // GET /api/devices/popular
  getPopularModels: {
    request: { limit?: number };
    response: ApiResponse<DeviceWithRelations[]>;
  };
}

// ============================================================================
// Booking API Contracts
// ============================================================================

export interface BookingAPIContracts {
  // GET /api/bookings
  getBookings: {
    request: {
      status?: string;
      customerId?: string;
      deviceModelId?: string;
      dateFrom?: string;
      dateTo?: string;
    } & ListQueryParams;
    response: PaginatedResponse<BookingWithRelations[]>;
  };

  // POST /api/bookings
  createBooking: {
    request: CreateBookingRequest;
    response: ApiResponse<BookingWithRelations>;
  };

  // GET /api/bookings/:id
  getBookingById: {
    request: { id: string };
    response: ApiResponse<BookingWithRelations>;
  };

  // PUT /api/bookings/:id
  updateBooking: {
    request: { id: string } & Partial<Booking>;
    response: ApiResponse<BookingWithRelations>;
  };

  // DELETE /api/bookings/:id
  deleteBooking: {
    request: { id: string };
    response: ApiResponse<{ message: string }>;
  };

  // GET /api/bookings/stats
  getBookingStats: {
    request: {
      dateFrom?: string;
      dateTo?: string;
      groupBy?: 'day' | 'week' | 'month';
    };
    response: ApiResponse<{
      total: number;
      byStatus: Record<string, number>;
      byRepairType: Record<string, number>;
      byDevice: Array<{ deviceName: string; count: number }>;
      timeline: Array<{ date: string; count: number; revenue: number }>;
    }>;
  };
}

// ============================================================================
// Pricing API Contracts
// ============================================================================

export interface PricingAPIContracts {
  // GET /api/pricing/calculate
  calculatePrice: {
    request: {
      deviceId: string;
      repairType: string;
      urgencyLevel?: string;
      issues?: string[];
    };
    response: ApiResponse<PriceCalculation>;
  };

  // GET /api/pricing/rules
  getPricingRules: {
    request: {
      deviceModelId?: string;
      repairType?: string;
    } & ListQueryParams;
    response: PaginatedResponse<PricingRule[]>;
  };

  // POST /api/pricing/rules
  createPricingRule: {
    request: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>;
    response: ApiResponse<PricingRule>;
  };

  // PUT /api/pricing/rules/:id
  updatePricingRule: {
    request: { id: string } & Partial<PricingRule>;
    response: ApiResponse<PricingRule>;
  };
}

// ============================================================================
// User Management API Contracts
// ============================================================================

export interface UserAPIContracts {
  // GET /api/users
  getUsers: {
    request: {
      role?: string;
      isActive?: boolean;
      search?: string;
    } & ListQueryParams;
    response: PaginatedResponse<User[]>;
  };

  // GET /api/users/:id
  getUserById: {
    request: { id: string };
    response: ApiResponse<User>;
  };

  // POST /api/users
  createUser: {
    request: CreateUserRequest;
    response: ApiResponse<User>;
  };

  // PUT /api/users/:id
  updateUser: {
    request: { id: string } & Partial<User>;
    response: ApiResponse<User>;
  };

  // DELETE /api/users/:id
  deleteUser: {
    request: { id: string };
    response: ApiResponse<{ message: string }>;
  };
}

// ============================================================================
// Analytics API Contracts
// ============================================================================

export interface AnalyticsAPIContracts {
  // GET /api/analytics/overview
  getOverview: {
    request: {
      dateFrom?: string;
      dateTo?: string;
    };
    response: ApiResponse<AnalyticsOverview>;
  };

  // GET /api/analytics/bookings
  getBookingAnalytics: {
    request: {
      dateFrom?: string;
      dateTo?: string;
      groupBy?: 'day' | 'week' | 'month';
    };
    response: ApiResponse<{
      totalBookings: number;
      completionRate: number;
      averageRepairTime: number;
      statusDistribution: Record<string, number>;
      timeline: Array<{ date: string; bookings: number; revenue: number }>;
    }>;
  };

  // GET /api/analytics/devices
  getDeviceAnalytics: {
    request: {
      dateFrom?: string;
      dateTo?: string;
    };
    response: ApiResponse<{
      topDevices: Array<{ deviceName: string; brandName: string; count: number }>;
      topBrands: Array<{ brandName: string; count: number }>;
      repairTypesByDevice: Record<string, Record<string, number>>;
    }>;
  };
}

// ============================================================================
// Email API Contracts
// ============================================================================

export interface EmailAPIContracts {
  // GET /api/email/templates
  getTemplates: {
    request: {
      category?: string;
      isActive?: boolean;
    } & ListQueryParams;
    response: PaginatedResponse<EmailTemplate[]>;
  };

  // GET /api/email/templates/:id
  getTemplateById: {
    request: { id: string };
    response: ApiResponse<EmailTemplate>;
  };

  // POST /api/email/send
  sendEmail: {
    request: SendEmailRequest;
    response: ApiResponse<{ messageId: string; status: string }>;
  };

  // POST /api/email/templates/:id/preview
  previewTemplate: {
    request: { id: string; variables: Record<string, string> };
    response: ApiResponse<{ subject: string; htmlContent: string; textContent: string }>;
  };
}

// ============================================================================
// Health Check API Contracts
// ============================================================================

export interface HealthAPIContracts {
  // GET /api/health
  health: {
    request: {};
    response: ApiResponse<{
      status: 'healthy' | 'unhealthy';
      timestamp: string;
      uptime: number;
      memory: { used: number; total: number; unit: string };
    }>;
  };

  // GET /api/health/database
  databaseHealth: {
    request: {};
    response: ApiResponse<{
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      details: {
        host: string;
        database: string;
        adapter: string;
      };
    }>;
  };
}

// ============================================================================
// Combined API Contracts
// ============================================================================

export interface APIContracts
  extends AuthAPIContracts,
          DeviceAPIContracts,
          BookingAPIContracts,
          PricingAPIContracts,
          UserAPIContracts,
          AnalyticsAPIContracts,
          EmailAPIContracts,
          HealthAPIContracts {}

// ============================================================================
// API Route Helpers
// ============================================================================

export const API_ROUTES = {
  // Authentication
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh',
  },
  
  // Devices
  DEVICES: {
    CATEGORIES: '/api/devices/categories',
    BRANDS: '/api/devices/brands',
    MODELS: '/api/devices/models',
    POPULAR: '/api/devices/popular',
  },
  
  // Bookings
  BOOKINGS: {
    LIST: '/api/bookings',
    CREATE: '/api/bookings',
    BY_ID: (id: string) => `/api/bookings/${id}`,
    STATS: '/api/bookings/stats',
  },
  
  // Pricing
  PRICING: {
    CALCULATE: '/api/pricing/calculate',
    RULES: '/api/pricing/rules',
  },
  
  // Users
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
  },
  
  // Analytics
  ANALYTICS: {
    OVERVIEW: '/api/analytics/overview',
    BOOKINGS: '/api/analytics/bookings',
    DEVICES: '/api/analytics/devices',
  },
  
  // Email
  EMAIL: {
    TEMPLATES: '/api/email/templates',
    SEND: '/api/email/send',
  },
  
  // Health
  HEALTH: {
    STATUS: '/api/health',
    DATABASE: '/api/health/database',
  },
} as const;

// ============================================================================
// Type Helper for API Responses
// ============================================================================

export type ExtractApiResponse<T extends { response: any }> = T['response'];
export type ExtractApiRequest<T extends { request: any }> = T['request'];