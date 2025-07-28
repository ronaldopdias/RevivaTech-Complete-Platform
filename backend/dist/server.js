"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./utils/logger");
const PORT = process.env.PORT || 3011;
const NODE_ENV = process.env.NODE_ENV || 'development';
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
const server = app_1.default.listen(PORT, () => {
    logger_1.logger.info(`🚀 RevivaTech API Server running on port ${PORT}`);
    logger_1.logger.info(`📋 Environment: ${NODE_ENV}`);
    logger_1.logger.info(`🌐 API Documentation: http://localhost:${PORT}/api/health`);
    console.log(`
╭─────────────────────────────────────────────────────╮
│                 RevivaTech API Server                │
│                                                     │
│  🚀 Server: http://localhost:${PORT}                   │
│  📋 Environment: ${NODE_ENV.padEnd(12)}                 │
│  🕐 Started: ${new Date().toISOString()}        │
│                                                     │
│  📚 API Endpoints:                                   │
│  • Health: /api/health                              │
│  • Auth: /api/auth                                  │
│  • Devices: /api/devices                            │
│  • Bookings: /api/bookings                          │
│  • Customers: /api/customers                        │
╰─────────────────────────────────────────────────────╯
  `);
});
exports.server = server;
const gracefulShutdown = (signal) => {
    logger_1.logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
        logger_1.logger.info('Server closed');
        process.exit(0);
    });
    setTimeout(() => {
        logger_1.logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
//# sourceMappingURL=server.js.map