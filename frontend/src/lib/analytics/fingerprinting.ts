/**
 * Customer Intelligence Fingerprinting Service
 * Privacy-compliant browser fingerprinting for customer tracking
 * Part of Phase 8 R1.1 implementation
 */

interface FingerprintData {
  deviceId: string;
  sessionId: string;
  timestamp: number;
  characteristics: {
    screen: {
      width: number;
      height: number;
      colorDepth: number;
      pixelRatio: number;
    };
    navigator: {
      userAgent: string;
      language: string;
      platform: string;
      cookieEnabled: boolean;
      doNotTrack: boolean;
    };
    browser: {
      name: string;
      version: string;
      engine: string;
    };
    device: {
      type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
      vendor: string;
      model: string;
    };
    features: {
      canvas: string;
      webgl: string;
      audio: string;
      fonts: string[];
      plugins: string[];
      timezone: string;
    };
    network: {
      connectionType: string;
      effectiveType: string;
      downlink: number;
    };
    performance: {
      hardwareConcurrency: number;
      deviceMemory: number;
    };
  };
  privacy: {
    consentGiven: boolean;
    fingerprinting: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

interface FingerprintConfig {
  enableCanvasFingerprinting: boolean;
  enableWebGLFingerprinting: boolean;
  enableAudioFingerprinting: boolean;
  enableFontDetection: boolean;
  respectDoNotTrack: boolean;
  consentRequired: boolean;
  fallbackToSession: boolean;
}

class CustomerFingerprintingService {
  private config: FingerprintConfig;
  private fingerprint: FingerprintData | null = null;
  private sessionId: string;
  private consentManager: ConsentManager;

  constructor(config: Partial<FingerprintConfig> = {}) {
    this.config = {
      enableCanvasFingerprinting: true,
      enableWebGLFingerprinting: true,
      enableAudioFingerprinting: false, // More privacy-friendly default
      enableFontDetection: true,
      respectDoNotTrack: true,
      consentRequired: true,
      fallbackToSession: true,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.consentManager = new ConsentManager();
  }

  /**
   * Generate or retrieve customer fingerprint
   */
  async generateFingerprint(): Promise<FingerprintData> {
    // Check privacy consent
    if (this.config.consentRequired && !await this.consentManager.hasConsent('analytics')) {
      if (this.config.fallbackToSession) {
        return this.generateSessionOnlyFingerprint();
      }
      throw new Error('Analytics consent required for fingerprinting');
    }

    // Respect Do Not Track
    if (this.config.respectDoNotTrack && navigator.doNotTrack === '1') {
      return this.generateSessionOnlyFingerprint();
    }

    const characteristics = await this.collectDeviceCharacteristics();
    const deviceId = await this.calculateDeviceId(characteristics);

    this.fingerprint = {
      deviceId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      characteristics,
      privacy: {
        consentGiven: await this.consentManager.hasConsent('analytics'),
        fingerprinting: await this.consentManager.hasConsent('fingerprinting'),
        analytics: await this.consentManager.hasConsent('analytics'),
        marketing: await this.consentManager.hasConsent('marketing')
      }
    };

    // Store in session storage for consistency
    this.storeFingerprint();

    return this.fingerprint;
  }

  /**
   * Get existing fingerprint or generate new one
   */
  async getFingerprint(): Promise<FingerprintData> {
    if (this.fingerprint) {
      return this.fingerprint;
    }

    // Try to load from storage first
    const stored = this.loadStoredFingerprint();
    if (stored) {
      this.fingerprint = stored;
      return stored;
    }

    return this.generateFingerprint();
  }

  /**
   * Collect comprehensive device characteristics
   */
  private async collectDeviceCharacteristics(): Promise<FingerprintData['characteristics']> {
    const screen = this.getScreenCharacteristics();
    const navigator = this.getNavigatorCharacteristics();
    const browser = this.getBrowserCharacteristics();
    const device = this.getDeviceCharacteristics();
    const features = await this.getAdvancedFeatures();
    const network = this.getNetworkCharacteristics();
    const performance = this.getPerformanceCharacteristics();

    return {
      screen,
      navigator,
      browser,
      device,
      features,
      network,
      performance
    };
  }

  /**
   * Screen characteristics
   */
  private getScreenCharacteristics() {
    return {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  /**
   * Navigator characteristics
   */
  private getNavigatorCharacteristics() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1'
    };
  }

  /**
   * Browser detection
   */
  private getBrowserCharacteristics() {
    const ua = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';

    // Browser detection logic
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      name = 'Chrome';
      version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
      engine = 'Blink';
    } else if (ua.includes('Firefox')) {
      name = 'Firefox';
      version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
      engine = 'Gecko';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      name = 'Safari';
      version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
      engine = 'WebKit';
    } else if (ua.includes('Edg')) {
      name = 'Edge';
      version = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
      engine = 'Blink';
    }

    return { name, version, engine };
  }

  /**
   * Device type detection
   */
  private getDeviceCharacteristics() {
    const ua = navigator.userAgent;
    let type: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
    let vendor = 'Unknown';
    let model = 'Unknown';

    // Device type detection
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      if (/iPad|Android(?!.*Mobile)/i.test(ua)) {
        type = 'tablet';
      } else {
        type = 'mobile';
      }
    } else {
      type = 'desktop';
    }

    // Vendor detection
    if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('Mac')) {
      vendor = 'Apple';
    } else if (ua.includes('Android')) {
      vendor = 'Google';
    } else if (ua.includes('Windows')) {
      vendor = 'Microsoft';
    }

    return { type, vendor, model };
  }

