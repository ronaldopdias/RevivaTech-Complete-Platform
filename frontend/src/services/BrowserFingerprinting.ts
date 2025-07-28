/**
 * Browser Fingerprinting Service
 * 
 * Privacy-compliant device identification using FingerprintJS
 * with fallback methods and consent validation
 * 
 * Session 3 - RevivaTech Analytics Implementation
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Types for fingerprint data
export interface DeviceFingerprint {
  id: string;
  confidence: number;
  timestamp: number;
  components: {
    canvas?: string;
    webgl?: string;
    fonts?: string[];
    screen?: {
      width: number;
      height: number;
      pixelRatio: number;
    };
    timezone?: string;
    language?: string;
    platform?: string;
    cookiesEnabled?: boolean;
    localStorage?: boolean;
    sessionStorage?: boolean;
  };
  fallbackMethods?: {
    sessionId?: string;
    localStorage?: string;
    clientId?: string;
  };
}

export interface FingerprintOptions {
  timeout?: number;
  excludeComponents?: string[];
  enableFallback?: boolean;
  respectDNT?: boolean;
  consentRequired?: boolean;
}

export interface ConsentStatus {
  analytics: boolean;
  fingerprinting: boolean;
  timestamp: number;
}

/**
 * Privacy-compliant browser fingerprinting service
 */
export class BrowserFingerprintingService {
  private fpPromise: Promise<any> | null = null;
  private fallbackId: string | null = null;
  private consentStatus: ConsentStatus | null = null;

  constructor(private options: FingerprintOptions = {}) {
    this.options = {
      timeout: 1000,
      excludeComponents: [],
      enableFallback: true,
      respectDNT: true,
      consentRequired: true,
      ...options
    };
  }

  /**
   * Initialize FingerprintJS
   */
  private async initializeFingerprinting(): Promise<any> {
    if (!this.fpPromise) {
      this.fpPromise = FingerprintJS.load();
    }
    return this.fpPromise;
  }

  /**
   * Check if user has consented to fingerprinting
   */
  private async checkConsent(): Promise<boolean> {
    if (!this.options.consentRequired) return true;

    // Check consent from privacy service
    const consent = localStorage.getItem('revivatech-privacy-consent');
    if (!consent) return false;

    try {
      const consentData = JSON.parse(consent);
      this.consentStatus = consentData;
      return consentData.analytics && consentData.fingerprinting;
    } catch (e) {
      console.warn('Failed to parse consent data:', e);
      return false;
    }
  }

  /**
   * Check if user has Do Not Track enabled
   */
  private checkDNT(): boolean {
    if (!this.options.respectDNT) return false;
    
    return navigator.doNotTrack === '1' || 
           navigator.doNotTrack === 'yes' || 
           (window as any).doNotTrack === '1';
  }

  /**
   * Generate fallback identifier when fingerprinting is not allowed
   */
  private generateFallbackId(): string {
    if (this.fallbackId) return this.fallbackId;

    // Try localStorage first
    const storageKey = 'revivatech-device-id';
    let fallbackId = localStorage.getItem(storageKey);
    
    if (!fallbackId) {
      // Generate random ID with timestamp
      fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        localStorage.setItem(storageKey, fallbackId);
      } catch (e) {
        console.warn('Failed to store fallback ID:', e);
      }
    }

