/**
 * Analytics Database Integration - Stub Implementation
 * Lightweight analytics without external dependencies
 * 
 * Features:
 * - In-memory event tracking for development
 * - Simple analytics data structure
 * - Ready for future database integration
 */

// Simple analytics event structure
export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  userId?: string;
  event: string;
  category: string;
  action: string;
  label: string;
  value?: number;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// In-memory storage for development
let events: AnalyticsEvent[] = [];
let sessions: Map<string, any> = new Map();

// Analytics database service
export const analyticsDB = {
  async recordEvent(event: AnalyticsEvent): Promise<void> {
    // Store event in memory for development
    events.push(event);
    
    // Keep only recent events (last 1000) to prevent memory issues
    if (events.length > 1000) {
      events = events.slice(-1000);
    }
    
    console.log(`Analytics: Recorded event ${event.event} for session ${event.sessionId}`);
  },

  async getEvents(sessionId?: string, userId?: string): Promise<AnalyticsEvent[]> {
    return events.filter(event => {
      if (sessionId && event.sessionId !== sessionId) return false;
      if (userId && event.userId !== userId) return false;
      return true;
    });
  },

  async getSessionData(sessionId: string): Promise<any> {
    return sessions.get(sessionId) || null;
  },

  async updateSessionData(sessionId: string, data: any): Promise<void> {
    sessions.set(sessionId, { ...sessions.get(sessionId), ...data });
  },

  async getAnalyticsSummary(): Promise<any> {
    const totalEvents = events.length;
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
    const eventTypes = events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents,
      uniqueSessions,
      eventTypes,
      lastUpdated: new Date(),
    };
  },

  // Simple business metrics calculation
  async getBusinessMetrics(): Promise<any> {
    const bookingEvents = events.filter(e => e.event === 'conversion' && e.category === 'booking');
    const pageViews = events.filter(e => e.event === 'page_view');
    
    return {
      totalBookings: bookingEvents.length,
      totalPageViews: pageViews.length,
      conversionRate: pageViews.length > 0 ? (bookingEvents.length / pageViews.length * 100).toFixed(2) : '0.00',
      avgSessionDuration: '5:32', // Mock data
      bounceRate: '24.5%', // Mock data
    };
  }
};

export default analyticsDB;