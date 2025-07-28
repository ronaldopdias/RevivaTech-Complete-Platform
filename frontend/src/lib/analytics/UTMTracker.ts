/**
 * UTM Campaign Tracking System
 * RevivaTech Visitor Intelligence System
 * 
 * Comprehensive UTM parameter tracking with multi-touch attribution
 * and campaign performance analytics
 */

import { utmConfig, customDimensions, conversionConfig } from '@/config/analytics.config';

interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string; // Google Ads campaign ID
}

interface CampaignAttribution {
  firstTouch: CampaignTouch | null;
  lastTouch: CampaignTouch | null;
  touches: CampaignTouch[];
  totalTouches: number;
  campaignJourney: string[];
  attributionModel: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';
}

interface CampaignTouch {
  timestamp: number;
  utm: UTMParameters;
  pageUrl: string;
  referrer: string;
  sessionId: string;
  deviceId: string;
  touchType: 'paid' | 'organic' | 'direct' | 'referral' | 'email' | 'social';
  campaignWeight?: number; // For weighted attribution models
}

interface CampaignPerformance {
  campaignId: string;
  source: string;
  medium: string;
  name: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  costPerClick?: number;
  returnOnAdSpend?: number;
}

interface TrafficSource {
  source: string;
  medium: string;
  campaign?: string;
  referrer?: string;
  type: 'organic' | 'paid' | 'direct' | 'referral' | 'email' | 'social' | 'unknown';
  weight: number; // For attribution modeling
}

class UTMTrackingService {
  private readonly STORAGE_KEY = 'revivatech_utm_attribution';
  private readonly ATTRIBUTION_WINDOW = 30 * 24 * 60 * 60 * 1000; // 30 days
  private currentAttribution: CampaignAttribution | null = null;

  constructor() {
    this.loadStoredAttribution();
    this.trackCurrentVisit();
  }

