# RevivaTech Unified Analytics & Intelligence System
## Comprehensive Product Requirements Document (PRD)

**Version**: 2.0 - Unified Implementation  
**Date**: July 16, 2025  
**Status**: Ready for Implementation  
**Project**: Complete Google/Facebook-Level Customer Analytics Platform

---

## 📋 Executive Summary

This unified PRD consolidates all analytics requirements from multiple sources into a comprehensive implementation plan for RevivaTech's advanced analytics and customer intelligence system. The document merges requirements from:

- Original comprehensive analytics PRD (`analytics-prd.md`)
- RevivaTech-specific Advanced Analytics Intelligence System PRD
- Analytics Implementation Todo List and progress tracking
- Current implementation analysis and gap assessment

### 🎯 **Business Objectives**

**Primary Goals:**
- **Complete Customer Intelligence**: Google/Facebook-level user tracking and behavioral analysis
- **Privacy-First Approach**: GDPR/CCPA compliant data collection and processing
- **Revenue Optimization**: ML-powered lead scoring, churn prediction, and conversion optimization
- **Marketing Intelligence**: Advanced attribution, campaign optimization, and automation
- **Real-time Insights**: Sub-500ms analytics processing with live dashboard updates

**Business Impact Targets:**
- **+35% conversion rate improvement** through behavioral optimization
- **+40% customer lifetime value increase** via predictive analytics
- **+300% marketing ROI** through intelligent targeting and automation
- **-25% customer churn reduction** with predictive intervention
- **£500,000+ annual revenue impact** from complete implementation

---

## 🏗️ Current State Analysis

### ✅ **Implemented Foundation (Excellent)**

**Business Intelligence Layer** (95% Complete):
- Revenue analytics with 30-day forecasting (85% accuracy)
- Customer behavior analytics with 5 distinct segments
- Real-time business metrics dashboard with 5-second updates
- Automated report generation with multi-format export
- Comprehensive KPI tracking and trend analysis
- Administrative analytics for operational decisions

**Technical Infrastructure** (90% Complete):
- PostgreSQL database with analytics schema
- Redis caching for real-time metrics
- Socket.io WebSocket real-time updates
- RESTful API endpoints for analytics data
- Component library with Nordic design system
- Docker containerized services

### ❌ **Missing Critical Components**

**Advanced User Tracking** (5% Complete):
- Browser fingerprinting and device identification
- Comprehensive session journey mapping
- Cross-domain customer tracking
- Behavioral event capture (scroll, click, form interactions)
- Exit-intent detection and intervention

**Privacy & Compliance** (10% Complete):
- GDPR/CCPA consent management system
- Data anonymization and retention policies
- Cookie-less tracking options
- Privacy preference center

**Machine Learning Intelligence** (20% Complete):
- Lead scoring algorithm with ML predictions
- Churn prediction with advance warnings
- Dynamic customer segmentation
- Personalization engine

**Marketing Intelligence** (15% Complete):
- Traffic source attribution and ROI analysis
- Campaign performance tracking
- Marketing automation triggers
- A/B testing framework

---

## 🎯 Complete System Requirements

### **Functional Requirements**

#### **FR1: Advanced User Tracking & Identification**
- **FR1.1**: Privacy-compliant browser fingerprinting using ThumbmarkJS
- **FR1.2**: Cross-domain customer journey tracking and mapping
- **FR1.3**: Comprehensive behavioral event capture (15+ event types)
- **FR1.4**: Session recording with privacy controls and anonymization
- **FR1.5**: Device detection and multi-device user attribution
- **FR1.6**: Real-time user scoring and intent classification

#### **FR2: Customer Intelligence & Machine Learning**
- **FR2.1**: Lead scoring algorithm with 80%+ prediction accuracy
- **FR2.2**: Customer segmentation using behavioral clustering (8-12 personas)
- **FR2.3**: Churn prediction with 72+ hour advance warning system
- **FR2.4**: Lifetime value prediction and optimization recommendations
- **FR2.5**: Real-time customer intent scoring and classification
- **FR2.6**: Predictive analytics for service recommendations

#### **FR3: Conversion Optimization & Personalization**
- **FR3.1**: Funnel analysis with precise drop-off point identification
- **FR3.2**: A/B testing framework for continuous optimization
- **FR3.3**: Dynamic pricing recommendations based on customer behavior
- **FR3.4**: Exit-intent detection with intervention strategies
- **FR3.5**: Personalized content and service recommendations
- **FR3.6**: Real-time experience optimization engine

#### **FR4: Marketing Intelligence & Attribution**
- **FR4.1**: Multi-touch attribution modeling across all channels
- **FR4.2**: Campaign performance tracking with real-time ROI metrics
- **FR4.3**: Automated audience creation for retargeting campaigns
- **FR4.4**: Customer acquisition cost optimization
- **FR4.5**: Marketing automation triggers based on behavioral patterns
- **FR4.6**: Cross-platform campaign synchronization

#### **FR5: Privacy & Compliance Management**
- **FR5.1**: GDPR/CCPA compliant consent management system
- **FR5.2**: Granular privacy controls with opt-in/opt-out capabilities
- **FR5.3**: Data anonymization and pseudonymization pipeline
- **FR5.4**: Right to erasure with automated data deletion
- **FR5.5**: Privacy audit trail and compliance reporting
- **FR5.6**: Cookie-less tracking alternatives for privacy-conscious users

#### **FR6: Data Analytics & Visualization**
- **FR6.1**: Real-time dashboard with live metrics and alerts
- **FR6.2**: Historical trend analysis with predictive insights
- **FR6.3**: Customer journey visualization and path analysis
- **FR6.4**: Cohort analysis for retention and engagement tracking
- **FR6.5**: Revenue attribution across all customer touchpoints
- **FR6.6**: Advanced data visualization with interactive reports

### **Non-Functional Requirements**

#### **NFR1: Performance & Scalability**
- **Event Processing Latency**: < 500ms for all analytics events
- **Dashboard Load Time**: < 2 seconds for all analytics views
- **Data Collection Rate**: > 95% of all user sessions tracked
- **System Uptime**: 99.9% availability with automated failover
- **Concurrent Users**: Support 10,000+ simultaneous sessions
- **Horizontal Scaling**: 10x growth support without architectural changes

#### **NFR2: Privacy & Security**
- **GDPR/CCPA Compliance**: 100% compliance with privacy regulations
- **Data Encryption**: End-to-end encryption for all sensitive data
- **Access Control**: Role-based access with audit logging
- **Data Retention**: Automated retention policies with secure deletion
- **Anonymization**: Privacy-by-design throughout the system
- **Security**: SOC 2 Type II compliance ready

#### **NFR3: Integration & Compatibility**
- **API Standards**: RESTful APIs with OpenAPI documentation
- **Real-time Communication**: WebSocket with fallback mechanisms
- **Third-party Integration**: Support for 10+ analytics and marketing tools
- **Data Portability**: Standard export formats (CSV, JSON, XML)
- **Browser Compatibility**: Support for 95%+ of web browsers
- **Mobile Optimization**: Full mobile and tablet compatibility

---

## 🛠️ Technical Architecture

### **Complete Technology Stack**

