import { NextRequest, NextResponse } from 'next/server';

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  level: 'error' | 'warning' | 'info';
  context?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const errorData: ErrorReport = await request.json();

    // Basic validation
    if (!errorData.message || !errorData.url) {
      return NextResponse.json(
        { error: 'Missing required fields: message, url' },
        { status: 400 }
      );
    }

    // Sanitize and structure the error data
    const sanitizedError = {
      message: errorData.message.substring(0, 1000), // Limit message length
      stack: errorData.stack?.substring(0, 5000), // Limit stack trace length
      componentStack: errorData.componentStack?.substring(0, 3000),
      url: errorData.url,
      userAgent: errorData.userAgent,
      timestamp: errorData.timestamp || Date.now(),
      userId: errorData.userId,
      sessionId: errorData.sessionId,
      level: errorData.level || 'error',
      context: errorData.context,
      ip: request.ip || 'unknown',
      headers: {
        referer: request.headers.get('referer'),
        accept: request.headers.get('accept'),
      }
    };

    // Log to console for development
    console.error('[Client Error Report]', {
      message: sanitizedError.message,
      url: sanitizedError.url,
      timestamp: new Date(sanitizedError.timestamp).toISOString(),
      level: sanitizedError.level,
      userAgent: sanitizedError.userAgent,
      ip: sanitizedError.ip
    });

    // In production, you might want to send this to an external service
    // like Sentry, DataDog, or store in database
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service
      // await sendToErrorTrackingService(sanitizedError);
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Error reported successfully',
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Failed to process error report:', error);
    
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}