interface AnalyticsEvent {
  type: 'connection_established' | 'realtime_metrics' | 'realtime_metrics_update' | 'user_insights' | 'event_processed' | 'error';
  data?: any;
  timestamp: string;
  message?: string;
}

interface AnalyticsMetricUpdate {
  metricId: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

class AnalyticsWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isConnected = false;
  private connectionEstablished = false;
  private authToken: string | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // Use the same WebSocket endpoint as other services
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-domain.com/api/analytics/ws'
        : 'ws://localhost:3011/api/analytics/ws';
      
      console.log('Connecting to analytics WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('Analytics WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Wait for connection_established before subscribing
        // Subscription will happen in handleMessage when we get connection_established
      };

      this.ws.onmessage = (event) => {
        try {
          const data: AnalyticsEvent = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse analytics WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('Analytics WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.connectionEstablished = false;
        this.stopHeartbeat();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Analytics WebSocket error:', error);
        this.isConnected = false;
        this.connectionEstablished = false;
        this.stopHeartbeat();
      };

    } catch (error) {
      console.error('Failed to connect analytics WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect analytics WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    }
  }

  private handleMessage(event: AnalyticsEvent) {
    console.log('Analytics WebSocket message received:', event);
    
    // Handle connection establishment
    if (event.type === 'connection_established') {
      this.connectionEstablished = true;
      console.log('Analytics WebSocket connection established');
      
      // Now subscribe to real-time updates
      this.send({
        type: 'subscribe_realtime'
      });
      return;
    }
    
    // Handle errors
    if (event.type === 'error') {
      console.error('Analytics WebSocket error:', event.message);
      return;
    }
    
    // Convert backend message types to frontend expected types
    let mappedEvent = event;
    if (event.type === 'realtime_metrics' || event.type === 'realtime_metrics_update') {
      mappedEvent = {
        ...event,
        type: 'metric_update'
      };
    }
    
    const listeners = this.listeners.get(mappedEvent.type) || [];
    listeners.forEach(listener => {
      try {
        listener(mappedEvent.data);
      } catch (error) {
        console.error('Error in analytics WebSocket listener:', error);
      }
    });
  }

  private send(data: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        console.log('Analytics WebSocket message sent:', data);
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket not connected, cannot send message:', data);
    }
  }
  
  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }
  
  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Subscribe to metric updates
  onMetricUpdate(callback: (data: AnalyticsMetricUpdate) => void) {
    this.addEventListener('metric_update', callback);
  }

  // Subscribe to new bookings
  onNewBooking(callback: (data: any) => void) {
    this.addEventListener('new_booking', callback);
  }

  // Subscribe to repair completions
  onRepairCompleted(callback: (data: any) => void) {
    this.addEventListener('repair_completed', callback);
  }

  // Subscribe to payments
  onPaymentReceived(callback: (data: any) => void) {
    this.addEventListener('payment_received', callback);
  }

  private addEventListener(type: string, callback: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);
  }

  removeEventListener(type: string, callback: Function) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Add property to store intervals (for cleanup)
  private simulationIntervals: NodeJS.Timeout[] = [];

  isConnectedToSocket(): boolean {
    return this.isConnected;
  }
  
  // Get the current connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionEstablished: this.connectionEstablished,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  disconnect() {
    console.log('Disconnecting analytics WebSocket...');
    
    // Clear any intervals if they exist
    this.simulationIntervals.forEach(interval => clearInterval(interval));
    this.simulationIntervals = [];
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
    this.isConnected = false;
    this.connectionEstablished = false;
  }
  
  // New method to check if fully connected and ready
  isFullyConnected(): boolean {
    return this.isConnected && this.connectionEstablished;
  }
  
  // Subscribe to specific user insights
  subscribeToUserInsights(fingerprint: string) {
    if (this.isFullyConnected()) {
      this.send({
        type: 'subscribe_user_insights',
        fingerprint
      });
    }
  }
}

// Export singleton instance
export const analyticsWebSocketService = new AnalyticsWebSocketService();

