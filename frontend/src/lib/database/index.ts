// Database Module Index
// Centralized exports for all database functionality

// Core database client and utilities
export { db, checkDatabaseConnection, disconnectDatabase, transaction } from './client';

// Connection management and pooling
export { 
  connectionManager, 
  type ConnectionMetrics, 
  type ConnectionPoolConfig,
  DatabaseConnectionManager,
} from './connection-pool';

// Repository pattern base and factory
export { 
  BaseRepository,
  RepositoryFactory,
  type BaseEntity,
  type PaginationOptions,
  type PaginatedResult,
  type SortOptions,
  type FilterOptions,
} from '../repositories';

// Individual repositories
export {
  UserRepository,
  DeviceCategoryRepository,
  DeviceBrandRepository, 
  DeviceModelRepository,
  BookingRepository,
  BookingStatusHistoryRepository,
  NotificationRepository,
  PricingRuleRepository,
} from '../repositories';

// Query optimization and performance
export {
  queryOptimizer,
  QueryOptimizer,
  type QueryPerformanceMetrics,
} from './query-optimization';

// Database migrations and maintenance
export { MigrationHelper } from './migrations';

// Convenience factory functions for repositories
export const createUserRepository = () => RepositoryFactory.getUserRepository();
export const createDeviceCategoryRepository = () => RepositoryFactory.getDeviceCategoryRepository();
export const createDeviceBrandRepository = () => RepositoryFactory.getDeviceBrandRepository();
export const createDeviceModelRepository = () => RepositoryFactory.getDeviceModelRepository();
export const createBookingRepository = () => RepositoryFactory.getBookingRepository();
export const createNotificationRepository = () => RepositoryFactory.getNotificationRepository();
export const createPricingRuleRepository = () => RepositoryFactory.getPricingRuleRepository();

// Database health check utility
export async function getDatabaseHealth() {
  const connectionStatus = await connectionManager.getConnectionPoolStatus();
  const performanceStats = queryOptimizer.getPerformanceStats();
  const connectionMetrics = await connectionManager.getMetrics();
  
  return {
    connection: connectionStatus,
    performance: performanceStats,
    metrics: connectionMetrics,
    timestamp: new Date(),
  };
}

// Initialize database (for application startup)
export async function initializeDatabase(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('🔌 Initializing database connection...');
    
    // Test connection
    const connectionTest = await connectionManager.testConnection();
    if (!connectionTest.success) {
      return {
        success: false,
        message: 'Database connection failed',
        details: connectionTest,
      };
    }

    // Run maintenance if in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Running database maintenance...');
      await queryOptimizer.runMaintenance();
    }

    console.log('✅ Database initialized successfully');
    return {
      success: true,
      message: 'Database initialized successfully',
      details: connectionTest,
    };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return {
      success: false,
      message: 'Database initialization failed',
      details: error,
    };
  }
}

// Cleanup database connections (for application shutdown)
export async function cleanupDatabase(): Promise<void> {
  console.log('🧹 Cleaning up database connections...');
  
  try {
    await connectionManager.shutdown();
    await disconnectDatabase();
    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  }
}