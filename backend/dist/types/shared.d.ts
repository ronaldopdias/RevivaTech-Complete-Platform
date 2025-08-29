import { Prisma } from '@prisma/client';
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
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
}
export declare class ValidationError extends Error {
    field: string;
    code: string;
    constructor(message: string, field: string, code?: string);
}
export declare class NotFoundError extends Error {
    constructor(resource: string, id?: string);
}
export declare class UnauthorizedError extends Error {
    constructor(message?: string);
}
export declare const isValidUserRole: (role: string) => role is UserRole;
export declare const isValidBookingStatus: (status: string) => status is BookingStatus;
export declare const isValidRepairType: (type: string) => type is RepairType;
export declare const isValidUrgencyLevel: (level: string) => level is UrgencyLevel;
//# sourceMappingURL=shared.d.ts.map