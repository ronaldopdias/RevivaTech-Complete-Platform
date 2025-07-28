// Client-side fingerprinting utility
// Privacy-compliant browser fingerprinting for device identification
'use client';

export interface FingerprintData {
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
}

export interface BehaviorTracker {
  sessionId: string;
  startTime: Date;
  events: BehaviorEvent[];
}

export interface BehaviorEvent {
  type: 'page_view' | 'click' | 'scroll' | 'form_focus' | 'form_submit' | 'exit_intent' | 'rage_click' | 'conversion';
  name: string;
  properties: Record<string, any>;
  pageUrl: string;
  referrer?: string;
}

class FingerprintingClient {
  private sessionId: string;
  private tracker: BehaviorTracker;
  private fingerprint: FingerprintData | null = null;
  private eventQueue: BehaviorEvent[] = [];
  private isTracking = false;
  private consentGiven = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.tracker = {
      sessionId: this.sessionId,
      startTime: new Date(),
      events: [],
    };

    // Check for consent
    this.checkConsent();
    
    // Initialize if consent given
    if (this.consentGiven) {
      this.initialize();
    }
  }

  // Initialize fingerprinting and tracking
  public async initialize(): Promise<void> {
    if (!this.consentGiven) {
      console.log('Fingerprinting requires user consent');
      return;
    }

    try {
      // Generate fingerprint
      this.fingerprint = await this.generateFingerprint();
      
      // Start behavior tracking
      this.startBehaviorTracking();
      
      // Send initial page view
      this.trackEvent({
        type: 'page_view',
        name: 'page_view',
        properties: {
          title: document.title,
          url: window.location.href,
          referrer: document.referrer,
        },
        pageUrl: window.location.href,
        referrer: document.referrer || undefined,
      });

      console.log('Fingerprinting client initialized');
    } catch (error) {
      console.error('Failed to initialize fingerprinting:', error);
    }
  }

  // Generate device fingerprint
  public async generateFingerprint(): Promise<FingerprintData> {
    const fingerprint: FingerprintData = {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
      touchSupport: 'ontouchstart' in window,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
    };

    // Enhanced fingerprinting (optional)
    try {
      fingerprint.canvas = await this.getCanvasFingerprint();
      fingerprint.webgl = await this.getWebGLFingerprint();
      fingerprint.audio = await this.getAudioFingerprint();
      fingerprint.fonts = await this.getAvailableFonts();
      fingerprint.plugins = this.getPlugins();
    } catch (error) {
      console.warn('Enhanced fingerprinting failed:', error);
    }

    return fingerprint;
  }

  // Start behavior tracking
  public startBehaviorTracking(): void {
    if (this.isTracking || !this.consentGiven) return;

    this.isTracking = true;

    // Click tracking
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    // Scroll tracking
    window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 1000), { passive: true });
    
    // Form interactions
    document.addEventListener('focusin', this.handleFormFocus.bind(this), true);
    document.addEventListener('submit', this.handleFormSubmit.bind(this), true);
    
    // Exit intent (desktop only)
    if (!this.isMobile()) {
      document.addEventListener('mouseleave', this.handleExitIntent.bind(this));
    }

    // Page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Before unload
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    console.log('Behavior tracking started');
  }

  // Stop behavior tracking
  public stopBehaviorTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;

    // Remove event listeners
    document.removeEventListener('click', this.handleClick.bind(this), true);
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('focusin', this.handleFormFocus.bind(this), true);
    document.removeEventListener('submit', this.handleFormSubmit.bind(this), true);
    document.removeEventListener('mouseleave', this.handleExitIntent.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    console.log('Behavior tracking stopped');
  }

  // Track custom event
  public trackEvent(event: Omit<BehaviorEvent, 'pageUrl'> & { pageUrl?: string }): void {
    if (!this.consentGiven) return;

    const behaviorEvent: BehaviorEvent = {
      ...event,
      pageUrl: event.pageUrl || window.location.href,
    };

    this.tracker.events.push(behaviorEvent);
    this.eventQueue.push(behaviorEvent);

    // Send events in batches
    if (this.eventQueue.length >= 5) {
      this.sendEvents();
    }
  }

  // Track conversion
  public trackConversion(value?: number, category?: string): void {
    this.trackEvent({
      type: 'conversion',
      name: 'conversion',
      properties: {
        value,
        category,
        timestamp: Date.now(),
      },
    });

    // Send immediately for conversions
    this.sendEvents();
  }

  // Get fingerprint data
  public getFingerprint(): FingerprintData | null {
    return this.fingerprint;
  }

  // Get session ID
  public getSessionId(): string {
    return this.sessionId;
  }

  // Set user consent
  public setConsent(consent: boolean): void {
    this.consentGiven = consent;
    localStorage.setItem('fingerprint_consent', consent ? 'true' : 'false');

    if (consent && !this.isTracking) {
      this.initialize();
    } else if (!consent && this.isTracking) {
      this.stopBehaviorTracking();
    }
  }

  // Check if user has given consent
  public hasConsent(): boolean {
    return this.consentGiven;
  }

  // Private methods

  private checkConsent(): void {
    const stored = localStorage.getItem('fingerprint_consent');
    this.consentGiven = stored === 'true';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getCanvasFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    canvas.width = 200;
    canvas.height = 50;
    
    // Draw text
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('RevivaTech Fingerprint 🔧', 2, 2);
    
    // Draw colored rectangle
    ctx.fillStyle = '#007AFF';
    ctx.fillRect(100, 10, 50, 20);
    
    return canvas.toDataURL();
  }

  private async getWebGLFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return '';

    const vendor = gl.getParameter(gl.VENDOR);
    const renderer = gl.getParameter(gl.RENDERER);
    const version = gl.getParameter(gl.VERSION);
    
    return `${vendor}|${renderer}|${version}`;
  }

  private async getAudioFingerprint(): Promise<string> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gain = audioContext.createGain();
      
      oscillator.type = 'triangle';
      oscillator.frequency.value = 1000;
      
      gain.gain.value = 0; // Mute
      
      oscillator.connect(analyser);
      analyser.connect(gain);
      gain.connect(audioContext.destination);
      
      oscillator.start();
      
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buffer);
      
      oscillator.stop();
      audioContext.close();
      
      return Array.from(buffer).join(',');
    } catch (error) {
      return '';
    }
  }

  private async getAvailableFonts(): Promise<string[]> {
    const testFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
      'Georgia', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact',
      'Lucida Sans Unicode', 'Tahoma', 'Geneva', 'Lucida Console', 'Monaco',
      'Palatino', 'Garamond', 'Bookman', 'Avant Garde', 'Century Gothic',
    ];

    const available: string[] = [];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '12px';
    const baseFont = 'monospace';

    // Create test element
    const element = document.createElement('span');
    element.style.fontSize = testSize;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.textContent = testString;
    document.body.appendChild(element);

    // Get baseline measurements
    element.style.fontFamily = baseFont;
    const baselineWidth = element.offsetWidth;
    const baselineHeight = element.offsetHeight;

    // Test each font
    for (const font of testFonts) {
      element.style.fontFamily = `${font}, ${baseFont}`;
      const newWidth = element.offsetWidth;
      const newHeight = element.offsetHeight;

      if (newWidth !== baselineWidth || newHeight !== baselineHeight) {
        available.push(font);
      }
    }

    document.body.removeChild(element);
    return available;
  }

  private getPlugins(): string[] {
    const plugins: string[] = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      plugins.push(navigator.plugins[i].name);
    }
    return plugins;
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const properties: any = {
      x: event.clientX,
      y: event.clientY,
      target: this.getElementSelector(target),
      timestamp: Date.now(),
    };

    // Check for rage clicks
    const recentClicks = this.tracker.events
      .filter(e => e.type === 'click' && Date.now() - (e.properties.timestamp || 0) < 5000)
      .length;

    if (recentClicks >= 2) {
      this.trackEvent({
        type: 'rage_click',
        name: 'rage_click',
        properties: { ...properties, clickCount: recentClicks + 1 },
      });
    } else {
      this.trackEvent({
        type: 'click',
        name: 'click',
        properties,
      });
    }
  }

  private handleScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);

    this.trackEvent({
      type: 'scroll',
      name: 'scroll',
      properties: {
        scrollTop,
        scrollPercent,
        direction: scrollTop > (this.tracker.events.slice(-1)[0]?.properties?.scrollTop || 0) ? 'down' : 'up',
        timestamp: Date.now(),
      },
    });
  }

  private handleFormFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      this.trackEvent({
        type: 'form_focus',
        name: 'form_focus',
        properties: {
          field: this.getElementSelector(target),
          fieldType: (target as HTMLInputElement).type || target.tagName.toLowerCase(),
          timestamp: Date.now(),
        },
      });
    }
  }

  private handleFormSubmit(event: SubmitEvent): void {
    const form = event.target as HTMLFormElement;
    this.trackEvent({
      type: 'form_submit',
      name: 'form_submit',
      properties: {
        form: this.getElementSelector(form),
        timestamp: Date.now(),
      },
    });
  }

  private handleExitIntent(event: MouseEvent): void {
    if (event.clientY <= 0) {
      this.trackEvent({
        type: 'exit_intent',
        name: 'exit_intent',
        properties: {
          timestamp: Date.now(),
        },
      });
    }
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.sendEvents(); // Send any queued events before tab becomes hidden
    }
  }

  private handleBeforeUnload(): void {
    this.sendEvents(); // Send final events before page unload
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private throttle(func: Function, limit: number): Function {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  private async sendEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.consentGiven) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          fingerprint: this.fingerprint,
          events,
        }),
      });
    } catch (error) {
      console.error('Failed to send events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }
}

// Export singleton instance
export const fingerprintingClient = new FingerprintingClient();

// Utility function to initialize fingerprinting with consent
export function initializeFingerprinting(consent: boolean = false): void {
  fingerprintingClient.setConsent(consent);
}

// Utility function to track conversions
export function trackConversion(value?: number, category?: string): void {
  fingerprintingClient.trackConversion(value, category);
}

// Utility function to track custom events
export function trackCustomEvent(
  type: BehaviorEvent['type'],
  name: string,
  properties: Record<string, any> = {}
): void {
  fingerprintingClient.trackEvent({
    type,
    name,
    properties,
  });
}