| Component | Primary Technology | Alternative | Implementation Status |
|-----------|-------------------|-------------|---------------------|
| **Core Analytics** | Custom TypeScript + PostgreSQL | PostHog Self-hosted | ✅ Custom Complete |
| **User Tracking** | ThumbmarkJS + Custom Events | FingerprintJS Pro | ❌ Not Implemented |
| **Session Recording** | PostHog + rrweb | Hotjar Self-hosted | ❌ Not Implemented |
| **Event Streaming** | Redis + Custom Queue | Apache Kafka | ✅ Redis Complete |
| **Machine Learning** | TensorFlow.js + Node.js | Python scikit-learn | 🟡 Basic Implementation |
| **Data Warehouse** | PostgreSQL + TimescaleDB | Snowflake/BigQuery | ✅ PostgreSQL Complete |
| **Caching Layer** | Redis | Memcached | ✅ Complete |
| **Real-time Updates** | Socket.io | WebSocket API | ✅ Complete |
| **Privacy Management** | Custom Consent System | OneTrust/Cookiebot | ❌ Not Implemented |
| **Marketing Automation** | Custom Triggers | Segment + Zapier | ❌ Not Implemented |

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend Tracking Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Analytics Dashboard Components                              │
│  ❌ ThumbmarkJS Fingerprinting • Event Listeners               │
│  ❌ PostHog SDK • Session Recording • Consent Management       │
│  ✅ Real-time WebSocket Updates                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                Analytics API Gateway                            │
├─────────────────────────────────────────────────────────────────┤
│  ✅ RESTful API Endpoints • Data Validation                    │
│  ✅ Authentication & Authorization                             │
│  ❌ Rate Limiting • Privacy Controls                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Event Processing Pipeline                          │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Redis Event Queue • Real-time Processing                   │
│  ✅ Business Intelligence • Data Aggregation                   │
│  ❌ ML Feature Extraction • Advanced Analytics                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Data Storage Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  ✅ PostgreSQL (Analytics + Business Data)                     │
│  ✅ Redis (Real-time Metrics + Caching)                        │
│  ❌ File Storage (Session Recordings)                          │
│  ❌ TimescaleDB (High-volume Time-series)                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Machine Learning Engine                            │
├─────────────────────────────────────────────────────────────────┤
│  🟡 Basic Customer Segmentation (5 segments)                   │
│  ❌ Advanced Lead Scoring • Churn Prediction                   │
│  ❌ LTV Optimization • Real-time Personalization               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                Analytics Dashboard                              │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Real-time Business Metrics • Revenue Analytics             │
│  ✅ Customer Intelligence • Operational Dashboards             │
│  ❌ Journey Visualization • Predictive Analytics               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Complete Implementation Plan

### **PHASE 1: Foundation Completion (1-2 days)**

#### **🔗 PHASE 1.5: Complete WebSocket Integration** 
**Status**: 🟡 **IMMEDIATE NEXT STEP**  
**Priority**: HIGH  
**Duration**: 1 day

**Objectives:**
- Remove simulation code from analyticsWebSocketService.ts
- Connect to real backend WebSocket endpoint
- Implement proper authentication and error handling

**Files to Modify:**
- `/opt/webapps/revivatech/frontend/src/services/analyticsWebSocketService.ts`

**Implementation:**
```typescript
// Remove all simulation methods
// Add real WebSocket connection
class AnalyticsWebSocketService {
  private ws: WebSocket | null = null;
  
  constructor() {
    this.connect();
    // REMOVE: this.simulateRealTimeData();
  }
  
  private connect(): void {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/api/analytics/ws`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('📊 Connected to analytics WebSocket');
      this.authenticate();
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealTimeUpdate(data);
    };
  }
}
```

**Success Criteria:**
- ✅ No simulation code remains
- ✅ Real WebSocket connection established
- ✅ Authentication working
- ✅ Error handling and reconnection logic

---

### **PHASE 2: Advanced User Tracking (9-11 days)**

#### **🔍 PHASE 2.1: Privacy-Compliant Browser Fingerprinting**
**Status**: 🟡 **READY TO START**  
**Priority**: HIGH  
**Duration**: 2 days

**Objectives:**
- Implement ThumbmarkJS for privacy-compliant device identification
- Create fingerprint storage and management system
- Build consent validation before fingerprinting

**Files to Create:**
```
/opt/webapps/revivatech/frontend/src/services/BrowserFingerprinting.ts
/opt/webapps/revivatech/frontend/src/components/privacy/ConsentManager.tsx
/opt/webapps/revivatech/frontend/src/hooks/useDeviceFingerprint.ts
```

**Implementation Details:**
```bash
# Install dependencies
npm install thumbmarkjs @types/thumbmarkjs

# Implementation structure
class BrowserFingerprinting {
  async generateFingerprint(): Promise<string>
  validateConsent(): boolean
  storeFingerprint(fingerprint: string): void
  getStoredFingerprint(): string | null
  createFallbackId(): string
}
```

**Technical Specifications:**
```typescript
// ThumbmarkJS Configuration
const fingerprint = await ThumbmarkJS.generate({
  exclude: ['fonts', 'audio'], // Privacy compliance
  includeScreenResolution: true,
  includeTimezone: true,
  includeLanguage: true,
  includePlatform: true,
  salt: 'revivatech-2025' // Consistent fingerprints
});
```

**Success Criteria:**
- ✅ Privacy-compliant fingerprints generated
- ✅ 95%+ device identification accuracy
- ✅ Fallback system for blocked fingerprinting
- ✅ GDPR consent validation before generation

---

#### **📊 PHASE 2.2: Comprehensive Event Tracking System**
**Status**: 🟡 **DEPENDENT ON 2.1**  
**Priority**: HIGH  
**Duration**: 3 days

**Objectives:**
- Implement comprehensive behavioral event tracking
- Create event queue and batch processing system
- Build real-time event streaming to backend

**Files to Create:**
```
/opt/webapps/revivatech/frontend/src/services/AdvancedAnalyticsTracker.ts
/opt/webapps/revivatech/frontend/src/types/analytics.ts
/opt/webapps/revivatech/frontend/src/utils/eventThrottling.ts
```

**Event Types to Track:**
```typescript
// Core Behavioral Events
enum EventType {
  // Navigation Events
  PAGE_VIEW = 'page_view',
  PAGE_UNLOAD = 'page_unload',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  
  // Interaction Events
  SCROLL_MILESTONE = 'scroll_milestone', // 25%, 50%, 75%, 100%
  CLICK_EVENT = 'click_event',
  RAGE_CLICK = 'rage_click', // 3+ clicks in 500ms
  FORM_FOCUS = 'form_focus',
  FORM_SUBMIT = 'form_submit',
  FORM_ABANDON = 'form_abandon',
  
  // Business Events
  SERVICE_VIEW = 'service_view',
  PRICING_CHECK = 'pricing_check',
  COMPARISON_VIEW = 'comparison_view',
  BOOKING_START = 'booking_start',
  BOOKING_ABANDON = 'booking_abandon',
  BOOKING_COMPLETE = 'booking_complete',
  CONTACT_VIEW = 'contact_view',
  QUOTE_REQUEST = 'quote_request',
  
  // Engagement Events
  EXIT_INTENT = 'exit_intent',
  RETURN_VISIT = 'return_visit',
  SEARCH_PERFORM = 'search_perform',
  FILTER_APPLY = 'filter_apply',
  REVIEW_READ = 'review_read',
  
  // Performance Events
  PAGE_PERFORMANCE = 'page_performance',
  API_RESPONSE = 'api_response',
  ERROR_OCCURRED = 'error_occurred',
}
```

**Event Capture Implementation:**
```typescript
class AdvancedAnalyticsTracker {
  private eventQueue: AnalyticsEvent[] = [];
  private fingerprint: string;
  private sessionId: string;
  
  // Event Listeners Setup
  private setupScrollTracking(): void {
    let maxScroll = 0;
    const milestones = [25, 50, 75, 100];
    const tracked = new Set<number>();
    
    const handleScroll = throttle(() => {
      const scrollPercent = this.calculateScrollPercent();
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        milestones.forEach(milestone => {
          if (scrollPercent >= milestone && !tracked.has(milestone)) {
            tracked.add(milestone);
            this.trackEvent(EventType.SCROLL_MILESTONE, {
              percentage: milestone,
              timeOnPage: Date.now() - this.sessionStart
            });
          }
        });
      }
    }, 1000);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
  
