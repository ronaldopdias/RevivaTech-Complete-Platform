// Notification Analytics Service for RevivaTech
// Tracks notification delivery rates, engagement metrics, and performance analytics

import { db } from '@/lib/database/client';
import { NotificationType, NotificationChannel, NotificationStatus } from '@/generated/prisma';

export interface NotificationAnalytics {
  deliveryMetrics: {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
  };
  engagementMetrics: {
    opened: number;
    clicked: number;
    dismissed: number;
    openRate: number;
    clickThroughRate: number;
  };
  channelPerformance: {
    [key in NotificationChannel]: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      deliveryRate: number;
      engagementRate: number;
    };
  };
  typePerformance: {
    [key in NotificationType]: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      deliveryRate: number;
      engagementRate: number;
    };
  };
  timeSeriesData: {
    timestamp: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }[];
}

export interface NotificationEvent {
  notificationId: string;
  userId: string;
  eventType: 'delivered' | 'opened' | 'clicked' | 'dismissed';
  timestamp: Date;
  metadata?: any;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  channel?: NotificationChannel;
  type?: NotificationType;
  status?: NotificationStatus;
}

export class NotificationAnalyticsService {
  private static instance: NotificationAnalyticsService;

  private constructor() {}

  public static getInstance(): NotificationAnalyticsService {
    if (!NotificationAnalyticsService.instance) {
      NotificationAnalyticsService.instance = new NotificationAnalyticsService();
    }
    return NotificationAnalyticsService.instance;
  }

  public async getNotificationAnalytics(
    filters: AnalyticsFilters = {}
  ): Promise<NotificationAnalytics> {
    try {
      const whereClause = this.buildWhereClause(filters);

      // Get basic notification metrics
      const [
        totalNotifications,
        deliveredNotifications,
        failedNotifications,
        pendingNotifications,
        notificationEvents
      ] = await Promise.all([
        db.notification.count({ where: whereClause }),
        db.notification.count({ 
          where: { ...whereClause, status: NotificationStatus.DELIVERED }
        }),
        db.notification.count({ 
          where: { ...whereClause, status: NotificationStatus.FAILED }
        }),
        db.notification.count({ 
          where: { ...whereClause, status: NotificationStatus.PENDING }
        }),
        this.getNotificationEvents(filters)
      ]);

      // Calculate engagement metrics
      const engagementMetrics = this.calculateEngagementMetrics(notificationEvents);

      // Get channel performance
      const channelPerformance = await this.getChannelPerformance(filters);

      // Get type performance
      const typePerformance = await this.getTypePerformance(filters);

      // Get time series data
      const timeSeriesData = await this.getTimeSeriesData(filters);

      return {
        deliveryMetrics: {
          total: totalNotifications,
          delivered: deliveredNotifications,
          failed: failedNotifications,
          pending: pendingNotifications,
          deliveryRate: totalNotifications > 0 ? (deliveredNotifications / totalNotifications) * 100 : 0
        },
        engagementMetrics,
        channelPerformance,
        typePerformance,
        timeSeriesData
      };
    } catch (error) {
      console.error('Failed to get notification analytics:', error);
      throw error;
    }
  }

  public async trackNotificationEvent(event: NotificationEvent): Promise<void> {
    try {
      // Store notification event in database
      // This would require creating a NotificationEvent model
      console.log('Tracking notification event:', event);

      // Update notification status if needed
      if (event.eventType === 'delivered') {
        await db.notification.update({
          where: { id: event.notificationId },
          data: { 
            status: NotificationStatus.DELIVERED,
            data: {
              deliveredAt: event.timestamp
            }
          }
        });
      }

      // Store event data for analytics
      await this.storeNotificationEvent(event);
    } catch (error) {
      console.error('Failed to track notification event:', error);
    }
  }

