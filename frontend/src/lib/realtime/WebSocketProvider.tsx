'use client';

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id?: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastConnected?: Date;
  reconnectCount: number;
}

interface WebSocketContextType {
  connectionStatus: ConnectionStatus;
  sendMessage: (message: WebSocketMessage) => void;
  subscribe: (eventType: string, callback: (data: any) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3011/ws',
  autoConnect = false, // Disable auto-connect by default
  reconnectInterval = 30000, // Increase interval to reduce spam
  maxReconnectAttempts = 0 // Disable reconnection attempts for now
}) => {
  const { user, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectCount: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Build WebSocket URL with authentication
  const buildWebSocketUrl = () => {
    const urlParams = new URLSearchParams();
    
    if (user?.id) {
      urlParams.append('userId', user.id);
    }
    
    return `${url}?${urlParams.toString()}`;
  };

  // Send heartbeat to keep connection alive
  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: 'ping',
          payload: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Send ping every 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Process queued messages
  const processMessageQueue = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN && messageQueueRef.current.length > 0) {
      const messages = [...messageQueueRef.current];
      messageQueueRef.current = [];
      
      messages.forEach(message => {
        wsRef.current?.send(JSON.stringify(message));
      });
    }
  };

  // Connect to WebSocket
  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN || connectionStatus.isConnecting) {
      return;
    }

    setConnectionStatus(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));

    try {
      const wsUrl = buildWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          lastConnected: new Date(),
          reconnectCount: 0
        }));

        // Send authentication message
        if (isAuthenticated && user) {
          sendMessage({
            type: 'auth',
            payload: {
              userId: user.id,
              userType: user.role || 'customer',
              timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          });
        }

        // Process queued messages
        processMessageQueue();
        
        // Start heartbeat
        startHeartbeat();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle system messages
          if (message.type === 'pong') {
            return; // Heartbeat response
          }

          // Broadcast to subscribers
          const callbacks = subscriptionsRef.current.get(message.type);
          if (callbacks) {
            callbacks.forEach(callback => {
              try {
                callback(message.payload || message);
              } catch (error) {
                console.error('Error in WebSocket callback:', error);
              }
            });
          }

          // Broadcast to wildcard subscribers
          const wildcardCallbacks = subscriptionsRef.current.get('*');
          if (wildcardCallbacks) {
            wildcardCallbacks.forEach(callback => {
              try {
                callback(message);
              } catch (error) {
                console.error('Error in WebSocket wildcard callback:', error);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: event.code !== 1000 ? `Connection closed: ${event.reason || 'Unknown reason'}` : null
        }));

        stopHeartbeat();

        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && connectionStatus.reconnectCount < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: 'Connection error occurred'
        }));
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus(prev => ({
        ...prev,
        isConnecting: false,
        error: 'Failed to create connection'
      }));
    }
  };

  // Schedule reconnection
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(reconnectInterval * Math.pow(2, connectionStatus.reconnectCount), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionStatus(prev => ({
        ...prev,
        reconnectCount: prev.reconnectCount + 1
      }));
      connect();
    }, delay);
  };

  // Disconnect from WebSocket
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setConnectionStatus({
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectCount: 0
    });
  };

  // Send message
  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for later
      messageQueueRef.current.push(message);
    }
  };

  // Subscribe to event type
  const subscribe = (eventType: string, callback: (data: any) => void) => {
    if (!subscriptionsRef.current.has(eventType)) {
      subscriptionsRef.current.set(eventType, new Set());
    }
    
    subscriptionsRef.current.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = subscriptionsRef.current.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          subscriptionsRef.current.delete(eventType);
        }
      }
    };
  };

  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated) {
      connect();
    } else if (!isAuthenticated && wsRef.current) {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, autoConnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !connectionStatus.isConnected && isAuthenticated) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connectionStatus.isConnected, isAuthenticated]);

  const contextValue: WebSocketContextType = {
    connectionStatus,
    sendMessage,
    subscribe,
    connect,
    disconnect,
    isConnected: connectionStatus.isConnected
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Hook for specific event subscriptions
export const useWebSocketSubscription = (eventType: string, callback: (data: any) => void) => {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe(eventType, callback);
    return unsubscribe;
  }, [eventType, callback, subscribe]);
};

// Hook for connection status
export const useWebSocketStatus = () => {
  const { connectionStatus, connect, disconnect } = useWebSocket();
  return { connectionStatus, connect, disconnect };
};

export default WebSocketProvider;