  private setupClickTracking(): void {
    let clickCount = 0;
    let lastClickTime = 0;
    
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const now = Date.now();
      
      // Rage click detection
      if (now - lastClickTime < 500) {
        clickCount++;
        if (clickCount >= 3) {
          this.trackEvent(EventType.RAGE_CLICK, {
            element: target.tagName,
            className: target.className,
            position: { x: event.pageX, y: event.pageY }
          });
        }
      } else {
        clickCount = 1;
      }
      lastClickTime = now;
      
      // Track specific interactions
      this.trackEvent(EventType.CLICK_EVENT, {
        element: target.tagName,
        text: target.textContent?.slice(0, 100),
        href: target.getAttribute('href'),
        dataTrack: target.getAttribute('data-track')
      });
    });
  }
  
  private setupExitIntentTracking(): void {
    document.addEventListener('mouseleave', (event) => {
      if (event.clientY <= 0) {
        this.trackEvent(EventType.EXIT_INTENT, {
          timeOnPage: Date.now() - this.sessionStart,
          scrollDepth: this.calculateScrollPercent(),
          pageViews: this.pageViewCount
        });
      }
    });
  }
}
```

**Success Criteria:**
- ✅ 15+ event types captured automatically
- ✅ < 100ms tracking overhead
- ✅ 95%+ event capture rate
- ✅ Real-time event streaming to backend

---

#### **🗺️ PHASE 2.3: Customer Journey Mapping & Visualization**
**Status**: 🟡 **DEPENDENT ON 2.2**  
**Priority**: HIGH  
**Duration**: 2-3 days

**Objectives:**
- Build complete customer journey visualization
- Implement funnel analysis with drop-off identification
- Create session flow analysis for UX optimization

**Files to Create:**
```
/opt/webapps/revivatech/frontend/src/components/analytics/CustomerJourneyMap.tsx
/opt/webapps/revivatech/frontend/src/components/analytics/ConversionFunnelAnalysis.tsx
/opt/webapps/revivatech/frontend/src/components/analytics/SessionFlowVisualization.tsx
/opt/webapps/revivatech/frontend/src/lib/services/journeyAnalytics.ts
```

**Journey Mapping Implementation:**
```typescript
interface CustomerJourney {
  sessionId: string;
  fingerprint: string;
  stages: JourneyStage[];
  totalDuration: number;
  conversionEvents: ConversionEvent[];
  dropOffPoint?: string;
  completionRate: number;
}

interface JourneyStage {
  stage: 'awareness' | 'interest' | 'consideration' | 'decision' | 'retention';
  touchpoints: Touchpoint[];
  duration: number;
  sequenceNumber: number;
  conversionProbability: number;
}

class CustomerJourneyAnalytics {
  async getJourneyMap(timeframe: string): Promise<CustomerJourney[]>
  async getConversionFunnel(): Promise<FunnelStage[]>
  async getDropOffAnalysis(): Promise<DropOffPoint[]>
  async getSessionFlow(): Promise<SessionPath[]>
}
```

**Visualization Components:**
```tsx
// Customer Journey Map Component
<CustomerJourneyMap
  timeframe="last-30-days"
  showDropoffs={true}
  highlightConversions={true}
  segment="all"
/>

// Conversion Funnel Analysis
<ConversionFunnelAnalysis
  stages={['awareness', 'interest', 'consideration', 'decision']}
  showRealTime={true}
  highlightBottlenecks={true}
/>

// Session Flow Visualization
<SessionFlowVisualization
  maxDepth={5}
  showBouncePoints={true}
  highlightConversionPaths={true}
/>
```

**Success Criteria:**
- ✅ Complete customer journey visibility
- ✅ Funnel drop-off points identified with 95% accuracy
- ✅ Real-time journey tracking
- ✅ Interactive visualization with drill-down capabilities

---

#### **🎥 PHASE 2.4: PostHog Integration for Session Recording**
**Status**: 🟡 **OPTIONAL ENHANCEMENT**  
**Priority**: MEDIUM  
**Duration**: 2-3 days

**Objectives:**
- Deploy self-hosted PostHog for session recording
- Implement privacy-compliant session replay
- Create heatmap collection and analysis

**Files to Create:**
```
/opt/webapps/revivatech/docker-compose.posthog.yml
/opt/webapps/revivatech/frontend/src/services/PostHogIntegration.ts
/opt/webapps/revivatech/frontend/src/components/analytics/SessionRecordings.tsx
/opt/webapps/revivatech/frontend/src/components/analytics/HeatmapAnalysis.tsx
```

**PostHog Configuration:**
```yaml
# docker-compose.posthog.yml
version: '3.8'
services:
  posthog:
    image: posthog/posthog:latest
    ports:
      - "8084:8000"
    environment:
      - SECRET_KEY=your-secret-key
      - DATABASE_URL=postgres://user:pass@postgres:5432/posthog
    volumes:
      - posthog-data:/opt/posthog
    networks:
      - revivatech-network
```

**PostHog Integration:**
```typescript
class PostHogIntegration {
  initialize(): void {
    posthog.init('your-api-key', {
      api_host: 'http://localhost:8084',
      privacy: {
        respect_dnt: true,
        mask_all_element_attributes: true,
        mask_all_text: true
      },
      session_recording: {
        record_canvas: false,
        record_cross_origin_iframes: false,
        block_class: 'ph-no-capture',
        mask_text_class: 'ph-mask'
      }
    });
  }
  
  trackEvent(event: string, properties: any): void {
    posthog.capture(event, properties);
  }
  
  startSessionRecording(): void {
    posthog.startSessionRecording();
  }
  
  stopSessionRecording(): void {
    posthog.stopSessionRecording();
  }
}
```

**Success Criteria:**
- ✅ PostHog deployed and operational
- ✅ Session recordings with privacy masking
- ✅ Heatmap data collection
- ✅ Integration with existing analytics pipeline

---

### **PHASE 3: Machine Learning & Intelligence (7-9 days)**

#### **🧠 PHASE 3.1: Advanced ML Models & Predictions**
**Status**: 🟡 **READY AFTER PHASE 2**  
**Priority**: HIGH  
**Duration**: 4-5 days

**Objectives:**
- Implement lead scoring algorithm with ML predictions
- Build churn prediction system with 72+ hour warnings
- Create dynamic customer segmentation with behavioral clustering

**Files to Create:**
```
/opt/webapps/revivatech/backend/services/MLService.js
/opt/webapps/revivatech/backend/models/LeadScoringModel.js
/opt/webapps/revivatech/backend/models/ChurnPredictionModel.js
/opt/webapps/revivatech/backend/models/CustomerSegmentationModel.js
/opt/webapps/revivatech/frontend/src/components/analytics/PredictiveAnalytics.tsx
```

**Lead Scoring Algorithm:**
```javascript
class LeadScoringModel {
  constructor() {
    this.features = [
      'total_page_views',
      'avg_session_duration', 
      'pages_per_session',
      'price_check_frequency',
      'service_comparison_count',
      'form_interactions',
      'return_visit_rate',
      'device_consistency',
      'time_of_day_pattern',
      'referrer_quality_score'
    ];
  }
  
  calculateScore(userProfile, events) {
    let score = 0;
    
    // Behavioral scoring (60 points)
    score += this.calculateBehavioralScore(userProfile);
    
    // Engagement scoring (30 points)
    score += this.calculateEngagementScore(events);
    
    // Intent scoring (10 points)
    score += this.calculateIntentScore(events);
    
    return Math.min(Math.round(score), 100);
  }
  
