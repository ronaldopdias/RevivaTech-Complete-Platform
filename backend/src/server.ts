import app from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3011;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 RevivaTech API Server running on port ${PORT}`);
  logger.info(`📋 Environment: ${NODE_ENV}`);
  logger.info(`🌐 API Documentation: http://localhost:${PORT}/api/health`);
  
  // Display startup banner
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

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { server };