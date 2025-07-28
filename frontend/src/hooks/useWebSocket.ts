import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  shouldReconnect?: boolean;
}

export interface WebSocketHook {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: any;
  error: Event | null;
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(options: WebSocketOptions): WebSocketHook {
  const {
    url,
    protocols,
    onOpen,
    onClose,
    onError,
    onMessage,
    reconnectAttempts = 3,
    reconnectInterval = 3000,
    shouldReconnect = true,
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<Event | null>(null);
  
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const shouldAttemptReconnect = useRef(shouldReconnect);

  const connect = useCallback(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url, protocols);

      ws.onopen = (event) => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectCount.current = 0;
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        setSocket(null);
        onClose?.(event);

        // Attempt reconnection if enabled and not a normal closure
        if (
          shouldAttemptReconnect.current &&
          event.code !== 1000 &&
          reconnectCount.current < reconnectAttempts
        ) {
          reconnectCount.current += 1;
          reconnectTimer.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setError(event);
        setIsConnecting(false);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(event);
        } catch (err) {
          // If not JSON, use raw data
          setLastMessage(event.data);
          onMessage?.(event);
        }
      };

      setSocket(ws);
    } catch (err) {
      setIsConnecting(false);
      setError(err as Event);
    }
  }, [url, protocols, onOpen, onClose, onError, onMessage, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    shouldAttemptReconnect.current = false;
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    if (socket) {
      socket.close(1000, 'Client disconnect');
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectCount.current = 0;
    shouldAttemptReconnect.current = shouldReconnect;
    setTimeout(connect, 100);
  }, [disconnect, connect, shouldReconnect]);

  const sendMessage = useCallback((message: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
      socket.send(messageToSend);
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, [socket]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      shouldAttemptReconnect.current = false;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  // Update shouldReconnect ref when prop changes
  useEffect(() => {
    shouldAttemptReconnect.current = shouldReconnect;
  }, [shouldReconnect]);

  return {
    socket,
    isConnected,
    isConnecting,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect,
    reconnect,
  };
}

// Additional hook for WebSocket subscriptions
export function useWebSocketSubscription(
  url: string,
  eventType: string,
  callback: (data: any) => void
) {
  const { lastMessage, isConnected } = useWebSocket({
    url,
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === eventType) {
          callback(data);
        }
      } catch (err) {
        console.warn('Failed to parse WebSocket message:', err);
      }
    },
  });

  return { lastMessage, isConnected };
}

export default useWebSocket;