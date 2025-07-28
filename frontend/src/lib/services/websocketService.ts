/**
 * WebSocket service for real-time features
 * Handles real-time notifications, repair status updates, and live data
 */

import { featureService } from './featureService';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  userId?: string;
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'notification';
  data: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
  };
}

export interface RepairUpdateMessage extends WebSocketMessage {
  type: 'repair_update';
  data: {
    repairId: string;
    status: string;
    message: string;
    technician: string;
    estimatedCompletion?: string;
  };
}

export interface AnalyticsUpdateMessage extends WebSocketMessage {
  type: 'analytics_update';
  data: {
    metric: string;
    value: number;
    change: number;
  };
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private isConnected = false;
  private userId: string | null = null;

  constructor() {
    this.url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3011';
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.userId = userId || null;
      
      try {
        const wsUrl = this.userId 
          ? `${this.url}?userId=${this.userId}`
          : this.url;
          
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send authentication if available
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
          if (token) {
            this.send('auth', { token });
          }
          
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Send message to server
   */
  send(type: string, data: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      userId: this.userId || undefined,
    };

    this.socket.send(JSON.stringify(message));
  }

  /**
   * Subscribe to specific message types
   */
  subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    
    this.handlers.get(type)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(handler: (notification: NotificationMessage) => void): () => void {
    return this.subscribe('notification', handler as MessageHandler);
  }

  /**
   * Subscribe to repair updates
   */
  subscribeToRepairUpdates(handler: (update: RepairUpdateMessage) => void): () => void {
    return this.subscribe('repair_update', handler as MessageHandler);
  }

  /**
   * Subscribe to analytics updates
   */
  subscribeToAnalytics(handler: (update: AnalyticsUpdateMessage) => void): () => void {
    return this.subscribe('analytics_update', handler as MessageHandler);
  }

  /**
   * Join a specific room for targeted updates
   */
  joinRoom(roomId: string): void {
    this.send('join_room', { roomId });
  }

  /**
   * Leave a specific room
   */
  leaveRoom(roomId: string): void {
    this.send('leave_room', { roomId });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error handling WebSocket message of type ${message.type}:`, error);
        }
      });
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    
    setTimeout(() => {
      console.log(`Attempting WebSocket reconnection (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      this.connect(this.userId || undefined).catch(() => {
        // Failed to reconnect, will try again
      });
    }, delay);
  }
}

// React hook for WebSocket connection
import { useEffect, useState, useCallback } from 'react';

export const useWebSocket = (userId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [service] = useState(() => new WebSocketService());

  useEffect(() => {
    const connect = async () => {
      try {
        await service.connect(userId);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      service.disconnect();
      setIsConnected(false);
    };
  }, [userId, service]);

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    return service.subscribe(type, handler);
  }, [service]);

  const send = useCallback((type: string, data: any) => {
    service.send(type, data);
  }, [service]);

  return {
    isConnected,
    subscribe,
    send,
    service,
  };
};

// React hook for notifications
export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const { service, isConnected } = useWebSocket(userId);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = service.subscribeToNotifications((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return unsubscribe;
  }, [service, isConnected]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.data.id === notificationId 
          ? { ...notification, data: { ...notification.data, read: true } }
          : notification
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    markAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.data.read).length,
  };
};

// React hook for repair updates
export const useRepairUpdates = (userId?: string) => {
  const [repairUpdates, setRepairUpdates] = useState<RepairUpdateMessage[]>([]);
  const { service, isConnected } = useWebSocket(userId);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = service.subscribeToRepairUpdates((update) => {
      setRepairUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
    });

    return unsubscribe;
  }, [service, isConnected]);

  return {
    repairUpdates,
    latestUpdate: repairUpdates[0] || null,
  };
};

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;