  calculateBehavioralScore(profile) {
    const {
      total_page_views,
      avg_session_duration,
      pages_per_session,
      return_visit_rate
    } = profile;
    
    let score = 0;
    
    // Page engagement (0-20 points)
    score += Math.min(total_page_views * 0.5, 20);
    
    // Session quality (0-20 points)  
    score += Math.min((avg_session_duration / 60) * 2, 20);
    
    // Depth engagement (0-15 points)
    score += Math.min(pages_per_session * 3, 15);
    
    // Loyalty indicator (0-5 points)
    score += Math.min(return_visit_rate * 10, 5);
    
    return score;
  }
}
```

**Churn Prediction Model:**
```javascript
class ChurnPredictionModel {
  constructor() {
    this.riskFactors = {
      days_since_last_visit: { weight: 0.3, threshold: 14 },
      session_frequency_decline: { weight: 0.25, threshold: 0.5 },
      engagement_score_drop: { weight: 0.2, threshold: 0.3 },
      support_ticket_increase: { weight: 0.15, threshold: 2 },
      negative_feedback: { weight: 0.1, threshold: 1 }
    };
  }
  
  predictChurnRisk(userProfile, recentActivity) {
    let riskScore = 0;
    
    Object.entries(this.riskFactors).forEach(([factor, config]) => {
      const value = this.extractFeatureValue(userProfile, recentActivity, factor);
      const normalizedRisk = this.normalizeRiskFactor(value, config);
      riskScore += normalizedRisk * config.weight;
    });
    
    const riskLevel = this.categorizeRisk(riskScore);
    const timeToChurn = this.estimateTimeToChurn(riskScore, userProfile);
    
    return {
      riskScore: Math.round(riskScore * 100),
      riskLevel,
      timeToChurn,
      interventionRecommendations: this.getInterventionStrategies(riskLevel)
    };
  }
  
  categorizeRisk(score) {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.2) return 'low';
    return 'very_low';
  }
  
  getInterventionStrategies(riskLevel) {
    const strategies = {
      critical: [
        'immediate_personal_outreach',
        'exclusive_discount_offer',
        'priority_support_upgrade'
      ],
      high: [
        'targeted_email_campaign',
        'loyalty_program_invitation',
        'service_improvement_survey'
      ],
      medium: [
        'engagement_content_series',
        'product_update_notifications',
        'community_invitation'
      ],
      low: [
        'routine_check_in',
        'value_demonstration',
        'referral_program_invitation'
      ]
    };
    
    return strategies[riskLevel] || [];
  }
}
```

**Dynamic Customer Segmentation:**
```javascript
class CustomerSegmentationModel {
  constructor() {
    this.segments = {
      'vip_customers': {
        criteria: {
          total_bookings: { min: 5 },
          lifetime_value: { min: 1000 },
          engagement_score: { min: 80 }
        },
        characteristics: 'High-value repeat customers with strong engagement',
        strategy: 'VIP treatment, loyalty rewards, exclusive access'
      },
      'high_intent_browsers': {
        criteria: {
          price_check_frequency: { min: 3 },
          service_comparison_count: { min: 2 },
          lead_score: { min: 70 },
          bookings: { max: 0 }
        },
        characteristics: 'Active researchers with high purchase intent',
        strategy: 'Targeted offers, limited-time discounts, sales outreach'
      },
      'price_sensitive': {
        criteria: {
          price_check_frequency: { min: 5 },
          comparison_shopping_rate: { min: 0.8 },
          booking_conversion_rate: { max: 0.1 }
        },
        characteristics: 'Cost-conscious customers who compare extensively',
        strategy: 'Value propositions, price matching, budget options'
      },
      'technical_enthusiasts': {
        criteria: {
          technical_page_views: { min: 10 },
          detailed_service_views: { min: 5 },
          specification_downloads: { min: 1 }
        },
        characteristics: 'Technical users interested in detailed information',
        strategy: 'Technical content, detailed specifications, expert consultations'
      },
      'mobile_first_users': {
        criteria: {
          mobile_usage_rate: { min: 0.8 },
          mobile_booking_attempts: { min: 1 }
        },
        characteristics: 'Primarily mobile users with mobile-optimized needs',
        strategy: 'Mobile-first experiences, app promotions, mobile support'
      },
      'quick_converters': {
        criteria: {
          avg_decision_time: { max: 1800 }, // 30 minutes
          booking_conversion_rate: { min: 0.5 },
          pages_per_session: { max: 5 }
        },
        characteristics: 'Fast decision makers with clear needs',
        strategy: 'Streamlined processes, quick booking, immediate availability'
      },
      'window_shoppers': {
        criteria: {
          total_sessions: { min: 3 },
          avg_session_duration: { max: 120 },
          bounce_rate: { min: 0.7 }
        },
        characteristics: 'Casual browsers with low commitment',
        strategy: 'Engaging content, retargeting, educational materials'
      },
      'returning_prospects': {
        criteria: {
          return_visit_count: { min: 3 },
          days_between_visits: { max: 30 },
          bookings: { max: 0 }
        },
        characteristics: 'Interested prospects who need nurturing',
        strategy: 'Progressive engagement, trust building, social proof'
      }
    };
  }
  
  segmentUser(userProfile, behaviorData) {
    const matchedSegments = [];
    
    Object.entries(this.segments).forEach(([segmentName, segment]) => {
      const matchScore = this.calculateSegmentMatch(userProfile, behaviorData, segment.criteria);
      if (matchScore >= 0.7) {
        matchedSegments.push({
          segment: segmentName,
          confidence: matchScore,
          characteristics: segment.characteristics,
          strategy: segment.strategy
        });
      }
    });
    
    // Sort by confidence and return primary segment
    matchedSegments.sort((a, b) => b.confidence - a.confidence);
    
    return {
      primarySegment: matchedSegments[0] || this.getDefaultSegment(),
      allMatches: matchedSegments,
      segmentationDate: new Date().toISOString()
    };
  }
}
```

**Success Criteria:**
- ✅ Lead scoring accuracy > 80%
- ✅ Churn prediction with 72+ hour advance warning
- ✅ 8-12 distinct customer segments identified
- ✅ Real-time ML scoring under 100ms latency

---

#### **📧 PHASE 3.2: Marketing Automation & Triggers**
**Status**: 🟡 **DEPENDENT ON 3.1**  
**Priority**: HIGH  
**Duration**: 3-4 days

**Objectives:**
- Create event-driven marketing automation system
- Implement behavioral triggers for customer engagement
- Build dynamic audience creation and synchronization

**Files to Create:**
```
/opt/webapps/revivatech/backend/services/MarketingAutomation.js
/opt/webapps/revivatech/backend/services/AudienceBuilder.js
/opt/webapps/revivatech/backend/services/PersonalizationEngine.js
/opt/webapps/revivatech/frontend/src/components/analytics/MarketingDashboard.tsx
```

**Marketing Automation Triggers:**
```javascript
class MarketingAutomation {
  constructor() {
    this.triggers = {
      // Abandonment Triggers
      'booking_abandoned': {
        condition: (event) => event.type === 'booking_abandon',
        delay: '1_hour',
        action: 'send_abandonment_email',
        personalization: ['service_name', 'estimated_price', 'discount_offer'],
        maxFrequency: '1_per_week'
      },
      
      'cart_abandoned': {
        condition: (event) => event.type === 'form_abandon' && event.data.form_type === 'booking',
        delay: '30_minutes',
        action: 'show_exit_intent_offer',
        personalization: ['selected_services', 'time_spent'],
        maxFrequency: '1_per_session'
      },
      
      // Engagement Triggers
      'high_engagement_no_conversion': {
        condition: (user) => user.leadScore > 80 && user.totalBookings === 0,
        delay: '24_hours',
        action: 'send_personalized_offer',
        personalization: ['viewed_services', 'engagement_level', 'special_discount'],
        maxFrequency: '1_per_month'
      },
      
      'repeat_visitor_no_booking': {
        condition: (user) => user.returnVisits >= 3 && user.totalBookings === 0,
        delay: '12_hours',
        action: 'trigger_consultation_offer',
        personalization: ['visit_history', 'areas_of_interest'],
        maxFrequency: '1_per_2_weeks'
      },
      
      // Retention Triggers
      'customer_inactive': {
        condition: (user) => user.daysSinceLastVisit > 30 && user.totalBookings > 0,
        delay: 'immediate',
        action: 'start_winback_campaign',
        personalization: ['past_services', 'loyalty_status', 'exclusive_offer'],
        maxFrequency: '1_per_quarter'
      },
      
      'service_completed': {
        condition: (event) => event.type === 'service_completed',
        delay: '7_days',
        action: 'send_follow_up_survey',
        personalization: ['completed_service', 'technician_name', 'related_services'],
        maxFrequency: '1_per_service'
      },
      
      // Cross-sell Triggers
      'complementary_service_recommendation': {
        condition: (event) => event.type === 'service_booked',
        delay: '3_days',
        action: 'recommend_related_services',
        personalization: ['booked_service', 'complementary_services', 'bundle_discount'],
        maxFrequency: '1_per_booking'
      },
      
      // Urgency Triggers
      'price_check_multiple': {
        condition: (user) => user.priceCheckFrequency > 5 && user.lastPriceCheck < 24, // hours
        delay: '2_hours',
        action: 'show_limited_time_offer',
        personalization: ['checked_services', 'urgency_discount'],
        maxFrequency: '1_per_week'
      }
    };
    
    this.audiences = new Map();
    this.scheduledTriggers = new Map();
  }
  
