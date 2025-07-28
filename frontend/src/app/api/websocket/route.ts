import { NextRequest } from 'next/server';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';

// WebSocket connection manager
class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, WebSocket>();
  private userConnections = new Map<string, Set<string>>();
  private connectionUsers = new Map<string, string>();

  initialize(server?: any) {
    if (this.wss) return;

    this.wss = new WebSocketServer({ 
      port: 3012,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      const connectionId = this.generateConnectionId();
      this.connections.set(connectionId, ws);

      console.log(`WebSocket connection established: ${connectionId}`);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(connectionId, message, ws);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(connectionId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${connectionId}:`, error);
        this.handleDisconnection(connectionId);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        connectionId,
        message: 'Connected to RevivaTech real-time service'
      }));
    });

    console.log('WebSocket server initialized on port 3012');
  }

  private handleMessage(connectionId: string, message: any, ws: WebSocket) {
    switch (message.type) {
      case 'auth':
        this.handleAuth(connectionId, message.userId, ws);
        break;
      case 'subscribe':
        this.handleSubscription(connectionId, message.events, ws);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private handleAuth(connectionId: string, userId: string, ws: WebSocket) {
    if (!userId) {
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'User ID is required'
      }));
      return;
    }

    // Associate connection with user
    this.connectionUsers.set(connectionId, userId);
    
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    ws.send(JSON.stringify({
      type: 'auth_success',
      userId,
      message: 'Authentication successful'
    }));

    console.log(`User ${userId} authenticated on connection ${connectionId}`);
  }

  private handleSubscription(connectionId: string, events: string[], ws: WebSocket) {
    // In a real implementation, you'd store subscription preferences
    ws.send(JSON.stringify({
      type: 'subscription_success',
      events,
      message: `Subscribed to ${events.length} event types`
    }));

    console.log(`Connection ${connectionId} subscribed to events:`, events);
  }

  private handleDisconnection(connectionId: string) {
    const userId = this.connectionUsers.get(connectionId);
    
    if (userId) {
      const userConnections = this.userConnections.get(userId);
      if (userConnections) {
        userConnections.delete(connectionId);
        if (userConnections.size === 0) {
          this.userConnections.delete(userId);
        }
      }
      this.connectionUsers.delete(connectionId);
    }

    this.connections.delete(connectionId);
    console.log(`WebSocket connection closed: ${connectionId}`);
  }

  // Public methods for sending notifications
  sendToUser(userId: string, notification: any) {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) {
      console.log(`No connections found for user ${userId}`);
      return false;
    }

    let sent = 0;
    userConnections.forEach(connectionId => {
      const ws = this.connections.get(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'notification',
          ...notification
        }));
        sent++;
      }
    });

    console.log(`Sent notification to ${sent} connections for user ${userId}`);
    return sent > 0;
  }

  sendToConnection(connectionId: string, message: any) {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  broadcast(message: any, excludeUser?: string) {
    let sent = 0;
    this.connections.forEach((ws, connectionId) => {
      const userId = this.connectionUsers.get(connectionId);
      if (excludeUser && userId === excludeUser) return;
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        sent++;
      }
    });

    console.log(`Broadcast message sent to ${sent} connections`);
    return sent;
  }

  getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      authenticatedUsers: this.userConnections.size,
      connections: Array.from(this.connections.keys()),
      users: Array.from(this.userConnections.keys())
    };
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global WebSocket manager instance
const wsManager = new WebSocketManager();

// Initialize WebSocket server
if (process.env.NODE_ENV !== 'test') {
  wsManager.initialize();
}

// API endpoints for WebSocket management
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'stats':
      return Response.json({
        success: true,
        stats: wsManager.getConnectionStats()
      });

    case 'health':
      return Response.json({
        success: true,
        message: 'WebSocket service is running',
        timestamp: new Date().toISOString()
      });

    default:
      return Response.json({
        success: true,
        message: 'WebSocket API ready',
        endpoints: {
          stats: '?action=stats',
          health: '?action=health',
          send: 'POST with notification data'
        }
      });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, data, broadcast } = body;

    switch (type) {
      case 'send_notification':
        if (!userId || !data) {
          return Response.json({
            success: false,
            error: 'userId and data are required'
          }, { status: 400 });
        }

        const sent = wsManager.sendToUser(userId, data);
        return Response.json({
          success: sent,
          message: sent ? 'Notification sent' : 'User not connected'
        });

      case 'broadcast':
        if (!data) {
          return Response.json({
            success: false,
            error: 'data is required for broadcast'
          }, { status: 400 });
        }

        const broadcastCount = wsManager.broadcast(data, body.excludeUser);
        return Response.json({
          success: true,
          message: `Broadcast sent to ${broadcastCount} connections`
        });

      case 'test_notification':
        const testNotification = {
          id: `test_${Date.now()}`,
          type: data?.notificationType || 'system-message',
          title: data?.title || 'Test Notification',
          message: data?.message || 'This is a test notification from the WebSocket service',
          priority: data?.priority || 'normal',
          timestamp: new Date().toISOString(),
          data: { test: true }
        };

        if (userId) {
          const testSent = wsManager.sendToUser(userId, testNotification);
          return Response.json({
            success: testSent,
            message: testSent ? 'Test notification sent' : 'User not connected',
            notification: testNotification
          });
        } else {
          const testBroadcast = wsManager.broadcast({
            type: 'notification',
            ...testNotification
          });
          return Response.json({
            success: true,
            message: `Test notification broadcast to ${testBroadcast} connections`,
            notification: testNotification
          });
        }

      default:
        return Response.json({
          success: false,
          error: 'Unknown message type'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('WebSocket API error:', error);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export the WebSocket manager for use in other parts of the application
export { wsManager };

export const dynamic = 'force-dynamic';