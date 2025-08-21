/**
 * Third-Party Analytics Integration Service
 * RevivaTech Visitor Intelligence System
 * 
 * Integrates Google Analytics 4, Facebook Pixel, and PostHog
 * with privacy compliance and consent management
 */

interface ThirdPartyConfig {
  googleAnalytics?: {
    enabled: boolean;
    measurementId: string;
    trackingId?: string; // For backwards compatibility
    customDimensions?: Record<string, string>;
  };
  facebookPixel?: {
    enabled: boolean;
    pixelId: string;
    accessToken?: string;
  };
  postHog?: {
    enabled: boolean;
    apiKey: string;
    hostUrl?: string;
    enableSessionRecording?: boolean;
    enableHeatmaps?: boolean;
  };
  privacy: {
    requireConsent: boolean;
    anonymizeIP: boolean;
    respectDoNotTrack: boolean;
    cookieExpiryDays: number;
  };
  performance: {
    loadAsync: boolean;
    enableBatching: boolean;
    batchSize: number;
    flushInterval: number;
  };
}

interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
  deviceId?: string;
}

interface ConversionEvent {
  eventName: string;
  value?: number;
  currency?: string;
  transactionId?: string;
  items?: Array<{
    itemId: string;
    itemName: string;
    category: string;
    price: number;
    quantity: number;
  }>;
}

interface UserProperties {
  userId?: string;
  email?: string;
  customerType?: 'new' | 'returning' | 'premium';
  devicePreference?: string;
  repairHistory?: number;
  lifetimeValue?: number;
}

class ThirdPartyAnalyticsService {
  private static instance: ThirdPartyAnalyticsService | null = null;
  private config: ThirdPartyConfig;
  private isInitialized: boolean = false;
  private consentGiven: boolean = false;
  private eventQueue: AnalyticsEvent[] = [];
  private batchTimer?: NodeJS.Timeout;

  // Service instances
  private ga4?: any;
  private fbq?: any;
  private posthog?: any;

  constructor(config: Partial<ThirdPartyConfig> = {}) {
    this.config = {
      googleAnalytics: {
        enabled: false,
        measurementId: '',
        ...config.googleAnalytics
      },
      facebookPixel: {
        enabled: false,
        pixelId: '',
        ...config.facebookPixel
      },
      postHog: {
        enabled: false,
        apiKey: '',
        hostUrl: 'https://app.posthog.com',
        enableSessionRecording: true,
        enableHeatmaps: true,
        ...config.postHog
      },
      privacy: {
        requireConsent: true,
        anonymizeIP: true,
        respectDoNotTrack: true,
        cookieExpiryDays: 365,
        ...config.privacy
      },
      performance: {
        loadAsync: true,
        enableBatching: true,
        batchSize: 10,
        flushInterval: 5000,
        ...config.performance
      }
    };
  }

  /**
   * Initialize all enabled analytics services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Check privacy consent
    if (this.config.privacy.requireConsent && !this.hasConsent()) {
      console.log('ThirdPartyAnalytics: Consent required but not given');
      return;
    }

    // Respect Do Not Track
    if (this.config.privacy.respectDoNotTrack && navigator.doNotTrack === '1') {
      console.log('ThirdPartyAnalytics: Do Not Track enabled, skipping initialization');
      return;
    }

    try {
      const initPromises: Promise<void>[] = [];

      // Initialize Google Analytics 4
      if (this.config.googleAnalytics?.enabled && this.config.googleAnalytics.measurementId) {
        initPromises.push(this.initializeGoogleAnalytics());
      }

      // Initialize Facebook Pixel
      if (this.config.facebookPixel?.enabled && this.config.facebookPixel.pixelId) {
        initPromises.push(this.initializeFacebookPixel());
      }

      // PostHog is now initialized via instrumentation-client.js
      if (this.config.postHog?.enabled && this.config.postHog.apiKey) {
        // PostHog is already initialized in instrumentation-client.js
        // Just verify it's available and store reference
        if (typeof window !== 'undefined' && (window as any).posthog) {
          this.posthog = (window as any).posthog;
          console.log('PostHog: Using official SDK from instrumentation-client.js');
        } else {
          // PostHog is disabled in instrumentation.ts - this is expected
          console.log('PostHog: SDK not loaded (disabled in instrumentation.ts)');
        }
      }

      await Promise.all(initPromises);

      this.isInitialized = true;
      this.consentGiven = true;

      // Start batch processing if enabled
      if (this.config.performance.enableBatching) {
        this.startBatchProcessing();
      }

      // Flush any queued events
      this.flushEventQueue();

      // Reduce console noise in production
      if (process.env.NODE_ENV === 'development') {
        console.log('ThirdPartyAnalytics: Successfully initialized');
      }
    } catch (error) {
      console.error('ThirdPartyAnalytics: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Google Analytics 4
   */
  private async initializeGoogleAnalytics(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const measurementId = this.config.googleAnalytics!.measurementId;

        // Create gtag script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        
        script.onload = () => {
          // Initialize gtag
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).gtag = function() {
            (window as any).dataLayer.push(arguments);
          };

          const gtag = (window as any).gtag;

          // Configure GA4
          gtag('js', new Date());
          gtag('config', measurementId, {
            anonymize_ip: this.config.privacy.anonymizeIP,
            allow_google_signals: this.consentGiven,
            cookie_expires: this.config.privacy.cookieExpiryDays * 24 * 60 * 60,
            custom_map: this.config.googleAnalytics?.customDimensions || {},
            send_page_view: false, // We'll handle this manually
          });

          this.ga4 = gtag;
          // Reduce console noise in production
          if (process.env.NODE_ENV === 'development') {
            console.log('Google Analytics 4 initialized');
          }
          resolve();
        };

