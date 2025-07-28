// Query Optimization Strategies
// Database performance optimization utilities and query builders

import { PrismaClient } from '@/generated/prisma';
import { db } from './client';

export interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  rowsAffected: number;
  timestamp: Date;
}

export class QueryOptimizer {
  private prisma: PrismaClient;
  private performanceLog: QueryPerformanceMetrics[] = [];

  constructor() {
    this.prisma = db;
  }

  // Measure query performance
  async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<{ result: T; metrics: QueryPerformanceMetrics }> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const executionTime = performance.now() - startTime;
      
      const metrics: QueryPerformanceMetrics = {
        query: queryName,
        executionTime,
        rowsAffected: Array.isArray(result) ? result.length : 1,
        timestamp: new Date(),
      };

      this.performanceLog.push(metrics);
      
      // Keep only last 100 measurements
      if (this.performanceLog.length > 100) {
        this.performanceLog = this.performanceLog.slice(-100);
      }

      return { result, metrics };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      const metrics: QueryPerformanceMetrics = {
        query: `${queryName} (ERROR)`,
        executionTime,
        rowsAffected: 0,
        timestamp: new Date(),
      };

      this.performanceLog.push(metrics);
      throw error;
    }
  }

  // Get performance statistics
  getPerformanceStats(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowestQueries: QueryPerformanceMetrics[];
    recentQueries: QueryPerformanceMetrics[];
  } {
    const totalQueries = this.performanceLog.length;
    const averageExecutionTime = totalQueries > 0 
      ? this.performanceLog.reduce((sum, log) => sum + log.executionTime, 0) / totalQueries
      : 0;

    const slowestQueries = [...this.performanceLog]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    const recentQueries = [...this.performanceLog]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    return {
      totalQueries,
      averageExecutionTime,
      slowestQueries,
      recentQueries,
    };
  }

  // Optimized query builders
  
  // Efficient booking queries with proper includes
  async findBookingsOptimized(params: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
    includeFull?: boolean;
  }) {
    const { customerId, status, limit = 50, offset = 0, includeFull = false } = params;

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const include = includeFull ? {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      deviceModel: {
        include: {
          brand: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    } : {
      deviceModel: {
        select: {
          id: true,
          name: true,
          brand: {
            select: {
              id: true,
              name: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    };

    return await this.measureQuery('findBookingsOptimized', async () => {
      const [bookings, total] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          include,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.booking.count({ where }),
      ]);

      return { bookings, total };
    });
  }

  // Efficient device search with full-text search simulation
  async searchDevicesOptimized(searchTerm: string, categoryId?: string) {
    return await this.measureQuery('searchDevicesOptimized', async () => {
      const where: any = {
        isActive: true,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { brand: { name: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      };

      if (categoryId) {
        where.brand = {
          ...where.brand,
          categoryId,
        };
      }

      return await this.prisma.deviceModel.findMany({
        where,
        include: {
          brand: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: [
          { year: 'desc' },
          { name: 'asc' },
        ],
        take: 20,
      });
    });
  }

  // Dashboard stats with efficient aggregation
  async getDashboardStatsOptimized() {
    return await this.measureQuery('getDashboardStatsOptimized', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue,
        recentBookings,
        popularDevices,
      ] = await Promise.all([
        this.prisma.booking.count(),
        this.prisma.booking.count({ where: { status: 'PENDING' } }),
        this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
        this.prisma.booking.aggregate({
          _sum: { finalPrice: true },
          where: { status: 'COMPLETED' },
        }),
        this.prisma.booking.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.$queryRaw`
          SELECT dm.name, db.name as brand_name, COUNT(b.id) as booking_count
          FROM device_models dm
          JOIN device_brands db ON db.id = dm.brand_id
          LEFT JOIN bookings b ON b.device_model_id = dm.id
          WHERE dm.is_active = true
          GROUP BY dm.id, dm.name, db.name
          ORDER BY booking_count DESC
          LIMIT 5
        `,
      ]);

      return {
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue: Number(totalRevenue._sum.finalPrice || 0),
        recentBookings,
        popularDevices,
      };
    });
  }

  // Efficient notification queries
  async getUserNotificationsOptimized(userId: string, limit: number = 20) {
    return await this.measureQuery('getUserNotificationsOptimized', async () => {
      const [notifications, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where: { userId },
          include: {
            booking: {
              select: {
                id: true,
                status: true,
                deviceModel: {
                  select: {
                    name: true,
                    brand: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        this.prisma.notification.count({
          where: { userId, isRead: false },
        }),
      ]);

      return { notifications, unreadCount };
    });
  }

  // Bulk operations for better performance
  async bulkUpdateBookingStatus(bookingIds: string[], status: string, updatedBy: string) {
    return await this.measureQuery('bulkUpdateBookingStatus', async () => {
      return await this.prisma.$transaction(async (tx) => {
        // Update bookings
        const updatedBookings = await tx.booking.updateMany({
          where: { id: { in: bookingIds } },
          data: { status },
        });

        // Create status history entries
        const statusHistoryData = bookingIds.map(bookingId => ({
          bookingId,
          status,
          notes: `Bulk status update to ${status}`,
          createdBy: updatedBy,
        }));

        await tx.bookingStatusHistory.createMany({
          data: statusHistoryData,
        });

        return updatedBookings;
      });
    });
  }

  // Advanced reporting with optimized queries
  async getBookingReportOptimized(params: {
    startDate: Date;
    endDate: Date;
    groupBy: 'day' | 'week' | 'month';
  }) {
    const { startDate, endDate, groupBy } = params;
    
    return await this.measureQuery('getBookingReportOptimized', async () => {
      let dateFormat: string;
      switch (groupBy) {
        case 'week':
          dateFormat = 'YYYY-"W"WW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }

      const results = await this.prisma.$queryRaw`
        SELECT 
          TO_CHAR(created_at, ${dateFormat}) as period,
          COUNT(*)::int as booking_count,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as completed_count,
          SUM(CASE WHEN status = 'COMPLETED' THEN final_price ELSE 0 END)::float as revenue,
          AVG(final_price)::float as average_price
        FROM bookings
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY TO_CHAR(created_at, ${dateFormat})
        ORDER BY period
      `;

      return results;
    });
  }

  // Database maintenance and optimization
  async runMaintenance() {
    return await this.measureQuery('runMaintenance', async () => {
      const results = {
        analyzedTables: 0,
        cleanedNotifications: 0,
        cleanedSessions: 0,
      };

      // Analyze tables for query planner
      const tables = [
        'users', 'bookings', 'device_models', 'device_brands', 
        'device_categories', 'notifications', 'pricing_rules'
      ];

      for (const table of tables) {
        try {
          await this.prisma.$executeRawUnsafe(`ANALYZE "${table}";`);
          results.analyzedTables++;
        } catch (error) {
          console.warn(`Failed to analyze table ${table}:`, error);
        }
      }

      // Clean old notifications (older than 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const cleanedNotifications = await this.prisma.notification.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
          status: { in: ['DELIVERED', 'CANCELLED'] },
        },
      });
      results.cleanedNotifications = cleanedNotifications.count;

      // Clean expired sessions
      const cleanedSessions = await this.prisma.userSession.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      results.cleanedSessions = cleanedSessions.count;

      return results;
    });
  }

  // Index recommendations based on query patterns
  getIndexRecommendations(): string[] {
    const recommendations = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_customer_status ON bookings(customer_id, status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status_urgency ON bookings(status, urgency_level);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_device_models_brand_year ON device_models(brand_id, year DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_device_models_search ON device_models USING gin(to_tsvector(\'english\', name));',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pricing_rules_device_repair ON pricing_rules(device_model_id, repair_type) WHERE is_active = true;',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);',
    ];

    return recommendations;
  }

  // Apply recommended indexes
  async applyRecommendedIndexes() {
    const recommendations = this.getIndexRecommendations();
    const results = { created: 0, errors: [] as string[] };

    for (const indexSQL of recommendations) {
      try {
        await this.prisma.$executeRawUnsafe(indexSQL);
        results.created++;
      } catch (error) {
        results.errors.push(`${indexSQL}: ${error}`);
      }
    }

    return results;
  }
}

// Singleton instance
export const queryOptimizer = new QueryOptimizer();