  /**
   * Extract UTM parameters from URL
   */
  extractUTMParameters(url?: string): UTMParameters {
    const targetUrl = url || window.location.href;
    const urlParams = new URL(targetUrl).searchParams;
    
    const utm: UTMParameters = {};
    
    utmConfig.parameters.forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        utm[param as keyof UTMParameters] = decodeURIComponent(value);
      }
    });

    // Also check for gclid (Google Click ID)
    const gclid = urlParams.get('gclid');
    if (gclid) {
      utm.utm_source = utm.utm_source || 'google';
      utm.utm_medium = utm.utm_medium || 'cpc';
      utm.utm_id = gclid;
    }

    // Facebook Click ID
    const fbclid = urlParams.get('fbclid');
    if (fbclid) {
      utm.utm_source = utm.utm_source || 'facebook';
      utm.utm_medium = utm.utm_medium || 'cpc';
      utm.utm_id = fbclid;
    }

    return utm;
  }

  /**
   * Determine traffic source from referrer and UTM
   */
  determineTrafficSource(referrer: string, utm: UTMParameters): TrafficSource {
    // Direct traffic
    if (!referrer && Object.keys(utm).length === 0) {
      return {
        source: 'direct',
        medium: 'none',
        type: 'direct',
        weight: 1.0
      };
    }

    // UTM parameters present (paid/campaign traffic)
    if (utm.utm_source && utm.utm_medium) {
      const type = this.classifyTrafficType(utm.utm_source, utm.utm_medium);
      return {
        source: utm.utm_source,
        medium: utm.utm_medium,
        campaign: utm.utm_campaign,
        type,
        weight: type === 'paid' ? 1.2 : 1.0 // Give more weight to paid traffic
      };
    }

    // Referral traffic classification
    if (referrer) {
      const referrerDomain = this.extractDomain(referrer);
      const classifiedSource = this.classifyReferrer(referrerDomain);
      
      return {
        source: classifiedSource.source,
        medium: classifiedSource.medium,
        referrer: referrer,
        type: classifiedSource.type,
        weight: classifiedSource.weight
      };
    }

    return {
      source: 'unknown',
      medium: 'unknown',
      type: 'unknown',
      weight: 0.5
    };
  }

  /**
   * Track current visit and update attribution
   */
  trackCurrentVisit(): void {
    const utm = this.extractUTMParameters();
    const referrer = document.referrer;
    const currentUrl = window.location.href;
    const sessionId = this.getSessionId();
    const deviceId = this.getDeviceId();

    // Only track if there are UTM parameters or this is a new session
    if (Object.keys(utm).length > 0 || this.isNewSession()) {
      const trafficSource = this.determineTrafficSource(referrer, utm);
      
      const newTouch: CampaignTouch = {
        timestamp: Date.now(),
        utm,
        pageUrl: currentUrl,
        referrer,
        sessionId,
        deviceId,
        touchType: trafficSource.type,
        campaignWeight: trafficSource.weight
      };

      this.addCampaignTouch(newTouch);
      this.persistAttribution();
    }

    // Track page view with campaign data
    this.trackCampaignPageView(utm);
  }

  /**
   * Add a new campaign touch to attribution
   */
  private addCampaignTouch(touch: CampaignTouch): void {
    if (!this.currentAttribution) {
      this.currentAttribution = {
        firstTouch: touch,
        lastTouch: touch,
        touches: [touch],
        totalTouches: 1,
        campaignJourney: [this.touchToString(touch)],
        attributionModel: 'last_touch'
      };
    } else {
      // Clean up old touches outside attribution window
      const cutoffTime = Date.now() - this.ATTRIBUTION_WINDOW;
      this.currentAttribution.touches = this.currentAttribution.touches.filter(
        t => t.timestamp > cutoffTime
      );

      // Add new touch
      this.currentAttribution.touches.push(touch);
      this.currentAttribution.lastTouch = touch;
      this.currentAttribution.totalTouches++;
      this.currentAttribution.campaignJourney.push(this.touchToString(touch));

      // Update first touch if needed (within window)
      if (this.currentAttribution.touches.length > 0) {
        this.currentAttribution.firstTouch = this.currentAttribution.touches[0];
      }
    }
  }

  /**
   * Calculate attribution based on model
   */
  calculateAttribution(conversionValue: number, model: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' = 'last_touch'): Record<string, number> {
    if (!this.currentAttribution || this.currentAttribution.touches.length === 0) {
      return {};
    }

    const touches = this.currentAttribution.touches;
    const attribution: Record<string, number> = {};

    switch (model) {
      case 'first_touch':
        const firstTouch = touches[0];
        const firstKey = this.touchToAttributionKey(firstTouch);
        attribution[firstKey] = conversionValue;
        break;

      case 'last_touch':
        const lastTouch = touches[touches.length - 1];
        const lastKey = this.touchToAttributionKey(lastTouch);
        attribution[lastKey] = conversionValue;
        break;

      case 'linear':
        const linearValue = conversionValue / touches.length;
        touches.forEach(touch => {
          const key = this.touchToAttributionKey(touch);
          attribution[key] = (attribution[key] || 0) + linearValue;
        });
        break;

      case 'time_decay':
        const now = Date.now();
        let totalWeight = 0;
        
        // Calculate weights (more recent touches get higher weight)
        const weights = touches.map(touch => {
          const daysSince = (now - touch.timestamp) / (24 * 60 * 60 * 1000);
          return Math.exp(-daysSince / 7); // 7-day half-life
        });

        totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

        touches.forEach((touch, index) => {
          const key = this.touchToAttributionKey(touch);
          const weight = weights[index] / totalWeight;
          attribution[key] = (attribution[key] || 0) + (conversionValue * weight);
        });
        break;

      case 'position_based':
        // 40% first touch, 40% last touch, 20% middle touches
        if (touches.length === 1) {
          const key = this.touchToAttributionKey(touches[0]);
          attribution[key] = conversionValue;
        } else if (touches.length === 2) {
          const firstKey = this.touchToAttributionKey(touches[0]);
          const lastKey = this.touchToAttributionKey(touches[1]);
          attribution[firstKey] = conversionValue * 0.5;
          attribution[lastKey] = conversionValue * 0.5;
        } else {
          const firstKey = this.touchToAttributionKey(touches[0]);
          const lastKey = this.touchToAttributionKey(touches[touches.length - 1]);
          const middleValue = (conversionValue * 0.2) / (touches.length - 2);
          
          attribution[firstKey] = conversionValue * 0.4;
          attribution[lastKey] = conversionValue * 0.4;
          
          for (let i = 1; i < touches.length - 1; i++) {
            const middleKey = this.touchToAttributionKey(touches[i]);
            attribution[middleKey] = (attribution[middleKey] || 0) + middleValue;
          }
        }
        break;
    }

    return attribution;
  }

  /**
   * Track conversion with attribution
   */
  trackConversion(eventName: string, value?: number, currency: string = 'GBP'): void {
    const conversion = conversionConfig.events[eventName as keyof typeof conversionConfig.events];
    const conversionValue = value || conversion?.value || 0;

    if (!this.currentAttribution) return;

    // Calculate attribution for different models
    const attributions = {
      first_touch: this.calculateAttribution(conversionValue, 'first_touch'),
      last_touch: this.calculateAttribution(conversionValue, 'last_touch'),
      linear: this.calculateAttribution(conversionValue, 'linear'),
      time_decay: this.calculateAttribution(conversionValue, 'time_decay'),
      position_based: this.calculateAttribution(conversionValue, 'position_based')
    };

    // Track conversion event with attribution data
    const conversionData = {
      event_name: eventName,
      conversion_value: conversionValue,
      currency,
      attribution_models: attributions,
      campaign_journey: this.currentAttribution.campaignJourney,
      total_touches: this.currentAttribution.totalTouches,
      attribution_window_days: this.ATTRIBUTION_WINDOW / (24 * 60 * 60 * 1000),
      timestamp: Date.now()
    };

    // Send to analytics
    this.sendAnalyticsEvent('conversion_attributed', conversionData);

    console.log('Conversion tracked with attribution:', conversionData);
  }

  /**
   * Get current campaign attribution
   */
  getCurrentAttribution(): CampaignAttribution | null {
    return this.currentAttribution;
  }

  /**
   * Get campaign performance metrics
   */
  getCampaignPerformance(): CampaignPerformance[] {
    // This would typically be retrieved from your analytics database
    // For now, return structured data based on current attribution
    if (!this.currentAttribution) return [];

    const campaigns = new Map<string, CampaignPerformance>();

    this.currentAttribution.touches.forEach(touch => {
      const key = this.touchToAttributionKey(touch);
      const existing = campaigns.get(key) || {
        campaignId: key,
        source: touch.utm.utm_source || 'unknown',
        medium: touch.utm.utm_medium || 'unknown',
        name: touch.utm.utm_campaign || 'unknown',
        sessions: 0,
        users: 0,
        pageviews: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0
      };

      existing.sessions++;
      existing.pageviews++;
      campaigns.set(key, existing);
    });

    return Array.from(campaigns.values());
  }

  /**
   * Clear attribution data
   */
  clearAttribution(): void {
    this.currentAttribution = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Private helper methods

  private loadStoredAttribution(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Check if data is within attribution window
        const cutoffTime = Date.now() - this.ATTRIBUTION_WINDOW;
        if (data.lastTouch?.timestamp > cutoffTime) {
          this.currentAttribution = data;
        }
      }
    } catch (error) {
      console.warn('Failed to load stored attribution:', error);
    }
  }

  private persistAttribution(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentAttribution));
    } catch (error) {
      console.warn('Failed to persist attribution:', error);
    }
  }

  private classifyTrafficType(source: string, medium: string): CampaignTouch['touchType'] {
    const lowerSource = source.toLowerCase();
    const lowerMedium = medium.toLowerCase();

    if (lowerMedium.includes('cpc') || lowerMedium.includes('paid') || lowerMedium.includes('ppc')) {
      return 'paid';
    }

    if (lowerMedium.includes('email') || lowerSource.includes('email')) {
      return 'email';
    }

    if (lowerSource.includes('social') || lowerMedium.includes('social') || 
        ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok'].includes(lowerSource)) {
      return 'social';
    }

    if (lowerMedium.includes('organic')) {
      return 'organic';
    }

    if (lowerMedium.includes('referral')) {
      return 'referral';
    }

    return 'organic';
  }

  private classifyReferrer(domain: string): { source: string; medium: string; type: TrafficSource['type']; weight: number } {
    const lowerDomain = domain.toLowerCase();

    // Search engines
    if (lowerDomain.includes('google')) {
      return { source: 'google', medium: 'organic', type: 'organic', weight: 1.0 };
    }
    if (lowerDomain.includes('bing')) {
      return { source: 'bing', medium: 'organic', type: 'organic', weight: 0.9 };
    }
    if (lowerDomain.includes('yahoo')) {
      return { source: 'yahoo', medium: 'organic', type: 'organic', weight: 0.8 };
    }
    if (lowerDomain.includes('duckduckgo')) {
      return { source: 'duckduckgo', medium: 'organic', type: 'organic', weight: 0.9 };
    }

    // Social media
    if (lowerDomain.includes('facebook')) {
      return { source: 'facebook', medium: 'social', type: 'social', weight: 1.1 };
    }
    if (lowerDomain.includes('instagram')) {
      return { source: 'instagram', medium: 'social', type: 'social', weight: 1.1 };
    }
    if (lowerDomain.includes('twitter')) {
      return { source: 'twitter', medium: 'social', type: 'social', weight: 1.0 };
    }
    if (lowerDomain.includes('linkedin')) {
      return { source: 'linkedin', medium: 'social', type: 'social', weight: 0.9 };
    }

    // Default referral
    return { source: domain, medium: 'referral', type: 'referral', weight: 0.8 };
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  private touchToString(touch: CampaignTouch): string {
    if (touch.utm.utm_campaign) {
      return `${touch.utm.utm_source}/${touch.utm.utm_medium}/${touch.utm.utm_campaign}`;
    }
    return `${touch.utm.utm_source || 'direct'}/${touch.utm.utm_medium || 'none'}`;
  }

  private touchToAttributionKey(touch: CampaignTouch): string {
    return this.touchToString(touch);
  }

  private trackCampaignPageView(utm: UTMParameters): void {
    if (Object.keys(utm).length === 0) return;

    const pageViewData = {
      event_name: 'campaign_page_view',
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      utm_term: utm.utm_term,
      utm_id: utm.utm_id,
      page_url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now()
    };

    this.sendAnalyticsEvent('campaign_page_view', pageViewData);
  }

  private sendAnalyticsEvent(eventName: string, data: any): void {
    // Integration point with existing analytics system
    try {
      if (typeof window !== 'undefined' && (window as any).analyticsWS) {
        (window as any).analyticsWS.send(JSON.stringify({
          type: eventName,
          data,
          timestamp: Date.now()
        }));
      }

      // Also store locally for offline support
      const stored = localStorage.getItem('revivatech-utm-events') || '[]';
      const events = JSON.parse(stored);
      events.push({ eventName, data, timestamp: Date.now() });
      
      if (events.length > 50) {
        events.splice(0, events.length - 50);
      }
      
      localStorage.setItem('revivatech-utm-events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to send UTM analytics event:', error);
    }
  }

  private getSessionId(): string {
    return sessionStorage.getItem('revivatech_session_id') || 'unknown';
  }

  private getDeviceId(): string {
    return localStorage.getItem('revivatech_device_id') || sessionStorage.getItem('revivatech_device_id') || 'unknown';
  }

  private isNewSession(): boolean {
    const lastPageView = sessionStorage.getItem('last_page_view');
    return !lastPageView || (Date.now() - parseInt(lastPageView)) > 30 * 60 * 1000; // 30 minutes
  }
}

// Export singleton instance
let utmTracker: UTMTrackingService;

export function getUTMTracker(): UTMTrackingService {
  if (!utmTracker) {
    utmTracker = new UTMTrackingService();
  }
  return utmTracker;
}

export { 
  UTMTrackingService, 
  type UTMParameters, 
  type CampaignAttribution, 
  type CampaignTouch, 
  type CampaignPerformance,
  type TrafficSource 
};