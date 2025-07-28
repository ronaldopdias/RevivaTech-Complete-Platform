# Third-Party Analytics Integration - TDD Tasks
**Feature**: Third-Party Analytics Integration  
**Version**: 1.0  
**Status**: Draft

## 📋 Task Overview

Implementation tasks following Test-Driven Development (TDD) methodology with Red-Green-Refactor cycles.

## 🔴🟢🔄 TDD Implementation Tasks

### Task 1: Consent Manager Implementation
**Estimated**: 2 hours  
**Dependencies**: None

#### 🔴 Red Phase - Write Failing Tests
```typescript
// __tests__/analytics/ConsentManager.test.ts

describe('ConsentManager', () => {
  it('should return null when no consent exists', async () => {
    const manager = new ConsentManager();
    const consent = await manager.checkConsent();
    expect(consent).toBeNull();
  });
  
  it('should store consent with timestamp when granted', async () => {
    const manager = new ConsentManager();
    await manager.grantConsent({ analytics: true, marketing: false });
    
    const consent = await manager.checkConsent();
    expect(consent).toMatchObject({
      analytics: true,
      marketing: false,
      functional: true,
      version: '1.0'
    });
    expect(consent.timestamp).toBeDefined();
  });
  
  it('should respect Do Not Track when enabled', async () => {
    Object.defineProperty(navigator, 'doNotTrack', { value: '1' });
    const manager = new ConsentManager();
    
    const shouldTrack = await manager.shouldInitializeAnalytics();
    expect(shouldTrack).toBe(false);
  });
  
  it('should clear data when consent is revoked', async () => {
    const manager = new ConsentManager();
    await manager.grantConsent({ analytics: true });
    await manager.revokeConsent(['analytics']);
    
    const consent = await manager.checkConsent();
    expect(consent.analytics).toBe(false);
  });
});
```

#### 🟢 Green Phase - Implement ConsentManager
```typescript
// lib/analytics/ConsentManager.ts

export class ConsentManager {
  private readonly CONSENT_KEY = 'revivatech_consent';
  private readonly CONSENT_VERSION = '1.0';
  private readonly CONSENT_EXPIRY = 365 * 24 * 60 * 60 * 1000; // 365 days
  
  async checkConsent(): Promise<ConsentStatus | null> {
    // Implementation to pass tests
  }
  
  async grantConsent(categories: Partial<ConsentStatus>): Promise<void> {
    // Implementation to pass tests
  }
  
  async shouldInitializeAnalytics(): Promise<boolean> {
    // Check Do Not Track and consent status
  }
  
  async revokeConsent(categories: string[]): Promise<void> {
    // Implementation to pass tests
  }
}
```

#### 🔄 Refactor Phase
- Extract constants to configuration
- Add error handling for localStorage failures
- Implement consent version migration
- Add audit logging for compliance

---

### Task 2: Analytics Service Base Class
**Estimated**: 1 hour  
**Dependencies**: Task 1

#### 🔴 Red Phase - Write Failing Tests
```typescript
// __tests__/analytics/AnalyticsService.test.ts

describe('AnalyticsService', () => {
  class TestService extends AnalyticsService {
    async initialize(): Promise<void> {
      this.isInitialized = true;
    }
    
    async trackEvent(event: AnalyticsEvent): Promise<void> {
      // Test implementation
    }
  }
  
  it('should load scripts asynchronously', async () => {
    const service = new TestService({ scriptUrl: 'https://example.com/script.js' });
    const mockScript = { onload: null, onerror: null };
    
    jest.spyOn(document, 'createElement').mockReturnValue(mockScript as any);
    
    const loadPromise = service.loadScript('https://example.com/script.js');
    mockScript.onload();
    
    await expect(loadPromise).resolves.toBeUndefined();
    expect(mockScript.async).toBe(true);
  });
  
  it('should handle script loading errors', async () => {
    const service = new TestService({});
    const mockScript = { onload: null, onerror: null };
    
    jest.spyOn(document, 'createElement').mockReturnValue(mockScript as any);
    
    const loadPromise = service.loadScript('https://example.com/script.js');
    mockScript.onerror();
    
    await expect(loadPromise).rejects.toThrow('Failed to load');
  });
  
  it('should batch events when configured', () => {
    const service = new TestService({ batchSize: 5 });
    const events = Array(10).fill(null).map((_, i) => ({
      name: `event_${i}`,
      parameters: {}
    }));
    
    const batches = service.batchEvents(events);
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(5);
  });
});
```

