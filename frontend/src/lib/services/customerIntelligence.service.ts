// Customer Intelligence Service with Browser Fingerprinting
// Privacy-compliant device identification and behavior tracking
import { PrismaClient } from '../../generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

// Types and interfaces
export interface DeviceFingerprint {
  id: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  vendor: string;
  cookieEnabled: boolean;
  doNotTrack: boolean;
  canvas?: string;
  webgl?: string;
  audio?: string;
  fonts?: string[];
  plugins?: string[];
  touchSupport: boolean;
  colorDepth: number;
  pixelRatio: number;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  confidence: number;
}

export interface BehaviorEvent {
  type: 'page_view' | 'click' | 'scroll' | 'form_focus' | 'form_submit' | 'exit_intent' | 'rage_click' | 'conversion';
  name: string;
  properties: Record<string, any>;
  timestamp: Date;
  pageUrl: string;
  referrer?: string;
}

export interface CustomerJourney {
  sessionId: string;
  customerId?: string;
  startTime: Date;
  endTime?: Date;
  touchpoints: TouchPoint[];
  source?: string;
  medium?: string;
  campaign?: string;
  conversion: boolean;
  conversionValue?: number;
}

export interface TouchPoint {
  timestamp: Date;
  page: string;
  action: string;
  value?: string;
  duration?: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  customerCount: number;
}

export interface SegmentCriteria {
  behaviors?: string[];
  demographics?: Record<string, any>;
  technographics?: Record<string, any>;
  transactional?: Record<string, any>;
  engagement?: Record<string, any>;
}

export interface CustomerScore {
  overall: number;
  engagement: number;
  conversion: number;
  loyalty: number;
  value: number;
  churn: number;
}

// Schema validation
const FingerprintSchema = z.object({
  userAgent: z.string(),
  screenResolution: z.string(),
  timezone: z.string(),
  language: z.string(),
  platform: z.string(),
  vendor: z.string(),
  cookieEnabled: z.boolean(),
  doNotTrack: z.boolean(),
  canvas: z.string().optional(),
  webgl: z.string().optional(),
  audio: z.string().optional(),
  fonts: z.array(z.string()).optional(),
  plugins: z.array(z.string()).optional(),
  touchSupport: z.boolean(),
  colorDepth: z.number(),
  pixelRatio: z.number(),
  hardwareConcurrency: z.number(),
  maxTouchPoints: z.number(),
});

const EventSchema = z.object({
  type: z.enum(['page_view', 'click', 'scroll', 'form_focus', 'form_submit', 'exit_intent', 'rage_click', 'conversion']),
  name: z.string(),
  properties: z.record(z.any()),
  pageUrl: z.string().url(),
  referrer: z.string().url().optional(),
});

class CustomerIntelligenceService {
  private sessionData = new Map<string, any>();
  private fingerprintCache = new Map<string, DeviceFingerprint>();
  
  constructor() {
    // Initialize cleanup interval
    setInterval(() => this.cleanupOldSessions(), 3600000); // 1 hour
    console.log('Customer Intelligence Service initialized');
  }

  // Generate device fingerprint
  public async generateFingerprint(rawData: any): Promise<DeviceFingerprint> {
    try {
      const validated = FingerprintSchema.parse(rawData);
      
      // Create fingerprint components
      const components = [
        validated.userAgent,
        validated.screenResolution,
        validated.timezone,
        validated.language,
        validated.platform,
        validated.vendor,
        validated.cookieEnabled.toString(),
        validated.touchSupport.toString(),
        validated.colorDepth.toString(),
        validated.pixelRatio.toString(),
        validated.hardwareConcurrency.toString(),
        validated.maxTouchPoints.toString(),
        validated.canvas || '',
        validated.webgl || '',
        validated.audio || '',
        (validated.fonts || []).join(','),
        (validated.plugins || []).join(','),
      ];

      // Generate hash-based fingerprint ID
      const fingerprintId = await this.hashFingerprint(components.join('|'));
      
      // Calculate confidence score
      const confidence = this.calculateFingerprintConfidence(validated);

      const fingerprint: DeviceFingerprint = {
        id: fingerprintId,
        ...validated,
        confidence,
      };

      // Cache fingerprint
      this.fingerprintCache.set(fingerprintId, fingerprint);

      // Store in database
      await this.storeFingerprint(fingerprint);

      return fingerprint;
    } catch (error) {
      console.error('Failed to generate fingerprint:', error);
      throw new Error('Fingerprint generation failed');
    }
  }

