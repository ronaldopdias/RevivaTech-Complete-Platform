// Real-time Analytics API endpoint
// Provides live metrics and insights for the analytics dashboard
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';
import { customerIntelligenceService } from '@/lib/services/customerIntelligence.service';
import { z } from 'zod';

const prisma = new PrismaClient();

// Query parameter validation
const QuerySchema = z.object({
  timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h'),
  includeSegments: z.boolean().default(false),
  includeEvents: z.boolean().default(true),
  includeGeographic: z.boolean().default(true),
});

// Time range mappings
const timeRangeHours = {
  '1h': 1,
  '6h': 6,
  '24h': 24,
  '7d': 168,
  '30d': 720,
};

// Cache for real-time metrics (Redis would be better in production)
const metricsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

async function getCachedMetrics(key: string): Promise<any | null> {
  const cached = metricsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedMetrics(key: string, data: any): void {
  metricsCache.set(key, { data, timestamp: Date.now() });
}

// GET /api/analytics/realtime
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse({
      timeRange: searchParams.get('timeRange') || '24h',
      includeSegments: searchParams.get('includeSegments') === 'true',
      includeEvents: searchParams.get('includeEvents') !== 'false',
      includeGeographic: searchParams.get('includeGeographic') !== 'false',
    });

    const cacheKey = `realtime_${query.timeRange}_${query.includeSegments}_${query.includeEvents}_${query.includeGeographic}`;
    
    // Try to get from cache first
    const cached = await getCachedMetrics(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Calculate time range
    const hoursAgo = timeRangeHours[query.timeRange];
    const fromDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const toDate = new Date();

    // Parallel data fetching for better performance
    const [
      totalPageViews,
      uniqueVisitors,
      recentEvents,
      sessionData,
      conversionEvents,
    ] = await Promise.all([
      // Total page views
      prisma.behavioralEvent.count({
        where: {
          eventType: 'page_view',
          timestamp: { gte: fromDate, lte: toDate },
        },
      }),

      // Unique visitors (by session)
      prisma.behavioralEvent.groupBy({
        by: ['sessionId'],
        where: {
          timestamp: { gte: fromDate, lte: toDate },
        },
        _count: { sessionId: true },
      }),

      // Recent events for activity feed
      prisma.behavioralEvent.findMany({
        where: {
          timestamp: { gte: fromDate, lte: toDate },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
        select: {
          id: true,
          eventType: true,
          eventName: true,
          sessionId: true,
          customerId: true,
          pageUrl: true,
          properties: true,
          timestamp: true,
        },
      }),

      // Session data for metrics calculation
      prisma.customerJourney.findMany({
        where: {
          startTime: { gte: fromDate, lte: toDate },
        },
        include: {
          customer: {
            select: { email: true, name: true },
          },
        },
      }),

      // Conversion events
      prisma.behavioralEvent.findMany({
        where: {
          eventType: 'conversion',
          timestamp: { gte: fromDate, lte: toDate },
        },
      }),
    ]);

    // Calculate active users (users with activity in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await prisma.behavioralEvent.groupBy({
      by: ['sessionId'],
      where: {
        timestamp: { gte: fiveMinutesAgo, lte: toDate },
      },
      _count: { sessionId: true },
    });

    // Calculate top pages
    const topPagesData = await prisma.behavioralEvent.groupBy({
      by: ['pageUrl'],
      where: {
        eventType: 'page_view',
        timestamp: { gte: fromDate, lte: toDate },
      },
      _count: { pageUrl: true },
      orderBy: { _count: { pageUrl: 'desc' } },
      take: 10,
    });

    // Calculate unique views per page
    const topPages = await Promise.all(
      topPagesData.map(async (page) => {
        const uniqueViews = await prisma.behavioralEvent.groupBy({
          by: ['sessionId'],
          where: {
            eventType: 'page_view',
            pageUrl: page.pageUrl,
            timestamp: { gte: fromDate, lte: toDate },
          },
          _count: { sessionId: true },
        });

        return {
          url: page.pageUrl || 'Unknown',
          views: page._count.pageUrl,
          uniqueViews: uniqueViews.length,
        };
      })
    );

    // Calculate top events
    const topEventsData = await prisma.behavioralEvent.groupBy({
      by: ['eventType'],
      where: {
        timestamp: { gte: fromDate, lte: toDate },
      },
      _count: { eventType: true },
      orderBy: { _count: { eventType: 'desc' } },
    });

    const topEvents = topEventsData.map((event) => ({
      name: event.eventType || 'unknown',
      count: event._count.eventType,
      trend: 'stable' as const, // Would calculate from historical data
    }));

    // Calculate bounce rate (sessions with only 1 page view)
    const singlePageSessions = await prisma.behavioralEvent.groupBy({
      by: ['sessionId'],
      where: {
        eventType: 'page_view',
        timestamp: { gte: fromDate, lte: toDate },
      },
      _count: { sessionId: true },
      having: {
        sessionId: { _count: { equals: 1 } },
      },
    });

    const bounceRate = uniqueVisitors.length > 0 
      ? (singlePageSessions.length / uniqueVisitors.length) * 100
      : 0;

    // Calculate average session duration
    const avgSessionDuration = sessionData.length > 0
      ? sessionData.reduce((sum, session) => {
          if (session.endTime && session.startTime) {
            return sum + (session.endTime.getTime() - session.startTime.getTime()) / 1000;
          }
          return sum;
        }, 0) / sessionData.filter(s => s.endTime).length
      : 0;

    // Calculate conversion rate
    const conversionRate = uniqueVisitors.length > 0
      ? (conversionEvents.length / uniqueVisitors.length) * 100
      : 0;

    // Get geographic data (mock for now - would integrate with GeoIP service)
    const geographicData = [
      { country: 'United Kingdom', users: Math.floor(uniqueVisitors.length * 0.6), percentage: 60 },
      { country: 'United States', users: Math.floor(uniqueVisitors.length * 0.15), percentage: 15 },
      { country: 'Germany', users: Math.floor(uniqueVisitors.length * 0.1), percentage: 10 },
      { country: 'France', users: Math.floor(uniqueVisitors.length * 0.08), percentage: 8 },
      { country: 'Other', users: Math.floor(uniqueVisitors.length * 0.07), percentage: 7 },
    ];

    // Get device types (mock for now - would extract from user agents)
    const deviceTypes = [
      { type: 'Desktop', users: Math.floor(uniqueVisitors.length * 0.6), percentage: 60 },
      { type: 'Mobile', users: Math.floor(uniqueVisitors.length * 0.3), percentage: 30 },
      { type: 'Tablet', users: Math.floor(uniqueVisitors.length * 0.1), percentage: 10 },
    ];

    // Format recent events for activity feed
    const formattedRecentEvents = recentEvents.slice(0, 20).map(event => ({
      id: event.id,
      type: event.eventType || 'unknown',
      user: event.customerId || 'Anonymous',
      page: event.pageUrl || 'Unknown',
      timestamp: event.timestamp,
      properties: event.properties as Record<string, any> || {},
    }));

    // Generate alerts based on metrics
    const alerts = [];
    
    if (bounceRate > 60) {
      alerts.push({
        id: 'high-bounce-rate',
        type: 'warning' as const,
        message: `High bounce rate detected: ${bounceRate.toFixed(1)}%`,
        timestamp: new Date(),
      });
    }

    if (activeUsers.length === 0 && hoursAgo <= 1) {
      alerts.push({
        id: 'no-active-users',
        type: 'warning' as const,
        message: 'No active users detected in the last hour',
        timestamp: new Date(),
      });
    }

    if (conversionRate > 5) {
      alerts.push({
        id: 'high-conversion',
        type: 'info' as const,
        message: `Excellent conversion rate: ${conversionRate.toFixed(1)}%`,
        timestamp: new Date(),
      });
    }

    // Compile final metrics
    const metrics = {
      activeUsers: activeUsers.length,
      pageViews: totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      bounceRate: Math.round(bounceRate * 10) / 10,
      avgSessionDuration: Math.round(avgSessionDuration),
      conversionRate: Math.round(conversionRate * 10) / 10,
      topPages: topPages.slice(0, 5),
      topEvents: topEvents.slice(0, 5),
      geographicData: query.includeGeographic ? geographicData : [],
      deviceTypes: deviceTypes,
      recentEvents: query.includeEvents ? formattedRecentEvents : [],
      alerts,
      timeRange: query.timeRange,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    };

    // Cache the results
    setCachedMetrics(cacheKey, metrics);

    return NextResponse.json({
      success: true,
      data: metrics,
      cached: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to fetch real-time analytics:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/analytics/realtime - Force refresh cache
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // Clear cache for this time range
    const patterns = [`realtime_${timeRange}_`];
    for (const [key] of metricsCache.entries()) {
      if (patterns.some(pattern => key.startsWith(pattern))) {
        metricsCache.delete(key);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cache cleared',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to clear analytics cache:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to clear cache',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Cleanup old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of metricsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL * 2) {
      metricsCache.delete(key);
    }
  }
}, CACHE_TTL);