  async processTrigger(eventData, userProfile) {
    for (const [triggerName, trigger] of Object.entries(this.triggers)) {
      if (await this.evaluateTriggerCondition(trigger, eventData, userProfile)) {
        await this.scheduleTriggerAction(triggerName, trigger, userProfile);
      }
    }
  }
  
  async scheduleTriggerAction(triggerName, trigger, userProfile) {
    // Check frequency limits
    if (await this.checkFrequencyLimit(triggerName, userProfile, trigger.maxFrequency)) {
      return; // Skip if frequency limit exceeded
    }
    
    const scheduledTime = this.calculateDelay(trigger.delay);
    const personalizationData = await this.generatePersonalization(
      userProfile,
      trigger.personalization
    );
    
    const triggerJob = {
      id: `${triggerName}_${userProfile.fingerprint}_${Date.now()}`,
      triggerName,
      action: trigger.action,
      userProfile,
      personalizationData,
      scheduledFor: scheduledTime,
      status: 'scheduled'
    };
    
    // Store in database for processing
    await this.storeTriggerJob(triggerJob);
    
    // Schedule execution
    setTimeout(async () => {
      await this.executeTriggerAction(triggerJob);
    }, scheduledTime - Date.now());
  }
  
  async executeTriggerAction(triggerJob) {
    try {
      switch (triggerJob.action) {
        case 'send_abandonment_email':
          await this.sendAbandonmentEmail(triggerJob);
          break;
        case 'show_exit_intent_offer':
          await this.showExitIntentOffer(triggerJob);
          break;
        case 'send_personalized_offer':
          await this.sendPersonalizedOffer(triggerJob);
          break;
        case 'start_winback_campaign':
          await this.startWinbackCampaign(triggerJob);
          break;
        default:
          console.warn(`Unknown trigger action: ${triggerJob.action}`);
      }
      
      // Mark as executed
      await this.markTriggerExecuted(triggerJob.id);
      
    } catch (error) {
      console.error(`Failed to execute trigger ${triggerJob.id}:`, error);
      await this.markTriggerFailed(triggerJob.id, error.message);
    }
  }
}
```

**Dynamic Audience Builder:**
```javascript
class AudienceBuilder {
  constructor(dataWarehouse) {
    this.dwh = dataWarehouse;
  }
  
  async createBehavioralAudiences() {
    const audiences = {
      'high_intent_visitors': {
        query: `
          SELECT DISTINCT fingerprint
          FROM user_behavior_profiles ubp
          JOIN ml_predictions mp ON ubp.fingerprint = mp.fingerprint
          WHERE mp.model_type = 'lead_scoring'
            AND mp.prediction_value > 70
            AND ubp.total_bookings = 0
            AND ubp.last_seen_at > NOW() - INTERVAL '7 days'
        `,
        description: 'Users with high purchase intent but no bookings',
        refreshFrequency: 'daily'
      },
      
      'abandoned_booking_users': {
        query: `
          SELECT DISTINCT ae.user_fingerprint as fingerprint
          FROM analytics_events ae
          WHERE ae.event_type = 'booking_abandon'
            AND ae.created_at > NOW() - INTERVAL '7 days'
            AND NOT EXISTS (
              SELECT 1 FROM analytics_events ae2
              WHERE ae2.user_fingerprint = ae.user_fingerprint
                AND ae2.event_type = 'booking_complete'
                AND ae2.created_at > ae.created_at
            )
        `,
        description: 'Users who started but didn\'t complete booking process',
        refreshFrequency: 'hourly'
      },
      
      'price_sensitive_segment': {
        query: `
          SELECT DISTINCT fingerprint
          FROM user_behavior_profiles
          WHERE price_check_frequency > (
            SELECT AVG(price_check_frequency) * 2 
            FROM user_behavior_profiles
          )
          AND booking_conversion_rate < 0.1
        `,
        description: 'Price-conscious users who compare extensively',
        refreshFrequency: 'daily'
      },
      
      'vip_customers': {
        query: `
          SELECT DISTINCT fingerprint
          FROM user_behavior_profiles
          WHERE total_bookings >= 3
            AND lifetime_value >= 500
            AND customer_segment = 'VIP'
        `,
        description: 'High-value repeat customers',
        refreshFrequency: 'weekly'
      },
      
      'churn_risk_customers': {
        query: `
          SELECT DISTINCT mp.fingerprint
          FROM ml_predictions mp
          JOIN user_behavior_profiles ubp ON mp.fingerprint = ubp.fingerprint
          WHERE mp.model_type = 'churn_prediction'
            AND mp.prediction_value > 0.6
            AND ubp.total_bookings > 0
        `,
        description: 'Existing customers at risk of churning',
        refreshFrequency: 'daily'
      }
    };
    
    // Create and refresh audiences
    for (const [audienceName, audience] of Object.entries(audiences)) {
      await this.refreshAudience(audienceName, audience);
    }
  }
  
  async refreshAudience(audienceName, audience) {
    try {
      const userIds = await this.dwh.query(audience.query);
      
      // Store audience in database
      await this.storeAudience(audienceName, userIds, audience.description);
      
      // Sync to marketing platforms
      await this.syncToMarketingPlatforms(audienceName, userIds);
      
      console.log(`📊 Audience ${audienceName} refreshed: ${userIds.length} users`);
      
    } catch (error) {
      console.error(`Failed to refresh audience ${audienceName}:`, error);
    }
  }
  
  async syncToMarketingPlatforms(audienceName, userIds) {
    // Google Ads Customer Match
    await this.syncToGoogleAds(audienceName, userIds);
    
    // Facebook Custom Audiences  
    await this.syncToFacebook(audienceName, userIds);
    
    // Email marketing platforms
    await this.syncToEmailPlatform(audienceName, userIds);
    
    // Retargeting platforms
    await this.syncToRetargetingPlatforms(audienceName, userIds);
  }
}
```

**Success Criteria:**
- ✅ Event-driven triggers fire within 500ms
- ✅ Personalized content increases engagement by 25%
- ✅ Dynamic audiences sync to marketing platforms
- ✅ Trigger frequency limits respected

---

### **PHASE 4: Privacy & Performance Optimization (6-8 days)**

#### **🛡️ PHASE 4.1: GDPR/CCPA Compliance Framework**
**Status**: 🟡 **CRITICAL PRIORITY**  
**Priority**: CRITICAL  
**Duration**: 3-4 days

**Objectives:**
- Implement comprehensive GDPR/CCPA compliance system
- Create granular consent management with opt-in/opt-out controls
- Build data subject rights portal with automated data deletion

**Files to Create:**
```
/opt/webapps/revivatech/frontend/src/components/privacy/ConsentBanner.tsx
/opt/webapps/revivatech/frontend/src/components/privacy/PrivacyPreferenceCenter.tsx
/opt/webapps/revivatech/frontend/src/components/privacy/DataSubjectRights.tsx
/opt/webapps/revivatech/backend/services/PrivacyService.js
/opt/webapps/revivatech/backend/middleware/PrivacyMiddleware.js
/opt/webapps/revivatech/backend/services/DataRetentionService.js
```

**Consent Management System:**
```typescript
interface ConsentPreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  sessionRecording: boolean;
  thirdPartyIntegrations: boolean;
}