#### 🟢 Green Phase - Implement Base Class
```typescript
// lib/analytics/AnalyticsService.ts

export abstract class AnalyticsService {
  protected config: ServiceConfig;
  protected isInitialized: boolean = false;
  protected eventQueue: AnalyticsEvent[] = [];
  
  abstract async initialize(): Promise<void>;
  abstract async trackEvent(event: AnalyticsEvent): Promise<void>;
  
  protected async loadScript(url: string): Promise<void> {
    // Implementation to pass tests
  }
  
  protected batchEvents(events: AnalyticsEvent[]): AnalyticsEvent[][] {
    // Implementation to pass tests
  }
}
```

---

### Task 3: Google Analytics 4 Service
**Estimated**: 2 hours  
**Dependencies**: Task 2

#### 🔴 Red Phase - Write Failing Tests
```typescript
// __tests__/analytics/GoogleAnalytics4Service.test.ts

describe('GoogleAnalytics4Service', () => {
  beforeEach(() => {
    delete window.dataLayer;
    delete window.gtag;
  });
  
  it('should initialize GA4 with measurement ID', async () => {
    const service = new GoogleAnalytics4Service({
      measurementId: 'G-TEST123'
    });
    
    // Mock script loading
    jest.spyOn(service as any, 'loadScript').mockResolvedValue(undefined);
    
    await service.initialize();
    
    expect(window.dataLayer).toBeDefined();
    expect(window.gtag).toBeDefined();
    expect(service.isInitialized).toBe(true);
  });
  
  it('should track events with custom parameters', async () => {
    const service = new GoogleAnalytics4Service({
      measurementId: 'G-TEST123'
    });
    
    await service.initialize();
    
    const mockGtag = jest.fn();
    window.gtag = mockGtag;
    
    await service.trackEvent({
      name: 'test_event',
      parameters: { value: 100, currency: 'GBP' }
    });
    
    expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', {
      value: 100,
      currency: 'GBP'
    });
  });
  
  it('should anonymize IP addresses', async () => {
    const service = new GoogleAnalytics4Service({
      measurementId: 'G-TEST123',
      anonymizeIP: true
    });
    
    const mockGtag = jest.fn();
    window.gtag = mockGtag;
    
    await service.initialize();
    
    expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123', 
      expect.objectContaining({
        anonymize_ip: true
      })
    );
  });
});
```

#### 🟢 Green Phase - Implement GA4 Service
```typescript
// lib/analytics/services/GoogleAnalytics4Service.ts

export class GoogleAnalytics4Service extends AnalyticsService {
  private gtag: Gtag.Gtag | null = null;
  
  async initialize(): Promise<void> {
    // Implementation to pass tests
  }
  
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    // Implementation to pass tests
  }
  
  async trackPageView(pageData: PageViewData): Promise<void> {
    // Implementation to pass tests
  }
}
```

---

### Task 4: Facebook Pixel Service
**Estimated**: 2 hours  
**Dependencies**: Task 2

#### 🔴 Red Phase - Write Failing Tests
```typescript
// __tests__/analytics/FacebookPixelService.test.ts

describe('FacebookPixelService', () => {
  beforeEach(() => {
    delete window.fbq;
  });
  
  it('should initialize Facebook Pixel with pixel ID', async () => {
    const service = new FacebookPixelService({
      pixelId: '123456789'
    });
    
    jest.spyOn(service as any, 'loadScript').mockResolvedValue(undefined);
    
    await service.initialize();
    
    expect(window.fbq).toBeDefined();
    expect(window.fbq.loaded).toBe(true);
  });
  
  it('should track conversion events with value', async () => {
    const service = new FacebookPixelService({
      pixelId: '123456789'
    });
    
    await service.initialize();
    
    const mockFbq = jest.fn();
    window.fbq = mockFbq;
    
    await service.trackConversion({
      eventName: 'Purchase',
      value: 150,
      currency: 'GBP',
      items: [{ itemId: 'repair_001', quantity: 1 }]
    });
    
    expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
      value: 150,
      currency: 'GBP',
      content_ids: ['repair_001'],
      content_type: 'product',
      num_items: 1
    });
  });
});
```

#### 🟢 Green Phase - Implement Facebook Pixel Service
```typescript
// lib/analytics/services/FacebookPixelService.ts

export class FacebookPixelService extends AnalyticsService {
  private fbq: any = null;
  
  async initialize(): Promise<void> {
    // Implementation to pass tests
  }
  
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    // Implementation to pass tests
  }
  
  async trackConversion(conversion: ConversionEvent): Promise<void> {
    // Implementation to pass tests
  }
}
```

---

### Task 5: PostHog Service with Session Recording
**Estimated**: 2 hours  
**Dependencies**: Task 2

