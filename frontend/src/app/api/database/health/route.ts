// Database Health Check API Route
// Provides database status and performance metrics

import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseHealth, initializeDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const health = await getDatabaseHealth();
    
    const status = health.connection.status === 'healthy' ? 200 : 
                  health.connection.status === 'warning' ? 200 : 503;
    
    return NextResponse.json({
      status: health.connection.status,
      timestamp: health.timestamp,
      connection: health.connection.details,
      performance: {
        totalQueries: health.performance.totalQueries,
        averageExecutionTime: Math.round(health.performance.averageExecutionTime),
        recentQueries: health.performance.recentQueries.length,
      },
      metrics: {
        uptime: Math.round(health.metrics.uptime / 1000), // Convert to seconds
        queriesExecuted: health.metrics.queriesExecuted,
        lastHealthCheck: health.metrics.lastHealthCheck,
      },
    }, { status });
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json({
      status: 'critical',
      error: 'Health check failed',
      timestamp: new Date(),
    }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'initialize') {
      const result = await initializeDatabase();
      
      return NextResponse.json(result, { 
        status: result.success ? 200 : 500 
      });
    }
    
    return NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 });
  } catch (error) {
    console.error('Database initialization failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database operation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}