    this.fallbackId = fallbackId;
    return fallbackId;
  }

  /**
   * Generate session-based identifier
   */
  private generateSessionId(): string {
    const sessionKey = 'revivatech-session-id';
    let sessionId = sessionStorage.getItem(sessionKey);
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        sessionStorage.setItem(sessionKey, sessionId);
      } catch (e) {
        console.warn('Failed to store session ID:', e);
      }
    }
    
    return sessionId;
  }

  /**
   * Get basic device information without fingerprinting
   */
  private getBasicDeviceInfo(): DeviceFingerprint['components'] {
    return {
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio || 1
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage
    };
  }

  /**
   * Generate device fingerprint with privacy compliance
   */
  async generateFingerprint(): Promise<DeviceFingerprint> {
    const timestamp = Date.now();
    
    // Check consent and DNT
    const hasConsent = await this.checkConsent();
    const dntEnabled = this.checkDNT();
    
    if (!hasConsent || dntEnabled) {
      // Use fallback methods only
      const fallbackId = this.generateFallbackId();
      const sessionId = this.generateSessionId();
      
      return {
        id: fallbackId,
        confidence: 0.3, // Low confidence for fallback
        timestamp,
        components: this.getBasicDeviceInfo(),
        fallbackMethods: {
          sessionId,
          localStorage: fallbackId,
          clientId: `client_${timestamp}`
        }
      };
    }

    try {
      // Initialize FingerprintJS
      const fp = await this.initializeFingerprinting();
      
      // Get fingerprint with timeout
      const result = await Promise.race([
        fp.get({
          excludes: this.options.excludeComponents
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fingerprint timeout')), this.options.timeout)
        )
      ]);

      // Build comprehensive fingerprint
      const fingerprint: DeviceFingerprint = {
        id: result.visitorId,
        confidence: result.confidence?.score || 0.9,
        timestamp,
        components: {
          canvas: result.components.canvas?.value,
          webgl: result.components.webgl?.value,
          fonts: result.components.fonts?.value,
          screen: {
            width: result.components.screenResolution?.value?.width || screen.width,
            height: result.components.screenResolution?.value?.height || screen.height,
            pixelRatio: window.devicePixelRatio || 1
          },
          timezone: result.components.timezone?.value,
          language: result.components.languages?.value?.[0] || navigator.language,
          platform: result.components.platform?.value,
          cookiesEnabled: result.components.cookiesEnabled?.value,
          localStorage: !!window.localStorage,
          sessionStorage: !!window.sessionStorage
        }
      };

      // Add fallback methods if enabled
      if (this.options.enableFallback) {
        fingerprint.fallbackMethods = {
          sessionId: this.generateSessionId(),
          localStorage: this.generateFallbackId(),
          clientId: `client_${timestamp}`
        };
      }

      return fingerprint;

    } catch (error) {
      console.warn('Fingerprinting failed, using fallback:', error);
      
      // Fallback to basic identification
      const fallbackId = this.generateFallbackId();
      const sessionId = this.generateSessionId();
      
      return {
        id: fallbackId,
        confidence: 0.5, // Medium confidence for error fallback
        timestamp,
        components: this.getBasicDeviceInfo(),
        fallbackMethods: {
          sessionId,
          localStorage: fallbackId,
          clientId: `client_${timestamp}`
        }
      };
    }
  }

  /**
   * Update consent status
   */
  updateConsent(consent: ConsentStatus): void {
    this.consentStatus = consent;
  }

  /**
   * Clear stored fingerprint data
   */
  clearFingerprint(): void {
    this.fallbackId = null;
    this.fpPromise = null;
    
    // Clear storage
    try {
      localStorage.removeItem('revivatech-device-id');
      sessionStorage.removeItem('revivatech-session-id');
    } catch (e) {
      console.warn('Failed to clear fingerprint data:', e);
    }
  }

  /**
   * Get cached fingerprint if available
   */
  getCachedFingerprint(): DeviceFingerprint | null {
    const cached = localStorage.getItem('revivatech-cached-fingerprint');
    if (!cached) return null;

    try {
      const data = JSON.parse(cached);
      const age = Date.now() - data.timestamp;
      
      // Cache valid for 24 hours
      if (age < 24 * 60 * 60 * 1000) {
        return data;
      }
    } catch (e) {
      console.warn('Failed to parse cached fingerprint:', e);
    }

    return null;
  }

  /**
   * Cache fingerprint for future use
   */
  private cacheFingerprint(fingerprint: DeviceFingerprint): void {
    try {
      localStorage.setItem('revivatech-cached-fingerprint', JSON.stringify(fingerprint));
    } catch (e) {
      console.warn('Failed to cache fingerprint:', e);
    }
  }

  /**
   * Get device fingerprint with caching
   */
  async getDeviceFingerprint(): Promise<DeviceFingerprint> {
    // Check cache first
    const cached = this.getCachedFingerprint();
    if (cached) return cached;

    // Generate new fingerprint
    const fingerprint = await this.generateFingerprint();
    
    // Cache if consent given
    if (this.consentStatus?.fingerprinting) {
      this.cacheFingerprint(fingerprint);
    }

    return fingerprint;
  }

  /**
   * Validate fingerprint accuracy
   */
  validateFingerprint(fingerprint: DeviceFingerprint): boolean {
    return fingerprint.confidence > 0.7 && 
           fingerprint.id && 
           fingerprint.id.length > 0 &&
           fingerprint.timestamp > 0;
  }

  /**
   * Get fingerprint statistics
   */
  getStatistics(): {
    accuracy: number;
    fallbackRate: number;
    cacheHitRate: number;
    lastGenerated: number;
  } {
    const stats = localStorage.getItem('revivatech-fingerprint-stats');
    if (!stats) {
      return {
        accuracy: 0,
        fallbackRate: 0,
        cacheHitRate: 0,
        lastGenerated: 0
      };
    }

    try {
      return JSON.parse(stats);
    } catch (e) {
      console.warn('Failed to parse fingerprint statistics:', e);
      return {
        accuracy: 0,
        fallbackRate: 0,
        cacheHitRate: 0,
        lastGenerated: 0
      };
    }
  }
}

// Export singleton instance
export const browserFingerprintingService = new BrowserFingerprintingService({
  timeout: 2000,
  enableFallback: true,
  respectDNT: true,
  consentRequired: true
});

export default browserFingerprintingService;