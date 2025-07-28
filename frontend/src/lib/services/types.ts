// Service abstraction layer types for RevivaTech

export interface ServiceConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  headers: Record<string, string>;
  auth?: {
    type: 'bearer' | 'apiKey' | 'basic';
    token?: string;
    apiKey?: string;
    username?: string;
    password?: string;
  };
  cache?: {
    enabled: boolean;
    ttl: number; // Time to live in seconds
    maxSize: number;
  };
  rateLimiting?: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  data?: any;
  config?: RequestConfig;
  originalError?: Error;
}

export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  cache?: boolean;
  cacheTtl?: number;
}

export interface ServiceHealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

// Base service interface
export abstract class BaseService {
  protected config: ServiceConfig;
  protected circuitBreaker: CircuitBreakerState;

  constructor(config: ServiceConfig) {
    this.config = config;
    this.circuitBreaker = {
      state: 'closed',
      failureCount: 0,
    };
  }

  abstract healthCheck(): Promise<ServiceHealthCheck>;
  abstract request<T>(config: RequestConfig): Promise<ApiResponse<T>>;
}

// Specific service interfaces
export interface BookingService extends BaseService {
  submitBooking(bookingData: BookingSubmission): Promise<ApiResponse<BookingResponse>>;
  getBooking(bookingId: string): Promise<ApiResponse<Booking>>;
  updateBookingStatus(bookingId: string, status: BookingStatus): Promise<ApiResponse<Booking>>;
  getBookingHistory(customerId: string): Promise<ApiResponse<Booking[]>>;
  cancelBooking(bookingId: string): Promise<ApiResponse<boolean>>;
  getAvailableSlots(date: string, serviceType: string): Promise<ApiResponse<TimeSlot[]>>;
}

export interface CustomerService extends BaseService {
  createCustomer(customerData: CustomerData): Promise<ApiResponse<Customer>>;
  getCustomer(customerId: string): Promise<ApiResponse<Customer>>;
  updateCustomer(customerId: string, updates: Partial<CustomerData>): Promise<ApiResponse<Customer>>;
  getCustomerBookings(customerId: string): Promise<ApiResponse<Booking[]>>;
  deleteCustomer(customerId: string): Promise<ApiResponse<boolean>>;
  searchCustomers(query: string): Promise<ApiResponse<Customer[]>>;
}

export interface DeviceService extends BaseService {
  getDeviceCategories(): Promise<ApiResponse<DeviceCategory[]>>;
  getDeviceModels(categoryId: string): Promise<ApiResponse<DeviceModel[]>>;
  getDeviceSpecs(modelId: string): Promise<ApiResponse<DeviceSpecs>>;
  getRepairTypes(modelId: string): Promise<ApiResponse<RepairType[]>>;
  getRepairPricing(modelId: string, repairTypeId: string): Promise<ApiResponse<RepairPricing>>;
  searchDevices(query: string): Promise<ApiResponse<DeviceModel[]>>;
}

export interface CRMService extends BaseService {
  syncBooking(bookingData: BookingSubmission): Promise<ApiResponse<CRMSyncResponse>>;
  syncCustomer(customerData: CustomerData): Promise<ApiResponse<CRMSyncResponse>>;
  createLead(leadData: LeadData): Promise<ApiResponse<CRMLeadResponse>>;
  updateDeal(dealId: string, dealData: DealData): Promise<ApiResponse<CRMDealResponse>>;
  getCustomerHistory(customerId: string): Promise<ApiResponse<CRMCustomerHistory>>;
}

export interface PaymentService extends BaseService {
  createPaymentIntent(amount: number, currency: string, metadata?: Record<string, any>): Promise<ApiResponse<PaymentIntent>>;
  confirmPayment(paymentIntentId: string): Promise<ApiResponse<PaymentResult>>;
  refundPayment(paymentId: string, amount?: number): Promise<ApiResponse<RefundResult>>;
  getPaymentHistory(customerId: string): Promise<ApiResponse<Payment[]>>;
}

export interface NotificationService extends BaseService {
  sendEmail(to: string, template: string, data: Record<string, any>): Promise<ApiResponse<NotificationResult>>;
  sendSMS(to: string, message: string): Promise<ApiResponse<NotificationResult>>;
  sendPushNotification(userId: string, message: string, data?: Record<string, any>): Promise<ApiResponse<NotificationResult>>;
  getNotificationHistory(userId: string): Promise<ApiResponse<Notification[]>>;
}

// Data type definitions
export interface BookingSubmission {
  deviceCategory: string;
  deviceModel: string;
  repairType: string;
  urgency: 'standard' | 'priority' | 'emergency';
  serviceType: 'drop-off' | 'pickup-delivery' | 'on-site';
  problemDescription: string;
  customer: CustomerData;
  preferredDate?: string;
  preferredTime?: string;
  pickupAddress?: Address;
  deliveryAddress?: Address;
  additionalNotes?: string;
}

export interface BookingResponse {
  bookingId: string;
  referenceNumber: string;
  status: BookingStatus;
  estimatedCost: number;
  estimatedDuration: string;
  scheduledDate?: string;
  scheduledTime?: string;
  confirmation: {
    email: boolean;
    sms: boolean;
  };
}

export interface Booking {
  id: string;
  referenceNumber: string;
  status: BookingStatus;
  deviceCategory: string;
  deviceModel: string;
  repairType: string;
  urgency: string;
  serviceType: string;
  problemDescription: string;
  customer: Customer;
  technician?: Technician;
  pricing: {
    estimated: number;
    actual?: number;
    breakdown: PriceBreakdown[];
  };
  timeline: {
    created: Date;
    scheduled?: Date;
    started?: Date;
    diagnosed?: Date;
    repaired?: Date;
    tested?: Date;
    completed?: Date;
  };
  notes: BookingNote[];
  attachments: BookingAttachment[];
}

