/**
 * Frontend API Proxy: Admin Analytics Activity  
 * Proxies requests to backend analytics realtime endpoint
 * Rule 1 Integration: Connects frontend to existing backend functionality
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://revivatech_backend:3011';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    
    // Forward request to backend analytics realtime-dev endpoint  
    const backendUrl = `${BACKEND_URL}/api/dev/admin/analytics/realtime-dev`;
    
    console.log(`🔄 Proxying analytics activity request to: ${backendUrl}`);
    
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
      console.error(`Backend activity error (${response.status}):`, errorText);
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch activity data',
          code: 'BACKEND_ACTIVITY_ERROR', 
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform backend response to match frontend expectations
    // Extract activity data and limit to requested number
    const activityData = data.data || data;
    const limitNum = parseInt(limit);
    
    const transformedData = {
      success: data.success || true,
      data: activityData,
      // If the frontend expects a specific activity array format, we can transform it here
      activity: activityData.metrics || [],
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
    console.error('Analytics activity proxy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Activity proxy failed',
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