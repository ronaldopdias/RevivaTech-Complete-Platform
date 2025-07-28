/**
 * Customer Journey Analytics Service
 * Tracks customer journey stages, conversion funnels, and drop-off points
 */

import { analyticsLogger } from '../lib/utils';

// Customer Journey Stage Types
export interface JourneyStage {
  id: string;
  name: string;
  description: string;
  order: number;
  isRequired: boolean;
  category: 'awareness' | 'consideration' | 'conversion' | 'retention';
}

// Journey Event Types
export interface JourneyEvent {
  id: string;
  userId?: string;
  sessionId: string;
  fingerprintId: string;
  timestamp: Date;
  stageId: string;
  eventType: string;
  eventData: Record<string, any>;
  pageUrl: string;
  referrer?: string;
  userAgent: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  duration?: number;
  exitPoint?: boolean;
}

// Funnel Stage Definition
export interface FunnelStage {
  id: string;
  name: string;
  order: number;
  requiredEvents: string[];
  conversionGoal: string;
  dropOffReasons: string[];
}

// Funnel Analysis Result
export interface FunnelAnalysis {
  stageId: string;
  stageName: string;
  totalEntered: number;
  totalConverted: number;
  totalDropped: number;
  conversionRate: number;
  dropOffRate: number;
  averageTimeSpent: number;
  topDropOffReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  conversionsByDevice: Record<string, number>;
  conversionsBySource: Record<string, number>;
}

// Customer Journey Map
export interface CustomerJourneyMap {
  journeyId: string;
  customerId?: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
  stages: JourneyStage[];
  events: JourneyEvent[];
  currentStage: string;
  completedStages: string[];
  droppedAtStage?: string;
  conversionAchieved: boolean;
  touchpoints: number;
  deviceSwitches: number;
  channelSwitches: number;
  revenue?: number;
}

// Journey Analytics Configuration
const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'awareness',
    name: 'Awareness',
    description: 'Customer becomes aware of our services',
    order: 1,
    isRequired: true,
    category: 'awareness'
  },
  {
    id: 'interest',
    name: 'Interest',
    description: 'Customer shows interest in specific services',
    order: 2,
    isRequired: true,
    category: 'awareness'
  },
  {
    id: 'consideration',
    name: 'Consideration',
    description: 'Customer considers our services vs competitors',
    order: 3,
    isRequired: true,
    category: 'consideration'
  },
  {
    id: 'intent',
    name: 'Intent',
    description: 'Customer shows strong purchase intent',
    order: 4,
    isRequired: true,
    category: 'consideration'
  },
  {
    id: 'conversion',
    name: 'Conversion',
    description: 'Customer completes booking or purchase',
    order: 5,
    isRequired: true,
    category: 'conversion'
  },
  {
    id: 'retention',
    name: 'Retention',
    description: 'Customer returns for additional services',
    order: 6,
    isRequired: false,
    category: 'retention'
  }
];

const CONVERSION_FUNNEL: FunnelStage[] = [
  {
    id: 'landing',
    name: 'Landing',
    order: 1,
    requiredEvents: ['page_view'],
    conversionGoal: 'service_view',
    dropOffReasons: ['high_bounce', 'slow_load', 'irrelevant_content']
  },
  {
    id: 'service_exploration',
    name: 'Service Exploration',
    order: 2,
    requiredEvents: ['service_view', 'click_event'],
    conversionGoal: 'pricing_check',
    dropOffReasons: ['unclear_pricing', 'too_expensive', 'lack_trust']
  },
  {
    id: 'pricing_review',
    name: 'Pricing Review',
    order: 3,
    requiredEvents: ['pricing_check', 'scroll_milestone'],
    conversionGoal: 'booking_start',
    dropOffReasons: ['price_shock', 'hidden_fees', 'comparison_shopping']
  },
  {
    id: 'booking_initiation',
    name: 'Booking Initiation',
    order: 4,
    requiredEvents: ['booking_start', 'form_interact'],
    conversionGoal: 'booking_completion',
    dropOffReasons: ['form_complexity', 'payment_issues', 'trust_concerns']
  },
  {
    id: 'booking_completion',
    name: 'Booking Completion',
    order: 5,
    requiredEvents: ['booking_completion', 'payment_success'],
    conversionGoal: 'customer_satisfaction',
    dropOffReasons: ['payment_failure', 'technical_error', 'last_minute_doubt']
  }
];