        script.onerror = () => {
          reject(new Error('Failed to load Google Analytics script'));
        };

        document.head.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initialize Facebook Pixel
   */
  private async initializeFacebookPixel(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const pixelId = this.config.facebookPixel!.pixelId;

        // Facebook Pixel code
        const fbq = function(...args: any[]) {
          if ((fbq as any).callMethod) {
            (fbq as any).callMethod.apply(fbq, args);
          } else {
            (fbq as any).queue.push(args);
          }
        };

        if (!(window as any).fbq) {
          (window as any).fbq = fbq;
        }

        (fbq as any).push = fbq;
        (fbq as any).loaded = true;
        (fbq as any).version = '2.0';
        (fbq as any).queue = [];

        // Load Facebook Pixel script
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';

        script.onload = () => {
          // Initialize pixel
          fbq('init', pixelId, {
            external_id: this.getCurrentUserId(),
          });

          // Track page view
          fbq('track', 'PageView');

          this.fbq = fbq;
          // Reduce console noise in production
          if (process.env.NODE_ENV === 'development') {
            console.log('Facebook Pixel initialized');
          }
          resolve();
        };

        script.onerror = () => {
          reject(new Error('Failed to load Facebook Pixel script'));
        };

        document.head.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  }

  // PostHog initialization removed - now handled by instrumentation-client.js

  /**
   * Track custom event across all platforms
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.isInitialized || !this.consentGiven) {
      if (this.config.performance.enableBatching) {
        this.eventQueue.push(event);
      }
      return;
    }

    try {
      const eventData = {
        ...event.parameters,
        timestamp: event.timestamp || Date.now(),
        session_id: event.sessionId || `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        device_id: event.deviceId
      };

      // Google Analytics 4
      if (this.ga4) {
        this.ga4('event', event.name, eventData);
      }

      // Facebook Pixel
      if (this.fbq) {
        this.fbq('track', event.name, eventData);
      }

      // PostHog
      if (this.posthog) {
        this.posthog.capture(event.name, eventData);
      }

      // Event tracked silently to reduce console spam
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track page view across all platforms
   */
  trackPageView(url: string, title?: string, referrer?: string): void {
    const event: AnalyticsEvent = {
      name: 'page_view',
      parameters: {
        page_location: url,
        page_title: title || document.title,
        page_referrer: referrer || document.referrer,
      }
    };

    this.trackEvent(event);

    // Additional platform-specific tracking
    if (this.posthog) {
      this.posthog.capture('$pageview', {
        $current_url: url,
        $title: title || document.title,
        $referrer: referrer || document.referrer,
      });
    }
  }

  /**
   * Track conversion event
   */
  trackConversion(conversion: ConversionEvent): void {
    const event: AnalyticsEvent = {
      name: conversion.eventName,
      parameters: {
        value: conversion.value,
        currency: conversion.currency || 'GBP',
        transaction_id: conversion.transactionId,
        items: conversion.items
      }
    };

    this.trackEvent(event);

    // Enhanced Facebook Pixel conversion tracking
    if (this.fbq && conversion.value) {
      this.fbq('track', 'Purchase', {
        value: conversion.value,
        currency: conversion.currency || 'GBP',
        content_ids: conversion.items?.map(item => item.itemId),
        content_type: 'product',
        num_items: conversion.items?.length || 1
      });
    }
  }

