/**
 * Socket.IO WebSocket Client Service for Real-Time Communication
 * 
 * Provides centralized Socket.IO connection management with:
 * - JWT authentication with backend
 * - Room-based subscription management
 * - Automatic reconnection handling
 * - Event-based message handling
 * - Connection state management
 * - Error handling and recovery
 * 
 * Configuration-driven architecture following Nordic design principles
 */

import { io, Socket } from 'socket.io-client';

interface SocketIOConfig {
  url: string;
  debug: boolean;
  autoConnect: boolean;
  reconnectDelay: number;
  maxReconnectAttempts: number;
}

interface SocketIOEvents {
  'connected': { message: string; user: any };
  'booking:updated': { bookingId: string; status: string; [key: string]: any };
  'pricing:updated': { deviceId?: string; [key: string]: any };
  'notification': { type: string; title: string; message: string; [key: string]: any };
  'error': { message: string; code?: string };
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

type SubscriptionCallback<T = any> = (data: T) => void;

interface Subscription {
  event: keyof SocketIOEvents;
  callback: SubscriptionCallback;
  id: string;
}

class SocketIOWebSocketService {
  private config: SocketIOConfig;
  private socket: Socket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private subscriptions = new Map<string, Subscription>();
  private eventListeners = new Map<string, Set<Function>>();
  private authToken: string | null = null;
  private reconnectAttempts = 0;

  constructor(config?: Partial<SocketIOConfig>) {
    this.config = {
      url: process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:3011',
      debug: process.env.NODE_ENV === 'development',
      autoConnect: false,
      reconnectDelay: 1000,
      maxReconnectAttempts: 10,
      ...config,
    };

    this.log('SocketIO WebSocket Service initialized', this.config);
  }

  /**
   * Set authentication token for WebSocket connection
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    this.log('Auth token set');
  }

  /**
   * Connect to Socket.IO server with JWT authentication
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
        resolve();
        return;
      }

      if (!this.authToken) {
        const error = new Error('Authentication token required');
        this.handleError(error);
        reject(error);
        return;
      }

      this.setConnectionState('connecting');
      this.log('Connecting to Socket.IO...', this.config.url);

      try {
        this.socket = io(this.config.url, {
          auth: {
            token: this.authToken
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true,
          autoConnect: this.config.autoConnect
        });

        // Connection established
        this.socket.on('connect', () => {
          this.log('Socket.IO connected', this.socket?.id);
          this.setConnectionState('connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
          this.log('Socket.IO connection error', error.message);
          this.handleError(error);
          reject(error);
        });

        // Disconnection
        this.socket.on('disconnect', (reason) => {
          this.log('Socket.IO disconnected', reason);
          this.setConnectionState('disconnected');
          
          // Auto-reconnect for unexpected disconnections
          if (reason === 'io server disconnect') {
            // Server disconnected us, don't auto-reconnect
            this.setConnectionState('disconnected');
          } else if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        });

        // Authentication response
        this.socket.on('connected', (data: SocketIOEvents['connected']) => {
          this.log('Authentication successful', data);
          this.emit('connection-state', 'connected');
        });

        // Global error handler
        this.socket.on('error', (error: any) => {
          this.log('Socket.IO error', error);
          this.handleError(error);
        });

        // Booking updates
        this.socket.on('booking:updated', (data: SocketIOEvents['booking:updated']) => {
          this.log('Booking update received', data);
          this.emit('booking:updated', data);
        });

        // Pricing updates
        this.socket.on('pricing:updated', (data: SocketIOEvents['pricing:updated']) => {
          this.log('Pricing update received', data);
          this.emit('pricing:updated', data);
        });

        // Notifications
        this.socket.on('notification', (data: SocketIOEvents['notification']) => {
          this.log('Notification received', data);
          this.emit('notification', data);
        });

        // Manual connect if not auto-connecting
        if (!this.config.autoConnect) {
          this.socket.connect();
        }

      } catch (error) {
        this.handleError(error as Error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    this.log('Disconnecting from Socket.IO...');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.setConnectionState('disconnected');
    this.subscriptions.clear();
  }

  /**
   * Subscribe to booking updates
   */
  subscribeToBookings(): string {
    if (!this.isConnected()) {
      throw new Error('Not connected to Socket.IO server');
    }

    this.socket?.emit('subscribe:bookings');
    this.log('Subscribed to booking updates');
    
    return this.subscribe('booking:updated', (data) => {
      this.log('Booking updated', data);
    });
  }

  /**
   * Subscribe to pricing updates
   */
  subscribeToPricing(): string {
    if (!this.isConnected()) {
      throw new Error('Not connected to Socket.IO server');
    }

    this.socket?.emit('subscribe:pricing');
    this.log('Subscribed to pricing updates');
    
    return this.subscribe('pricing:updated', (data) => {
      this.log('Pricing updated', data);
    });
  }

  /**
   * Join a chat room
   */
  joinChatRoom(roomId: string): void {
    if (!this.isConnected()) {
      throw new Error('Not connected to Socket.IO server');
    }

    this.socket?.emit('join:chat', roomId);
    this.log('Joined chat room', roomId);
  }

  /**
   * Subscribe to specific event
   */
  subscribe<K extends keyof SocketIOEvents>(
    event: K,
    callback: SubscriptionCallback<SocketIOEvents[K]>
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: Subscription = {
      event,
      callback: callback as SubscriptionCallback,
      id: subscriptionId,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.log('Subscription created', { subscriptionId, event });

    return subscriptionId;
  }

  /**
   * Unsubscribe from event
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    this.subscriptions.delete(subscriptionId);
    this.log('Subscription removed', { subscriptionId, event: subscription.event });
    return true;
  }

  /**
   * Add event listener for service events
   */
  addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected' && this.socket?.connected === true;
  }

  /**
   * Get Socket.IO instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  // Private methods

  private handleError(error: Error): void {
    this.log('Socket.IO error', error.message);
    this.setConnectionState('error');
    this.emit('error', error);
  }

  private attemptReconnect(): void {
    if (this.connectionState === 'reconnecting') {
      return;
    }

    this.setConnectionState('reconnecting');
    this.reconnectAttempts++;
    
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    this.log(`Reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    this.emit('reconnect-attempt', this.reconnectAttempts);

    setTimeout(() => {
      if (this.authToken) {
        this.connect().catch((error) => {
          this.log('Reconnection failed', error.message);
          if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.attemptReconnect();
          } else {
            this.setConnectionState('disconnected');
          }
        });
      }
    }, delay);
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.log('Connection state changed', state);
      this.emit('connection-state', state);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          this.log('Error in event listener', error);
        }
      });
    }

    // Also trigger subscription callbacks
    this.subscriptions.forEach((subscription) => {
      if (subscription.event === event) {
        try {
          subscription.callback(data);
        } catch (error) {
          this.log('Error in subscription callback', error);
        }
      }
    });
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[SocketIO] ${message}`, data || '');
    }
  }
}

// Create singleton instance
export const socketIOWebSocketService = new SocketIOWebSocketService();

// Export types for external use
export type {
  SocketIOConfig,
  SocketIOEvents,
  ConnectionState,
  SubscriptionCallback,
};

export default SocketIOWebSocketService;