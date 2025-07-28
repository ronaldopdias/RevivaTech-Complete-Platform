/**
 * Customer Behavior Analytics Service
 * Tracks and analyzes customer interactions, patterns, and journey optimization
 */

export interface CustomerBehaviorEvent {
  id: string;
  customerId: string;
  sessionId: string;
  timestamp: number;
  eventType: 'page_view' | 'click' | 'form_interaction' | 'purchase' | 'search' | 'filter' | 'scroll' | 'hover';
  page: string;
  element?: string;
  value?: string | number;
  metadata: Record<string, any>;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
  customerCount: number;
  averageValue: number;
  conversionRate: number;
  retentionRate: number;
  characteristics: string[];
}

export interface CustomerJourney {
  customerId: string;
  stages: Array<{
    stage: string;
    timestamp: number;
    duration: number;
    actions: number;
    conversion: boolean;
    exitPoint?: string;
  }>;
  totalDuration: number;
  touchpoints: number;
  converted: boolean;
  conversionValue?: number;
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  customers: number;
  conversionRate: number;
  averageValue: number;
  description: string;
  examples: string[];
}

export interface CustomerInsight {
  type: 'opportunity' | 'risk' | 'behavior' | 'preference';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation?: string;
  affectedCustomers: number;
  potentialValue: number;
}

export interface BehaviorAnalysis {
  segments: CustomerSegment[];
  journeys: CustomerJourney[];
  patterns: BehaviorPattern[];
  insights: CustomerInsight[];
  metrics: {
    totalCustomers: number;
    activeCustomers: number;
    averageSessionDuration: number;
    averagePageViews: number;
    bounceRate: number;
    returnRate: number;
    conversionRate: number;
    customerLifetimeValue: number;
  };
}

class CustomerBehaviorAnalyticsService {
  private events: CustomerBehaviorEvent[] = [];
  private segments: CustomerSegment[] = [];
  private journeys: Map<string, CustomerJourney> = new Map();
  private patterns: BehaviorPattern[] = [];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Initialize with mock data for demonstration
    this.generateMockData();
    this.defineCustomerSegments();
    this.identifyBehaviorPatterns();
    
