import { NextRequest, NextResponse } from 'next/server';
import { getBackendInternalUrl } from '@/lib/utils/env-validator';

export async function GET(request: NextRequest) {
  try {
    // Get backend URL dynamically - uses localhost:3011 in development
    const backendUrl = getBackendInternalUrl();
    
    // Forward the request to backend with session cookies
    const response = await fetch(`${backendUrl}/api/admin/bookings/stats/overview`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies from the frontend request
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      // If backend returns 401, it means authentication failed
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication required' }, 
          { status: 401 }
        );
      }
      
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Backend service error', details: errorText }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy service error' }, 
      { status: 500 }
    );
  }
}