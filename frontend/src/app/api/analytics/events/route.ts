/**
 * Analytics Events API Proxy
 * Forwards analytics events to backend server
 * Following RULE 1: Use existing backend services
 */

import { NextRequest, NextResponse } from 'next/server';

// POST /api/analytics/events - Proxy to backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Forward to backend analytics service
    // Use development bypass in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    const backendUrl = isDevelopment 
      ? 'http://revivatech_backend:3011/api/dev/analytics/events'
      : 'http://revivatech_backend:3011/api/analytics/events';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies for authentication
        'Cookie': request.headers.get('cookie') || '',
      },
      body: body,
    });

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Analytics proxy error:', error);
    
    // Return success anyway to not break analytics
    return NextResponse.json({ success: true });
  }
}

// GET /api/analytics/events - Proxy to backend
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Forward to backend
    // Use container name for internal Docker communication
    const response = await fetch(`http://revivatech_backend:3011/api/analytics/events${url.search}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Analytics proxy error:', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}