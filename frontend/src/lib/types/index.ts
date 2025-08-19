// Shared Type Definitions
// Replaces generated Prisma types - unified type definitions for the application

// Repair and Service Types
export type RepairType = 
  | 'SCREEN_REPAIR' 
  | 'BATTERY_REPLACEMENT' 
  | 'CAMERA_REPAIR' 
  | 'CHARGING_PORT' 
  | 'SPEAKER_REPAIR' 
  | 'MICROPHONE_REPAIR' 
  | 'BUTTON_REPAIR' 
  | 'WATER_DAMAGE' 
  | 'SOFTWARE_ISSUE' 
  | 'OTHER';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Booking Types
export type BookingStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'ON_HOLD'
  | 'READY_FOR_PICKUP';

// Notification Types
export type NotificationType = 
  | 'BOOKING_CONFIRMED' 
  | 'BOOKING_CONFIRMATION'  // Added from generated Prisma
  | 'STATUS_UPDATE' 
  | 'READY_FOR_PICKUP' 
  | 'REMINDER'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_REQUEST'       // Added from generated Prisma
  | 'COMPLETION_NOTICE'     // Added from generated Prisma
  | 'REPAIR_STARTED'
  | 'REPAIR_COMPLETED'
  | 'APPOINTMENT_SCHEDULED'
  | 'PROMOTIONAL'           // Added from generated Prisma
  | 'SYSTEM_ALERT';         // Added from generated Prisma

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'WEBSOCKET';

export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Device Types
export type DeviceCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'BROKEN';

export type DeviceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  isActive: boolean;
};

export type DeviceBrand = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type DeviceModel = {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  year: number;
  screenSize?: number;
  specs: Record<string, any>;
  imageUrl?: string;
  isActive: boolean;
};

// User and Authentication Types (for compatibility - Better Auth handles this)
export type UserRole = 'CUSTOMER' | 'TECHNICIAN' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';

// Payment Types
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'CASH' | 'OTHER';

// Generic API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

// Database Model Interfaces (simplified - real data comes from backend)
export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking extends BaseModel {
  deviceModelId: string;
  customerId: string;
  repairType: RepairType;
  status: BookingStatus;
  urgencyLevel: UrgencyLevel;
  problemDescription: string;
  estimatedPrice?: number;
  finalPrice?: number;
  scheduledDate?: Date;
  completedDate?: Date;
  assignedTechnicianId?: string;
}

export interface Notification extends BaseModel {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
}

// For backward compatibility with existing Prisma imports
export type PrismaClient = any; // Placeholder type

// Export commonly used enums as objects for runtime access
export const RepairTypeEnum = {
  SCREEN_REPAIR: 'SCREEN_REPAIR',
  BATTERY_REPLACEMENT: 'BATTERY_REPLACEMENT',
  CAMERA_REPAIR: 'CAMERA_REPAIR',
  CHARGING_PORT: 'CHARGING_PORT',
  SPEAKER_REPAIR: 'SPEAKER_REPAIR',
  MICROPHONE_REPAIR: 'MICROPHONE_REPAIR',
  BUTTON_REPAIR: 'BUTTON_REPAIR',
  WATER_DAMAGE: 'WATER_DAMAGE',
  SOFTWARE_ISSUE: 'SOFTWARE_ISSUE',
  OTHER: 'OTHER'
} as const;

export const BookingStatusEnum = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP'
} as const;

export const NotificationTypeEnum = {
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',   // Added from generated Prisma
  STATUS_UPDATE: 'STATUS_UPDATE',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  REMINDER: 'REMINDER',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_REQUEST: 'PAYMENT_REQUEST',             // Added from generated Prisma
  COMPLETION_NOTICE: 'COMPLETION_NOTICE',         // Added from generated Prisma
  REPAIR_STARTED: 'REPAIR_STARTED',
  REPAIR_COMPLETED: 'REPAIR_COMPLETED',
  APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
  PROMOTIONAL: 'PROMOTIONAL',                     // Added from generated Prisma
  SYSTEM_ALERT: 'SYSTEM_ALERT'                   // Added from generated Prisma
} as const;