  public async getDeliveryRateByChannel(
    channel: NotificationChannel,
    filters: AnalyticsFilters = {}
  ): Promise<number> {
    try {
      const whereClause = {
        ...this.buildWhereClause(filters),
        channel
      };

      const [total, delivered] = await Promise.all([
        db.notification.count({ where: whereClause }),
        db.notification.count({ 
          where: { ...whereClause, status: NotificationStatus.DELIVERED }
        })
      ]);

      return total > 0 ? (delivered / total) * 100 : 0;
    } catch (error) {
      console.error('Failed to get delivery rate by channel:', error);
      return 0;
    }
  }

  public async getEngagementRateByType(
    type: NotificationType,
    filters: AnalyticsFilters = {}
  ): Promise<number> {
    try {
      const whereClause = {
        ...this.buildWhereClause(filters),
        type
      };

      const totalSent = await db.notification.count({ where: whereClause });
      const events = await this.getNotificationEvents({ ...filters, type });
      
      const engagedCount = events.filter(event => 
        event.eventType === 'opened' || event.eventType === 'clicked'
      ).length;

      return totalSent > 0 ? (engagedCount / totalSent) * 100 : 0;
    } catch (error) {
      console.error('Failed to get engagement rate by type:', error);
      return 0;
    }
  }

  public async getUserNotificationStats(
    userId: string,
    filters: AnalyticsFilters = {}
  ): Promise<{
    totalReceived: number;
    totalRead: number;
    totalClicked: number;
    readRate: number;
    clickRate: number;
    preferredChannel: NotificationChannel;
    mostEngagingType: NotificationType;
  }> {
    try {
      const whereClause = {
        ...this.buildWhereClause(filters),
        userId
      };

      const [totalReceived, totalRead, notificationEvents] = await Promise.all([
        db.notification.count({ where: whereClause }),
        db.notification.count({ 
          where: { ...whereClause, isRead: true }
        }),
        this.getNotificationEvents({ ...filters, userId })
      ]);

      const totalClicked = notificationEvents.filter(event => 
        event.eventType === 'clicked'
      ).length;

      // Calculate preferred channel
      const channelCounts = await db.notification.groupBy({
        by: ['channel'],
        where: { userId },
        _count: { channel: true }
      });

      const preferredChannel = channelCounts.reduce((prev, current) => 
        prev._count.channel > current._count.channel ? prev : current
      ).channel;

      // Calculate most engaging type
      const typeCounts = await db.notification.groupBy({
        by: ['type'],
        where: { userId, isRead: true },
        _count: { type: true }
      });

      const mostEngagingType = typeCounts.reduce((prev, current) => 
        prev._count.type > current._count.type ? prev : current
      ).type;

      return {
        totalReceived,
        totalRead,
        totalClicked,
        readRate: totalReceived > 0 ? (totalRead / totalReceived) * 100 : 0,
        clickRate: totalReceived > 0 ? (totalClicked / totalReceived) * 100 : 0,
        preferredChannel,
        mostEngagingType
      };
    } catch (error) {
      console.error('Failed to get user notification stats:', error);
      throw error;
    }
  }

  public async getNotificationTrends(
    period: 'hour' | 'day' | 'week' | 'month',
    filters: AnalyticsFilters = {}
  ): Promise<{
    period: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    deliveryRate: number;
    engagementRate: number;
  }[]> {
    try {
      // This would require more complex SQL queries with date grouping
      // For now, return mock data structure
      const mockData = [
        {
          period: '2024-01-01',
          sent: 150,
          delivered: 142,
          opened: 89,
          clicked: 34,
          deliveryRate: 94.7,
          engagementRate: 59.2
        },
        {
          period: '2024-01-02',
          sent: 203,
          delivered: 195,
          opened: 117,
          clicked: 45,
          deliveryRate: 96.1,
          engagementRate: 60.0
        }
      ];

      return mockData;
    } catch (error) {
      console.error('Failed to get notification trends:', error);
      return [];
    }
  }

