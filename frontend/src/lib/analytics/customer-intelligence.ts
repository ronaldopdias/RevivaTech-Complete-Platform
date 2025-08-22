/**
 * Customer Intelligence Service
 * Orchestrates fingerprinting, behavioral tracking, and real-time analytics
 * Part of Phase 8 R1 implementation for RevivaTech
 */

import { CustomerFingerprintingService, type FingerprintData } from './fingerprinting';
import { BehavioralTrackingService, type BehavioralEvent } from './behavioral-tracking';

interface CustomerIntelligenceConfig {
  apiBaseUrl: string;
  enableFingerprinting: boolean;
  enableBehavioralTracking: boolean;
  enableRealtimeSync: boolean;
  consentRequired: boolean;
  debugMode: boolean;
  trackingConfig: {
    enableScrollTracking: boolean;
    enableClickHeatmaps: boolean;
    enableFormTracking: boolean;
    enableExitIntent: boolean;
    enableRageClicks: boolean;
    enablePerformanceTracking: boolean;
  };
}

interface CustomerProfile {
  fingerprint: string;
  sessionId: string;
  userId?: string;
  
  // Basic info
  firstSeen: number;
  lastSeen: number;
  totalSessions: number;
  currentSession: {
    startTime: number;
    duration: number;
    pageViews: number;
    events: number;
  };
  
  // Behavioral metrics
  engagement: {
    score: number;
    timeOnSite: number;
    pagesPerSession: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
  
  // Business metrics
  conversion: {
    leadScore: number;
    conversionProbability: number;
    totalBookings: number;
    totalValue: number;
    averageOrderValue: number;
  };
  
  // Risk assessment
  churnRisk: {
    score: number;
    daysSinceLastVisit: number;
    riskFactors: string[];
  };
  
  // Segmentation
  segment: string;
  traits: string[];
  preferences: {
    deviceType: string;
    communicationChannel: string;
    priceRange: string;
  };
  
  // Journey tracking
  journey: {
    currentStage: string;
    touchpoints: string[];
    conversionFunnel: {
      stage: string;
      completionRate: number;
    }[];
  };
}

interface RealtimeMetrics {
  activeUsers: number;
  activeSessions: number;
  eventsPerMinute: number;
  conversions: number;
  topPages: Array<{ url: string; views: number }>;
  deviceBreakdown: { [key: string]: number };
  trafficSources: { [key: string]: number };
}

interface CustomerInsight {
  type: 'behavior' | 'conversion' | 'risk' | 'opportunity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  data: Record<string, any>;
  actionable: boolean;
  actions?: Array<{
    type: string;
    title: string;
    description: string;
  }>;
}

class CustomerIntelligenceService {
  private config: CustomerIntelligenceConfig;
  private fingerprintingService: CustomerFingerprintingService;
  private behavioralTrackingService: BehavioralTrackingService;
  private customerProfile: CustomerProfile | null = null;
  private realtimeMetrics: RealtimeMetrics | null = null;
  private websocket: WebSocket | null = null;
  private isInitialized: boolean = false;

  constructor(config: Partial<CustomerIntelligenceConfig> = {}) {
    this.config = {
      apiBaseUrl: '/api/analytics',
      enableFingerprinting: true,
      enableBehavioralTracking: true,
      enableRealtimeSync: true,
      consentRequired: true,
      debugMode: false,
      trackingConfig: {
        enableScrollTracking: true,
        enableClickHeatmaps: true,
        enableFormTracking: true,
        enableExitIntent: true,
        enableRageClicks: true,
        enablePerformanceTracking: true,
      },
      ...config
    };

    // Initialize services
    this.fingerprintingService = new CustomerFingerprintingService({
      enableCanvasFingerprinting: this.config.enableFingerprinting,
      enableWebGLFingerprinting: this.config.enableFingerprinting,
      enableAudioFingerprinting: false, // Privacy-friendly default
      enableFontDetection: this.config.enableFingerprinting,
      respectDoNotTrack: true,
      consentRequired: this.config.consentRequired,
      fallbackToSession: true
    });

    this.behavioralTrackingService = new BehavioralTrackingService(
      this.fingerprintingService,
      {
        ...this.config.trackingConfig,
        apiEndpoint: `${this.config.apiBaseUrl}/events`,
        debugMode: this.config.debugMode
      }
    );
  }

