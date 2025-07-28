/**
 * WebSocket Client Service for Real-Time Communication
 * 
 * Provides centralized WebSocket connection management with:
 * - Automatic reconnection with exponential backoff
 * - Event-based message handling
 * - Subscription management for different data types
 * - Connection state management
 * - Error handling and recovery
 * 
 * Configuration-driven architecture following Nordic design principles
 */

interface WebSocketConfig {
  url: string;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  debug: boolean;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id?: string;
}

interface Subscription {
  id: string;
  channel: string;
  callback: (data: any) => void;
  filter?: (data: any) => boolean;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

type WebSocketEventType = 
  | 'booking-status-update'
  | 'repair-progress-update'
  | 'notification'
  | 'chat-message'
  | 'pricing-update'
  | 'queue-update'
  | 'system-message';

interface WebSocketEvents {
  'connection-state': ConnectionState;
  'message': WebSocketMessage;
  'error': Error;
  'reconnect-attempt': number;
}

class WebSocketService {
  private config: WebSocketConfig;
  private socket: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private subscriptions = new Map<string, Subscription>();
  private eventListeners = new Map<keyof WebSocketEvents, Set<Function>>();
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3011/ws',
      reconnectDelay: 1000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      debug: process.env.NODE_ENV === 'development',
      ...config,
    };

    // Bind methods to preserve context
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
        resolve();
        return;
      }

      this.setConnectionState('connecting');
      this.log('Connecting to WebSocket...', this.config.url);

      try {
        this.socket = new WebSocket(this.config.url);
        this.socket.addEventListener('open', () => {
          this.handleOpen();
          resolve();
        });
        this.socket.addEventListener('message', this.handleMessage);
        this.socket.addEventListener('error', (event) => {
          this.handleError(new Error('WebSocket connection error'));
          reject(new Error('Failed to connect to WebSocket'));
        });
        this.socket.addEventListener('close', this.handleClose);
      } catch (error) {
        this.handleError(error as Error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.log('Disconnecting from WebSocket...');
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.removeEventListener('open', this.handleOpen);
      this.socket.removeEventListener('message', this.handleMessage);
      this.socket.removeEventListener('error', this.handleError);
      this.socket.removeEventListener('close', this.handleClose);
      
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, 'Client disconnect');
      }
      
      this.socket = null;
    }

    this.setConnectionState('disconnected');
    this.subscriptions.clear();
  }

  /**
   * Send message to WebSocket server
   */
  send(type: WebSocketEventType, payload: any): boolean {
    if (this.connectionState !== 'connected' || !this.socket) {
      this.log('Cannot send message - not connected', { type, payload });
      return false;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      id: this.generateMessageId(),
    };

    try {
      this.socket.send(JSON.stringify(message));
      this.log('Message sent', message);
      return true;
    } catch (error) {
      this.log('Error sending message', error);
      return false;
    }
  }

  /**
   * Subscribe to specific channel/event type
   */
  subscribe(
    channel: WebSocketEventType,
    callback: (data: any) => void,
    filter?: (data: any) => boolean
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: Subscription = {
      id: subscriptionId,
      channel,
      callback,
      filter,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.log('Subscription created', { subscriptionId, channel });

    // Send subscription message to server
    if (this.connectionState === 'connected') {
      this.send('system-message', {
        action: 'subscribe',
        channel,
        subscriptionId,
      });
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    this.subscriptions.delete(subscriptionId);
    this.log('Subscription removed', { subscriptionId, channel: subscription.channel });

    // Send unsubscription message to server
    if (this.connectionState === 'connected') {
      this.send('system-message', {
        action: 'unsubscribe',
        channel: subscription.channel,
        subscriptionId,
      });
    }

    return true;
  }

  /**
   * Add event listener for connection events
   */
  addEventListener<K extends keyof WebSocketEvents>(
    event: K,
    listener: (data: WebSocketEvents[K]) => void
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener<K extends keyof WebSocketEvents>(
    event: K,
    listener: (data: WebSocketEvents[K]) => void
  ): void {
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
    return this.connectionState === 'connected' && this.socket?.readyState === WebSocket.OPEN;
  }

  // Private methods

  private handleOpen(): void {
    this.log('WebSocket connected');
    this.setConnectionState('connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    
    // Re-subscribe to all channels
    this.subscriptions.forEach((subscription) => {
      this.send('system-message', {
        action: 'subscribe',
        channel: subscription.channel,
        subscriptionId: subscription.id,
      });
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.log('Message received', message);

      // Handle heartbeat responses
      if (message.type === 'system-message' && message.payload?.action === 'pong') {
        return;
      }

      // Distribute message to subscribers
      this.subscriptions.forEach((subscription) => {
        if (subscription.channel === message.type) {
          if (!subscription.filter || subscription.filter(message.payload)) {
            subscription.callback(message.payload);
          }
        }
      });

      // Emit message event
      this.emit('message', message);
    } catch (error) {
      this.log('Error parsing message', error);
    }
  }

  private handleError(error: Error): void {
    this.log('WebSocket error', error);
    this.setConnectionState('error');
    this.emit('error', error);
  }

  private handleClose(event: CloseEvent): void {
    this.log('WebSocket closed', { code: event.code, reason: event.reason });
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Attempt reconnection if not manually closed
    if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.attemptReconnect();
    } else {
      this.setConnectionState('disconnected');
    }
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

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.log('Reconnection failed', error);
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          this.setConnectionState('disconnected');
        }
      });
    }, delay);
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send('system-message', { action: 'ping' });
      }
    }, this.config.heartbeatInterval);
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.log('Connection state changed', state);
      this.emit('connection-state', state);
    }
  }

  private emit<K extends keyof WebSocketEvents>(event: K, data: WebSocketEvents[K]): void {
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
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[WebSocket] ${message}`, data || '');
    }
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// Export types for external use
export type {
  WebSocketConfig,
  WebSocketMessage,
  WebSocketEventType,
  WebSocketEvents,
  ConnectionState,
  Subscription,
};

export default WebSocketService;