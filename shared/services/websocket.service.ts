/**
 * RevivaTech WebSocket Service
 * Real-time communication service for booking updates, notifications, and chat
 */

import { Server } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';

export interface WebSocketUser {
  id: string;
  email: string;
  role: 'customer' | 'admin' | 'technician';
  socketId: string;
  connectedAt: Date;
  rooms: string[];
}

export interface BookingUpdateData {
  bookingId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  message: string;
  timestamp: Date;
  estimatedCompletion?: Date;
}

export interface NotificationData {
  id: string;
  type: 'booking_update' | 'quote_ready' | 'repair_complete' | 'system';
  title: string;
  message: string;
  userId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
}

export class WebSocketService {
  private io: Server;
  private connectedUsers: Map<string, WebSocketUser> = new Map();
  private userSocketMap: Map<string, string> = new Map(); // userId -> socketId

  constructor(server?: any) {
    if (server) {
      this.io = new Server(server, {
        cors: {
          origin: [
            "http://localhost:3010", // RevivaTech English frontend
            "https://revivatech.co.uk",
            "https://revivatech.com.br"
          ],
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['websocket', 'polling']
      });
      
      this.setupEventHandlers();
    }
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'revivatech-secret') as any;
          const user: WebSocketUser = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role || 'customer',
            socketId: socket.id,
            connectedAt: new Date(),
            rooms: []
          };

          this.connectedUsers.set(socket.id, user);
          this.userSocketMap.set(user.id, socket.id);

          // Join user-specific room
          socket.join(`user:${user.id}`);
          user.rooms.push(`user:${user.id}`);

          // Join role-based room
          socket.join(`role:${user.role}`);
          user.rooms.push(`role:${user.role}`);

          socket.emit('authenticated', {
            message: 'Successfully authenticated',
            user: {
              id: user.id,
              email: user.email,
              role: user.role
            }
          });

          console.log(`✅ User authenticated: ${user.email} (${user.role})`);
        } catch (error) {
          console.error('❌ Authentication failed:', error);
          socket.emit('auth_error', { message: 'Invalid token' });
          socket.disconnect();
        }
      });

      // Handle booking subscription
      socket.on('subscribe_booking', (bookingId: string) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          const room = `booking:${bookingId}`;
          socket.join(room);
          user.rooms.push(room);
          
          socket.emit('booking_subscribed', { bookingId });
          console.log(`📋 User ${user.email} subscribed to booking ${bookingId}`);
        }
      });

      // Handle booking unsubscription
      socket.on('unsubscribe_booking', (bookingId: string) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          const room = `booking:${bookingId}`;
          socket.leave(room);
          user.rooms = user.rooms.filter(r => r !== room);
          
          socket.emit('booking_unsubscribed', { bookingId });
        }
      });

      // Handle chat messages
      socket.on('chat_message', (data: { bookingId: string; message: string }) => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          const chatMessage = {
            id: `msg_${Date.now()}`,
            bookingId: data.bookingId,
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            message: data.message,
            timestamp: new Date()
          };

          // Broadcast to booking room
          this.io.to(`booking:${data.bookingId}`).emit('chat_message', chatMessage);
          
          console.log(`💬 Chat message from ${user.email} in booking ${data.bookingId}`);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          this.connectedUsers.delete(socket.id);
          this.userSocketMap.delete(user.id);
          console.log(`🔌 User disconnected: ${user.email}`);
        } else {
          console.log(`🔌 Client disconnected: ${socket.id}`);
        }
      });
    });
  }

  /**
   * Send booking status update to relevant users
   */
  public async sendBookingUpdate(data: BookingUpdateData): Promise<void> {
    try {
      const payload = {
        type: 'booking_update',
        bookingId: data.bookingId,
        status: data.status,
        message: data.message,
        timestamp: data.timestamp,
        estimatedCompletion: data.estimatedCompletion
      };

      // Send to booking-specific room
      this.io.to(`booking:${data.bookingId}`).emit('booking_status_update', payload);
      
      // Send to all admins and technicians
      this.io.to('role:admin').emit('booking_status_update', payload);
      this.io.to('role:technician').emit('booking_status_update', payload);

      console.log(`📋 Booking update sent for ${data.bookingId}: ${data.status}`);
    } catch (error) {
      console.error('❌ Error sending booking update:', error);
    }
  }

  /**
   * Send notification to specific user or broadcast
   */
  public async sendNotification(data: NotificationData): Promise<void> {
    try {
      const payload = {
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority,
        timestamp: data.timestamp
      };

      if (data.userId) {
        // Send to specific user
        this.io.to(`user:${data.userId}`).emit('notification', payload);
        console.log(`🔔 Notification sent to user ${data.userId}: ${data.title}`);
      } else {
        // Broadcast to all connected users
        this.io.emit('notification', payload);
        console.log(`🔔 Notification broadcast: ${data.title}`);
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
    }
  }

  /**
   * Send admin alert
   */
  public async sendAdminAlert(message: string, severity: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    try {
      const payload = {
        type: 'admin_alert',
        message,
        severity,
        timestamp: new Date()
      };

      this.io.to('role:admin').emit('admin_alert', payload);
      console.log(`🚨 Admin alert sent: ${message} (${severity})`);
    } catch (error) {
      console.error('❌ Error sending admin alert:', error);
    }
  }

  /**
   * Get connection statistics
   */
  public getStats(): any {
    const totalConnections = this.connectedUsers.size;
    const usersByRole = Array.from(this.connectedUsers.values()).reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalConnections,
      usersByRole,
      connectedUsers: Array.from(this.connectedUsers.values()).map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        connectedAt: user.connectedAt,
        rooms: user.rooms.length
      }))
    };
  }

  /**
   * Initialize WebSocket service with HTTP server
   */
  public static create(server: any): WebSocketService {
    return new WebSocketService(server);
  }
}

export default WebSocketService;