class ConsentManager {
  private preferences: ConsentPreferences;
  private consentVersion: string = '2025.1';
  
  constructor() {
    this.loadStoredConsent();
  }
  
  showConsentBanner(): void {
    // Show GDPR-compliant consent banner
    const banner = new ConsentBanner({
      version: this.consentVersion,
      onAccept: (preferences) => this.updateConsent(preferences),
      onReject: () => this.updateConsent({ necessary: true }),
      onCustomize: () => this.showPreferenceCenter(),
      privacyPolicyUrl: '/privacy-policy',
      cookiePolicyUrl: '/cookie-policy'
    });
    
    banner.render();
  }
  
  updateConsent(preferences: Partial<ConsentPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    
    // Store consent with timestamp and version
    const consentRecord = {
      preferences: this.preferences,
      timestamp: new Date().toISOString(),
      version: this.consentVersion,
      userAgent: navigator.userAgent,
      ipAddress: this.getClientIP()
    };
    
    localStorage.setItem('consent_record', JSON.stringify(consentRecord));
    
    // Send to backend for audit trail
    this.storeConsentAuditTrail(consentRecord);
    
    // Apply consent settings
    this.applyConsentSettings();
  }
  
  applyConsentSettings(): void {
    // Analytics consent
    if (!this.hasConsent('analytics')) {
      this.disableAnalyticsTracking();
    } else {
      this.enableAnalyticsTracking();
    }
    
    // Marketing consent
    if (!this.hasConsent('marketing')) {
      this.disableMarketingTracking();
      this.clearMarketingCookies();
    }
    
    // Session recording consent
    if (!this.hasConsent('sessionRecording')) {
      this.disableSessionRecording();
    }
    
    // Third-party integrations
    if (!this.hasConsent('thirdPartyIntegrations')) {
      this.disableThirdPartyIntegrations();
    }
  }
  
  hasConsent(category: keyof ConsentPreferences): boolean {
    return this.preferences[category] === true;
  }
}
```

**Data Subject Rights Portal:**
```typescript
class DataSubjectRights {
  async requestDataExport(userIdentifier: string): Promise<DataExport> {
    // Compile all user data
    const userData = await this.compileUserData(userIdentifier);
    
    const exportData = {
      personalData: userData.profile,
      analyticsEvents: userData.events,
      behaviorProfile: userData.behavior,
      mlPredictions: userData.predictions,
      consentHistory: userData.consents,
      exportDate: new Date().toISOString(),
      retentionPeriod: this.calculateRetentionPeriod(userData)
    };
    
    // Create downloadable package
    return this.createExportPackage(exportData);
  }
  
  async requestDataDeletion(userIdentifier: string): Promise<DeletionResult> {
    // Anonymize instead of delete for compliance
    const deletionResult = await this.anonymizeUserData(userIdentifier);
    
    // Log deletion request for audit
    await this.logDeletionRequest({
      userIdentifier,
      requestDate: new Date().toISOString(),
      method: 'anonymization',
      affectedRecords: deletionResult.recordCount
    });
    
    return deletionResult;
  }
  
  async requestDataCorrection(userIdentifier: string, corrections: any): Promise<CorrectionResult> {
    // Validate correction request
    const validatedCorrections = await this.validateCorrections(corrections);
    
    // Apply corrections
    const correctionResult = await this.applyCorrections(userIdentifier, validatedCorrections);
    
    // Log for audit trail
    await this.logDataCorrection({
      userIdentifier,
      corrections: validatedCorrections,
      correctionDate: new Date().toISOString()
    });
    
    return correctionResult;
  }
}
```

**Data Retention Service:**
```javascript
class DataRetentionService {
  constructor() {
    this.retentionPolicies = {
      analytics_events: { period: '2_years', anonymizeAfter: '6_months' },
      user_behavior_profiles: { period: '3_years', anonymizeAfter: '1_year' },
      session_recordings: { period: '90_days', anonymizeAfter: 'immediate' },
      ml_predictions: { period: '5_years', anonymizeAfter: '2_years' },
      marketing_data: { period: '1_year', anonymizeAfter: '6_months' }
    };
  }
  
  async enforceRetentionPolicies(): Promise<void> {
    for (const [dataType, policy] of Object.entries(this.retentionPolicies)) {
      await this.processRetentionPolicy(dataType, policy);
    }
  }
  
  async processRetentionPolicy(dataType, policy): Promise<void> {
    const deletionDate = this.calculateDeletionDate(policy.period);
    const anonymizationDate = this.calculateAnonymizationDate(policy.anonymizeAfter);
    
    // Delete expired data
    await this.deleteExpiredData(dataType, deletionDate);
    
    // Anonymize data that should be anonymized
    await this.anonymizeData(dataType, anonymizationDate);
    
    console.log(`🗑️ Retention policy enforced for ${dataType}`);
  }
}
```

**Success Criteria:**
- ✅ 100% GDPR/CCPA compliance
- ✅ Granular consent controls functional
- ✅ Data subject rights portal operational
- ✅ Automated data retention and anonymization

---

#### **⚡ PHASE 4.2: Performance Optimization & Monitoring**
**Status**: 🟡 **FINAL PHASE**  
**Priority**: MEDIUM  
**Duration**: 3-4 days

**Objectives:**
- Optimize real-time event processing to sub-500ms latency
- Implement comprehensive caching strategies
- Build monitoring and alerting system for analytics health

**Files to Create:**
```
/opt/webapps/revivatech/backend/services/CacheService.js
/opt/webapps/revivatech/backend/middleware/PerformanceMiddleware.js
/opt/webapps/revivatech/backend/services/MonitoringService.js
/opt/webapps/revivatech/scripts/performance-monitoring.sh
/opt/webapps/revivatech/frontend/src/components/admin/SystemHealthDashboard.tsx
```

**Performance Optimization:**
```javascript
class PerformanceOptimizer {
  constructor() {
    this.cacheService = new CacheService();
    this.monitoringService = new MonitoringService();
  }
  
  async optimizeEventProcessing(): Promise<void> {
    // Batch event processing
    this.setupEventBatching();
    
    // Database connection pooling
    this.optimizeDBConnections();
    
    // Query optimization
    this.setupQueryOptimization();
    
    // Memory management
    this.setupMemoryOptimization();
  }
  
  setupEventBatching(): void {
    this.eventBatch = [];
    this.batchSize = 100;
    this.batchInterval = 5000; // 5 seconds
    
    setInterval(async () => {
      if (this.eventBatch.length > 0) {
        await this.processBatchedEvents(this.eventBatch);
        this.eventBatch = [];
      }
    }, this.batchInterval);
  }
  
  async processBatchedEvents(events): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Bulk insert optimization
      await this.bulkInsertEvents(events);
      
      // Update metrics
      const processingTime = Date.now() - startTime;
      this.monitoringService.recordMetric('event_processing_latency', processingTime);
      