  /**
   * Initialize customer intelligence system
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      if (this.config.debugMode) {
      }

      // Start fingerprinting
      if (this.config.enableFingerprinting) {
        await this.fingerprintingService.getFingerprint();
      }

      // Start behavioral tracking
      if (this.config.enableBehavioralTracking) {
        await this.behavioralTrackingService.startTracking();
      }

      // Load customer profile
      await this.loadCustomerProfile();

      // Start realtime sync
      if (this.config.enableRealtimeSync) {
        this.initializeRealtimeConnection();
      }

      // Track initialization
      await this.trackCustomEvent('customer_intelligence_init', 'Customer Intelligence Initialized', {
        fingerprinting_enabled: this.config.enableFingerprinting,
        behavioral_tracking_enabled: this.config.enableBehavioralTracking,
        realtime_sync_enabled: this.config.enableRealtimeSync
      });

      this.isInitialized = true;

      if (this.config.debugMode) {
        console.log('Customer Intelligence System initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize Customer Intelligence System:', error);
      throw error;
    }
  }

  /**
   * Track custom event
   */
  async trackCustomEvent(eventType: string, eventName: string, eventData: Record<string, any> = {}): Promise<void> {
    if (!this.config.enableBehavioralTracking) return;
    
    await this.behavioralTrackingService.trackEvent(eventType, eventName, eventData);
  }

  /**
   * Track business events
   */
  async trackBookingStarted(bookingData: { serviceType: string; deviceType: string; estimatedValue?: number }): Promise<void> {
    await this.trackCustomEvent('booking_started', 'Booking Process Started', {
      service_type: bookingData.serviceType,
      device_type: bookingData.deviceType,
      estimated_value: bookingData.estimatedValue,
      stage: 'consideration'
    });

    // Update journey stage
    await this.updateJourneyStage('conversion', 'booking_form');
  }

  async trackBookingCompleted(bookingData: { bookingId: string; serviceType: string; totalValue: number }): Promise<void> {
    await this.trackCustomEvent('booking_completed', 'Booking Completed', {
      booking_id: bookingData.bookingId,
      service_type: bookingData.serviceType,
      booking_value: bookingData.totalValue,
      stage: 'conversion'
    });

    // Update journey stage
    await this.updateJourneyStage('conversion', 'booking_complete');
  }

  async trackPriceCheck(priceData: { serviceType: string; deviceModel?: string; quotedPrice?: number }): Promise<void> {
    await this.trackCustomEvent('price_check', 'Price Check', {
      service_type: priceData.serviceType,
      device_model: priceData.deviceModel,
      quoted_price: priceData.quotedPrice,
      stage: 'consideration'
    });
  }

  async trackServiceComparison(comparisonData: { services: string[]; timeSpent: number }): Promise<void> {
    await this.trackCustomEvent('service_comparison', 'Service Comparison', {
      services_compared: comparisonData.services,
      comparison_time: comparisonData.timeSpent,
      service_count: comparisonData.services.length,
      stage: 'consideration'
    });
  }

