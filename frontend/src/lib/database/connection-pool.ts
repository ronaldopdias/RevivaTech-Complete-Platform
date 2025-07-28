// Database Connection Pooling & Monitoring
// Advanced connection management and health monitoring

import { PrismaClient } from '@/generated/prisma';

export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMs: number;
  createRetryIntervalMs: number;
  createTimeoutMs: number;
  idleTimeoutMs: number;
  reapIntervalMs: number;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  queriesExecuted: number;
  averageQueryTime: number;
  lastHealthCheck: Date;
  uptime: number;
}

export class DatabaseConnectionManager {
  private prisma: PrismaClient;
  private metrics: ConnectionMetrics;
  private queryTimes: number[] = [];
  private startTime: Date;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config?: Partial<ConnectionPoolConfig>) {
    this.startTime = new Date();
    
    const defaultConfig: ConnectionPoolConfig = {
      maxConnections: 20,
      minConnections: 2,
      acquireTimeoutMs: 30000,
      createRetryIntervalMs: 1000,
      createTimeoutMs: 30000,
      idleTimeoutMs: 600000, // 10 minutes
      reapIntervalMs: 60000,  // 1 minute
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Initialize Prisma with connection pooling
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.buildConnectionString(finalConfig),
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });

    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingConnections: 0,
      queriesExecuted: 0,
      averageQueryTime: 0,
      lastHealthCheck: new Date(),
      uptime: 0,
    };

    this.initializeMonitoring();
  }

  private buildConnectionString(config: ConnectionPoolConfig): string {
    const baseUrl = process.env.DATABASE_URL || '';
    const url = new URL(baseUrl);
    
    // Add connection pool parameters
    url.searchParams.set('connection_limit', config.maxConnections.toString());
    url.searchParams.set('pool_timeout', (config.acquireTimeoutMs / 1000).toString());
    url.searchParams.set('connect_timeout', (config.createTimeoutMs / 1000).toString());
    
    return url.toString();
  }

  private initializeMonitoring() {
    // Set up periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Every 30 seconds

    // Middleware to track query performance
    this.prisma.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const duration = Date.now() - start;
      
      this.recordQueryMetrics(duration);
      return result;
    });
  }

  private recordQueryMetrics(duration: number) {
    this.metrics.queriesExecuted++;
    this.queryTimes.push(duration);
    
    // Keep only last 100 query times for rolling average
    if (this.queryTimes.length > 100) {
      this.queryTimes = this.queryTimes.slice(-100);
    }
    
    this.metrics.averageQueryTime = 
      this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length;
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      
      this.metrics.lastHealthCheck = new Date();
      this.metrics.uptime = Date.now() - this.startTime.getTime();
      
      // Log slow health checks
      if (responseTime > 1000) {
        console.warn(`Slow database health check: ${responseTime}ms`);
      }
    } catch (error) {
      console.error('Database health check failed:', error);
    }
  }

  // Get current connection metrics
  async getMetrics(): Promise<ConnectionMetrics> {
    try {
      // Get database connection info
      const connectionInfo = await this.prisma.$queryRaw<Array<{ 
        active_connections: number;
        total_connections: number;
      }>>`
        SELECT 
          COUNT(CASE WHEN state = 'active' THEN 1 END)::int as active_connections,
          COUNT(*)::int as total_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      if (connectionInfo.length > 0) {
        this.metrics.activeConnections = connectionInfo[0].active_connections;
        this.metrics.totalConnections = connectionInfo[0].total_connections;
        this.metrics.idleConnections = this.metrics.totalConnections - this.metrics.activeConnections;
      }
    } catch (error) {
      console.error('Failed to get connection metrics:', error);
    }

    return { ...this.metrics };
  }

  // Test database connectivity
  async testConnection(): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      await this.prisma.$queryRaw`SELECT 1 as test`;
      const responseTime = Date.now() - start;
      
      return { success: true, responseTime };
    } catch (error) {
      const responseTime = Date.now() - start;
      return { 
        success: false, 
        responseTime, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Execute query with automatic retry
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (this.isRetryableError(error) && attempt < maxRetries) {
          console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms:`, error);
          await this.delay(delayMs * attempt); // Exponential backoff
          continue;
        }
        
        throw error;
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'Connection terminated',
      'Connection lost',
      'Connection timed out',
    ];

    const errorMessage = error?.message || '';
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get database size and usage info
  async getDatabaseStats(): Promise<{
    databaseSize: string;
    tableStats: Array<{
      tableName: string;
      rowCount: number;
      tableSize: string;
      indexSize: string;
    }>;
  }> {
    try {
      const sizeResult = await this.prisma.$queryRaw<Array<{ database_size: string }>>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `;

      const tableStatsResult = await this.prisma.$queryRaw<Array<{
        table_name: string;
        row_count: number;
        table_size: string;
        index_size: string;
      }>>`
        SELECT 
          schemaname||'.'||tablename as table_name,
          n_tup_ins + n_tup_upd + n_tup_del as row_count,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      return {
        databaseSize: sizeResult[0]?.database_size || 'Unknown',
        tableStats: tableStatsResult.map(stat => ({
          tableName: stat.table_name,
          rowCount: Number(stat.row_count),
          tableSize: stat.table_size,
          indexSize: stat.index_size,
        })),
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        databaseSize: 'Unknown',
        tableStats: [],
      };
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('Shutting down database connection manager...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    try {
      await this.prisma.$disconnect();
      console.log('Database connections closed successfully');
    } catch (error) {
      console.error('Error during database shutdown:', error);
    }
  }

  // Get the Prisma client instance
  getClient(): PrismaClient {
    return this.prisma;
  }

  // Connection pool status
  async getConnectionPoolStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    details: {
      activeConnections: number;
      maxConnections: number;
      utilization: number;
      avgQueryTime: number;
      healthCheckStatus: boolean;
    };
  }> {
    const metrics = await this.getMetrics();
    const connectionTest = await this.testConnection();
    
    const maxConnections = 20; // From config
    const utilization = (metrics.activeConnections / maxConnections) * 100;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (!connectionTest.success || utilization > 90 || metrics.averageQueryTime > 5000) {
      status = 'critical';
    } else if (utilization > 70 || metrics.averageQueryTime > 1000) {
      status = 'warning';
    }
    
    return {
      status,
      details: {
        activeConnections: metrics.activeConnections,
        maxConnections,
        utilization: Math.round(utilization),
        avgQueryTime: Math.round(metrics.averageQueryTime),
        healthCheckStatus: connectionTest.success,
      },
    };
  }
}

// Singleton instance
export const connectionManager = new DatabaseConnectionManager();

// Export the configured Prisma client
export const db = connectionManager.getClient();