export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'scheduled'
  | 'in-progress'
  | 'diagnosed'
  | 'waiting-approval'
  | 'approved'
  | 'repairing'
  | 'testing'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: Address;
  preferences?: {
    communication: 'email' | 'sms' | 'both';
    language: 'en' | 'pt';
    marketing: boolean;
  };
}

export interface Customer extends CustomerData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  totalBookings: number;
  loyaltyPoints: number;
  notes: string[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  instructions?: string;
}

export interface DeviceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  brands: string[];
  popularModels: string[];
}

export interface DeviceModel {
  id: string;
  categoryId: string;
  brand: string;
  name: string;
  year: number;
  imageUrl: string;
  specifications: DeviceSpecs;
  commonIssues: string[];
  averageRepairCost: number;
}

export interface DeviceSpecs {
  screen?: {
    size: string;
    resolution: string;
    type: string;
  };
  processor?: string;
  memory?: string;
  storage?: string;
  graphics?: string;
  ports?: string[];
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    weight: number;
  };
  connectivity?: string;
  cameras?: string;
}

// Image configuration types
export interface DeviceImageConfig {
  provider: ImageProvider;
  baseUrl: string;
  fallbackUrl: string;
  variants: Record<string, ImageVariant>;
  optimizations: {
    format: 'webp' | 'avif' | 'auto';
    quality: number;
    progressive: boolean;
    lazy: boolean;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxAge: number;
  };
}

export type ImageProvider = 'cloudinary' | 'imagekit' | 'local' | 'cdn';

export interface ImageVariant {
  width: number;
  height: number;
  crop: 'fill' | 'fit' | 'scale' | 'thumb';
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png' | 'auto';
}

export interface RepairType {
  id: string;
  name: string;
  description: string;
  category: 'hardware' | 'software' | 'diagnostic';
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  warrantyCovered: boolean;
  requiredParts: string[];
}

export interface RepairPricing {
  basePrice: number;
  laborCost: number;
  partsCost: number;
  urgencyMultiplier: {
    standard: 1;
    priority: 1.5;
    emergency: 2;
  };
  warranty: {
    duration: string;
    coverage: string[];
  };
}

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
  technicianId?: string;
  technicianName?: string;
}

export interface Technician {
  id: string;
  name: string;
  specialties: string[];
  rating: number;
  availability: TimeSlot[];
}

export interface PriceBreakdown {
  type: 'diagnostic' | 'labor' | 'parts' | 'urgency' | 'service';
  description: string;
  amount: number;
}

export interface BookingNote {
  id: string;
  author: string;
  authorType: 'customer' | 'technician' | 'admin';
  content: string;
  timestamp: Date;
  isPrivate: boolean;
}

export interface BookingAttachment {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'document' | 'video';
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
}

// CRM Integration types
export interface CRMSyncResponse {
  success: boolean;
  crmId: string;
  syncTimestamp: Date;
  errors?: string[];
}

export interface LeadData {
  email: string;
  phone?: string;
  name: string;
  source: string;
  deviceType: string;
  repairType: string;
  estimatedValue: number;
}

export interface CRMLeadResponse {
  leadId: string;
  status: string;
  score: number;
}

export interface DealData {
  amount: number;
  stage: string;
  probability: number;
  closeDate: string;
  notes?: string;
}

export interface CRMDealResponse {
  dealId: string;
  status: string;
  updatedAt: Date;
}

export interface CRMCustomerHistory {
  interactions: CRMInteraction[];
  deals: CRMDeal[];
  tickets: CRMTicket[];
}

export interface CRMInteraction {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'chat';
  timestamp: Date;
  description: string;
  outcome: string;
}

export interface CRMDeal {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closeDate: Date;
  probability: number;
}

export interface CRMTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  resolvedAt?: Date;
}

// Payment types
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  amount: number;
  currency: string;
  timestamp: Date;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  timestamp: Date;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  timestamp: Date;
  description: string;
}

// Notification types
export interface NotificationResult {
  success: boolean;
  messageId: string;
  timestamp: Date;
  deliveryStatus?: string;
}

export interface Notification {
  id: string;
  type: 'email' | 'sms' | 'push';
  recipient: string;
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: Date;
  readAt?: Date;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt?: Date;
  lastLoginAt?: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface PermissionCheck {
  resource: string;
  action: string;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN', 
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// AuthService interface
export interface AuthService extends BaseService {
  // Authentication methods
  login(credentials: LoginCredentials): Promise<AuthResponse<LoginResponse>>;
  register(data: RegisterData): Promise<AuthResponse<LoginResponse>>;
  logout(): Promise<AuthResponse>;
  
  // Token management
  validateToken(): Promise<AuthResponse<AuthUser>>;
  refreshToken(): Promise<AuthResponse<AuthTokens>>;
  
  // User management
  getCurrentUser(): Promise<AuthResponse<AuthUser>>;
  updateProfile(updates: Partial<AuthUser>): Promise<AuthResponse<AuthUser>>;
  
  // Permission checking
  checkPermission(permission: PermissionCheck): Promise<AuthResponse<boolean>>;
  getUserPermissions(): Promise<AuthResponse<string[]>>;
  
  // Password management
  changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse>;
  resetPassword(email: string): Promise<AuthResponse>;
  confirmPasswordReset(token: string, newPassword: string): Promise<AuthResponse>;
}