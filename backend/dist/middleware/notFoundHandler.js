"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            type: 'NotFoundError',
        },
        availableEndpoints: {
            health: '/api/health',
            auth: '/api/auth',
            devices: '/api/devices',
            bookings: '/api/bookings',
            customers: '/api/customers',
        },
        timestamp: new Date().toISOString(),
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=notFoundHandler.js.map