class JourneyAnalyticsService {
  private journeyCache: Map<string, CustomerJourneyMap> = new Map();
  private eventQueue: JourneyEvent[] = [];
  private isProcessing = false;
  private apiBaseUrl = '/api';

  constructor() {
    this.startEventProcessing();
  }

  /**
   * Track journey event
   */
  public trackJourneyEvent(event: Partial<JourneyEvent>): void {
    const journeyEvent: JourneyEvent = {
      id: this.generateEventId(),
      sessionId: event.sessionId || this.getSessionId(),
      fingerprintId: event.fingerprintId || this.getFingerprintId(),
      timestamp: new Date(),
      stageId: event.stageId || 'awareness',
      eventType: event.eventType || 'page_view',
      eventData: event.eventData || {},
      pageUrl: event.pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      referrer: event.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      deviceType: this.getDeviceType(),
      duration: event.duration,
      exitPoint: event.exitPoint || false,
      ...event
    };

    this.eventQueue.push(journeyEvent);
    this.updateJourneyMap(journeyEvent);
    this.sendEventToBackend(journeyEvent);
  }

  /**
   * Get current customer journey map
   */
  public getJourneyMap(sessionId: string): CustomerJourneyMap | null {
    return this.journeyCache.get(sessionId) || null;
  }

  /**
   * Get funnel analysis for date range
   */
  public async getFunnelAnalysis(
    startDate: Date,
    endDate: Date
  ): Promise<FunnelAnalysis[]> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(
        `${this.apiBaseUrl}/analytics/funnel-analysis?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch funnel analysis');
      }

      const data = await response.json();
      return data.funnelAnalysis || [];
    } catch (error) {
      console.error('Failed to fetch funnel analysis', error);
      return [];
    }
  }

  /**
   * Get customer journey analytics
   */
  public async getJourneyAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalJourneys: number;
    completedJourneys: number;
    averageJourneyDuration: number;
    topDropOffStages: Array<{
      stage: string;
      count: number;
      percentage: number;
    }>;
    conversionsByDevice: Record<string, number>;
    stageAnalysis: Array<{
      stageId: string;
      stageName: string;
      entries: number;
      completions: number;
      averageTime: number;
      dropOffRate: number;
      conversionRate: number;
    }>;
  }> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(
        `${this.apiBaseUrl}/analytics/journey-analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch journey analytics');
      }

