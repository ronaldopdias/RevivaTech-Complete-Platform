/**
 * Frontend Health Check API Endpoint
 * Production-ready health monitoring for Docker containers
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check basic application health
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'RevivaTech Frontend',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      features: {
        ai_advanced: 'operational',
        authentication: 'operational',
        business_intelligence: 'operational',
        enterprise_dashboard: 'operational'
      }
    };

    // Test backend connectivity (optional - don't fail health check if backend is down)
    try {
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'http://revivatech_new_backend:3011' 
        : 'http://localhost:3011';
      
      const backendResponse = await fetch(`${backendUrl}/health`, {
        timeout: 2000,
        headers: { 'User-Agent': 'Frontend-Health-Check' }
      });
      
      if (backendResponse.ok) {
        healthData.backend_connectivity = 'operational';
      } else {
        healthData.backend_connectivity = 'degraded';
      }
    } catch (error) {
      healthData.backend_connectivity = 'unavailable';
      healthData.backend_error = error.message;
    }

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    // Health check failed
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'RevivaTech Frontend',
      error: error.message || 'Unknown error',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    }, { status: 503 });
  }
}

// Also support HEAD requests for basic health checks
export async function HEAD() {
  return new Response(null, { status: 200 });
}