      if (processingTime > 500) {
        console.warn(`⚠️ Slow event processing: ${processingTime}ms`);
      }
      
    } catch (error) {
      console.error('Batch processing failed:', error);
      this.monitoringService.recordError('batch_processing_error', error);
    }
  }
}
```

**Monitoring & Alerting:**
```javascript
class MonitoringService {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = {
      event_processing_latency: 500, // ms
      dashboard_load_time: 2000, // ms
      api_response_time: 200, // ms
      websocket_latency: 100, // ms
      error_rate: 0.01, // 1%
      memory_usage: 0.8 // 80%
    };
  }
  
  recordMetric(metricName: string, value: number): void {
    const timestamp = Date.now();
    
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    
    this.metrics.get(metricName).push({ value, timestamp });
    
    // Check for threshold violations
    this.checkThreshold(metricName, value);
    
    // Clean old metrics (keep last 24 hours)
    this.cleanOldMetrics(metricName);
  }
  
  checkThreshold(metricName: string, value: number): void {
    const threshold = this.thresholds[metricName];
    if (threshold && value > threshold) {
      this.triggerAlert(metricName, value, threshold);
    }
  }
  
  triggerAlert(metricName: string, actualValue: number, threshold: number): void {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metric: metricName,
      actualValue,
      threshold,
      severity: this.calculateSeverity(actualValue, threshold),
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    
    this.alerts.set(alert.id, alert);
    
    // Send notifications
    this.sendAlertNotification(alert);
    
    console.warn(`🚨 ALERT: ${metricName} exceeded threshold`, alert);
  }
  
  async getSystemHealth(): Promise<SystemHealth> {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const health = {
      status: 'healthy',
      metrics: {},
      alerts: Array.from(this.alerts.values()).filter(alert => alert.status === 'active'),
      lastUpdated: new Date().toISOString()
    };
    
    // Calculate metric averages for last hour
    for (const [metricName, values] of this.metrics.entries()) {
      const recentValues = values.filter(v => v.timestamp > oneHourAgo);
      if (recentValues.length > 0) {
        const average = recentValues.reduce((sum, v) => sum + v.value, 0) / recentValues.length;
        health.metrics[metricName] = {
          average: Math.round(average),
          count: recentValues.length,
          status: average <= this.thresholds[metricName] ? 'good' : 'warning'
        };
      }
    }
    
    // Determine overall system status
    const hasWarnings = Object.values(health.metrics).some(m => m.status === 'warning');
    const hasActiveAlerts = health.alerts.length > 0;
    
    if (hasActiveAlerts) {
      health.status = 'critical';
    } else if (hasWarnings) {
      health.status = 'warning';
    }
    
    return health;
  }
}
```

**Success Criteria:**
- ✅ Event processing latency < 500ms consistently
- ✅ Dashboard load time < 2 seconds
- ✅ 99.9% system uptime maintained
- ✅ Automated alerts for performance degradation

---

## 📊 Complete Database Schema

### **Enhanced Analytics Schema**

```sql
-- Core Analytics Events (Enhanced)
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_fingerprint VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(200),
    event_data JSONB,
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    ip_address INET,
    device_info JSONB,
    geo_location JSONB,
    consent_status JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- User Behavior Profiles (Enhanced)
CREATE TABLE user_behavior_profiles (
    fingerprint VARCHAR(255) PRIMARY KEY,
    first_seen_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP DEFAULT NOW(),
    total_sessions INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0,
    avg_session_duration FLOAT DEFAULT 0,
    pages_per_session FLOAT DEFAULT 0,
    bounce_rate FLOAT DEFAULT 0,
    return_visit_rate FLOAT DEFAULT 0,
    price_check_frequency INTEGER DEFAULT 0,
    service_comparison_count INTEGER DEFAULT 0,
    booking_attempts INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    engagement_score FLOAT DEFAULT 0,
    lead_score INTEGER DEFAULT 0,
    churn_risk_score FLOAT DEFAULT 0,
    customer_segment VARCHAR(100),
    preferred_services JSONB DEFAULT '[]',
    device_types JSONB DEFAULT '[]',
    referrer_sources JSONB DEFAULT '[]',
    behavioral_traits JSONB DEFAULT '{}',
    consent_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Customer Journey Mapping (Enhanced)
CREATE TABLE customer_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    journey_stage VARCHAR(100),
    touchpoint VARCHAR(200),
    touchpoint_data JSONB,
    sequence_number INTEGER,
    time_spent INTEGER,
    conversion_event BOOLEAN DEFAULT FALSE,
    attribution_data JSONB,
    personalization_applied JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ML Model Predictions (Enhanced)
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    prediction_value FLOAT NOT NULL,
    confidence_score FLOAT,
    features_used JSONB,
    prediction_metadata JSONB,
    prediction_date TIMESTAMP DEFAULT NOW(),
    actual_outcome FLOAT,
    outcome_date TIMESTAMP,
    model_accuracy FLOAT
);

-- Marketing Automation (New)
CREATE TABLE marketing_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_name VARCHAR(100) NOT NULL,
    fingerprint VARCHAR(255) NOT NULL,
    trigger_condition JSONB,
    scheduled_action VARCHAR(100),
    personalization_data JSONB,
    scheduled_for TIMESTAMP,
    executed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled',
    execution_result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Privacy & Consent Management (New)
CREATE TABLE privacy_consent_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint VARCHAR(255) NOT NULL,
    consent_version VARCHAR(20),
    consent_preferences JSONB,
    consent_method VARCHAR(50), -- banner, preference_center, api
    user_agent TEXT,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Performance Monitoring (New)
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Session Analytics (Enhanced)
CREATE TABLE analytics_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    fingerprint VARCHAR(255) NOT NULL,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    bounce_session BOOLEAN DEFAULT FALSE,
    conversion_session BOOLEAN DEFAULT FALSE,
    entry_page TEXT,
    exit_page TEXT,
    referrer_url TEXT,
    referrer_domain VARCHAR(255),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    screen_resolution VARCHAR(20),
    ip_address INET,
    geo_country VARCHAR(3),
    geo_region VARCHAR(100),
    geo_city VARCHAR(100),
    session_quality_score FLOAT,
    engagement_level VARCHAR(20)
);