  /**
   * Advanced fingerprinting features
   */
  private async getAdvancedFeatures(): Promise<FingerprintData['characteristics']['features']> {
    const features = {
      canvas: '',
      webgl: '',
      audio: '',
      fonts: [] as string[],
      plugins: [] as string[],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Canvas fingerprinting (if enabled)
    if (this.config.enableCanvasFingerprinting) {
      features.canvas = await this.getCanvasFingerprint();
    }

    // WebGL fingerprinting (if enabled)
    if (this.config.enableWebGLFingerprinting) {
      features.webgl = await this.getWebGLFingerprint();
    }

    // Audio fingerprinting (if enabled)
    if (this.config.enableAudioFingerprinting) {
      features.audio = await this.getAudioFingerprint();
    }

    // Font detection (if enabled)
    if (this.config.enableFontDetection) {
      features.fonts = await this.detectFonts();
    }

    // Plugin detection
    features.plugins = this.getPlugins();

    return features;
  }

  /**
   * Canvas fingerprinting
   */
  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      canvas.width = 200;
      canvas.height = 50;

      // Draw text with different fonts and colors
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('RevivaTech Analytics 🔧', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Customer Intelligence', 4, 35);

      return canvas.toDataURL().substring(0, 100); // Truncate for storage efficiency
    } catch (error) {
      console.warn('Canvas fingerprinting failed:', error);
      return '';
    }
  }

  /**
   * WebGL fingerprinting
   */
  private async getWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';

      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      const version = gl.getParameter(gl.VERSION);

