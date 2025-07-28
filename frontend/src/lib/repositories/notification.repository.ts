// Notification Repository
// Repository for multi-channel notification management

import { 
  Notification, 
  NotificationType,
  NotificationChannel,
  NotificationStatus 
} from '@/generated/prisma';
import { BaseRepository, PaginationOptions, PaginatedResult } from '../database/repository.base';

export interface CreateNotificationData {
  userId: string;
  bookingId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: any;
  scheduledFor?: Date;
}

export interface NotificationSearchFilters {
  userId?: string;
  bookingId?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  isRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export class NotificationRepository extends BaseRepository<Notification> {
  protected readonly modelName = 'notification';

  async createNotification(data: CreateNotificationData): Promise<Notification> {
    return await this.create(data);
  }

  async createBulkNotifications(notifications: CreateNotificationData[]): Promise<{ count: number }> {
    return await this.createMany(notifications);
  }

  async findUserNotifications(
    userId: string,
    pagination?: PaginationOptions,
    onlyUnread: boolean = false
  ): Promise<Notification[] | PaginatedResult<Notification>> {
    const where: any = { userId };
    if (onlyUnread) {
      where.isRead = false;
    }

    const options = {
      where,
      include: {
        booking: {
          include: {
            deviceModel: {
              include: {
                brand: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ field: 'createdAt', direction: 'desc' as const }],
    };

    if (pagination) {
      return await this.findPaginated(pagination, options);
    }

    return await this.findMany(options);
  }

  async markAsRead(id: string): Promise<Notification> {
    return await this.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    return await this.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async markAsUnread(id: string): Promise<Notification> {
    return await this.update(id, { isRead: false });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.count({
      userId,
      isRead: false,
    });
  }

  async findPendingNotifications(): Promise<Notification[]> {
    const now = new Date();
    
    return await this.findMany({
      where: {
        status: NotificationStatus.PENDING,
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: now } },
        ],
      },
      orderBy: [{ field: 'createdAt', direction: 'asc' }],
    });
  }

  async findFailedNotifications(maxRetries: number = 3): Promise<Notification[]> {
    return await this.findMany({
      where: {
        status: NotificationStatus.FAILED,
        retryCount: { lt: maxRetries },
      },
      orderBy: [{ field: 'createdAt', direction: 'asc' }],
    });
  }

  async updateNotificationStatus(
    id: string, 
    status: NotificationStatus,
    incrementRetry: boolean = false
  ): Promise<Notification> {
    const updateData: any = { status };
    
    if (status === NotificationStatus.SENT) {
      updateData.sentAt = new Date();
    }
    
    if (incrementRetry) {
      // Use raw query to increment retry count atomically
      return await this.rawQuery(`
        UPDATE notifications 
        SET status = ?, retry_count = retry_count + 1, updated_at = NOW()
        WHERE id = ?
        RETURNING *
      `, status, id).then(results => results[0]);
    }

    return await this.update(id, updateData);
  }

  async searchNotifications(
    query: string,
    filters?: NotificationSearchFilters,
    pagination?: PaginationOptions
  ): Promise<Notification[] | PaginatedResult<Notification>> {
    const whereConditions: any = {};

    if (filters?.userId) whereConditions.userId = filters.userId;
    if (filters?.bookingId) whereConditions.bookingId = filters.bookingId;
    if (filters?.type) whereConditions.type = filters.type;
    if (filters?.channel) whereConditions.channel = filters.channel;
    if (filters?.status) whereConditions.status = filters.status;
    if (filters?.isRead !== undefined) whereConditions.isRead = filters.isRead;

    if (filters?.dateFrom || filters?.dateTo) {
      whereConditions.createdAt = {};
      if (filters.dateFrom) whereConditions.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) whereConditions.createdAt.lte = filters.dateTo;
    }

    const searchOptions = {
      where: whereConditions,
      include: {
        user: true,
        booking: {
          include: {
            deviceModel: {
              include: {
                brand: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ field: 'createdAt', direction: 'desc' as const }],
      pagination,
    };

    return await this.search(
      query,
      ['title', 'message'],
      searchOptions
    );
  }

  async getNotificationStats(): Promise<{
    total: number;
    byStatus: Record<NotificationStatus, number>;
    byChannel: Record<NotificationChannel, number>;
    byType: Record<NotificationType, number>;
    unreadCount: number;
    successRate: number;
  }> {
    const notifications = await this.findMany({});
    
    const total = notifications.length;
    const byStatus: Record<NotificationStatus, number> = {} as any;
    const byChannel: Record<NotificationChannel, number> = {} as any;
    const byType: Record<NotificationType, number> = {} as any;
    
    let unreadCount = 0;
    let successCount = 0;

    // Initialize counters
    Object.values(NotificationStatus).forEach(status => byStatus[status as NotificationStatus] = 0);
    Object.values(NotificationChannel).forEach(channel => byChannel[channel as NotificationChannel] = 0);
    Object.values(NotificationType).forEach(type => byType[type as NotificationType] = 0);

    notifications.forEach(notification => {
      byStatus[notification.status]++;
      byChannel[notification.channel]++;
      byType[notification.type]++;
      
      if (!notification.isRead) unreadCount++;
      if (notification.status === NotificationStatus.DELIVERED || 
          notification.status === NotificationStatus.SENT) {
        successCount++;
      }
    });

    const successRate = total > 0 ? (successCount / total) * 100 : 0;

    return {
      total,
      byStatus,
      byChannel,
      byType,
      unreadCount,
      successRate,
    };
  }

  async findNotificationsByBooking(bookingId: string): Promise<Notification[]> {
    return await this.findMany({
      where: { bookingId },
      include: { user: true },
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  async scheduleNotification(
    data: CreateNotificationData,
    scheduledFor: Date
  ): Promise<Notification> {
    return await this.create({
      ...data,
      scheduledFor,
      status: NotificationStatus.PENDING,
    });
  }

  async bulkScheduleNotifications(
    notifications: Array<CreateNotificationData & { scheduledFor: Date }>
  ): Promise<{ count: number }> {
    const notificationsWithStatus = notifications.map(n => ({
      ...n,
      status: NotificationStatus.PENDING,
    }));
    
    return await this.createMany(notificationsWithStatus);
  }

  async cancelScheduledNotification(id: string): Promise<Notification> {
    return await this.update(id, { 
      status: NotificationStatus.CANCELLED 
    });
  }

  async rescheduleNotification(id: string, newDate: Date): Promise<Notification> {
    return await this.update(id, {
      scheduledFor: newDate,
      status: NotificationStatus.PENDING,
    });
  }

  async findExpiredNotifications(olderThanDays: number = 30): Promise<Notification[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return await this.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: {
          in: [
            NotificationStatus.DELIVERED,
            NotificationStatus.FAILED,
            NotificationStatus.CANCELLED,
          ],
        },
      },
    });
  }

  async cleanupOldNotifications(olderThanDays: number = 90): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return await this.deleteMany({
      createdAt: { lt: cutoffDate },
      status: {
        in: [
          NotificationStatus.DELIVERED,
          NotificationStatus.CANCELLED,
        ],
      },
    });
  }

  async getNotificationsByDateRange(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; count: number; successRate: number }>> {
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

    return await this.rawQuery(`
      SELECT 
        TO_CHAR(created_at, ?) as date,
        COUNT(*)::int as count,
        (COUNT(CASE WHEN status IN ('SENT', 'DELIVERED') THEN 1 END)::float / COUNT(*)::float * 100) as success_rate
      FROM notifications
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY TO_CHAR(created_at, ?)
      ORDER BY date
    `, dateFormat, startDate, endDate, dateFormat);
  }
}