-- Advanced Analytics Aggregations (New)
CREATE TABLE analytics_aggregations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregation_type VARCHAR(100) NOT NULL, -- hourly, daily, weekly, monthly
    aggregation_key VARCHAR(200) NOT NULL, -- metric_name, segment, etc.
    aggregation_value JSONB NOT NULL,
    time_bucket TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- A/B Testing Framework (New)
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name VARCHAR(100) NOT NULL,
    description TEXT,
    hypothesis TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft', -- draft, running, completed, paused
    traffic_allocation FLOAT DEFAULT 0.5,
    variants JSONB, -- [{name: 'control', allocation: 0.5}, {name: 'variant_a', allocation: 0.5}]
    success_metrics JSONB,
    results JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES ab_tests(id),
    fingerprint VARCHAR(255) NOT NULL,
    variant_name VARCHAR(50),
    assigned_at TIMESTAMP DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_analytics_events_fingerprint_created ON analytics_events(user_fingerprint, created_at DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_type_created ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_behavior_profiles_score ON user_behavior_profiles(lead_score DESC);
CREATE INDEX idx_behavior_profiles_segment ON user_behavior_profiles(customer_segment);
CREATE INDEX idx_behavior_profiles_last_seen ON user_behavior_profiles(last_seen_at DESC);
CREATE INDEX idx_customer_journeys_fingerprint_sequence ON customer_journeys(fingerprint, sequence_number);
CREATE INDEX idx_ml_predictions_fingerprint_type ON ml_predictions(fingerprint, model_type);
CREATE INDEX idx_marketing_triggers_scheduled ON marketing_triggers(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_privacy_consent_fingerprint ON privacy_consent_log(fingerprint, timestamp DESC);
CREATE INDEX idx_performance_metrics_name_time ON performance_metrics(metric_name, recorded_at DESC);
CREATE INDEX idx_analytics_sessions_fingerprint ON analytics_sessions(fingerprint);
CREATE INDEX idx_aggregations_type_bucket ON analytics_aggregations(aggregation_type, time_bucket DESC);
```

---

## 📈 Success Metrics & KPIs

### **Technical Performance Targets**

| Metric | Target | Current | Gap |
|--------|---------|---------|-----|
| **Event Processing Latency** | < 500ms | TBD | New metric |
| **Dashboard Load Time** | < 2 seconds | ~3 seconds | -1 second |
| **Data Collection Rate** | > 95% | ~60% | +35% |
| **Real-time Update Latency** | < 100ms | ~200ms | -100ms |
| **System Uptime** | 99.9% | 99.8% | +0.1% |
| **API Response Time** | < 200ms | ~300ms | -100ms |

### **Business Intelligence Targets**

| Metric | Target | Expected Impact | Timeline |
|--------|---------|-----------------|----------|
| **Lead Scoring Accuracy** | > 80% | +40% qualified leads | Phase 3.1 |
| **Conversion Rate Improvement** | +25% | +£50K monthly revenue | Phase 2-3 |
| **Cart Abandonment Reduction** | -30% | +15% completed bookings | Phase 3.2 |
| **Customer Lifetime Value** | +40% | +£200 average value | Phase 3.1 |
| **Marketing ROI** | +35% | +£30K marketing efficiency | Phase 3.2 |
| **Churn Reduction** | -25% | +12% customer retention | Phase 3.1 |
| **Personalization Effectiveness** | +50% engagement | Dynamic experiences | Phase 3.2 |

### **Analytics Capabilities Targets**

| Capability | Target | Business Value | Status |
|------------|---------|---------------|---------|
| **Customer Journey Mapping** | 100% session coverage | Complete funnel visibility | Phase 2.3 |
| **Behavioral Segmentation** | 8-12 distinct personas | Personalized marketing | Phase 3.1 |
| **Churn Prediction** | 72h advance warning | Proactive retention | Phase 3.1 |
| **Real-time Personalization** | < 100ms response | Dynamic UX optimization | Phase 3.2 |
| **Marketing Attribution** | Multi-touch attribution | ROI optimization | Phase 3.2 |
| **Privacy Compliance** | 100% GDPR/CCPA | Legal compliance | Phase 4.1 |

---

## 💰 Investment & ROI Analysis

### **Implementation Investment**

| Phase | Duration | Development Cost | Infrastructure Cost |
|-------|----------|------------------|-------------------|
| **Phase 1.5** | 1 day | £1,000 | £0 |
| **Phase 2** | 9-11 days | £22,000 | £1,000 |
| **Phase 3** | 7-9 days | £18,000 | £500 |
| **Phase 4** | 6-8 days | £15,000 | £500 |
| **Total** | **24-30 days** | **£56,000** | **£2,000** |

### **Expected Business Returns**

| Benefit Category | Monthly Value | Annual Value |
|------------------|---------------|--------------|
| **Conversion Rate Improvement** (+25%) | £12,000 | £144,000 |
| **Customer LTV Increase** (+40%) | £8,000 | £96,000 |
| **Marketing Efficiency** (+35%) | £5,000 | £60,000 |
| **Churn Reduction** (-25%) | £6,000 | £72,000 |
| **Operational Savings** | £3,000 | £36,000 |
| **Total Annual Benefits** | **£34,000** | **£408,000** |

### **ROI Calculation**
```
Total Investment: £58,000
Annual Benefits: £408,000
Net Annual Value: £350,000
ROI: 603%
Payback Period: 1.7 months
```

---

## 🚨 Risk Management & Mitigation

### **Technical Risks**

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **Performance Degradation** | Medium | High | Comprehensive testing, caching, optimization |
| **Privacy Compliance Failure** | Low | Critical | GDPR-by-design, legal review, audit |
| **Data Security Breach** | Low | Critical | Encryption, access controls, monitoring |
| **Third-party Dependencies** | Medium | Medium | Vendor evaluation, fallback options |
| **Scalability Bottlenecks** | Medium | High | Load testing, horizontal scaling |

### **Business Risks**

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **Implementation Delays** | Medium | Medium | Agile methodology, phased delivery |
| **User Privacy Concerns** | Low | High | Transparency, opt-out options, clear benefits |
| **ROI Below Expectations** | Low | High | Clear metrics, regular review, optimization |
| **Competitive Response** | Medium | Medium | Continuous innovation, differentiation |

---

## 🛠️ Getting Started - Immediate Next Steps

### **Phase 1.5: Complete Foundation (IMMEDIATE)**
**Estimated Time**: 1 day  
**Priority**: HIGH  
**Prerequisites**: ✅ All requirements met

**Task**: Upgrade analyticsWebSocketService.ts
- Remove all simulation code
- Connect to real backend WebSocket endpoint  
- Implement authentication and error handling
- Test real-time data flow

### **Phase 2.1: Browser Fingerprinting (NEXT)**
**Estimated Time**: 2 days  
**Priority**: HIGH  
**Prerequisites**: Phase 1.5 complete

**Task**: Implement ThumbmarkJS integration
- Install ThumbmarkJS dependency
- Create privacy-compliant fingerprinting service
- Implement consent validation
- Build fallback identification system

### **Recommended Implementation Sequence**
1. **Week 1**: Phase 1.5 + Phase 2.1 (Foundation + Fingerprinting)
2. **Week 2**: Phase 2.2 (Event Tracking System)  
3. **Week 3**: Phase 2.3 (Journey Mapping) + Phase 4.1 (Privacy Compliance)
4. **Week 4**: Phase 3.1 (ML Models) + Phase 3.2 (Marketing Automation)
5. **Week 5**: Phase 4.2 (Performance Optimization) + Testing

---

## 📚 Implementation Resources

### **Documentation References**
- **Main PRD**: `/opt/webapps/revivatech/Docs/Advanced_Analytics_Intelligence_System_PRD.md`
- **Implementation Todo**: `/opt/webapps/revivatech/Docs/PRDs_completed/implementation_guides/Analytics_Implementation_PRD_TodoList.md`
- **Original Requirements**: `/opt/webapps/revivatech/Docs/analytics-prd.md`
- **Infrastructure Setup**: `/opt/webapps/revivatech/INFRASTRUCTURE_SETUP.md`

### **Key Dependencies**
```bash
# Frontend Dependencies
npm install thumbmarkjs posthog-js @types/thumbmarkjs

# Backend Dependencies  
npm install kafkajs tensorflow @tensorflow/tfjs-node

# Development Tools
npm install @types/node typescript ts-node nodemon
```

### **Environment Configuration**
```env
# Analytics Configuration
ANALYTICS_DB_URL=postgresql://user:pass@localhost:5435/revivatech
ANALYTICS_REDIS_URL=redis://localhost:6383
POSTHOG_API_KEY=your-posthog-key
POSTHOG_HOST=http://localhost:8084

# Privacy Configuration
GDPR_COMPLIANCE_MODE=true
CONSENT_MANAGER_VERSION=2025.1
DATA_RETENTION_PERIOD=2years

# ML Configuration
ML_MODEL_PATH=/opt/models/
TENSORFLOW_ENABLE_GPU=false
```

---

## 🎯 Conclusion

This unified PRD represents the complete roadmap for transforming RevivaTech's analytics capabilities from **excellent business intelligence** to **world-class customer intelligence**. The implementation will deliver Google/Facebook-level tracking while maintaining privacy compliance and operational excellence.

**Key Success Factors:**
1. **Privacy-First Implementation**: Building user trust through transparent data practices
2. **Phased Delivery**: Incremental value delivery with minimal risk
3. **Performance Focus**: Maintaining sub-500ms processing throughout
4. **Business Integration**: Direct connection to revenue optimization
5. **Scalability Design**: Supporting 10x growth without architectural changes

**Next Action**: Begin **Phase 1.5** to complete the analytics foundation and enable advanced tracking capabilities.

---

**Document Status**: ✅ **Ready for Implementation**  
**Implementation Priority**: HIGH  
**Expected Timeline**: 5 weeks to completion  
**Expected ROI**: 603% annually  
**Business Impact**: £350,000+ annual value

---

*This unified PRD serves as the definitive blueprint for completing RevivaTech's transformation into a data-driven, customer-intelligent technical assistance platform with world-class analytics capabilities.*