    // Set up real-time tracking
    if (typeof window !== 'undefined') {
      this.setupEventTracking();
    }
  }

  private generateMockData(): void {
    // Generate mock customer behavior events
    const customers = Array.from({ length: 100 }, (_, i) => `customer_${i + 1}`);
    const pages = ['/', '/book-repair', '/services', '/about', '/contact', '/login', '/dashboard'];
    const elements = ['hero-cta', 'service-card', 'book-button', 'contact-form', 'login-form'];

    for (let i = 0; i < 1000; i++) {
      const customerId = customers[Math.floor(Math.random() * customers.length)];
      const sessionId = `session_${Math.floor(Math.random() * 200)}`;
      const eventType = ['page_view', 'click', 'form_interaction', 'scroll', 'hover'][Math.floor(Math.random() * 5)] as CustomerBehaviorEvent['eventType'];
      const page = pages[Math.floor(Math.random() * pages.length)];
      const element = Math.random() > 0.5 ? elements[Math.floor(Math.random() * elements.length)] : undefined;

      this.events.push({
        id: `event_${i}`,
        customerId,
        sessionId,
        timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Last 30 days
        eventType,
        page,
        element,
        value: Math.random() > 0.7 ? Math.random() * 1000 : undefined,
        metadata: {
          userAgent: 'Mozilla/5.0...',
          deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
          referrer: Math.random() > 0.5 ? 'https://google.com' : 'direct'
        }
      });
    }

    // Generate customer journeys
    this.generateCustomerJourneys();
  }

  private generateCustomerJourneys(): void {
    const customerSessions = new Map<string, CustomerBehaviorEvent[]>();
    
    // Group events by customer
    this.events.forEach(event => {
      if (!customerSessions.has(event.customerId)) {
        customerSessions.set(event.customerId, []);
      }
      customerSessions.get(event.customerId)!.push(event);
    });

    // Create journeys
    customerSessions.forEach((events, customerId) => {
      const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
      const stages = this.identifyJourneyStages(sortedEvents);
      
      const journey: CustomerJourney = {
        customerId,
        stages,
        totalDuration: stages.length > 0 ? stages[stages.length - 1].timestamp - stages[0].timestamp : 0,
        touchpoints: stages.length,
        converted: stages.some(s => s.conversion),
        conversionValue: stages.find(s => s.conversion)?.timestamp
      };

      this.journeys.set(customerId, journey);
    });
  }

  private identifyJourneyStages(events: CustomerBehaviorEvent[]): CustomerJourney['stages'] {
    const stages: CustomerJourney['stages'] = [];
    const stageMap = {
      '/': 'awareness',
      '/services': 'consideration',
      '/book-repair': 'intent',
      '/login': 'engagement',
      '/dashboard': 'retention'
    };

    let currentStage = '';
    let stageStart = 0;
    let stageActions = 0;

    events.forEach(event => {
      const stage = stageMap[event.page as keyof typeof stageMap] || 'other';
      
      if (stage !== currentStage) {
        if (currentStage) {
          stages.push({
            stage: currentStage,
            timestamp: stageStart,
            duration: event.timestamp - stageStart,
            actions: stageActions,
            conversion: currentStage === 'intent' && Math.random() > 0.7,
            exitPoint: event.page
          });
        }
        currentStage = stage;
        stageStart = event.timestamp;
        stageActions = 0;
      }
      stageActions++;
    });

    // Add final stage
    if (currentStage) {
      stages.push({
        stage: currentStage,
        timestamp: stageStart,
        duration: Date.now() - stageStart,
        actions: stageActions,
        conversion: currentStage === 'intent' && Math.random() > 0.7
      });
    }

    return stages;
  }

  private defineCustomerSegments(): void {
    this.segments = [
      {
        id: 'high-value',
        name: 'High-Value Customers',
        description: 'Customers with high lifetime value and frequent purchases',
        criteria: { lifetimeValue: { min: 500 }, purchaseFrequency: { min: 3 } },
        customerCount: 15,
        averageValue: 750,
        conversionRate: 85,
        retentionRate: 92,
        characteristics: ['Multiple device repairs', 'Premium service preference', 'Quick decision makers']
      },
      {
        id: 'price-sensitive',
        name: 'Price-Sensitive Customers',
        description: 'Customers who prioritize cost-effectiveness',
        criteria: { averageOrderValue: { max: 100 }, priceComparisons: { min: 3 } },
        customerCount: 35,
        averageValue: 75,
        conversionRate: 45,
        retentionRate: 65,
        characteristics: ['Compare prices extensively', 'Seek discounts', 'Basic service preference']
      },
      {
        id: 'tech-savvy',
        name: 'Tech-Savvy Customers',
        description: 'Customers comfortable with technology and self-service',
        criteria: { onlineEngagement: { min: 10 }, selfServiceUsage: { min: 5 } },
        customerCount: 25,
        averageValue: 200,
        conversionRate: 72,
        retentionRate: 80,
        characteristics: ['Use online booking', 'Prefer digital communication', 'Research thoroughly']
      },
      {
        id: 'new-customers',
        name: 'New Customers',
        description: 'First-time customers within the last 30 days',
        criteria: { customerAge: { max: 30 }, purchaseCount: { max: 1 } },
        customerCount: 20,
        averageValue: 125,
        conversionRate: 35,
        retentionRate: 40,
        characteristics: ['Cautious buyers', 'Need reassurance', 'Value reviews and testimonials']
      },
      {
        id: 'loyal-customers',
        name: 'Loyal Customers',
        description: 'Long-term customers with consistent engagement',
        criteria: { customerAge: { min: 365 }, purchaseCount: { min: 3 } },
        customerCount: 30,
        averageValue: 300,
        conversionRate: 78,
        retentionRate: 88,
        characteristics: ['Trust the brand', 'Refer others', 'Open to upselling']
      }
    ];
  }

  private identifyBehaviorPatterns(): void {
    this.patterns = [
      {
        pattern: 'Mobile-first browsing',
        frequency: 65,
        customers: 65,
        conversionRate: 42,
        averageValue: 85,
        description: 'Customers primarily use mobile devices for browsing and booking',
        examples: ['Mobile page views > 80%', 'Mobile conversions', 'Touch interactions']
      },
      {
        pattern: 'Research-heavy journey',
        frequency: 45,
        customers: 45,
        conversionRate: 68,
        averageValue: 150,
        description: 'Customers spend significant time researching before making decisions',
        examples: ['Multiple service page visits', 'FAQ engagement', 'Review reading']
      },
      {
        pattern: 'Quick decision making',
        frequency: 25,
        customers: 25,
        conversionRate: 85,
        averageValue: 95,
        description: 'Customers make rapid purchase decisions with minimal browsing',
        examples: ['Single session conversions', 'Direct booking', 'Minimal page views']
      },
      {
        pattern: 'Comparison shopping',
        frequency: 55,
        customers: 55,
        conversionRate: 35,
        averageValue: 75,
        description: 'Customers actively compare services and prices',
        examples: ['Multiple service comparisons', 'Price checking', 'Feature evaluation']
      },
      {
        pattern: 'Social proof seeking',
        frequency: 70,
        customers: 70,
        conversionRate: 58,
        averageValue: 110,
        description: 'Customers rely heavily on reviews and testimonials',
        examples: ['Review page visits', 'Testimonial engagement', 'Rating interactions']
      }
    ];
  }

  private setupEventTracking(): void {
    // Track page views
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      // Track page change
    };

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        this.trackEvent('click', {
          element: target.id || target.className,
          text: target.textContent,
          href: target.getAttribute('href')
        });
      }
    });

    // Track form interactions
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        this.trackEvent('form_interaction', {
          field: target.name || target.id,
          type: target.type
        });
      }
    });

    // Track scroll behavior
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        this.trackEvent('scroll', { percentage: scrollPercentage });
      }, 100);
    });
  }

  /**
   * Track a customer behavior event
   */
  trackEvent(eventType: CustomerBehaviorEvent['eventType'], metadata: Record<string, any> = {}): void {
    const event: CustomerBehaviorEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId: this.getCurrentCustomerId(),
      sessionId: this.getCurrentSessionId(),
      timestamp: Date.now(),
      eventType,
      page: window.location.pathname,
      element: metadata.element,
      value: metadata.value,
      metadata: {
        userAgent: navigator.userAgent,
        deviceType: this.getDeviceType(),
        referrer: document.referrer,
        ...metadata
      }
    };

    this.events.push(event);
    this.updateCustomerJourney(event);
  }

  private getCurrentCustomerId(): string {
    return localStorage.getItem('customerId') || 'anonymous';
  }

  private getCurrentSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private updateCustomerJourney(event: CustomerBehaviorEvent): void {
    const journey = this.journeys.get(event.customerId);
    if (journey) {
      // Update existing journey
      // Implementation would update the journey stages
    } else {
      // Create new journey
      const newJourney: CustomerJourney = {
        customerId: event.customerId,
        stages: [],
        totalDuration: 0,
        touchpoints: 1,
        converted: false
      };
      this.journeys.set(event.customerId, newJourney);
    }
  }

  /**
   * Get comprehensive behavior analysis
   */
  getBehaviorAnalysis(): BehaviorAnalysis {
    const metrics = this.calculateBehaviorMetrics();
    const insights = this.generateInsights();

    return {
      segments: this.segments,
      journeys: Array.from(this.journeys.values()),
      patterns: this.patterns,
      insights,
      metrics
    };
  }

  private calculateBehaviorMetrics() {
    const totalCustomers = new Set(this.events.map(e => e.customerId)).size;
    const totalSessions = new Set(this.events.map(e => e.sessionId)).size;
    const pageViews = this.events.filter(e => e.eventType === 'page_view').length;
    const conversions = Array.from(this.journeys.values()).filter(j => j.converted).length;

    return {
      totalCustomers,
      activeCustomers: Math.floor(totalCustomers * 0.7),
      averageSessionDuration: 180000, // 3 minutes in ms
      averagePageViews: pageViews / totalSessions,
      bounceRate: 35,
      returnRate: 45,
      conversionRate: (conversions / totalCustomers) * 100,
      customerLifetimeValue: 250
    };
  }

  private generateInsights(): CustomerInsight[] {
    const insights: CustomerInsight[] = [];

    // High-value customer opportunity
    insights.push({
      type: 'opportunity',
      title: 'High-Value Customer Growth',
      description: 'High-value customers show 85% conversion rate and could be expanded',
      impact: 'high',
      actionable: true,
      recommendation: 'Create targeted campaigns for high-value customer acquisition',
      affectedCustomers: 15,
      potentialValue: 11250
    });

    // Mobile optimization opportunity
    insights.push({
      type: 'behavior',
      title: 'Mobile-First Behavior Dominance',
      description: '65% of customers primarily use mobile devices for browsing',
      impact: 'high',
      actionable: true,
      recommendation: 'Optimize mobile experience and implement mobile-specific features',
      affectedCustomers: 65,
      potentialValue: 5525
    });

    // Price sensitivity risk
    insights.push({
      type: 'risk',
      title: 'Price Sensitivity Impact',
      description: 'Price-sensitive customers have low conversion (45%) and retention (65%)',
      impact: 'medium',
      actionable: true,
      recommendation: 'Develop value-based pricing strategies and highlight service quality',
      affectedCustomers: 35,
      potentialValue: 2625
    });

    // Research pattern opportunity
    insights.push({
      type: 'preference',
      title: 'Research-Heavy Customer Preference',
      description: 'Customers who research extensively have 68% conversion rate',
      impact: 'medium',
      actionable: true,
      recommendation: 'Enhance educational content and comparison tools',
      affectedCustomers: 45,
      potentialValue: 6750
    });

    return insights;
  }

  /**
   * Get customer segments
   */
  getCustomerSegments(): CustomerSegment[] {
    return [...this.segments];
  }

  /**
   * Get behavior patterns
   */
  getBehaviorPatterns(): BehaviorPattern[] {
    return [...this.patterns];
  }

  /**
   * Get customer journey for specific customer
   */
  getCustomerJourney(customerId: string): CustomerJourney | null {
    return this.journeys.get(customerId) || null;
  }

  /**
   * Get all customer journeys
   */
  getAllCustomerJourneys(): CustomerJourney[] {
    return Array.from(this.journeys.values());
  }

  /**
   * Get events for specific customer
   */
  getCustomerEvents(customerId: string): CustomerBehaviorEvent[] {
    return this.events.filter(e => e.customerId === customerId);
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 50): CustomerBehaviorEvent[] {
    return this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Generate customer behavior report
   */
  generateBehaviorReport(): {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    data: BehaviorAnalysis;
  } {
    const analysis = this.getBehaviorAnalysis();
    
    return {
      summary: `Analysis of ${analysis.metrics.totalCustomers} customers reveals ${analysis.patterns.length} key behavior patterns with ${analysis.metrics.conversionRate.toFixed(1)}% overall conversion rate.`,
      keyFindings: [
        `Mobile-first behavior dominates with 65% of customers primarily using mobile devices`,
        `Research-heavy customers show 68% conversion rate, significantly above average`,
        `High-value customers represent 15% of base but contribute disproportionately to revenue`,
        `Price-sensitive customers (35%) have lower conversion and retention rates`
      ],
      recommendations: analysis.insights
        .filter(i => i.actionable)
        .map(i => i.recommendation || i.description),
      data: analysis
    };
  }
}

// Export singleton instance
export const customerBehaviorAnalytics = new CustomerBehaviorAnalyticsService();