  /**
   * Set user properties across all platforms
   */
  setUserProperties(properties: UserProperties): void {
    if (!this.isInitialized || !this.consentGiven) return;

    try {
      // Google Analytics 4
      if (this.ga4) {
        if (properties.userId) {
          this.ga4('config', this.config.googleAnalytics!.measurementId, {
            user_id: properties.userId
          });
        }

        this.ga4('set', {
          custom_parameter: properties
        });
      }

      // PostHog
      if (this.posthog) {
        if (properties.userId) {
          this.posthog.identify(properties.userId, properties);
        } else {
          this.posthog.people.set(properties);
        }
      }

      console.log('User properties set:', properties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Update consent status
   */
  updateConsent(granted: boolean): void {
    this.consentGiven = granted;
    
    // Store consent preference
    localStorage.setItem('analytics_consent', granted.toString());
    localStorage.setItem('analytics_consent_timestamp', Date.now().toString());

    if (granted && !this.isInitialized) {
      this.initialize();
    } else if (!granted) {
      this.clearTrackingData();
    }

    // Update Google Analytics consent
    if (this.ga4) {
      this.ga4('consent', 'update', {
        'analytics_storage': granted ? 'granted' : 'denied',
        'ad_storage': granted ? 'granted' : 'denied',
      });
    }

    // Update PostHog consent
    if (this.posthog) {
      if (granted) {
        this.posthog.opt_in_capturing();
      } else {
        this.posthog.opt_out_capturing();
      }
    }
  }

  /**
   * Check if user has given consent
   */
  private hasConsent(): boolean {
    const consent = localStorage.getItem('analytics_consent');
    return consent === 'true';
  }

  /**
   * Get current user ID from various sources
   */
  private getCurrentUserId(): string | undefined {
    // Try to get from session storage first
    const sessionUserId = sessionStorage.getItem('user_id');
    if (sessionUserId) return sessionUserId;

    // Try to get from local storage
    const localUserId = localStorage.getItem('user_id');
    if (localUserId) return localUserId;

    // Generate session-based ID if no user ID available
    const sessionId = sessionStorage.getItem('session_id');
    return sessionId || undefined;
  }

  /**
   * Start batch processing for events
   */
  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      this.flushEventQueue();
    }, this.config.performance.flushInterval);
  }

  /**
   * Flush queued events
   */
  private flushEventQueue(): void {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = this.eventQueue.splice(0, this.config.performance.batchSize);
    
    eventsToFlush.forEach(event => {
      this.trackEvent(event);
    });
  }

  /**
   * Clear all tracking data
   */
  private clearTrackingData(): void {
    // Clear Google Analytics cookies
    const gaCookies = document.cookie.split(';').filter(cookie => 
      cookie.trim().startsWith('_ga') || cookie.trim().startsWith('_gid')
    );
    
    gaCookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });

    // Clear Facebook Pixel data
    if (this.fbq) {
      this.fbq('consent', 'revoke');
    }

    // Clear PostHog data
    if (this.posthog) {
      this.posthog.reset();
    }

    console.log('Tracking data cleared');
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    return {
      isInitialized: this.isInitialized,
      consentGiven: this.consentGiven,
      queuedEvents: this.eventQueue.length,
      enabledServices: {
        googleAnalytics: this.config.googleAnalytics?.enabled && !!this.ga4,
        facebookPixel: this.config.facebookPixel?.enabled && !!this.fbq,
        postHog: this.config.postHog?.enabled && !!this.posthog
      }
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.flushEventQueue();
    this.isInitialized = false;
    this.ga4 = undefined;
    this.fbq = undefined;
    this.posthog = undefined;
  }
}

// Export singleton instance with global initialization guard
let thirdPartyAnalytics: ThirdPartyAnalyticsService;
let isGloballyInitialized = false;

export function getThirdPartyAnalytics(config?: Partial<ThirdPartyConfig>): ThirdPartyAnalyticsService {
  if (!thirdPartyAnalytics) {
    // Prevent duplicate initialization in development hot reload
    if (typeof window !== 'undefined' && (window as any).__thirdPartyAnalytics) {
      return (window as any).__thirdPartyAnalytics;
    }
    
    thirdPartyAnalytics = new ThirdPartyAnalyticsService(config);
    
    // Store globally to prevent hot reload duplicates
    if (typeof window !== 'undefined') {
      (window as any).__thirdPartyAnalytics = thirdPartyAnalytics;
    }
  }
  return thirdPartyAnalytics;
}

export { 
  ThirdPartyAnalyticsService, 
  type ThirdPartyConfig, 
  type AnalyticsEvent, 
  type ConversionEvent, 
  type UserProperties 
};