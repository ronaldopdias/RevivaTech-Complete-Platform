"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = void 0;
const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET',
    'DATABASE_URL'
];
const validateEnvironment = (req, res, next) => {
    if (req.path === '/api/health' || req.path === '/') {
        return next();
    }
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        return res.status(500).json({
            success: false,
            error: {
                message: 'Server configuration error',
                type: 'ConfigurationError',
                details: process.env.NODE_ENV === 'development'
                    ? `Missing environment variables: ${missingVars.join(', ')}`
                    : 'Server misconfiguration detected',
            },
            timestamp: new Date().toISOString(),
        });
    }
    next();
};
exports.validateEnvironment = validateEnvironment;
//# sourceMappingURL=validateEnvironment.js.map