#### 🔴 Red Phase - Write Failing Tests
```typescript
// __tests__/analytics/PostHogService.test.ts

describe('PostHogService', () => {
  it('should initialize PostHog with API key', async () => {
    const mockPosthog = {
      init: jest.fn(),
      identify: jest.fn(),
      capture: jest.fn()
    };
    
    window.posthog = mockPosthog;
    
    const service = new PostHogService({
      apiKey: 'phc_test123',
      hostUrl: 'https://app.posthog.com'
    });
    
    await service.initialize();
    
    expect(mockPosthog.init).toHaveBeenCalledWith('phc_test123', {
      api_host: 'https://app.posthog.com',
      respect_dnt: true,
      disable_session_recording: false
    });
  });
  
  it('should mask sensitive data in session recordings', async () => {
    const service = new PostHogService({
      apiKey: 'phc_test123',
      enableSessionRecording: true,
      privacyMasks: ['[data-mask]', '.sensitive']
    });
    
    const config = service.getRecordingConfig();
    
    expect(config.maskAllInputs).toBe(true);
    expect(config.maskTextSelector).toContain('[data-mask]');
  });
});
```

#### 🟢 Green Phase - Implement PostHog Service
```typescript
// lib/analytics/services/PostHogService.ts

export class PostHogService extends AnalyticsService {
  private posthog: any = null;
  
  async initialize(): Promise<void> {
    // Implementation to pass tests
  }
  
  getRecordingConfig(): RecordingConfig {
    // Implementation to pass tests
  }
  
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    // Implementation to pass tests
  }
}
```

---

### Task 6: Analytics Initializer Component
**Estimated**: 2 hours  
**Dependencies**: Tasks 1-5

#### 🔴 Red Phase - Write Failing Tests
```typescript
// __tests__/components/AnalyticsInitializer.test.tsx

describe('AnalyticsInitializer', () => {
  it('should show consent banner when no consent exists', () => {
    const { getByText } = render(
      <AnalyticsInitializer>
        <div>App Content</div>
      </AnalyticsInitializer>
    );
    
    expect(getByText('Cookie Consent')).toBeInTheDocument();
  });
  
  it('should initialize analytics after consent granted', async () => {
    const mockInitialize = jest.fn();
    jest.mock('@/lib/analytics/ThirdPartyAnalytics', () => ({
      getThirdPartyAnalytics: () => ({
        initialize: mockInitialize
      })
    }));
    
    const { getByText } = render(<AnalyticsInitializer />);
    
    fireEvent.click(getByText('Accept All'));
    
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });
  });
  
  it('should not initialize when consent denied', async () => {
    const mockInitialize = jest.fn();
    jest.mock('@/lib/analytics/ThirdPartyAnalytics', () => ({
      getThirdPartyAnalytics: () => ({
        initialize: mockInitialize
      })
    }));
    
    const { getByText } = render(<AnalyticsInitializer />);
    
    fireEvent.click(getByText('Essential Only'));
    
    await waitFor(() => {
      expect(mockInitialize).not.toHaveBeenCalled();
    });
  });
});
```

#### 🟢 Green Phase - Implement Component
```typescript
// components/analytics/AnalyticsInitializer.tsx

export function AnalyticsInitializer({ children }: AnalyticsInitializerProps) {
  // Implementation to pass tests
}
```

---

### Task 7: Consent Banner Component
**Estimated**: 1.5 hours  
**Dependencies**: Task 1

#### 🔴 Red Phase - Write Failing Tests
```typescript
// __tests__/components/ConsentBanner.test.tsx

describe('ConsentBanner', () => {
  it('should display consent options', () => {
    const { getByText } = render(<ConsentBanner onConsent={jest.fn()} />);
    
    expect(getByText('Accept All')).toBeInTheDocument();
    expect(getByText('Essential Only')).toBeInTheDocument();
    expect(getByText('Manage Preferences')).toBeInTheDocument();
  });
  
  it('should call onConsent with full consent when accepting all', () => {
    const handleConsent = jest.fn();
    const { getByText } = render(<ConsentBanner onConsent={handleConsent} />);
    
    fireEvent.click(getByText('Accept All'));
    
    expect(handleConsent).toHaveBeenCalledWith({
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: expect.any(Number),
      version: '1.0'
    });
  });
  
  it('should show preferences modal when clicked', () => {
    const { getByText, getByRole } = render(<ConsentBanner onConsent={jest.fn()} />);
    
    fireEvent.click(getByText('Manage Preferences'));
    
    expect(getByRole('dialog')).toBeInTheDocument();
    expect(getByText('Analytics Cookies')).toBeInTheDocument();
    expect(getByText('Marketing Cookies')).toBeInTheDocument();
  });
});
```