      const data = await response.json();
      return data.journeyAnalytics;
    } catch (error) {
      console.error('Failed to fetch journey analytics', error);
      return {
        totalJourneys: 0,
        completedJourneys: 0,
        averageJourneyDuration: 0,
        topDropOffStages: [],
        conversionsByDevice: {},
        stageAnalysis: []
      };
    }
  }

  /**
   * Get real-time journey updates
   */
  public subscribeToJourneyUpdates(
    callback: (journey: CustomerJourneyMap) => void
  ): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const eventSource = new EventSource(`${this.apiBaseUrl}/analytics/journey-stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const journeyData = JSON.parse(event.data);
        callback(journeyData);
      } catch (error) {
        console.error('Failed to parse journey update', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Journey stream error', error);
    };

    return () => {
      eventSource.close();
    };
  }

  /**
   * Identify drop-off patterns
   */
  public async identifyDropOffPatterns(
    stageId: string,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    patterns: Array<{
      pattern: string;
      frequency: number;
      impact: number;
      recommendations: string[];
    }>;
    topReasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
  }> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(
        `${this.apiBaseUrl}/analytics/drop-off-patterns?stageId=${stageId}&timeframe=${timeframe}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch drop-off patterns');
      }

      const data = await response.json();
      return data.dropOffAnalysis;
    } catch (error) {
      console.error('Failed to fetch drop-off patterns', error);
      return {
        patterns: [],
        topReasons: []
      };
    }
  }

  /**
   * Get conversion optimization recommendations
   */
  public async getOptimizationRecommendations(): Promise<Array<{
    stageId: string;
    issue: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: number;
  }>> {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${this.apiBaseUrl}/analytics/optimization-recommendations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch optimization recommendations');
      }

      const data = await response.json();
      return data.recommendations || [];
    } catch (error) {
      console.error('Failed to fetch optimization recommendations', error);
      return [];
    }
  }

  /**
   * Private Methods
   */
  private updateJourneyMap(event: JourneyEvent): void {
    const sessionId = event.sessionId;
    let journey = this.journeyCache.get(sessionId);

    if (!journey) {
      journey = {
        journeyId: this.generateJourneyId(),
        sessionId,
        startTime: event.timestamp,
        totalDuration: 0,
        stages: JOURNEY_STAGES,
        events: [],
        currentStage: event.stageId,
        completedStages: [],
        conversionAchieved: false,
        touchpoints: 0,
        deviceSwitches: 0,
        channelSwitches: 0
      };
    }

    journey.events.push(event);
    journey.touchpoints++;
    journey.totalDuration = event.timestamp.getTime() - journey.startTime.getTime();

    // Update current stage
    if (event.stageId !== journey.currentStage) {
      if (!journey.completedStages.includes(journey.currentStage)) {
        journey.completedStages.push(journey.currentStage);
      }
      journey.currentStage = event.stageId;
    }

    // Check for conversion
    if (event.eventType === 'booking_completion' || event.eventType === 'payment_success') {
      journey.conversionAchieved = true;
      journey.endTime = event.timestamp;
    }

    // Check for drop-off
    if (event.exitPoint) {
      journey.droppedAtStage = event.stageId;
      journey.endTime = event.timestamp;
    }

    this.journeyCache.set(sessionId, journey);
  }

  private async sendEventToBackend(event: JourneyEvent): Promise<void> {
    try {
      const token = this.getAuthToken();
      await fetch(`${this.apiBaseUrl}/analytics/journey-events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send journey event to backend', error);
    }
  }

  private startEventProcessing(): void {
    if (this.isProcessing || typeof window === 'undefined') return;
    this.isProcessing = true;

    const processEvents = () => {
      if (this.eventQueue.length > 0) {
        const batchSize = 10;
        const batch = this.eventQueue.splice(0, batchSize);
        this.processBatch(batch);
      }
      setTimeout(processEvents, 1000);
    };

    processEvents();
  }

  private async processBatch(events: JourneyEvent[]): Promise<void> {
    try {
      const token = this.getAuthToken();
      await fetch(`${this.apiBaseUrl}/analytics/journey-events/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.error('Failed to process event batch', error);
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateJourneyId(): string {
    return `jny_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server_session';
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getFingerprintId(): string {
    if (typeof window === 'undefined') return 'unknown';
    return localStorage.getItem('device_fingerprint') || 'unknown';
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof navigator === 'undefined') return 'desktop';
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getAuthToken(): string {
    if (typeof window === 'undefined') return '';
    
    // Get token from localStorage (matching AuthContext pattern)
    try {
      const tokens = localStorage.getItem('revivatech_auth_tokens');
      if (tokens) {
        const parsedTokens = JSON.parse(tokens);
        return parsedTokens.accessToken || '';
      }
    } catch (error) {
      console.error('Error reading auth tokens:', error);
    }
    return '';
  }
}

// Export singleton instance
export const journeyAnalytics = new JourneyAnalyticsService();

// Export types and constants
export { JOURNEY_STAGES, CONVERSION_FUNNEL };
export type { JourneyStage, JourneyEvent, FunnelStage, FunnelAnalysis, CustomerJourneyMap };