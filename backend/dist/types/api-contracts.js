"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ROUTES = void 0;
exports.API_ROUTES = {
    AUTH: {
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        ME: '/api/auth/me',
        REFRESH: '/api/auth/refresh',
    },
    DEVICES: {
        CATEGORIES: '/api/devices/categories',
        BRANDS: '/api/devices/brands',
        MODELS: '/api/devices/models',
        POPULAR: '/api/devices/popular',
    },
    BOOKINGS: {
        LIST: '/api/bookings',
        CREATE: '/api/bookings',
        BY_ID: (id) => `/api/bookings/${id}`,
        STATS: '/api/bookings/stats',
    },
    PRICING: {
        CALCULATE: '/api/pricing/calculate',
        RULES: '/api/pricing/rules',
    },
    USERS: {
        LIST: '/api/users',
        CREATE: '/api/users',
        BY_ID: (id) => `/api/users/${id}`,
    },
    ANALYTICS: {
        OVERVIEW: '/api/analytics/overview',
        BOOKINGS: '/api/analytics/bookings',
        DEVICES: '/api/analytics/devices',
    },
    EMAIL: {
        TEMPLATES: '/api/email/templates',
        SEND: '/api/email/send',
    },
    HEALTH: {
        STATUS: '/api/health',
        DATABASE: '/api/health/database',
    },
};
//# sourceMappingURL=api-contracts.js.map