  // Track behavioral event
  public async trackEvent(
    sessionId: string,
    customerId: string | undefined,
    event: Omit<BehaviorEvent, 'timestamp'>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const validated = EventSchema.parse(event);
      
      const behaviorEvent: BehaviorEvent = {
        ...validated,
        timestamp: new Date(),
      };

      // Store in database
      await prisma.behavioralEvent.create({
        data: {
          sessionId,
          customerId,
          eventType: behaviorEvent.type,
          eventName: behaviorEvent.name,
          properties: behaviorEvent.properties,
          pageUrl: behaviorEvent.pageUrl,
          referrer: behaviorEvent.referrer,
          ipAddress,
          userAgent,
          timestamp: behaviorEvent.timestamp,
        },
      });

      // Update session data
      this.updateSessionData(sessionId, behaviorEvent);

      // Check for patterns and triggers
      await this.analyzeEventPatterns(sessionId, customerId, behaviorEvent);

      console.log(`Event tracked: ${event.type} - ${event.name} for session ${sessionId}`);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Identify customer by fingerprint and behavior
  public async identifyCustomer(
    fingerprint: DeviceFingerprint,
    sessionId: string,
    email?: string
  ): Promise<{
    customerId?: string;
    isNew: boolean;
    confidence: number;
    previousSessions: number;
  }> {
    try {
      // Look for existing customer by fingerprint
      const existing = await prisma.customerIntelligence.findFirst({
        where: {
          fingerprint: fingerprint.id,
        },
        include: {
          customer: true,
        },
      });

      let customerId: string | undefined;
      let isNew = true;
      let confidence = fingerprint.confidence;
      let previousSessions = 0;

      if (existing) {
        customerId = existing.customerId || undefined;
        isNew = false;
        previousSessions = await this.countCustomerSessions(existing.customerId);
        
        // Update intelligence record
        await prisma.customerIntelligence.update({
          where: { id: existing.id },
          data: {
            sessionId,
            lastActivity: new Date(),
            score: await this.calculateCustomerScore(existing.customerId),
          },
        });
      } else if (email) {
        // Try to match by email
        const customer = await prisma.customer.findUnique({
          where: { email },
        });

        if (customer) {
          customerId = customer.id;
          isNew = false;
          
          // Create new intelligence record linking fingerprint to customer
          await prisma.customerIntelligence.create({
            data: {
              customerId: customer.id,
              sessionId,
              fingerprint: fingerprint.id,
              ipAddress: '', // Would be passed from request
              userAgent: fingerprint.userAgent,
              events: [],
              score: await this.calculateCustomerScore(customer.id),
              lastActivity: new Date(),
            },
          });
        }
      }

      if (!customerId) {
        // Create anonymous intelligence record
        await prisma.customerIntelligence.create({
          data: {
            sessionId,
            fingerprint: fingerprint.id,
            ipAddress: '', // Would be passed from request
            userAgent: fingerprint.userAgent,
            events: [],
            lastActivity: new Date(),
          },
        });
      }

      return {
        customerId,
        isNew,
        confidence,
        previousSessions,
      };
    } catch (error) {
      console.error('Failed to identify customer:', error);
      return {
        isNew: true,
        confidence: 0,
        previousSessions: 0,
      };
    }
  }

  // Analyze customer journey
  public async analyzeJourney(sessionId: string): Promise<CustomerJourney | null> {
    try {
      const events = await prisma.behavioralEvent.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
      });

      if (events.length === 0) return null;

      const firstEvent = events[0];
      const lastEvent = events[events.length - 1];

      // Build touchpoints
      const touchpoints: TouchPoint[] = events.map((event, index) => {
        const nextEvent = events[index + 1];
        const duration = nextEvent 
          ? nextEvent.timestamp.getTime() - event.timestamp.getTime()
          : undefined;

        return {
          timestamp: event.timestamp,
          page: event.pageUrl,
          action: event.eventName,
          value: event.properties?.value,
          duration,
        };
      });

      // Detect conversion
      const conversion = events.some(e => e.eventType === 'conversion');
      const conversionEvent = events.find(e => e.eventType === 'conversion');
      const conversionValue = conversionEvent?.properties?.value;

      // Extract traffic source
      const { source, medium, campaign } = this.extractTrafficSource(firstEvent);

      const journey: CustomerJourney = {
        sessionId,
        customerId: firstEvent.customerId || undefined,
        startTime: firstEvent.timestamp,
        endTime: lastEvent.timestamp,
        touchpoints,
        source,
        medium,
        campaign,
        conversion,
        conversionValue,
      };

      // Store journey in database
      await prisma.customerJourney.create({
        data: {
          sessionId: journey.sessionId,
          customerId: journey.customerId,
          startTime: journey.startTime,
          endTime: journey.endTime,
          touchpoints: journey.touchpoints,
          source: journey.source,
          medium: journey.medium,
          campaign: journey.campaign,
          conversion: journey.conversion,
          conversionValue: journey.conversionValue,
        },
      });

      return journey;
    } catch (error) {
      console.error('Failed to analyze journey:', error);
      return null;
    }
  }

  // Calculate customer score
  public async calculateCustomerScore(customerId: string | null): Promise<number> {
    if (!customerId) return 0;

    try {
      const [customer, bookings, events, journeys] = await Promise.all([
        prisma.customer.findUnique({ where: { id: customerId } }),
        prisma.booking.findMany({ 
          where: { customerId },
          include: { payment: true },
        }),
        prisma.behavioralEvent.count({ where: { customerId } }),
        prisma.customerJourney.findMany({ 
          where: { customerId, conversion: true },
        }),
      ]);

      if (!customer) return 0;

      // Calculate score components
      const engagementScore = Math.min(events / 100, 1) * 25; // Max 25 points
      const conversionScore = journeys.length * 10; // 10 points per conversion
      const valueScore = Math.min(
        bookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0) / 1000,
        1
      ) * 25; // Max 25 points for £1000+ value
      const loyaltyScore = Math.min(bookings.length, 5) * 5; // Max 25 points for 5+ bookings
      const frequencyScore = this.calculateFrequencyScore(bookings); // Max 20 points

      const totalScore = Math.round(
        engagementScore + conversionScore + valueScore + loyaltyScore + frequencyScore
      );

      return Math.min(totalScore, 100);
    } catch (error) {
      console.error('Failed to calculate customer score:', error);
      return 0;
    }
  }

  // Predict customer behavior
  public async predictCustomerBehavior(customerId: string): Promise<{
    churnProbability: number;
    nextPurchaseProbability: number;
    lifetimeValue: number;
    recommendedActions: string[];
  }> {
    try {
      const [customer, bookings, events, intelligence] = await Promise.all([
        prisma.customer.findUnique({ where: { id: customerId } }),
        prisma.booking.findMany({ 
          where: { customerId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        prisma.behavioralEvent.findMany({
          where: { customerId },
          orderBy: { timestamp: 'desc' },
          take: 100,
        }),
        prisma.customerIntelligence.findFirst({
          where: { customerId },
        }),
      ]);

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Calculate churn probability
      const daysSinceLastActivity = intelligence?.lastActivity 
        ? Math.floor((Date.now() - intelligence.lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      const churnProbability = Math.min(daysSinceLastActivity / 90, 1); // 90+ days = high churn risk

      // Calculate next purchase probability
      const avgDaysBetweenPurchases = this.calculateAveragePurchaseInterval(bookings);
      const daysSinceLastPurchase = bookings.length > 0
        ? Math.floor((Date.now() - bookings[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      const nextPurchaseProbability = avgDaysBetweenPurchases > 0
        ? Math.max(0, 1 - (daysSinceLastPurchase / (avgDaysBetweenPurchases * 2)))
        : 0;

      // Calculate lifetime value
      const totalValue = bookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
      const avgOrderValue = bookings.length > 0 ? totalValue / bookings.length : 0;
      const lifetimeValue = avgOrderValue * this.predictFutureOrders(bookings);

      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(
        churnProbability,
        nextPurchaseProbability,
        intelligence?.score || 0,
        events
      );

      return {
        churnProbability,
        nextPurchaseProbability,
        lifetimeValue,
        recommendedActions,
      };
    } catch (error) {
      console.error('Failed to predict customer behavior:', error);
      return {
        churnProbability: 0,
        nextPurchaseProbability: 0,
        lifetimeValue: 0,
        recommendedActions: [],
      };
    }
  }

  // Segment customers
  public async segmentCustomers(): Promise<CustomerSegment[]> {
    try {
      // Define segments based on behavior and value
      const segments: CustomerSegment[] = [
        {
          id: 'high-value',
          name: 'High Value Customers',
          description: 'Customers with multiple high-value orders',
          criteria: {
            transactional: { totalValue: { gte: 500 }, orderCount: { gte: 3 } },
          },
          customerCount: 0,
        },
        {
          id: 'frequent',
          name: 'Frequent Customers',
          description: 'Regular customers with multiple bookings',
          criteria: {
            transactional: { orderCount: { gte: 5 } },
          },
          customerCount: 0,
        },
        {
          id: 'at-risk',
          name: 'At Risk Customers',
          description: 'Previously active customers with declining engagement',
          criteria: {
            engagement: { daysSinceLastActivity: { gte: 60 } },
          },
          customerCount: 0,
        },
        {
          id: 'new-prospects',
          name: 'New Prospects',
          description: 'Recent visitors with high engagement but no purchases',
          criteria: {
            behaviors: ['high-engagement'],
            transactional: { orderCount: 0 },
          },
          customerCount: 0,
        },
      ];

      // Calculate customer counts for each segment
      for (const segment of segments) {
        segment.customerCount = await this.countSegmentCustomers(segment.criteria);
      }

      return segments;
    } catch (error) {
      console.error('Failed to segment customers:', error);
      return [];
    }
  }

  // Helper methods
  private async hashFingerprint(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private calculateFingerprintConfidence(data: any): number {
    let confidence = 0;
    
    // Base components (essential)
    if (data.userAgent) confidence += 15;
    if (data.screenResolution) confidence += 10;
    if (data.timezone) confidence += 10;
    if (data.language) confidence += 5;
    if (data.platform) confidence += 5;
    
    // Enhanced components (optional but valuable)
    if (data.canvas) confidence += 20;
    if (data.webgl) confidence += 15;
    if (data.audio) confidence += 10;
    if (data.fonts && data.fonts.length > 0) confidence += 10;
    
    return Math.min(confidence, 100);
  }

  private async storeFingerprint(fingerprint: DeviceFingerprint): Promise<void> {
    try {
      await prisma.customerIntelligence.upsert({
        where: { fingerprint: fingerprint.id },
        create: {
          fingerprint: fingerprint.id,
          ipAddress: '', // Would be set from request
          userAgent: fingerprint.userAgent,
          events: {},
          lastActivity: new Date(),
        },
        update: {
          lastActivity: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to store fingerprint:', error);
    }
  }

  private updateSessionData(sessionId: string, event: BehaviorEvent): void {
    if (!this.sessionData.has(sessionId)) {
      this.sessionData.set(sessionId, {
        events: [],
        startTime: new Date(),
      });
    }
    
    const session = this.sessionData.get(sessionId);
    session.events.push(event);
    session.lastActivity = new Date();
  }

  private async analyzeEventPatterns(
    sessionId: string,
    customerId: string | undefined,
    event: BehaviorEvent
  ): Promise<void> {
    // Detect rage clicks
    if (event.type === 'click') {
      const recentClicks = await this.getRecentEvents(sessionId, 'click', 5000); // 5 seconds
      if (recentClicks.length >= 3) {
        await this.trackEvent(sessionId, customerId, {
          type: 'rage_click',
          name: 'rage_click_detected',
          properties: { location: event.properties.target },
          pageUrl: event.pageUrl,
        });
      }
    }

    // Detect exit intent
    if (event.type === 'scroll' && event.properties.direction === 'up' && event.properties.position < 0.1) {
      await this.trackEvent(sessionId, customerId, {
        type: 'exit_intent',
        name: 'exit_intent_detected',
        properties: {},
        pageUrl: event.pageUrl,
      });
    }
  }

  private async getRecentEvents(sessionId: string, type: string, timeWindow: number): Promise<any[]> {
    const since = new Date(Date.now() - timeWindow);
    return await prisma.behavioralEvent.findMany({
      where: {
        sessionId,
        eventType: type,
        timestamp: { gte: since },
      },
    });
  }

  private async countCustomerSessions(customerId: string | null): Promise<number> {
    if (!customerId) return 0;
    
    return await prisma.customerIntelligence.count({
      where: { customerId },
    });
  }

  private extractTrafficSource(event: any): { source?: string; medium?: string; campaign?: string } {
    const url = new URL(event.referrer || '');
    const params = new URLSearchParams(url.search);
    
    return {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
    };
  }

  private calculateFrequencyScore(bookings: any[]): number {
    if (bookings.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < bookings.length; i++) {
      const interval = bookings[i-1].createdAt.getTime() - bookings[i].createdAt.getTime();
      intervals.push(interval);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const days = avgInterval / (1000 * 60 * 60 * 24);
    
    // Score higher for more frequent customers
    if (days <= 30) return 20;
    if (days <= 60) return 15;
    if (days <= 90) return 10;
    if (days <= 180) return 5;
    return 0;
  }

  private calculateAveragePurchaseInterval(bookings: any[]): number {
    if (bookings.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < bookings.length; i++) {
      const interval = Math.abs(bookings[i-1].createdAt.getTime() - bookings[i].createdAt.getTime());
      intervals.push(interval);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    return Math.floor(avgInterval / (1000 * 60 * 60 * 24)); // Convert to days
  }

  private predictFutureOrders(bookings: any[]): number {
    // Simple prediction based on historical pattern
    if (bookings.length === 0) return 0;
    if (bookings.length === 1) return 2;
    
    const monthlyRate = bookings.length / 12; // Assume 12 month history
    return Math.round(monthlyRate * 24); // Predict next 24 months
  }

  private generateRecommendedActions(
    churnProbability: number,
    nextPurchaseProbability: number,
    score: number,
    events: any[]
  ): string[] {
    const actions: string[] = [];

    if (churnProbability > 0.7) {
      actions.push('Send re-engagement email campaign');
      actions.push('Offer special discount to retain customer');
    }

    if (nextPurchaseProbability > 0.6) {
      actions.push('Send targeted product recommendations');
      actions.push('Notify about new services');
    }

    if (score > 80) {
      actions.push('Invite to VIP program');
      actions.push('Send exclusive offers');
    }

    if (events.some(e => e.eventName === 'abandoned_cart')) {
      actions.push('Send cart abandonment reminder');
    }

    return actions;
  }

  private async countSegmentCustomers(criteria: SegmentCriteria): Promise<number> {
    // This would implement the actual segmentation logic
    // For now, return a placeholder
    return Math.floor(Math.random() * 100);
  }

  private cleanupOldSessions(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    for (const [sessionId, session] of this.sessionData.entries()) {
      if (session.lastActivity && session.lastActivity.getTime() < cutoff) {
        this.sessionData.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
export const customerIntelligenceService = new CustomerIntelligenceService();