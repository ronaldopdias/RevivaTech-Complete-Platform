import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface AdminUpdate {
  id: string;
  type: 'new_booking' | 'repair_status_change' | 'urgent_notification' | 'system_alert';
  data: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface AdminMetrics {
  activeRepairs: number;
  pendingBookings: number;
  completedToday: number;
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  technicians: {
    online: number;
    busy: number;
    available: number;
  };
  queues: {
    diagnosis: number;
    repairInProgress: number;
    waitingParts: number;
    readyForPickup: number;
  };
}

interface UseAdminRealTimeOptions {
  adminId?: string;
  authToken?: string;
  onNewBooking?: (booking: any) => void;
  onRepairUpdate?: (update: any) => void;
  onUrgentAlert?: (alert: any) => void;
  onMetricsUpdate?: (metrics: AdminMetrics) => void;
}

export function useAdminRealTime(options: UseAdminRealTimeOptions) {
  const {
    adminId,
    authToken,
    onNewBooking,
    onRepairUpdate,
    onUrgentAlert,
    onMetricsUpdate,
  } = options;

  const [alerts, setAlerts] = useState<AdminUpdate[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    activeRepairs: 0,
    pendingBookings: 0,
    completedToday: 0,
    revenue: { today: 0, thisWeek: 0, thisMonth: 0 },
    technicians: { online: 0, busy: 0, available: 0 },
    queues: { diagnosis: 0, repairInProgress: 0, waitingParts: 0, readyForPickup: 0 },
  });
  const [lastUpdate, setLastUpdate] = useState<AdminUpdate | null>(null);

  // WebSocket connection for admin dashboard
  const wsUrl = process.env.NODE_ENV === 'development' 
    ? 'ws://localhost:3011/ws/admin'
    : `wss://${window.location.host}/ws/admin`;

  const {
    isConnected,
    isConnecting,
    sendMessage,
    connect,
    disconnect,
    error,
  } = useWebSocket({
    url: wsUrl,
    onOpen: () => {
      
      // Authenticate admin connection
      if (adminId && authToken) {
        sendMessage({
          type: 'admin_authenticate',
          adminId,
          authToken,
          role: 'admin',
        });
      }
    },
    onClose: () => {
    },
    onError: (event) => {
      console.error('Admin WebSocket error:', event);
    },
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        handleAdminMessage(data);
      } catch (err) {
        console.warn('Failed to parse admin WebSocket message:', err);
      }
    },
    shouldReconnect: true,
    reconnectAttempts: 5,
    reconnectInterval: 2000,
  });

  const handleAdminMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'new_booking':
        const bookingAlert: AdminUpdate = {
          id: data.id || Date.now().toString(),
          type: 'new_booking',
          data: data.booking,
          timestamp: data.timestamp || new Date().toISOString(),
          priority: 'medium',
        };
        
        setAlerts(prev => [bookingAlert, ...prev].slice(0, 50)); // Keep last 50 alerts
        setLastUpdate(bookingAlert);
        onNewBooking?.(data.booking);
        break;

      case 'repair_status_change':
        const repairAlert: AdminUpdate = {
          id: data.id || Date.now().toString(),
          type: 'repair_status_change',
          data: data.repair,
          timestamp: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'low',
        };
        
        setAlerts(prev => [repairAlert, ...prev].slice(0, 50));
        setLastUpdate(repairAlert);
        onRepairUpdate?.(data.repair);
        break;

      case 'urgent_notification':
        const urgentAlert: AdminUpdate = {
          id: data.id || Date.now().toString(),
          type: 'urgent_notification',
          data: data.alert,
          timestamp: data.timestamp || new Date().toISOString(),
          priority: 'urgent',
        };
        
        setAlerts(prev => [urgentAlert, ...prev].slice(0, 50));
        setLastUpdate(urgentAlert);
        onUrgentAlert?.(data.alert);
        break;

      case 'metrics_update':
        setMetrics(data.metrics);
        onMetricsUpdate?.(data.metrics);
        break;

      case 'system_alert':
        const systemAlert: AdminUpdate = {
          id: data.id || Date.now().toString(),
          type: 'system_alert',
          data: data.alert,
          timestamp: data.timestamp || new Date().toISOString(),
          priority: data.priority || 'high',
        };
        
        setAlerts(prev => [systemAlert, ...prev].slice(0, 50));
        setLastUpdate(systemAlert);
        break;

      case 'admin_authenticated':
        // Request initial metrics
        sendMessage({ type: 'request_metrics' });
        break;

      case 'admin_auth_failed':
        console.error('❌ Admin authentication failed');
        break;

      default:
        console.log('Unknown admin message type:', data.type);
    }
  }, [onNewBooking, onRepairUpdate, onUrgentAlert, onMetricsUpdate, sendMessage]);

  // Send command to technician
  const sendTechnicianCommand = useCallback((technicianId: string, command: string, data?: any) => {
    if (isConnected) {
      sendMessage({
        type: 'technician_command',
        technicianId,
        command,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isConnected, sendMessage]);

  // Update repair priority
  const updateRepairPriority = useCallback((repairId: string, priority: 'low' | 'medium' | 'high' | 'urgent') => {
    if (isConnected) {
      sendMessage({
        type: 'update_repair_priority',
        repairId,
        priority,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isConnected, sendMessage]);

  // Broadcast announcement
  const broadcastAnnouncement = useCallback((message: string, type: 'info' | 'warning' | 'urgent' = 'info') => {
    if (isConnected) {
      sendMessage({
        type: 'broadcast_announcement',
        message,
        announcementType: type,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isConnected, sendMessage]);

  // Request fresh metrics
  const refreshMetrics = useCallback(() => {
    if (isConnected) {
      sendMessage({ type: 'request_metrics' });
    }
  }, [isConnected, sendMessage]);

  // Clear specific alert
  const clearAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Get alert counts by priority
  const alertCounts = {
    urgent: alerts.filter(a => a.priority === 'urgent').length,
    high: alerts.filter(a => a.priority === 'high').length,
    medium: alerts.filter(a => a.priority === 'medium').length,
    low: alerts.filter(a => a.priority === 'low').length,
    total: alerts.length,
  };

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    
    // Data
    alerts,
    metrics,
    lastUpdate,
    alertCounts,
    
    // Actions
    sendTechnicianCommand,
    updateRepairPriority,
    broadcastAnnouncement,
    refreshMetrics,
    clearAlert,
    clearAllAlerts,
    connect,
    disconnect,
  };
}