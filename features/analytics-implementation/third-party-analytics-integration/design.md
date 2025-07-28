# Third-Party Analytics Integration - Technical Design
**Feature**: Third-Party Analytics Integration  
**Version**: 1.0  
**Status**: Draft

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                       │
├─────────────────────────────────────────────────────────────┤
│                    Layout Component                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            AnalyticsInitializer (Client)             │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │   Consent   │  │  Third-Party │  │    UTM    │  │   │
│  │  │   Manager   │→ │   Analytics  │← │  Tracker  │  │   │
│  │  └─────────────┘  └──────────────┘  └───────────┘  │   │
│  │         ↓                 ↓                ↓        │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │   │
│  │  │     GA4     │  │   Facebook   │  │  PostHog  │  │   │
│  │  │   Service   │  │    Pixel     │  │  Service  │  │   │
│  │  └─────────────┘  └──────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Existing Analytics Infrastructure            │   │
│  │  (UniversalAnalyticsProvider, FingerprintAnalytics) │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
```
User Action → Event Capture → Consent Check → Service Router
     ↓              ↓              ↓              ↓
Browser Event → Validation → Privacy Filter → Analytics APIs
     ↓              ↓              ↓              ↓
Page View → Enrichment → Batching → External Services
```

## 📦 Component Design

### 1. AnalyticsInitializer Component
```typescript
// Location: /frontend/src/components/analytics/AnalyticsInitializer.tsx

interface AnalyticsInitializerProps {
  children?: React.ReactNode;
}

export function AnalyticsInitializer({ children }: AnalyticsInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  
  useEffect(() => {
    // Client-side only initialization
    if (typeof window === 'undefined') return;
    
    // Check consent status
    const consent = checkConsentStatus();
    setConsentStatus(consent);
    
    // Initialize if consent granted
    if (consent.analytics || consent.marketing) {
      initializeAnalytics(consent);
    }
  }, []);
  
  return (
    <>
      {!consentStatus && <ConsentBanner onConsent={handleConsent} />}
      {children}
    </>
  );
}
```

### 2. Consent Manager Design
```typescript
// Location: /frontend/src/lib/analytics/ConsentManager.ts

interface ConsentStatus {
  analytics: boolean;      // GA4, PostHog analytics
  marketing: boolean;      // Facebook Pixel, remarketing
  functional: boolean;     // Required cookies
  timestamp: number;
  version: string;
}

class ConsentManager {
  private readonly CONSENT_KEY = 'revivatech_consent';
  private readonly CONSENT_VERSION = '1.0';
  
  async checkConsent(): Promise<ConsentStatus | null> {
    // Check localStorage for existing consent
    // Validate consent version and expiry
    // Return null if no valid consent
  }
  
  async grantConsent(categories: Partial<ConsentStatus>): Promise<void> {
    // Store consent with timestamp
    // Initialize approved services
    // Send consent granted events
  }
  
  async revokeConsent(categories: string[]): Promise<void> {
    // Update consent status
    // Disable revoked services
    // Clear associated data
  }
}
```

### 3. Service Integration Pattern
```typescript
// Base pattern for all analytics services

abstract class AnalyticsService {
  protected config: ServiceConfig;
  protected isInitialized: boolean = false;
  
  abstract async initialize(): Promise<void>;
  abstract async trackEvent(event: AnalyticsEvent): Promise<void>;
  abstract async trackPageView(pageData: PageViewData): Promise<void>;
  abstract async destroy(): Promise<void>;
  
  protected async loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.async = true;
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${url}`));
      document.head.appendChild(script);
    });
  }
}
```

### 4. Google Analytics 4 Service
```typescript
// Location: /frontend/src/lib/analytics/services/GoogleAnalytics4Service.ts

class GoogleAnalytics4Service extends AnalyticsService {
  private gtag: Gtag.Gtag | null = null;
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Load gtag script
    await this.loadScript(
      `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`
    );
    
    // Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || [];
    this.gtag = function() { window.dataLayer.push(arguments); };
    
    // Configure GA4
    this.gtag('js', new Date());
    this.gtag('config', this.config.measurementId, {
      send_page_view: false,
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
    });
    
    this.isInitialized = true;
  }
  
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.gtag) return;
    
    this.gtag('event', event.name, {
      ...event.parameters,
      custom_timestamp: event.timestamp,
    });
  }
}
```

### 5. Consent Banner Component
```typescript
// Location: /frontend/src/components/analytics/ConsentBanner.tsx

interface ConsentBannerProps {
  onConsent: (status: ConsentStatus) => void;
}