#### 🟢 Green Phase - Implement Banner
```typescript
// components/analytics/ConsentBanner.tsx

export function ConsentBanner({ onConsent }: ConsentBannerProps) {
  // Implementation to pass tests
}
```

---

### Task 8: Event Forwarding Integration
**Estimated**: 1.5 hours  
**Dependencies**: Tasks 3-5

#### 🔴 Red Phase - Write Failing Tests
```typescript
// __tests__/analytics/EventForwarding.test.ts

describe('Event Forwarding', () => {
  it('should forward events from existing analytics to third-party services', async () => {
    const mockGA4 = { trackEvent: jest.fn() };
    const mockFB = { trackEvent: jest.fn() };
    const mockPostHog = { trackEvent: jest.fn() };
    
    const forwarder = new EventForwarder({
      services: [mockGA4, mockFB, mockPostHog]
    });
    
    await forwarder.forward({
      name: 'page_view',
      parameters: { page: '/home' }
    });
    
    expect(mockGA4.trackEvent).toHaveBeenCalled();
    expect(mockFB.trackEvent).toHaveBeenCalled();
    expect(mockPostHog.trackEvent).toHaveBeenCalled();
  });
  
  it('should handle service failures gracefully', async () => {
    const mockGA4 = { 
      trackEvent: jest.fn().mockRejectedValue(new Error('GA4 failed')) 
    };
    const mockFB = { trackEvent: jest.fn() };
    
    const forwarder = new EventForwarder({
      services: [mockGA4, mockFB]
    });
    
    await expect(forwarder.forward({
      name: 'test_event'
    })).resolves.not.toThrow();
    
    expect(mockFB.trackEvent).toHaveBeenCalled();
  });
});
```

#### 🟢 Green Phase - Implement Forwarding
```typescript
// lib/analytics/EventForwarder.ts

export class EventForwarder {
  // Implementation to pass tests
}
```

---

### Task 9: Performance Testing
**Estimated**: 1 hour  
**Dependencies**: All previous tasks

#### 🔴 Red Phase - Write Performance Tests
```typescript
// __tests__/analytics/performance.test.ts

describe('Analytics Performance', () => {
  it('should load analytics without blocking render', async () => {
    const startTime = performance.now();
    
    render(<AnalyticsInitializer><App /></AnalyticsInitializer>);
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // 100ms max
  });
  
  it('should batch events efficiently', async () => {
    const analytics = getThirdPartyAnalytics();
    const sendSpy = jest.spyOn(analytics as any, 'sendBatch');
    
    // Send 25 events rapidly
    for (let i = 0; i < 25; i++) {
      analytics.trackEvent({ name: `event_${i}` });
    }
    
    // Should batch in groups of 10
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(sendSpy).toHaveBeenCalledTimes(3); // 2 full batches + 1 partial
  });
});
```

---

### Task 10: Integration Testing
**Estimated**: 1 hour  
**Dependencies**: All previous tasks

#### 🔴 Red Phase - Write Integration Tests
```typescript
// __tests__/analytics/integration.test.ts

describe('Analytics Integration', () => {
  it('should track complete user journey', async () => {
    const { getByText } = render(<App />);
    
    // Accept consent
    fireEvent.click(getByText('Accept All'));
    
    // Navigate and track
    fireEvent.click(getByText('Services'));
    fireEvent.click(getByText('Book Repair'));
    
    // Verify events sent
    await waitFor(() => {
      expect(window.dataLayer).toContainEqual(
        expect.objectContaining({
          event: 'page_view',
          page_location: '/services'
        })
      );
    });
  });
});
```

## ✅ Definition of Done

### For Each Task:
- [ ] All tests pass (Red → Green)
- [ ] Code refactored for clarity and maintainability
- [ ] Type safety verified (no TypeScript errors)
- [ ] Error handling implemented
- [ ] Performance requirements met
- [ ] Code reviewed

### For Complete Feature:
- [ ] All services initialized correctly
- [ ] Consent flow working end-to-end
- [ ] Events tracked across all platforms
- [ ] Performance impact < 100ms
- [ ] Privacy compliance verified
- [ ] Documentation updated

## 📊 Test Coverage Requirements

- Unit Test Coverage: > 90%
- Integration Test Coverage: > 80%
- Performance Tests: All pass
- E2E Tests: Core flows covered

---

**Status**: ⏳ Awaiting Approval  
**Next Step**: Review tasks and proceed to execution with `/spec:execute third-party-analytics-integration`