      return `${vendor}-${renderer}-${version}`.substring(0, 100);
    } catch (error) {
      console.warn('WebGL fingerprinting failed:', error);
      return '';
    }
  }

  /**
   * Audio fingerprinting (privacy-sensitive - disabled by default)
   */
  private async getAudioFingerprint(): Promise<string> {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) return '';
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      oscillator.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(0);
      oscillator.stop(0.1);

      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData);

      await audioContext.close();

      return Array.from(frequencyData).slice(0, 20).join(',');
    } catch (error) {
      console.warn('Audio fingerprinting failed:', error);
      return '';
    }
  }

  /**
   * Font detection
   */
  private async detectFonts(): Promise<string[]> {
    const baseFonts = ['Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia'];
    const testFonts = [
      'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Century Gothic',
      'Comic Sans MS', 'Consolas', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
      'Palatino Linotype', 'Tahoma', 'Trebuchet MS', 'Monaco', 'Menlo'
    ];

    const detectedFonts: string[] = [];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';

    // Create test element
    const testElement = document.createElement('span');
    testElement.style.fontSize = testSize;
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.top = '-9999px';
    testElement.style.visibility = 'hidden';
    testElement.textContent = testString;
    document.body.appendChild(testElement);

    try {
      // Get base measurements
      const baseMeasurements: { [key: string]: { width: number; height: number } } = {};
      
      for (const baseFont of baseFonts) {
        testElement.style.fontFamily = baseFont;
        baseMeasurements[baseFont] = {
          width: testElement.offsetWidth,
          height: testElement.offsetHeight
        };
      }

      // Test each font
      for (const font of testFonts) {
        for (const baseFont of baseFonts) {
          testElement.style.fontFamily = `${font}, ${baseFont}`;
          
          const measurements = {
            width: testElement.offsetWidth,
            height: testElement.offsetHeight
          };

          if (
            measurements.width !== baseMeasurements[baseFont].width ||
            measurements.height !== baseMeasurements[baseFont].height
          ) {
            detectedFonts.push(font);
            break;
          }
        }
      }
    } finally {
      document.body.removeChild(testElement);
    }

    return detectedFonts;
  }

  /**
   * Plugin detection
   */
  private getPlugins(): string[] {
    const plugins: string[] = [];
    
    if (navigator.plugins) {
      for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name);
      }
    }

    return plugins.slice(0, 10); // Limit to first 10 for privacy
  }

  /**
   * Network characteristics
   */
  private getNetworkCharacteristics() {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

    return {
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0
    };
  }

  /**
   * Performance characteristics
   */
  private getPerformanceCharacteristics() {
    return {
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || 0
    };
  }

  /**
   * Calculate device ID from characteristics
   */
  private async calculateDeviceId(characteristics: FingerprintData['characteristics']): Promise<string> {
    const fingerprint = JSON.stringify(characteristics);
    
    // Use Web Crypto API for hashing if available
    if (window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprint);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
      } catch (error) {
        console.warn('Crypto API failed, falling back to simple hash');
      }
    }

    // Fallback to simple hash
    return this.simpleHash(fingerprint).substring(0, 32);
  }

  /**
   * Simple hash function fallback
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Generate session-only fingerprint for privacy compliance
   */
  private generateSessionOnlyFingerprint(): FingerprintData {
    return {
      deviceId: `session_${this.sessionId}`,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      characteristics: {
        screen: { width: 0, height: 0, colorDepth: 0, pixelRatio: 1 },
        navigator: { userAgent: '', language: '', platform: '', cookieEnabled: false, doNotTrack: true },
        browser: { name: 'Unknown', version: 'Unknown', engine: 'Unknown' },
        device: { type: 'unknown', vendor: 'Unknown', model: 'Unknown' },
        features: { canvas: '', webgl: '', audio: '', fonts: [], plugins: [], timezone: '' },
        network: { connectionType: 'unknown', effectiveType: 'unknown', downlink: 0 },
        performance: { hardwareConcurrency: 0, deviceMemory: 0 }
      },
      privacy: {
        consentGiven: false,
        fingerprinting: false,
        analytics: false,
        marketing: false
      }
    };
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${randomStr}`;
  }

  /**
   * Store fingerprint in session storage
   */
  private storeFingerprint(): void {
    if (this.fingerprint) {
      try {
        sessionStorage.setItem('revivatech_fingerprint', JSON.stringify(this.fingerprint));
      } catch (error) {
        console.warn('Failed to store fingerprint:', error);
      }
    }
  }

  /**
   * Load stored fingerprint
   */
  private loadStoredFingerprint(): FingerprintData | null {
    try {
      const stored = sessionStorage.getItem('revivatech_fingerprint');
      if (stored) {
        const fingerprint = JSON.parse(stored);
        // Check if fingerprint is still valid (within session)
        if (fingerprint.sessionId === this.sessionId) {
          return fingerprint;
        }
      }
    } catch (error) {
      console.warn('Failed to load stored fingerprint:', error);
    }
    return null;
  }

  /**
   * Update privacy consent
   */
  async updateConsent(type: 'analytics' | 'fingerprinting' | 'marketing', granted: boolean): Promise<void> {
    await this.consentManager.setConsent(type, granted);
    
    // Regenerate fingerprint if consent changed
    if (this.fingerprint) {
      this.fingerprint.privacy[type] = granted;
      this.storeFingerprint();
    }
  }

  /**
   * Clear fingerprint data
   */
  clearFingerprint(): void {
    this.fingerprint = null;
    try {
      sessionStorage.removeItem('revivatech_fingerprint');
    } catch (error) {
      console.warn('Failed to clear fingerprint:', error);
    }
  }
}

/**
 * Consent Management (placeholder - integrate with your consent system)
 */
class ConsentManager {
  async hasConsent(type: 'analytics' | 'fingerprinting' | 'marketing'): Promise<boolean> {
    // TODO: Integrate with your actual consent management system
    const consent = localStorage.getItem(`consent_${type}`);
    return consent === 'true';
  }

  async setConsent(type: 'analytics' | 'fingerprinting' | 'marketing', granted: boolean): Promise<void> {
    localStorage.setItem(`consent_${type}`, granted.toString());
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

export { CustomerFingerprintingService, type FingerprintData, type FingerprintConfig };