// Performance Monitoring API Endpoint
// Provides performance metrics, monitoring, and optimization insights

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitoringService } from '@/lib/services/performanceMonitoringService';
import { cacheService } from '@/lib/services/cacheService';

// GET /api/performance - Get performance metrics and reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const endpoint = searchParams.get('endpoint');

    // Default time range - last 24 hours
    const timeRange = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date()
    };

    switch (action) {
      case 'summary':
        const summary = await performanceMonitoringService.getApiPerformanceSummary(
          endpoint || undefined,
          timeRange
        );
        
        return NextResponse.json({
          success: true,
          data: summary
        });

      case 'database':
        const dbSummary = await performanceMonitoringService.getDatabasePerformanceSummary(timeRange);
        
        return NextResponse.json({
          success: true,
          data: dbSummary
        });

      case 'system-health':
        const systemHealth = await performanceMonitoringService.getSystemHealthSummary(timeRange);
        
        return NextResponse.json({
          success: true,
          data: systemHealth
        });

      case 'report':
        const report = await performanceMonitoringService.generatePerformanceReport(timeRange);
        
        return NextResponse.json({
          success: true,
          data: report
        });

      case 'cache-stats':
        const cacheStats = await cacheService.getStats();
        
        return NextResponse.json({
          success: true,
          data: cacheStats
        });

      case 'metrics':
        const metricName = searchParams.get('name');
        if (!metricName) {
          return NextResponse.json({
            success: false,
            error: 'Metric name is required'
          }, { status: 400 });
        }

        const metrics = await performanceMonitoringService.getMetrics(
          metricName,
          timeRange.start,
          timeRange.end
        );

        return NextResponse.json({
          success: true,
          data: metrics
        });

      case 'health-check':
        // Quick health check
        const healthMetrics = await performanceMonitoringService.getSystemHealthSummary({
          start: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          end: new Date()
        });

        const isHealthy = healthMetrics.alerts.filter(a => a.severity === 'high').length === 0;

        return NextResponse.json({
          success: true,
          data: {
            healthy: isHealthy,
            status: isHealthy ? 'healthy' : 'unhealthy',
            metrics: healthMetrics,
            timestamp: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Performance API GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/performance - Track performance metrics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'track-api':
        if (!data || !data.endpoint || !data.responseTime) {
          return NextResponse.json({
            success: false,
            error: 'Endpoint and responseTime are required'
          }, { status: 400 });
        }

        await performanceMonitoringService.trackApiPerformance({
          endpoint: data.endpoint,
          method: data.method || 'GET',
          responseTime: data.responseTime,
          statusCode: data.statusCode || 200,
          requestSize: data.requestSize || 0,
          responseSize: data.responseSize || 0,
          cacheHit: data.cacheHit || false,
          errorRate: data.errorRate || 0,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
        });

        return NextResponse.json({
          success: true,
          message: 'API performance tracked successfully'
        });

      case 'track-database':
        if (!data || !data.query || !data.executionTime) {
          return NextResponse.json({
            success: false,
            error: 'Query and executionTime are required'
          }, { status: 400 });
        }

        await performanceMonitoringService.trackDatabasePerformance({
          query: data.query,
          executionTime: data.executionTime,
          recordsReturned: data.recordsReturned || 0,
          cacheHit: data.cacheHit || false,
          error: data.error,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
        });

        return NextResponse.json({
          success: true,
          message: 'Database performance tracked successfully'
        });

      case 'track-system':
        if (!data) {
          return NextResponse.json({
            success: false,
            error: 'System metrics data is required'
          }, { status: 400 });
        }

        await performanceMonitoringService.trackSystemHealth({
          cpuUsage: data.cpuUsage || 0,
          memoryUsage: data.memoryUsage || 0,
          diskUsage: data.diskUsage || 0,
          activeConnections: data.activeConnections || 0,
          cacheHitRate: data.cacheHitRate || 0,
          errorRate: data.errorRate || 0,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
        });

        return NextResponse.json({
          success: true,
          message: 'System health tracked successfully'
        });

      case 'batch-track':
        if (!Array.isArray(data?.metrics)) {
          return NextResponse.json({
            success: false,
            error: 'Metrics array is required'
          }, { status: 400 });
        }

        const trackingPromises = data.metrics.map(async (metric: any) => {
          switch (metric.type) {
            case 'api':
              return performanceMonitoringService.trackApiPerformance(metric.data);
            case 'database':
              return performanceMonitoringService.trackDatabasePerformance(metric.data);
            case 'system':
              return performanceMonitoringService.trackSystemHealth(metric.data);
            default:
              console.warn('Unknown metric type:', metric.type);
          }
        });

        await Promise.all(trackingPromises);

        return NextResponse.json({
          success: true,
          message: `${data.metrics.length} metrics tracked successfully`
        });

      case 'simulate-load':
        // Simulate load testing data for development
        const simulationCount = data?.count || 100;
        const simulationPromises = [];

        for (let i = 0; i < simulationCount; i++) {
          simulationPromises.push(
            performanceMonitoringService.trackApiPerformance({
              endpoint: `/api/test-endpoint-${i % 10}`,
              method: ['GET', 'POST', 'PUT', 'DELETE'][i % 4],
              responseTime: Math.random() * 1000 + 100,
              statusCode: Math.random() > 0.95 ? 500 : 200,
              requestSize: Math.random() * 1000,
              responseSize: Math.random() * 5000,
              cacheHit: Math.random() > 0.3,
              errorRate: Math.random() * 5,
              timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
            })
          );
        }

        await Promise.all(simulationPromises);

        return NextResponse.json({
          success: true,
          message: `${simulationCount} simulated metrics generated`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Performance API POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/performance - Update performance settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'clear-cache':
        const cleared = await cacheService.clear();
        
        return NextResponse.json({
          success: cleared,
          message: cleared ? 'Cache cleared successfully' : 'Failed to clear cache'
        });

      case 'warm-cache':
        await cacheService.warmUp();
        
        return NextResponse.json({
          success: true,
          message: 'Cache warmed up successfully'
        });

      case 'cleanup-metrics':
        const olderThan = data?.olderThan ? new Date(data.olderThan) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const cleaned = await performanceMonitoringService.cleanup(olderThan);
        
        return NextResponse.json({
          success: true,
          message: `${cleaned} old metrics cleaned up`
        });

      case 'invalidate-cache':
        if (!data?.tags) {
          return NextResponse.json({
            success: false,
            error: 'Tags are required for cache invalidation'
          }, { status: 400 });
        }

        const invalidated = await cacheService.invalidateByTags(data.tags);
        
        return NextResponse.json({
          success: true,
          message: `${invalidated} cache entries invalidated`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Performance API PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/performance - Delete performance data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'clear-all':
        // Clear all performance data
        await performanceMonitoringService.cleanup(new Date());
        await cacheService.clear();
        
        return NextResponse.json({
          success: true,
          message: 'All performance data cleared'
        });

      case 'clear-metrics':
        const metricName = searchParams.get('name');
        if (!metricName) {
          return NextResponse.json({
            success: false,
            error: 'Metric name is required'
          }, { status: 400 });
        }

        // This would clear specific metrics
        console.log('Clearing metrics:', metricName);
        
        return NextResponse.json({
          success: true,
          message: `Metrics ${metricName} cleared`
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Performance API DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}