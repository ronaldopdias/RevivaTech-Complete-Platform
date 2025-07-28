/**
 * Analytics API Route - Server-Side Analytics Data Provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverAnalyticsDB } from '@/lib/analytics/server-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : new Date();

    let data;

    switch (type) {
      case 'revenue':
        data = await serverAnalyticsDB.getRevenueMetrics(startDate, endDate);
        break;
      case 'customers':
        data = await serverAnalyticsDB.getCustomerMetrics(startDate, endDate);
        break;
      case 'bookings':
        data = await serverAnalyticsDB.getBookingMetrics(startDate, endDate);
        break;
      case 'all':
      default:
        const [revenue, customers, bookings] = await Promise.all([
          serverAnalyticsDB.getRevenueMetrics(startDate, endDate),
          serverAnalyticsDB.getCustomerMetrics(startDate, endDate),
          serverAnalyticsDB.getBookingMetrics(startDate, endDate)
        ]);
        
        data = {
          revenue,
          customers,
          bookings,
          performance: {
            totalOperations: 3,
            cacheHits: 0,
            responseTime: Date.now(),
          }
        };
        break;
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log analytics event (would be implemented with server analytics)
    console.log('Analytics event received:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Event recorded',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics event recording error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to record event',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}