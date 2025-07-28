/**
 * React Hook for Socket.IO WebSocket Management
 * 
 * Provides React integration for Socket.IO WebSocket service with:
 * - Connection state management
 * - Authentication integration
 * - Event subscription handling
 * - Automatic cleanup on unmount
 * - Error handling and reconnection
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketIOWebSocketService, ConnectionState, SocketIOEvents } from '../services/socket-io-websocket.service';

interface UseSocketIOOptions {
  autoConnect?: boolean;
  authToken?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onReconnect?: (attempts: number) => void;
}

interface UseSocketIOReturn {
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: <K extends keyof SocketIOEvents>(
    event: K,
    callback: (data: SocketIOEvents[K]) => void
  ) => string;
  unsubscribe: (subscriptionId: string) => boolean;
  subscribeToBookings: () => string;
  subscribeToPricing: () => string;
  joinChatRoom: (roomId: string) => void;
  reconnect: () => Promise<void>;
}

export function useSocketIO(options: UseSocketIOOptions = {}): UseSocketIOReturn {
  const {
    autoConnect = false,
    authToken,
    onConnect,
    onDisconnect,
    onError,
    onReconnect,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const optionsRef = useRef(options);

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Set auth token when provided
  useEffect(() => {
    if (authToken) {
      socketIOWebSocketService.setAuthToken(authToken);
    }
  }, [authToken]);

  // Connection state listener
  useEffect(() => {
    const handleConnectionState = (state: ConnectionState) => {
      setConnectionState(state);
      
      if (state === 'connected') {
        setError(null);
        optionsRef.current.onConnect?.();
      } else if (state === 'disconnected') {
        optionsRef.current.onDisconnect?.();
      }
    };

    const handleError = (err: Error) => {
      setError(err);
      optionsRef.current.onError?.(err);
    };

    const handleReconnectAttempt = (attempts: number) => {
      optionsRef.current.onReconnect?.(attempts);
    };

    socketIOWebSocketService.addEventListener('connection-state', handleConnectionState);
    socketIOWebSocketService.addEventListener('error', handleError);
    socketIOWebSocketService.addEventListener('reconnect-attempt', handleReconnectAttempt);

    // Set initial state
    setConnectionState(socketIOWebSocketService.getConnectionState());

    return () => {
      socketIOWebSocketService.removeEventListener('connection-state', handleConnectionState);
      socketIOWebSocketService.removeEventListener('error', handleError);
      socketIOWebSocketService.removeEventListener('reconnect-attempt', handleReconnectAttempt);
    };
  }, []);

  // Auto-connect if enabled and auth token is available
  useEffect(() => {
    if (autoConnect && authToken && connectionState === 'disconnected') {
      connect();
    }
  }, [autoConnect, authToken, connectionState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from all subscriptions
      subscriptionsRef.current.forEach((subscriptionId) => {
        socketIOWebSocketService.unsubscribe(subscriptionId);
      });
      subscriptionsRef.current.clear();

      // Disconnect if this was the last component using the service
      if (connectionState === 'connected') {
        socketIOWebSocketService.disconnect();
      }
    };
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    if (!authToken) {
      const error = new Error('Authentication token required for WebSocket connection');
      setError(error);
      throw error;
    }

    try {
      await socketIOWebSocketService.connect();
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    }
  }, [authToken]);

  const disconnect = useCallback((): void => {
    socketIOWebSocketService.disconnect();
    
    // Clean up subscriptions
    subscriptionsRef.current.forEach((subscriptionId) => {
      socketIOWebSocketService.unsubscribe(subscriptionId);
    });
    subscriptionsRef.current.clear();
  }, []);

  const subscribe = useCallback(<K extends keyof SocketIOEvents>(
    event: K,
    callback: (data: SocketIOEvents[K]) => void
  ): string => {
    const subscriptionId = socketIOWebSocketService.subscribe(event, callback);
    subscriptionsRef.current.add(subscriptionId);
    return subscriptionId;
  }, []);

  const unsubscribe = useCallback((subscriptionId: string): boolean => {
    subscriptionsRef.current.delete(subscriptionId);
    return socketIOWebSocketService.unsubscribe(subscriptionId);
  }, []);

  const subscribeToBookings = useCallback((): string => {
    if (!socketIOWebSocketService.isConnected()) {
      throw new Error('Not connected to WebSocket server');
    }
    
    const subscriptionId = socketIOWebSocketService.subscribeToBookings();
    subscriptionsRef.current.add(subscriptionId);
    return subscriptionId;
  }, []);

  const subscribeToPricing = useCallback((): string => {
    if (!socketIOWebSocketService.isConnected()) {
      throw new Error('Not connected to WebSocket server');
    }
    
    const subscriptionId = socketIOWebSocketService.subscribeToPricing();
    subscriptionsRef.current.add(subscriptionId);
    return subscriptionId;
  }, []);

  const joinChatRoom = useCallback((roomId: string): void => {
    if (!socketIOWebSocketService.isConnected()) {
      throw new Error('Not connected to WebSocket server');
    }
    
    socketIOWebSocketService.joinChatRoom(roomId);
  }, []);

  const reconnect = useCallback(async (): Promise<void> => {
    disconnect();
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    await connect();
  }, [connect, disconnect]);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting' || connectionState === 'reconnecting',
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    subscribeToBookings,
    subscribeToPricing,
    joinChatRoom,
    reconnect,
  };
}

export default useSocketIO;