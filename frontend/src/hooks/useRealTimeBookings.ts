import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface RepairUpdate {
  id: string;
  type: 'status_change' | 'progress_update' | 'message' | 'timeline_update' | 'photo_added';
  repairId: string;
  data: any;
  timestamp: string;
}

interface UseRealTimeBookingsOptions {
  customerId?: string;
  authToken?: string;
  onRepairUpdate?: (update: RepairUpdate) => void;
  onNewMessage?: (message: any) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useRealTimeBookings(options: UseRealTimeBookingsOptions) {
  const {
    customerId,
    authToken,
    onRepairUpdate,
    onNewMessage,
    onConnectionChange,
  } = options;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<RepairUpdate | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<any>(null);

  // Socket.IO connection to backend
  useEffect(() => {
    if (!authToken) {
      console.warn('No auth token provided, skipping WebSocket connection');
      return;
    }

    const socketUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3011'
      : window.location.origin;

    console.log('🔌 Connecting to Socket.IO server at:', socketUrl);
    setIsConnecting(true);

    const newSocket = io(socketUrl, {
      auth: {
        token: authToken,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      onConnectionChange?.(true);

      // Subscribe to booking updates
      newSocket.emit('subscribe:bookings', { customerId });
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      setIsConnecting(false);
      onConnectionChange?.(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setError(error);
      setIsConnecting(false);
      setIsConnected(false);
    });

    // Handle booking updates
    newSocket.on('booking:updated', (data) => {
      console.log('📬 Booking update received:', data);
      const update: RepairUpdate = {
        id: data.id || Date.now().toString(),
        type: data.updateType || 'status_change',
        repairId: data.bookingId || data.repairId,
        data: data,
        timestamp: data.timestamp || new Date().toISOString(),
      };
      
      setLastUpdate(update);
      onRepairUpdate?.(update);
      
      // Add notification
      setNotifications(prev => [...prev, {
        id: update.id,
        type: 'repair_update',
        title: getUpdateTitle(update.type),
        message: data.message || 'Your repair status has been updated',
        timestamp: update.timestamp,
        read: false,
        repairId: update.repairId,
      }]);
    });

    // Handle chat messages
    newSocket.on('chat:message', (data) => {
      console.log('💬 Chat message received:', data);
      onNewMessage?.(data);
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        type: 'message',
        title: 'New Message',
        message: `New message from ${data.from || 'technician'}`,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        repairId: data.repairId,
      }]);
    });

    // Handle connection confirmation
    newSocket.on('connected', (data) => {
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up Socket.IO connection');
      newSocket.disconnect();
    };
  }, [authToken, customerId, onRepairUpdate, onNewMessage, onConnectionChange]);

  // Helper function for getting update titles
  const getUpdateTitle = useCallback((updateType: string): string => {
    const titles = {
      status_change: 'Status Updated',
      progress_update: 'Progress Update',
      message: 'New Message',
      timeline_update: 'Timeline Updated',
      photo_added: 'New Photo Added',
    };
    return titles[updateType] || 'Repair Updated';
  }, []);

  // Subscribe to specific repair
  const subscribeToRepair = useCallback((repairId: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe:repair', { repairId });
      console.log('📡 Subscribed to repair:', repairId);
    }
  }, [socket, isConnected]);

  // Unsubscribe from repair
  const unsubscribeFromRepair = useCallback((repairId: string) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe:repair', { repairId });
      console.log('📡 Unsubscribed from repair:', repairId);
    }
  }, [socket, isConnected]);

  // Send message to technician
  const sendMessageToTechnician = useCallback((repairId: string, message: string) => {
    if (socket && isConnected) {
      socket.emit('chat:send', {
        repairId,
        message,
        from: 'customer',
        timestamp: new Date().toISOString(),
      });
      console.log('💬 Message sent:', { repairId, message });
    }
  }, [socket, isConnected]);

  // Connect and disconnect functions
  const connect = useCallback(() => {
    if (socket) {
      socket.connect();
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
  }, [socket]);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread notification count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    
    // Data
    notifications,
    lastUpdate,
    unreadCount,
    
    // Actions
    subscribeToRepair,
    unsubscribeFromRepair,
    sendMessageToTechnician,
    markNotificationAsRead,
    clearNotifications,
    connect,
    disconnect,
  };
}