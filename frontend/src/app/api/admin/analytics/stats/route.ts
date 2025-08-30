/**
 * Frontend API Proxy: Admin Analytics Stats
 * Proxies requests to backend analytics dashboard endpoint
 * Rule 1 Integration: Connects frontend to existing backend functionality
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://revivatech_backend:3011';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // Map frontend parameter to backend parameter
    const backendPeriod = timeRange;
    
    // Forward request to backend analytics dashboard
    const backendUrl = `${BACKEND_URL}/api/dev/admin/analytics/dashboard-dev?period=${backendPeriod}`;
    
    console.log(`🔄 Proxying analytics stats request to: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // Forward auth headers if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
        ...(request.headers.get('cookie') && {
          'Cookie': request.headers.get('cookie')!
        })
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend analytics error (${response.status}):`, errorText);
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch analytics data',
          code: 'BACKEND_ANALYTICS_ERROR',
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform backend response to match frontend expectations
    const transformedData = {
      success: data.success || true,
      data: data.data || data,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(transformedData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Analytics stats proxy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Analytics proxy failed',
        code: 'PROXY_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Support OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    },
  });
}