  /**
   * Load customer profile from backend
   */
  async loadCustomerProfile(): Promise<CustomerProfile | null> {
    try {
      const fingerprint = await this.fingerprintingService.getFingerprint();
      
      const response = await fetch(`${this.config.apiBaseUrl}/insights/${fingerprint.deviceId}`, {
        headers: {
          'Authorization': 'Bearer admin-api-key' // TODO: Replace with proper auth
        }
      });

      if (response.ok) {
        const insights = await response.json();
        this.customerProfile = this.transformInsightsToProfile(insights.data);
        return this.customerProfile;
      } else if (response.status === 404) {
        // New customer - create basic profile
        this.customerProfile = await this.createNewCustomerProfile(fingerprint);
        return this.customerProfile;
      } else {
        throw new Error(`Failed to load customer profile: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading customer profile:', error);
      return null;
    }
  }

  /**
   * Get current customer profile
   */
  getCustomerProfile(): CustomerProfile | null {
    return this.customerProfile;
  }

  /**
   * Get customer insights
   */
  async getCustomerInsights(): Promise<CustomerInsight[]> {
    if (!this.customerProfile) {
      await this.loadCustomerProfile();
    }

    const insights: CustomerInsight[] = [];

    if (this.customerProfile) {
      // Engagement insights
      if (this.customerProfile.engagement.score < 30) {
        insights.push({
          type: 'behavior',
          priority: 'high',
          title: 'Low Engagement Detected',
          description: `Customer has low engagement score (${this.customerProfile.engagement.score}/100). Consider personalized outreach.`,
          data: { engagementScore: this.customerProfile.engagement.score },
          actionable: true,
          actions: [
            {
              type: 'email',
              title: 'Send Personalized Email',
              description: 'Send targeted content based on customer interests'
            },
            {
              type: 'discount',
              title: 'Offer Special Discount',
              description: 'Provide incentive to re-engage'
            }
          ]
        });
      }

      // Conversion insights
      if (this.customerProfile.conversion.leadScore > 75 && this.customerProfile.conversion.totalBookings === 0) {
        insights.push({
          type: 'opportunity',
          priority: 'high',
          title: 'High-Intent Customer',
          description: `Customer has high lead score (${this.customerProfile.conversion.leadScore}/100) but hasn't converted yet.`,
          data: { leadScore: this.customerProfile.conversion.leadScore },
          actionable: true,
          actions: [
            {
              type: 'call',
              title: 'Schedule Sales Call',
              description: 'Direct outreach to high-intent prospect'
            },
            {
              type: 'demo',
              title: 'Offer Free Assessment',
              description: 'Provide value to encourage conversion'
            }
          ]
        });
      }

      // Churn risk insights
      if (this.customerProfile.churnRisk.score > 60) {
        insights.push({
          type: 'risk',
          priority: 'medium',
          title: 'Churn Risk Detected',
          description: `Customer has high churn risk (${this.customerProfile.churnRisk.score}/100).`,
          data: { 
            churnScore: this.customerProfile.churnRisk.score,
            riskFactors: this.customerProfile.churnRisk.riskFactors
          },
          actionable: true,
          actions: [
            {
              type: 'retention',
              title: 'Launch Retention Campaign',
              description: 'Proactive outreach to prevent churn'
            }
          ]
        });
      }

      // Journey insights
      if (this.customerProfile.journey.currentStage === 'consideration' && 
          this.customerProfile.currentSession.duration > 300000) { // 5 minutes
        insights.push({
          type: 'behavior',
          priority: 'medium',
          title: 'Extended Consideration Phase',
          description: 'Customer spending significant time in consideration phase - may need assistance.',
          data: { 
            currentStage: this.customerProfile.journey.currentStage,
            sessionDuration: this.customerProfile.currentSession.duration
          },
          actionable: true,
          actions: [
            {
              type: 'chat',
              title: 'Offer Live Chat',
              description: 'Proactive chat support to assist decision'
            }
          ]
        });
      }
    }

    return insights;
  }

