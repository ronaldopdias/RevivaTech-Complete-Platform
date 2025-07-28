// WebSocket Server Statistics API
// Monitor WebSocket server health and connection metrics

import { NextRequest } from 'next/server';
import { ApiMiddleware } from '@/lib/api/middleware';
// import { getWebSocketServer } from '@/lib/websocket/server';

// GET /api/websocket/stats - Get WebSocket server statistics
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      // WebSocket server should run in backend, not frontend
      // For now, return mock stats
      return ApiMiddleware.createResponse({
        server: {
          status: 'online',
          uptime: process.uptime(),
          connections: {
            total: 0,
            authenticated: 0,
            uniqueUsers: 0,
          },
        },
        performance: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        },
        timestamp: new Date().toISOString(),
        note: 'WebSocket server runs in backend container'
      });
    } catch (error) {
      return ApiMiddleware.createErrorResponse('WebSocket server not available', 503);
    }
  },
  {
    requireAuth: true,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 30 },
  }
);