  public async performABTest(
    testId: string,
    variantA: {
      title: string;
      message: string;
      userIds: string[];
    },
    variantB: {
      title: string;
      message: string;
      userIds: string[];
    }
  ): Promise<{
    testId: string;
    variantA: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      performance: number;
    };
    variantB: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      performance: number;
    };
    winner: 'A' | 'B' | 'tie';
  }> {
    try {
      // This would require implementing A/B testing logic
      // For now, return mock results
      return {
        testId,
        variantA: {
          sent: variantA.userIds.length,
          delivered: Math.floor(variantA.userIds.length * 0.95),
          opened: Math.floor(variantA.userIds.length * 0.6),
          clicked: Math.floor(variantA.userIds.length * 0.25),
          performance: 25.0
        },
        variantB: {
          sent: variantB.userIds.length,
          delivered: Math.floor(variantB.userIds.length * 0.93),
          opened: Math.floor(variantB.userIds.length * 0.65),
          clicked: Math.floor(variantB.userIds.length * 0.30),
          performance: 30.0
        },
        winner: 'B'
      };
    } catch (error) {
      console.error('Failed to perform A/B test:', error);
      throw error;
    }
  }

  public async generateAnalyticsReport(
    filters: AnalyticsFilters = {}
  ): Promise<{
    summary: {
      totalNotifications: number;
      deliveryRate: number;
      engagementRate: number;
      topPerformingChannel: NotificationChannel;
      topPerformingType: NotificationType;
    };
    recommendations: string[];
    insights: string[];
  }> {
    try {
      const analytics = await this.getNotificationAnalytics(filters);

      // Find top performing channel
      const topPerformingChannel = Object.entries(analytics.channelPerformance)
        .reduce((best, [channel, metrics]) => 
          metrics.engagementRate > best.rate ? 
            { channel: channel as NotificationChannel, rate: metrics.engagementRate } : best,
          { channel: NotificationChannel.PUSH, rate: 0 }
        ).channel;

      // Find top performing type
      const topPerformingType = Object.entries(analytics.typePerformance)
        .reduce((best, [type, metrics]) => 
          metrics.engagementRate > best.rate ? 
            { type: type as NotificationType, rate: metrics.engagementRate } : best,
          { type: NotificationType.BOOKING_CONFIRMATION, rate: 0 }
        ).type;

      // Generate recommendations
      const recommendations = this.generateRecommendations(analytics);

      // Generate insights
      const insights = this.generateInsights(analytics);

      return {
        summary: {
          totalNotifications: analytics.deliveryMetrics.total,
          deliveryRate: analytics.deliveryMetrics.deliveryRate,
          engagementRate: analytics.engagementMetrics.openRate,
          topPerformingChannel,
          topPerformingType
        },
        recommendations,
        insights
      };
    } catch (error) {
      console.error('Failed to generate analytics report:', error);
      throw error;
    }
  }

  // Private helper methods
  private buildWhereClause(filters: AnalyticsFilters): any {
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate
      };
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.channel) {
      where.channel = filters.channel;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return where;
  }

  private async getNotificationEvents(filters: AnalyticsFilters): Promise<NotificationEvent[]> {
    // This would require a NotificationEvent model
    // For now, return mock data
    return [];
  }

  private calculateEngagementMetrics(events: NotificationEvent[]): {
    opened: number;
    clicked: number;
    dismissed: number;
    openRate: number;
    clickThroughRate: number;
  } {
    const opened = events.filter(e => e.eventType === 'opened').length;
    const clicked = events.filter(e => e.eventType === 'clicked').length;
    const dismissed = events.filter(e => e.eventType === 'dismissed').length;
    const total = events.length;

    return {
      opened,
      clicked,
      dismissed,
      openRate: total > 0 ? (opened / total) * 100 : 0,
      clickThroughRate: total > 0 ? (clicked / total) * 100 : 0
    };
  }

  private async getChannelPerformance(filters: AnalyticsFilters): Promise<any> {
    // This would require complex aggregation queries
    // For now, return mock data
    return {
      [NotificationChannel.PUSH]: {
        sent: 150,
        delivered: 142,
        opened: 89,
        clicked: 34,
        deliveryRate: 94.7,
        engagementRate: 59.2
      },
      [NotificationChannel.EMAIL]: {
        sent: 200,
        delivered: 185,
        opened: 120,
        clicked: 45,
        deliveryRate: 92.5,
        engagementRate: 64.9
      },
      [NotificationChannel.SMS]: {
        sent: 50,
        delivered: 48,
        opened: 35,
        clicked: 15,
        deliveryRate: 96.0,
        engagementRate: 72.9
      },
      [NotificationChannel.WEBSOCKET]: {
        sent: 300,
        delivered: 298,
        opened: 200,
        clicked: 80,
        deliveryRate: 99.3,
        engagementRate: 66.9
      },
      [NotificationChannel.IN_APP]: {
        sent: 100,
        delivered: 100,
        opened: 75,
        clicked: 30,
        deliveryRate: 100.0,
        engagementRate: 75.0
      }
    };
  }

  private async getTypePerformance(filters: AnalyticsFilters): Promise<any> {
    // This would require complex aggregation queries
    // For now, return mock data
    return {
      [NotificationType.BOOKING_CONFIRMATION]: {
        sent: 100,
        delivered: 98,
        opened: 85,
        clicked: 40,
        deliveryRate: 98.0,
        engagementRate: 86.7
      },
      [NotificationType.STATUS_UPDATE]: {
        sent: 150,
        delivered: 145,
        opened: 110,
        clicked: 35,
        deliveryRate: 96.7,
        engagementRate: 75.9
      },
      [NotificationType.PAYMENT_REQUEST]: {
        sent: 80,
        delivered: 75,
        opened: 65,
        clicked: 55,
        deliveryRate: 93.8,
        engagementRate: 84.6
      }
    };
  }

  private async getTimeSeriesData(filters: AnalyticsFilters): Promise<any[]> {
    // This would require time-series queries
    // For now, return mock data
    return [
      {
        timestamp: '2024-01-01T00:00:00Z',
        sent: 150,
        delivered: 142,
        opened: 89,
        clicked: 34
      },
      {
        timestamp: '2024-01-02T00:00:00Z',
        sent: 203,
        delivered: 195,
        opened: 117,
        clicked: 45
      }
    ];
  }

  private async storeNotificationEvent(event: NotificationEvent): Promise<void> {
    // This would require a NotificationEvent model
    console.log('Storing notification event:', event);
  }

  private generateRecommendations(analytics: NotificationAnalytics): string[] {
    const recommendations: string[] = [];

    if (analytics.deliveryMetrics.deliveryRate < 90) {
      recommendations.push('Delivery rate is below 90%. Consider reviewing your notification infrastructure and user subscriptions.');
    }

    if (analytics.engagementMetrics.openRate < 50) {
      recommendations.push('Open rate is below 50%. Consider A/B testing different notification titles and content.');
    }

    if (analytics.engagementMetrics.clickThroughRate < 20) {
      recommendations.push('Click-through rate is below 20%. Consider adding more compelling call-to-action buttons.');
    }

    return recommendations;
  }

  private generateInsights(analytics: NotificationAnalytics): string[] {
    const insights: string[] = [];

    const bestChannel = Object.entries(analytics.channelPerformance)
      .reduce((best, [channel, metrics]) => 
        metrics.engagementRate > best.rate ? 
          { channel, rate: metrics.engagementRate } : best,
        { channel: 'PUSH', rate: 0 }
      );

    insights.push(`${bestChannel.channel} has the highest engagement rate at ${bestChannel.rate.toFixed(1)}%`);

    const totalSent = analytics.deliveryMetrics.total;
    if (totalSent > 1000) {
      insights.push('High notification volume detected. Consider implementing frequency capping to prevent user fatigue.');
    }

    return insights;
  }
}

export const notificationAnalyticsService = NotificationAnalyticsService.getInstance();