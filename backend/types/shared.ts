/**
 * Shared TypeScript Types for RevivaTech API
 * 
 * These types ensure consistency between frontend and backend
 * and provide type safety for API contracts.
 */

import { Prisma } from '@prisma/client';

// ============================================================================
// User and Authentication Types
// ============================================================================

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TECHNICIAN' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  session?: {
    id: string;
    expiresAt: Date;
  };
}

// ============================================================================
// Device and Catalog Types
// ============================================================================

export interface DeviceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  iconName?: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceBrand {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  category?: DeviceCategory;
}

export interface DeviceModel {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  year?: number | null;
  screenSize?: number | null;
  specs?: Prisma.JsonValue | null;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  brand?: DeviceBrand;
}

export interface DeviceWithRelations extends DeviceModel {
  brand: DeviceBrand & {
    category: DeviceCategory;
  };
  pricingRules?: PricingRule[];
}

// ============================================================================
// Booking and Repair Types  
// ============================================================================

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type RepairType = 'SCREEN_REPAIR' | 'BATTERY_REPLACEMENT' | 'WATER_DAMAGE' | 'SOFTWARE_ISSUE' | 'HARDWARE_REPAIR' | 'DATA_RECOVERY' | 'SPEAKER_REPAIR' | 'CAMERA_REPAIR' | 'CHARGING_PORT' | 'BUTTON_REPAIR';
export type UrgencyLevel = 'STANDARD' | 'URGENT' | 'EMERGENCY';

export interface Booking {
  id: string;
  customerId: string;
  deviceModelId: string;
  repairType: RepairType;
  problemDescription: string;
  urgencyLevel: UrgencyLevel;
  status: BookingStatus;
  basePrice: number;
  finalPrice: number;
  customerInfo?: Prisma.JsonValue | null;
  deviceCondition?: Prisma.JsonValue | null;
  photoUrls?: string[] | null;
  preferredDate?: Date | null;
  scheduledDate?: Date | null;
  completedDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingWithRelations extends Booking {
  customer: User;
  deviceModel: DeviceWithRelations;
}

export interface CreateBookingRequest {
  deviceModelId: string;
  repairType: RepairType;
  problemDescription: string;
  urgencyLevel?: UrgencyLevel;
  customerInfo: {
    contactMethod: string;
    preferredLanguage: string;
    address?: {
      street: string;
      city: string;
      postcode: string;
      country: string;
    };
  };
  deviceCondition?: {
    overallCondition: string;
    screenCondition: string;
    backCondition: string;
    batteryHealth: string;
  };
  photoUrls?: string[];
  preferredDate?: string;
}

// ============================================================================
// Pricing Types
// ============================================================================

export interface PricingRule {
  id: string;
  deviceModelId: string;
  repairType: RepairType;
  basePrice: number;
  urgencyMultiplier: number;
  complexityMultiplier: number;
  marketDemand: number;
  seasonalFactor: number;
  validFrom: Date;
  validUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceCalculation {
  basePrice: number;
  urgencyMultiplier: number;
  complexityMultiplier: number;
  marketDemand: number;
  seasonalFactor: number;
  finalPrice: number;
  breakdown: {
    base: number;
    urgencyAdjustment: number;
    complexityAdjustment: number;
    marketAdjustment: number;
    seasonalAdjustment: number;
  };
}

// ============================================================================
// Email and Notification Types
// ============================================================================

export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  sample_data?: Prisma.JsonValue | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SendEmailRequest {
  templateSlug: string;
  to: string;
  variables: Record<string, string>;
  from?: string;
  subject?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsOverview {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  averageRepairTime: number;
  customerSatisfaction: number;
  topRepairTypes: Array<{
    type: RepairType;
    count: number;
    percentage: number;
  }>;
  topDevices: Array<{
    deviceName: string;
    brandName: string;
    count: number;
  }>;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// ============================================================================
// Type Guards
// ============================================================================

export const isValidUserRole = (role: string): role is UserRole => {
  return ['SUPER_ADMIN', 'ADMIN', 'TECHNICIAN', 'CUSTOMER'].includes(role);
};

export const isValidBookingStatus = (status: string): status is BookingStatus => {
  return ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status);
};

export const isValidRepairType = (type: string): type is RepairType => {
  return [
    'SCREEN_REPAIR', 'BATTERY_REPLACEMENT', 'WATER_DAMAGE', 'SOFTWARE_ISSUE',
    'HARDWARE_REPAIR', 'DATA_RECOVERY', 'SPEAKER_REPAIR', 'CAMERA_REPAIR',
    'CHARGING_PORT', 'BUTTON_REPAIR'
  ].includes(type);
};

export const isValidUrgencyLevel = (level: string): level is UrgencyLevel => {
  return ['STANDARD', 'URGENT', 'EMERGENCY'].includes(level);
};