export function ConsentBanner({ onConsent }: ConsentBannerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 z-50">
      <div className="max-w-7xl mx-auto">
        <h3>Cookie Consent</h3>
        <p>We use cookies to improve your experience and analyze site usage.</p>
        
        <div className="flex gap-4 mt-4">
          <button onClick={() => acceptAll()}>Accept All</button>
          <button onClick={() => acceptEssential()}>Essential Only</button>
          <button onClick={() => showPreferences()}>Manage Preferences</button>
        </div>
      </div>
    </div>
  );
}
```

## 🔧 Implementation Details

### Environment Configuration
```typescript
// .env.local
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=123456789012345
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_ANALYTICS_DEBUG=false
```

### Event Batching Strategy
```typescript
class EventBatcher {
  private queue: AnalyticsEvent[] = [];
  private timer: NodeJS.Timeout | null = null;
  
  constructor(
    private batchSize: number = 10,
    private flushInterval: number = 5000
  ) {}
  
  add(event: AnalyticsEvent): void {
    this.queue.push(event);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }
  
  flush(): void {
    if (this.queue.length === 0) return;
    
    const events = this.queue.splice(0, this.batchSize);
    this.sendBatch(events);
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
```

### Privacy Masking for Session Recording
```typescript
// PostHog session recording configuration

const privacyRules = {
  // Mask all input values by default
  maskAllInputs: true,
  
  // Mask specific text content
  maskTextSelector: '[data-mask], .sensitive-data',
  
  // Block recording on specific pages
  blockPages: ['/admin/*', '/payment/*'],
  
  // Custom masking function
  maskTextFn: (text: string, element?: HTMLElement) => {
    if (element?.hasAttribute('data-mask-partial')) {
      // Partial masking for emails: u***@example.com
      return text.replace(/(.{1})(.*)(@.*)/, '$1***$3');
    }
    return '***';
  }
};
```

### Error Handling Pattern
```typescript
class AnalyticsErrorHandler {
  private errors: AnalyticsError[] = [];
  private maxRetries = 3;
  
  async handleError(
    error: Error,
    context: ErrorContext,
    retryFn?: () => Promise<void>
  ): Promise<void> {
    // Log error
    console.error(`Analytics Error: ${error.message}`, context);
    
    // Store error for debugging
    this.errors.push({
      error,
      context,
      timestamp: Date.now()
    });
    
    // Retry logic
    if (retryFn && context.retries < this.maxRetries) {
      await this.retryWithBackoff(retryFn, context.retries);
    }
    
    // Cleanup old errors (keep last 50)
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
  }
  
  private async retryWithBackoff(
    fn: () => Promise<void>,
    attempt: number
  ): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    await fn();
  }
}
```

## 🔒 Security Considerations

### Content Security Policy Updates
```typescript
// Required CSP headers for analytics services
const analyticsCSP = {
  'script-src': [
    "'self'",
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://connect.facebook.net',
    'https://app.posthog.com',
  ],
  'connect-src': [
    "'self'",
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://facebook.com',
    'https://app.posthog.com',
  ],
  'img-src': [
    "'self'",
    'https://www.google-analytics.com',
    'https://www.facebook.com',
  ]
};
```

### Data Sanitization
```typescript
function sanitizeEventData(data: any): any {
  const sensitivePatterns = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit cards
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  ];
  
  const sanitized = JSON.parse(JSON.stringify(data));
  
  function recursiveSanitize(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        sensitivePatterns.forEach(pattern => {
          obj[key] = obj[key].replace(pattern, '[REDACTED]');
        });
      } else if (typeof obj[key] === 'object') {
        recursiveSanitize(obj[key]);
      }
    }
  }
  
  recursiveSanitize(sanitized);
  return sanitized;
}
```

## 🧪 Testing Strategy

### Unit Tests
- ConsentManager functionality
- Service initialization and error handling
- Event batching and queuing
- Privacy masking functions

### Integration Tests
- Script loading and initialization
- Event tracking across all services
- Consent flow end-to-end
- Error recovery mechanisms

### Performance Tests
- Page load impact measurement
- Event batching efficiency
- Memory usage monitoring
- Network request optimization

## 📊 Monitoring & Debugging

### Debug Mode Implementation
```typescript
class AnalyticsDebugger {
  private enabled: boolean;
  
  constructor() {
    this.enabled = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';
  }
  
  log(service: string, event: string, data?: any): void {
    if (!this.enabled) return;
    
    console.group(`🔍 Analytics Debug: ${service}`);
    console.log('Event:', event);
    console.log('Data:', data);
    console.log('Timestamp:', new Date().toISOString());
    console.trace();
    console.groupEnd();
  }
}
```

---

**Status**: ⏳ Awaiting Approval  
**Next Step**: Review design and proceed to task breakdown with `/spec:tasks`