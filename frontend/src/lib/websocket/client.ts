/**
 * RevivaTech WebSocket Client
 * Socket.IO-based real-time client for booking updates and notifications
 */

import { io, Socket } from 'socket.io-client';

export interface WebSocketClientOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
}

export interface BookingUpdate {
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
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  message: string;
  timestamp: Date;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'authenticated' | 'error';

export class RevivaTechWebSocketClient {
  private socket: Socket | null = null;
  private options: WebSocketClientOptions;
  private status: ConnectionStatus = 'disconnected';
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(options: WebSocketClientOptions = {}) {
    this.options = {
      url: options.url || 'http://localhost:3011', // RevivaTech backend
      autoConnect: options.autoConnect ?? false,
      reconnect: options.reconnect ?? true,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 5,
      ...options
    };

    if (this.options.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to WebSocket server
   */
  public connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.status = 'connecting';
        this.emit('status_change', this.status);

        this.socket = io(this.options.url!, {
          transports: ['websocket', 'polling'],
          autoConnect: false,
          reconnection: this.options.reconnect,
          reconnectionAttempts: this.options.maxReconnectAttempts,
          timeout: 10000
        });

        this.setupEventHandlers();
        this.socket.connect();

        // Auto-authenticate if token provided
        const authToken = token || this.options.token;
        if (authToken) {
          this.authenticate(authToken);
        }

        this.socket.on('connect', () => {
          this.status = 'connected';
          this.emit('status_change', this.status);
          this.emit('connected');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          this.status = 'error';
          this.emit('status_change', this.status);
          this.emit('error', error);
          reject(error);
        });

      } catch (error) {
        this.status = 'error';
        this.emit('status_change', this.status);
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'system_alert':
        if (message.data.message === 'Authentication successful') {
          this.isAuthenticated = true;
          this.emit('authenticated', message.data);
        }
        this.emit('system_alert', message.data);
        break;

      case 'booking_update':
        this.emit('booking_update', message.data);
        break;

      case 'notification':
        this.emit('notification', message.data);
        break;

      case 'pong':
        // Heartbeat response received
        break;

      default:
        console.log('Received WebSocket message:', message);
    }
  }

  private authenticate(token: string) {
    this.send({
      type: 'auth',
      data: { token },
      timestamp: new Date().toISOString(),
    });
  }

  private send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send({
        type: 'ping',
        data: {},
        timestamp: new Date().toISOString(),
      });
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
      this.connect().catch(() => {
        // Reconnection failed, will try again if under limit
      });
    }, this.options.reconnectInterval);
  }

  // Public methods

  public subscribe(channels: string[]) {
    if (!this.isAuthenticated) {
      console.warn('Cannot subscribe: not authenticated');
      return;
    }

    this.send({
      type: 'subscribe',
      data: { channels },
      timestamp: new Date().toISOString(),
    });
  }

  public unsubscribe(channels: string[]) {
    if (!this.isAuthenticated) {
      console.warn('Cannot unsubscribe: not authenticated');
      return;
    }

    this.send({
      type: 'unsubscribe',
      data: { channels },
      timestamp: new Date().toISOString(),
    });
  }

  public on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  public off(event: string, callback?: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      if (callback) {
        listeners.delete(callback);
      } else {
        listeners.clear();
      }
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    this.isAuthenticated = false;
  }

  public getConnectionState() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws?.readyState,
    };
  }
}

// React Hook for WebSocket
export function useWebSocket(options: WebSocketClientOptions) {
  const [client] = useState(() => new RevivaTechWebSocketClient(options));
  const [connectionState, setConnectionState] = useState(client.getConnectionState());

  useEffect(() => {
    const updateConnectionState = () => {
      setConnectionState(client.getConnectionState());
    };

    client.on('connect', updateConnectionState);
    client.on('disconnect', updateConnectionState);
    client.on('authenticated', updateConnectionState);

    // Connect on mount
    client.connect().catch(console.error);

    // Cleanup on unmount
    return () => {
      client.disconnect();
    };
  }, [client]);

  const subscribeToBookingUpdates = useCallback((bookingId: string, callback: Function) => {
    client.on('booking_update', (data: any) => {
      if (data.bookingId === bookingId) {
        callback(data);
      }
    });

    if (client.getConnectionState().isAuthenticated) {
      client.subscribe([`booking:${bookingId}`]);
    }

    return () => {
      client.off('booking_update', callback);
      client.unsubscribe([`booking:${bookingId}`]);
    };
  }, [client]);

  const subscribeToNotifications = useCallback((callback: Function) => {
    client.on('notification', callback);
    
    if (client.getConnectionState().isAuthenticated) {
      client.subscribe(['notifications']);
    }

    return () => {
      client.off('notification', callback);
      client.unsubscribe(['notifications']);
    };
  }, [client]);

  return {
    client,
    connectionState,
    subscribeToBookingUpdates,
    subscribeToNotifications,
  };
}

// Helper to create WebSocket URL
export function createWebSocketUrl(baseUrl?: string): string {
  if (typeof window === 'undefined') {
    return 'ws://localhost:8080'; // Server-side fallback
  }

  if (baseUrl) {
    return baseUrl.replace(/^http/, 'ws');
  }

  // Auto-detect from current page
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const port = process.env.NODE_ENV === 'development' ? ':8080' : '';
  
  return `${protocol}//${window.location.hostname}${port}`;
}

// Export for dynamic imports
import { useState, useEffect, useCallback } from 'react';