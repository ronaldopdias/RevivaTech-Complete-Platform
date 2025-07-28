import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - can be extended with database connectivity checks
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'revivatech-frontend',
      version: '1.0.0',
      uptime: process.uptime()
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        service: 'revivatech-frontend',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 503 }
    );
  }
}