  /**
   * Initialize realtime WebSocket connection
   */
  private initializeRealtimeConnection(): void {
    try {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${this.config.apiBaseUrl}/ws`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        if (this.config.debugMode) {
          console.log('Realtime analytics connection established');
        }
        
        // Subscribe to realtime metrics
        this.websocket?.send(JSON.stringify({
          type: 'subscribe_realtime'
        }));
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeUpdate(data);
        } catch (error) {
          console.error('Error parsing realtime message:', error);
        }
      };

      this.websocket.onclose = () => {
        if (this.config.debugMode) {
          console.log('Realtime connection closed, attempting reconnect...');
        }
        
        // Reconnect after 5 seconds
        setTimeout(() => {
          if (this.config.enableRealtimeSync) {
            this.initializeRealtimeConnection();
          }
        }, 5000);
      };

      this.websocket.onerror = (error) => {
        console.error('Realtime connection error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize realtime connection:', error);
    }
  }

  /**
   * Handle realtime updates from WebSocket
   */
  private handleRealtimeUpdate(data: any): void {
    switch (data.type) {
      case 'realtime_metrics':
      case 'realtime_metrics_update':
        this.realtimeMetrics = data.data;
        break;
      case 'user_insights':
        if (data.fingerprint === this.customerProfile?.fingerprint) {
          this.customerProfile = this.transformInsightsToProfile(data.data);
        }
        break;
    }
  }

  /**
   * Update customer journey stage
   */
  private async updateJourneyStage(stage: string, touchpoint: string): Promise<void> {
    try {
      const fingerprint = await this.fingerprintingService.getFingerprint();
      
      await fetch(`${this.config.apiBaseUrl}/track/journey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_fingerprint: fingerprint.deviceId,
          session_id: fingerprint.sessionId,
          journey_stage: stage,
          touchpoint: touchpoint,
          time_spent_seconds: (Date.now() - (this.customerProfile?.currentSession.startTime || Date.now())) / 1000
        })
      });
    } catch (error) {
      console.error('Error updating journey stage:', error);
    }
  }

  /**
   * Transform backend insights to customer profile
   */
  private transformInsightsToProfile(insights: any): CustomerProfile {
    return {
      fingerprint: insights.profile?.fingerprint || '',
      sessionId: insights.profile?.sessionId || '',
      userId: insights.profile?.customerId,
      
      firstSeen: new Date(insights.profile?.firstSeen || Date.now()).getTime(),
      lastSeen: new Date(insights.profile?.lastSeen || Date.now()).getTime(),
      totalSessions: insights.profile?.totalSessions || 0,
      currentSession: {
        startTime: Date.now(),
        duration: 0,
        pageViews: 0,
        events: 0
      },
      
      engagement: {
        score: insights.scores?.engagement || 0,
        timeOnSite: insights.behavior?.avgSessionDuration || 0,
        pagesPerSession: insights.behavior?.pagesPerSession || 0,
        averageSessionDuration: insights.behavior?.avgSessionDuration || 0,
        bounceRate: insights.behavior?.bounceRate || 0
      },
      
      conversion: {
        leadScore: insights.scores?.lead || 0,
        conversionProbability: insights.scores?.conversionProbability || 0,
        totalBookings: insights.profile?.totalBookings || 0,
        totalValue: insights.profile?.totalValue || 0,
        averageOrderValue: (insights.profile?.totalValue || 0) / Math.max(1, insights.profile?.totalBookings || 1)
      },
      
      churnRisk: {
        score: insights.scores?.churnRisk || 0,
        daysSinceLastVisit: Math.floor((Date.now() - new Date(insights.profile?.lastSeen || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
        riskFactors: []
      },
      
      segment: insights.profile?.segment || 'Unknown',
      traits: [],
      preferences: {
        deviceType: insights.behavior?.preferredDevice || 'unknown',
        communicationChannel: 'email',
        priceRange: 'medium'
      },
      
      journey: {
        currentStage: insights.journey?.currentStage || 'awareness',
        touchpoints: insights.journey?.stages?.map((s: any) => s.journey_stage) || [],
        conversionFunnel: []
      }
    };
  }

  /**
   * Create new customer profile
   */
  private async createNewCustomerProfile(fingerprint: FingerprintData): Promise<CustomerProfile> {
    return {
      fingerprint: fingerprint.deviceId,
      sessionId: fingerprint.sessionId,
      
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      totalSessions: 1,
      currentSession: {
        startTime: Date.now(),
        duration: 0,
        pageViews: 1,
        events: 0
      },
      
      engagement: {
        score: 50, // Neutral starting score
        timeOnSite: 0,
        pagesPerSession: 1,
        averageSessionDuration: 0,
        bounceRate: 0
      },
      
      conversion: {
        leadScore: 25, // Low starting score for new visitors
        conversionProbability: 0.1,
        totalBookings: 0,
        totalValue: 0,
        averageOrderValue: 0
      },
      
      churnRisk: {
        score: 0, // No risk for new customers
        daysSinceLastVisit: 0,
        riskFactors: []
      },
      
      segment: 'New Visitor',
      traits: ['first_time_visitor'],
      preferences: {
        deviceType: fingerprint.characteristics.device.type,
        communicationChannel: 'email',
        priceRange: 'unknown'
      },
      
      journey: {
        currentStage: 'awareness',
        touchpoints: ['landing_page'],
        conversionFunnel: []
      }
    };
  }

  /**
   * Get realtime metrics
   */
  getRealtimeMetrics(): RealtimeMetrics | null {
    return this.realtimeMetrics;
  }

  /**
   * Clean up and stop tracking
   */
  async shutdown(): Promise<void> {
    if (this.config.enableBehavioralTracking) {
      this.behavioralTrackingService.stopTracking();
    }
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.isInitialized = false;
    
    if (this.config.debugMode) {
      console.log('Customer Intelligence System shut down');
    }
  }

  /**
   * Update consent preferences
   */
  async updateConsent(consentType: 'analytics' | 'fingerprinting' | 'marketing', granted: boolean): Promise<void> {
    await this.fingerprintingService.updateConsent(consentType, granted);
    
    // Re-initialize if analytics consent is granted
    if (consentType === 'analytics' && granted && !this.isInitialized) {
      await this.initialize();
    }
  }
}

export { 
  CustomerIntelligenceService, 
  type CustomerProfile, 
  type CustomerInsight, 
  type RealtimeMetrics,
  type CustomerIntelligenceConfig 
};