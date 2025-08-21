import { NextRequest, NextResponse } from 'next/server';

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side: use backend service directly
    return 'http://revivatech_backend:3011';
  }
  // Client-side should never reach here for API routes
  return 'http://localhost:3011';
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    
    // Use development bypass in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = getApiBaseUrl();
    const apiUrl = isDevelopment 
      ? `${baseUrl}/api/dev/admin/analytics/stats?timeRange=${timeRange}`
      : `${baseUrl}/api/admin/analytics/stats?timeRange=${timeRange}`;
    
    // Forward the request to backend with authentication headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Forward authentication headers
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['authorization'] = authHeader;
    }
    
    // Forward cookies for session-based auth
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['cookie'] = cookieHeader;
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      console.error(`Backend analytics/stats error: ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch stats data', status: response.status },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Analytics stats proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}