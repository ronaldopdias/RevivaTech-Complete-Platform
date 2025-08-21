/**
 * Better Auth API Route Handler
 * Proxies to backend Better Auth server following official patterns
 */

import { NextRequest } from 'next/server';

// Function to get backend URL dynamically
function getBackendURL() {
  // Use environment variable for internal container communication
  // This avoids hardcoding container names and works across environments
  const internalURL = process.env.BACKEND_INTERNAL_URL;
  const betterAuthURL = process.env.BETTER_AUTH_BACKEND_URL;
  
  // Priority: Better Auth specific URL > Internal URL > fallback
  if (betterAuthURL) {
    return betterAuthURL;
  }
  
  if (internalURL) {
    return internalURL;
  }
  
  // Fallback for local development
  return 'http://localhost:3011';
}

async function handler(request: NextRequest) {
  const backendURL = getBackendURL();
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  
  const targetURL = `${backendURL}${pathname}${search}`;
  
  try {
    const response = await fetch(targetURL, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        // Ensure proper host header for backend
        'host': new URL(backendURL).host,
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.arrayBuffer() 
        : undefined,
    });

    // Copy response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Better Auth proxy error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;