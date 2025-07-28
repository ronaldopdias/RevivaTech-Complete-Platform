// API Types and Interfaces
// Centralized type definitions for all API endpoints

import { 
  User, 
  UserRole, 
  Booking, 
  BookingStatus, 
  RepairType, 
  UrgencyLevel,
  DeviceCategory,
  DeviceBrand,
  DeviceModel,
  Notification,
  NotificationType,
  NotificationChannel,
  PricingRule
} from '@/generated/prisma';

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
}

// User API Types
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  username?: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
  expiresAt: string;
}

// Device API Types
export interface DeviceSearchRequest {
  query?: string;
  categoryId?: string;
  brandId?: string;
  yearFrom?: number;
  yearTo?: number;
  screenSizeMin?: number;
  screenSizeMax?: number;
  page?: number;
  limit?: number;
}

export interface DeviceWithRelations extends DeviceModel {
  brand: DeviceBrand & {
    category: DeviceCategory;
  };
}

export interface CreateDeviceRequest {
  brandId: string;
  name: string;
  slug: string;
  year: number;
  screenSize?: number;
  specs?: any;
  imageUrl?: string;
}

// Booking API Types
export interface CreateBookingRequest {
  deviceModelId: string;
  repairType: RepairType;
  problemDescription: string;
  urgencyLevel?: UrgencyLevel;
  preferredDate?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  deviceCondition?: {
    physicalDamage?: string;
    functionalIssues?: string;
    accessories?: string[];
  };
  photoUrls?: string[];
  customerNotes?: string;
}

export interface UpdateBookingRequest {
  status?: BookingStatus;
  scheduledDate?: string;
  estimatedCompletion?: string;
  assignedTechnicianId?: string;
  internalNotes?: string;
  customerNotes?: string;
}

export interface BookingWithRelations extends Booking {
  customer: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>;
  deviceModel: DeviceWithRelations;
  statusHistory?: Array<{
    id: string;
    status: BookingStatus;
    notes?: string;
    createdAt: Date;
    createdBy: string;
  }>;
  notifications?: Notification[];
}

export interface BookingSearchRequest {
  customerId?: string;
  status?: BookingStatus;
  repairType?: RepairType;
  urgencyLevel?: UrgencyLevel;
  assignedTechnicianId?: string;
  dateFrom?: string;
  dateTo?: string;
  priceMin?: number;
  priceMax?: number;
  query?: string;
  page?: number;
  limit?: number;
}

// Pricing API Types
export interface PriceCalculationRequest {
  deviceModelId: string;
  repairType: RepairType;
  urgencyLevel?: UrgencyLevel;
  complexityFactor?: number;
  marketDemandFactor?: number;
  seasonalFactor?: number;
}

export interface PriceCalculationResponse {
  basePrice: number;
  finalPrice: number;
  breakdown: {
    base: number;
    urgencyMultiplier: number;
    complexityMultiplier: number;
    marketDemand: number;
    seasonalFactor: number;
  };
  rule?: PricingRule;
  validUntil: string;
}

export interface CreatePricingRuleRequest {
  deviceModelId?: string;
  repairType: RepairType;
  basePrice: number;
  urgencyMultiplier?: number;
  complexityMultiplier?: number;
  marketDemand?: number;
  seasonalFactor?: number;
  validFrom?: string;
  validUntil?: string;
}

// Notification API Types
export interface CreateNotificationRequest {
  userId: string;
  bookingId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: any;
  scheduledFor?: string;
}

export interface NotificationSearchRequest {
  userId?: string;
  bookingId?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface BulkNotificationRequest {
  userIds: string[];
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: any;
  scheduledFor?: string;
}

// Analytics API Types
export interface DashboardStatsResponse {
  bookings: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    recentCount: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  devices: {
    totalModels: number;
    popularDevices: Array<{
      id: string;
      name: string;
      brandName: string;
      bookingCount: number;
    }>;
  };
  notifications: {
    unreadCount: number;
    recentActivity: Array<{
      id: string;
      type: string;
      message: string;
      createdAt: string;
    }>;
  };
}

export interface BookingReportRequest {
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month';
  repairType?: RepairType;
  status?: BookingStatus;
}

export interface BookingReportResponse {
  data: Array<{
    period: string;
    bookingCount: number;
    completedCount: number;
    revenue: number;
    averagePrice: number;
  }>;
  summary: {
    totalBookings: number;
    totalRevenue: number;
    averagePrice: number;
    completionRate: number;
  };
}

// Real-time WebSocket Types
export interface WebSocketMessage {
  type: 'booking_update' | 'notification' | 'pricing_update' | 'system_alert';
  data: any;
  timestamp: string;
  userId?: string;
  bookingId?: string;
}

export interface BookingUpdateMessage extends WebSocketMessage {
  type: 'booking_update';
  data: {
    bookingId: string;
    status: BookingStatus;
    statusText: string;
    estimatedCompletion?: string;
    technicianName?: string;
  };
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'notification';
  data: {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    bookingId?: string;
  };
}

// File Upload Types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface BulkFileUploadResponse {
  files: FileUploadResponse[];
  errors: Array<{
    filename: string;
    error: string;
  }>;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  category?: string;
  status?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  filters: SearchFilters;
  facets?: {
    [key: string]: Array<{
      value: string;
      count: number;
    }>;
  };
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResponse {
  valid: boolean;
  errors: ValidationError[];
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}