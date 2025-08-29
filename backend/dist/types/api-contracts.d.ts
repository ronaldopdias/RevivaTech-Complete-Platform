import { User, Booking, BookingWithRelations, DeviceCategory, DeviceBrand, DeviceWithRelations, PricingRule, EmailTemplate, CreateUserRequest, LoginRequest, AuthResponse, CreateBookingRequest, SendEmailRequest, ApiResponse, PaginatedResponse, ListQueryParams, AnalyticsOverview, PriceCalculation } from './shared';
export interface AuthAPIContracts {
    register: {
        request: CreateUserRequest;
        response: ApiResponse<AuthResponse>;
    };
    login: {
        request: LoginRequest;
        response: ApiResponse<AuthResponse>;
    };
    logout: {
        request: {};
        response: ApiResponse<{
            message: string;
        }>;
    };
    me: {
        request: {};
        response: ApiResponse<User>;
    };
    updateProfile: {
        request: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>;
        response: ApiResponse<User>;
    };
    refresh: {
        request: {
            refreshToken: string;
        };
        response: ApiResponse<{
            token: string;
            expiresIn: number;
        }>;
    };
}
export interface DeviceAPIContracts {
    getCategories: {
        request: ListQueryParams;
        response: PaginatedResponse<DeviceCategory[]>;
    };
    getBrandsByCategory: {
        request: {
            categoryId: string;
        } & ListQueryParams;
        response: PaginatedResponse<DeviceBrand[]>;
    };
    getAllBrands: {
        request: ListQueryParams;
        response: PaginatedResponse<DeviceBrand[]>;
    };
    getModels: {
        request: {
            brandId?: string;
            categoryId?: string;
            year?: number;
            search?: string;
        } & ListQueryParams;
        response: PaginatedResponse<DeviceWithRelations[]>;
    };
    getModelById: {
        request: {
            id: string;
        };
        response: ApiResponse<DeviceWithRelations>;
    };
    getPopularModels: {
        request: {
            limit?: number;
        };
        response: ApiResponse<DeviceWithRelations[]>;
    };
}
export interface BookingAPIContracts {
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
    createBooking: {
        request: CreateBookingRequest;
        response: ApiResponse<BookingWithRelations>;
    };
    getBookingById: {
        request: {
            id: string;
        };
        response: ApiResponse<BookingWithRelations>;
    };
    updateBooking: {
        request: {
            id: string;
        } & Partial<Booking>;
        response: ApiResponse<BookingWithRelations>;
    };
    deleteBooking: {
        request: {
            id: string;
        };
        response: ApiResponse<{
            message: string;
        }>;
    };
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
            byDevice: Array<{
                deviceName: string;
                count: number;
            }>;
            timeline: Array<{
                date: string;
                count: number;
                revenue: number;
            }>;
        }>;
    };
}
export interface PricingAPIContracts {
    calculatePrice: {
        request: {
            deviceId: string;
            repairType: string;
            urgencyLevel?: string;
            issues?: string[];
        };
        response: ApiResponse<PriceCalculation>;
    };
    getPricingRules: {
        request: {
            deviceModelId?: string;
            repairType?: string;
        } & ListQueryParams;
        response: PaginatedResponse<PricingRule[]>;
    };
    createPricingRule: {
        request: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>;
        response: ApiResponse<PricingRule>;
    };
    updatePricingRule: {
        request: {
            id: string;
        } & Partial<PricingRule>;
        response: ApiResponse<PricingRule>;
    };
}
export interface UserAPIContracts {
    getUsers: {
        request: {
            role?: string;
            isActive?: boolean;
            search?: string;
        } & ListQueryParams;
        response: PaginatedResponse<User[]>;
    };
    getUserById: {
        request: {
            id: string;
        };
        response: ApiResponse<User>;
    };
    createUser: {
        request: CreateUserRequest;
        response: ApiResponse<User>;
    };
    updateUser: {
        request: {
            id: string;
        } & Partial<User>;
        response: ApiResponse<User>;
    };
    deleteUser: {
        request: {
            id: string;
        };
        response: ApiResponse<{
            message: string;
        }>;
    };
}
export interface AnalyticsAPIContracts {
    getOverview: {
        request: {
            dateFrom?: string;
            dateTo?: string;
        };
        response: ApiResponse<AnalyticsOverview>;
    };
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
            timeline: Array<{
                date: string;
                bookings: number;
                revenue: number;
            }>;
        }>;
    };
    getDeviceAnalytics: {
        request: {
            dateFrom?: string;
            dateTo?: string;
        };
        response: ApiResponse<{
            topDevices: Array<{
                deviceName: string;
                brandName: string;
                count: number;
            }>;
            topBrands: Array<{
                brandName: string;
                count: number;
            }>;
            repairTypesByDevice: Record<string, Record<string, number>>;
        }>;
    };
}
export interface EmailAPIContracts {
    getTemplates: {
        request: {
            category?: string;
            isActive?: boolean;
        } & ListQueryParams;
        response: PaginatedResponse<EmailTemplate[]>;
    };
    getTemplateById: {
        request: {
            id: string;
        };
        response: ApiResponse<EmailTemplate>;
    };
    sendEmail: {
        request: SendEmailRequest;
        response: ApiResponse<{
            messageId: string;
            status: string;
        }>;
    };
    previewTemplate: {
        request: {
            id: string;
            variables: Record<string, string>;
        };
        response: ApiResponse<{
            subject: string;
            htmlContent: string;
            textContent: string;
        }>;
    };
}
export interface HealthAPIContracts {
    health: {
        request: {};
        response: ApiResponse<{
            status: 'healthy' | 'unhealthy';
            timestamp: string;
            uptime: number;
            memory: {
                used: number;
                total: number;
                unit: string;
            };
        }>;
    };
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
export interface APIContracts extends AuthAPIContracts, DeviceAPIContracts, BookingAPIContracts, PricingAPIContracts, UserAPIContracts, AnalyticsAPIContracts, EmailAPIContracts, HealthAPIContracts {
}
export declare const API_ROUTES: {
    readonly AUTH: {
        readonly REGISTER: "/api/auth/register";
        readonly LOGIN: "/api/auth/login";
        readonly LOGOUT: "/api/auth/logout";
        readonly ME: "/api/auth/me";
        readonly REFRESH: "/api/auth/refresh";
    };
    readonly DEVICES: {
        readonly CATEGORIES: "/api/devices/categories";
        readonly BRANDS: "/api/devices/brands";
        readonly MODELS: "/api/devices/models";
        readonly POPULAR: "/api/devices/popular";
    };
    readonly BOOKINGS: {
        readonly LIST: "/api/bookings";
        readonly CREATE: "/api/bookings";
        readonly BY_ID: (id: string) => string;
        readonly STATS: "/api/bookings/stats";
    };
    readonly PRICING: {
        readonly CALCULATE: "/api/pricing/calculate";
        readonly RULES: "/api/pricing/rules";
    };
    readonly USERS: {
        readonly LIST: "/api/users";
        readonly CREATE: "/api/users";
        readonly BY_ID: (id: string) => string;
    };
    readonly ANALYTICS: {
        readonly OVERVIEW: "/api/analytics/overview";
        readonly BOOKINGS: "/api/analytics/bookings";
        readonly DEVICES: "/api/analytics/devices";
    };
    readonly EMAIL: {
        readonly TEMPLATES: "/api/email/templates";
        readonly SEND: "/api/email/send";
    };
    readonly HEALTH: {
        readonly STATUS: "/api/health";
        readonly DATABASE: "/api/health/database";
    };
};
export type ExtractApiResponse<T extends {
    response: any;
}> = T['response'];
export type ExtractApiRequest<T extends {
    request: any;
}> = T['request'];
//# sourceMappingURL=api-contracts.d.ts.map