/**
 * Better Auth API Proxy Route for RevivaTech
 * Proxies all auth requests to the backend Better Auth instance
 */

import { NextRequest, NextResponse } from 'next/server'

// Get the backend API URL
function getBackendAuthURL(): string {
  // Use environment variables for full flexibility
  if (process.env.BACKEND_AUTH_URL) {
    return process.env.BACKEND_AUTH_URL
  }
  
  // Fallback to sensible defaults
  const backendHost = process.env.BACKEND_HOST || 'revivatech_backend'
  const backendPort = process.env.BACKEND_PORT || '3011'
  
  if (process.env.NODE_ENV === 'production') {
    // Production: Use API subdomain
    return process.env.BACKEND_AUTH_URL || `https://api.revivatech.co.uk/api/auth`
  } else {
    // Development: Use Docker container name for inter-container communication
    return `http://${backendHost}:${backendPort}/api/auth`
  }
}

// Handle all auth requests by proxying to backend
async function proxyToBackend(request: NextRequest, path: string) {
  const backendURL = getBackendAuthURL()
  const targetURL = `${backendURL}/${path}`
  
  // Get search params from the request
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  
  const finalURL = queryString ? `${targetURL}?${queryString}` : targetURL
  
  try {
    // Forward the request to the backend
    const response = await fetch(finalURL, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'Accept': request.headers.get('Accept') || 'application/json',
        // Forward cookies
        'Cookie': request.headers.get('Cookie') || '',
        // Forward user agent
        'User-Agent': request.headers.get('User-Agent') || '',
      },
      body: request.method !== 'GET' ? await request.text() : undefined,
    })

    // Get response data
    const responseData = await response.text()
    
    // Create response with same status
    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    })
    
    // Forward important headers
    const headersToForward = [
      'Content-Type',
      'Set-Cookie',
      'Location',
      'Cache-Control',
      'Authorization'
    ]
    
    headersToForward.forEach(header => {
      const value = response.headers.get(header)
      if (value) {
        nextResponse.headers.set(header, value)
      }
    })
    
    return nextResponse
    
  } catch (error) {
    // Return service unavailable without logging in production
    return NextResponse.json(
      { error: 'Auth service unavailable' },
      { status: 503 }
    )
  }
}

// Handle GET requests
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  return proxyToBackend(request, path)
}

// Handle POST requests  
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  return proxyToBackend(request, path)
}

// Handle PUT requests
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  return proxyToBackend(request, path)
}

// Handle DELETE requests
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  return proxyToBackend(request, path)
}