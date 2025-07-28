// WebSocket Server Implementation
// Real-time communication for booking updates and notifications

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { createNotificationRepository, createUserRepository } from '@/lib/database';
import { NotificationChannel, NotificationType } from '@/generated/prisma';

export interface WebSocketMessage {
  type: 'booking_update' | 'notification' | 'pricing_update' | 'system_alert' | 'ping' | 'pong';
  data: any;
  timestamp: string;
  userId?: string;
  bookingId?: string;
}

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  sessionId: string;
  isAuthenticated: boolean;
  lastPing: number;
}

export class RevivaTechWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set of sessionIds
  private pingInterval: NodeJS.Timeout;

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ 
      port,
      verifyClient: this.verifyClient.bind(this),
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleError.bind(this));

    // Start ping/pong heartbeat
    this.pingInterval = setInterval(this.sendPings.bind(this), 30000); // Every 30 seconds

    console.log(`WebSocket server started on port ${port}`);
  }

  private async verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): Promise<boolean> {
    // Basic verification - in production, add more robust checks
    const allowedOrigins = [
      'http://localhost:3010',
      'https://revivatech.co.uk',
      'https://www.revivatech.co.uk',
    ];

    return allowedOrigins.includes(info.origin) || process.env.NODE_ENV === 'development';
  }

  private async handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage) {
    const sessionId = this.generateSessionId();
    ws.sessionId = sessionId;
    ws.isAuthenticated = false;
    ws.lastPing = Date.now();

    this.clients.set(sessionId, ws);

    console.log(`WebSocket client connected: ${sessionId}`);

    // Handle messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${sessionId}:`, error);
      this.handleDisconnection(ws);
    });

    // Handle pong responses
    ws.on('pong', () => {
      ws.lastPing = Date.now();
    });

    // Send initial connection message
    this.sendMessage(ws, {
      type: 'system_alert',
      data: {
        message: 'Connected to RevivaTech real-time service',
        sessionId,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'ping':
        this.sendMessage(ws, {
          type: 'pong',
          data: { timestamp: message.timestamp },
          timestamp: new Date().toISOString(),
        });
        break;

      case 'auth':
        await this.handleAuthentication(ws, message.data);
        break;

      case 'subscribe':
        await this.handleSubscription(ws, message.data);
        break;

      case 'unsubscribe':
        await this.handleUnsubscription(ws, message.data);
        break;

      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private async handleAuthentication(ws: AuthenticatedWebSocket, authData: any) {
    try {
      const { token } = authData;
      
      if (!token) {
        this.sendError(ws, 'Authentication token required');
        return;
      }

      // Verify token with user repository
      const userRepo = createUserRepository();
      const session = await userRepo.findValidSession(token);

      if (!session || !session.user) {
        this.sendError(ws, 'Invalid or expired token');
        return;
      }

      // Authenticate the connection
      ws.userId = session.user.id;
      ws.isAuthenticated = true;

      // Track user connections
      if (!this.userConnections.has(session.user.id)) {
        this.userConnections.set(session.user.id, new Set());
      }
      this.userConnections.get(session.user.id)!.add(ws.sessionId);

      // Update last login
      await userRepo.updateLastLogin(session.user.id);

      this.sendMessage(ws, {
        type: 'system_alert',
        data: {
          message: 'Authentication successful',
          userId: session.user.id,
          userName: `${session.user.firstName} ${session.user.lastName}`,
        },
        timestamp: new Date().toISOString(),
      });

      console.log(`User ${session.user.id} authenticated on session ${ws.sessionId}`);
    } catch (error) {
      console.error('Authentication error:', error);
      this.sendError(ws, 'Authentication failed');
    }
  }

  private async handleSubscription(ws: AuthenticatedWebSocket, subscriptionData: any) {
    if (!ws.isAuthenticated) {
      this.sendError(ws, 'Authentication required');
      return;
    }

    const { channels } = subscriptionData;
    
    // Store subscription preferences (in production, persist to database)
    (ws as any).subscriptions = channels;

    this.sendMessage(ws, {
      type: 'system_alert',
      data: {
        message: `Subscribed to channels: ${channels.join(', ')}`,
        channels,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async handleUnsubscription(ws: AuthenticatedWebSocket, unsubscriptionData: any) {
    if (!ws.isAuthenticated) {
      this.sendError(ws, 'Authentication required');
      return;
    }

    const { channels } = unsubscriptionData;
    const currentSubscriptions = (ws as any).subscriptions || [];
    const newSubscriptions = currentSubscriptions.filter((c: string) => !channels.includes(c));
    
    (ws as any).subscriptions = newSubscriptions;

    this.sendMessage(ws, {
      type: 'system_alert',
      data: {
        message: `Unsubscribed from channels: ${channels.join(', ')}`,
        remainingChannels: newSubscriptions,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    console.log(`WebSocket client disconnected: ${ws.sessionId}`);

    // Remove from clients
    this.clients.delete(ws.sessionId);

    // Remove from user connections
    if (ws.userId) {
      const userSessions = this.userConnections.get(ws.userId);
      if (userSessions) {
        userSessions.delete(ws.sessionId);
        if (userSessions.size === 0) {
          this.userConnections.delete(ws.userId);
        }
      }
    }
  }

  private handleError(error: Error) {
    console.error('WebSocket server error:', error);
  }

  private sendMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: AuthenticatedWebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'system_alert',
      data: { error, level: 'error' },
      timestamp: new Date().toISOString(),
    });
  }

  private sendPings() {
    const now = Date.now();
    const timeout = 60000; // 1 minute timeout

    for (const [sessionId, ws] of this.clients.entries()) {
      if (now - ws.lastPing > timeout) {
        console.log(`Closing inactive connection: ${sessionId}`);
        ws.terminate();
        this.handleDisconnection(ws);
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }
  }

  private generateSessionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for sending notifications

  public async sendToUser(userId: string, message: WebSocketMessage) {
    const userSessions = this.userConnections.get(userId);
    if (!userSessions) return;

    for (const sessionId of userSessions) {
      const ws = this.clients.get(sessionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    }
  }

  public async sendBookingUpdate(bookingId: string, customerId: string, updateData: any) {
    const message: WebSocketMessage = {
      type: 'booking_update',
      data: {
        bookingId,
        ...updateData,
      },
      timestamp: new Date().toISOString(),
      userId: customerId,
      bookingId,
    };

    await this.sendToUser(customerId, message);

    // Also send to WebSocket notification repository for persistence
    const notificationRepo = createNotificationRepository();
    await notificationRepo.createNotification({
      userId: customerId,
      bookingId,
      type: NotificationType.STATUS_UPDATE,
      channel: NotificationChannel.WEBSOCKET,
      title: 'Booking Update',
      message: `Your booking status has been updated`,
      data: updateData,
    });
  }

  public async sendNotification(userId: string, notificationData: any) {
    const message: WebSocketMessage = {
      type: 'notification',
      data: notificationData,
      timestamp: new Date().toISOString(),
      userId,
    };

    await this.sendToUser(userId, message);
  }

  public async broadcastSystemAlert(alertData: any, userIds?: string[]) {
    const message: WebSocketMessage = {
      type: 'system_alert',
      data: alertData,
      timestamp: new Date().toISOString(),
    };

    if (userIds) {
      // Send to specific users
      for (const userId of userIds) {
        await this.sendToUser(userId, message);
      }
    } else {
      // Broadcast to all authenticated clients
      for (const [sessionId, ws] of this.clients.entries()) {
        if (ws.isAuthenticated && ws.readyState === WebSocket.OPEN) {
          this.sendMessage(ws, message);
        }
      }
    }
  }

  // Server management
  public getStats() {
    return {
      totalClients: this.clients.size,
      authenticatedClients: Array.from(this.clients.values()).filter(ws => ws.isAuthenticated).length,
      connectedUsers: this.userConnections.size,
      uptime: process.uptime(),
    };
  }

  public close() {
    clearInterval(this.pingInterval);
    
    // Close all client connections
    for (const ws of this.clients.values()) {
      ws.close();
    }
    
    this.wss.close();
    console.log('WebSocket server closed');
  }
}

// Singleton instance
let wsServer: RevivaTechWebSocketServer | null = null;

export function getWebSocketServer(port?: number): RevivaTechWebSocketServer {
  if (!wsServer) {
    wsServer = new RevivaTechWebSocketServer(port);
  }
  return wsServer;
}

export function closeWebSocketServer() {
  if (wsServer) {
    wsServer.close();
    wsServer = null;
  }
}