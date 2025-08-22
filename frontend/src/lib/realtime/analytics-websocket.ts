/**
 * Real-Time Analytics WebSocket Service
 * Phase 7 - Live dashboard updates and real-time metrics
 * 
 * Features:
 * - Real-time metric updates
 * - Live dashboard synchronization
 * - Event streaming for analytics
 * - Performance monitoring
 */

import { io, Socket } from 'socket.io-client';

export interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  unit?: string;
  category: string;
  timestamp: Date;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface RealTimeEvent {
  type: string;
  data: any;
  timestamp: Date;
}

export class AnalyticsWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connected = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    try {
      // Temporarily disable WebSocket in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 WebSocket disabled in development mode');
        this.connected = false;
        return;
      }

      // Use the backend port for WebSocket connection
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3011';

      this.socket = io(`${socketUrl}/analytics`, {
        path: '/analytics/socket.io/',
        transports: ['websocket', 'polling'],
        timeout: 20000,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connected', { timestamp: new Date() });
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      this.emit('disconnected', { reason, timestamp: new Date() });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Analytics WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emit('connection_failed', { error, timestamp: new Date() });
      }
    });

    // Real-time metric updates
    this.socket.on('metric_update', (metric: RealTimeMetric) => {
      this.emit('metric_update', metric);
    });

    // Live events
    this.socket.on('live_event', (event: RealTimeEvent) => {
      this.emit('live_event', event);
    });

    // Dashboard updates
    this.socket.on('dashboard_update', (data: any) => {
      this.emit('dashboard_update', data);
    });

    // Performance metrics
    this.socket.on('performance_update', (data: any) => {
      this.emit('performance_update', data);
    });
  }

  // Subscribe to real-time analytics
  public subscribeToAnalytics(dashboardId?: string) {
    // In development mode, WebSocket is disabled - silently return
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    if (!this.connected || !this.socket) {
      console.warn('WebSocket not connected, cannot subscribe to analytics');
      return;
    }

    this.socket.emit('subscribe_analytics', {
      dashboardId: dashboardId || 'admin_dashboard',
      timestamp: new Date(),
    });

  }

  // Subscribe to real-time metrics (alias for subscribeToAnalytics)
  public subscribeToMetrics(callback?: (metric: RealTimeMetric) => void) {
    if (callback) {
      this.on('metric_update', callback);
    }
    this.subscribeToAnalytics('admin_dashboard');
  }

  // Subscribe to real-time events
  public subscribeToEvents(eventType: string, callback?: (event: RealTimeEvent) => void) {
    if (callback) {
      this.on('live_event', callback);
    }
    
    // In development mode, WebSocket is disabled - silently return
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    if (!this.connected || !this.socket) {
      console.warn('WebSocket not connected, cannot subscribe to events');
      return;
    }

    this.socket.emit('subscribe_events', {
      eventType,
      timestamp: new Date(),
    });

  }

  // Unsubscribe from analytics
  public unsubscribeFromAnalytics() {
    if (!this.socket) return;

    this.socket.emit('unsubscribe_analytics', {
      timestamp: new Date(),
    });

  }

  // Send analytics event
  public sendEvent(event: Partial<RealTimeEvent>) {
    // In development mode, WebSocket is disabled - silently return
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    if (!this.connected || !this.socket) {
      console.warn('WebSocket not connected, cannot send event');
      return;
    }

    this.socket.emit('analytics_event', {
      ...event,
      timestamp: new Date(),
    });
  }

  // Request metric update
  public requestMetricUpdate(metricId: string) {
    // In development mode, WebSocket is disabled - silently return
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    if (!this.connected || !this.socket) {
      console.warn('WebSocket not connected, cannot request metric update');
      return;
    }

    this.socket.emit('request_metric', {
      metricId,
      timestamp: new Date(),
    });
  }

  // Event listener management
  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback?: Function) {
    if (!this.listeners.has(event)) return;

    if (callback) {
      const listeners = this.listeners.get(event)!;
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.listeners.set(event, []);
    }
  }

  private emit(event: string, data: any) {
    if (!this.listeners.has(event)) return;

    const listeners = this.listeners.get(event)!;
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Connection status
  public isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  // Disconnect
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  // Reconnect
  public reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }
}

// React hook for using real-time analytics
export function useRealTimeAnalytics() {
  const [service] = useState(() => new AnalyticsWebSocketService());
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState<Map<string, RealTimeMetric>>(new Map());
  const [events, setEvents] = useState<RealTimeEvent[]>([]);

  useEffect(() => {
    service.on('connected', () => setConnected(true));
    service.on('disconnected', () => setConnected(false));
    
    service.on('metric_update', (metric: RealTimeMetric) => {
      setMetrics(prev => new Map(prev.set(metric.id, metric)));
    });

    service.on('live_event', (event: RealTimeEvent) => {
      setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
    });

    // Subscribe to analytics on mount
    if (service.isConnected()) {
      service.subscribeToAnalytics();
    } else {
      service.on('connected', () => service.subscribeToAnalytics());
    }

    return () => {
      service.unsubscribeFromAnalytics();
      service.disconnect();
    };
  }, [service]);

  return {
    connected,
    metrics: Array.from(metrics.values()),
    events,
    sendEvent: (event: Partial<RealTimeEvent>) => service.sendEvent(event),
    requestMetricUpdate: (metricId: string) => service.requestMetricUpdate(metricId),
    service
  };
}

// Add necessary imports for React hook
import { useState, useEffect } from 'react';

// Export singleton instance for use outside React
export const analyticsWebSocket = new AnalyticsWebSocketService();