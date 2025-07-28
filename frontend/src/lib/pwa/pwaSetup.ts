/**
 * PWA Setup and Service Worker Registration
 * Handles PWA installation, service worker management, and offline functionality
 */

export interface PWAInstallPrompt extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAManager {
  private installPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private async init() {
    // Check if already installed
    this.checkInstallStatus();
    
    // Register service worker
    await this.registerServiceWorker();
    
    // Listen for install prompt
    this.setupInstallPrompt();
    
    // Setup update notifications
    this.setupUpdateNotifications();
    
    // Setup background sync
    this.setupBackgroundSync();

    console.log('🚀 PWA Manager initialized');
  }

  // Register service worker
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        console.log('📱 PWA: Registering service worker...');
        
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('✅ PWA: Service worker registered successfully');

        // Handle service worker updates
        this.swRegistration.addEventListener('updatefound', () => {
          const newWorker = this.swRegistration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 PWA: New version available');
                this.showUpdateNotification();
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('💬 PWA: Message from SW:', event.data);
        });

      } catch (error) {
        console.error('❌ PWA: Service worker registration failed:', error);
      }
    }
  }

  // Setup install prompt handling
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('📱 PWA: Install prompt available');
      event.preventDefault();
      this.installPrompt = event as PWAInstallPrompt;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA: App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.trackInstallation();
    });
  }

  // Check if app is already installed
  private checkInstallStatus(): void {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('📱 PWA: Running in standalone mode (installed)');
    }

    // Check for iOS standalone mode
    if ((window.navigator as any).standalone === true) {
      this.isInstalled = true;
      console.log('📱 PWA: Running in iOS standalone mode');
    }
  }

  // Show install button
  private showInstallButton(): void {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'block';
      installBtn.addEventListener('click', () => this.promptInstall());
    }

    // Create floating install prompt if no button exists
    if (!installBtn && !this.isInstalled) {
      this.createFloatingInstallPrompt();
    }
  }

  // Hide install button
  private hideInstallButton(): void {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }

    const floatingPrompt = document.getElementById('pwa-floating-prompt');
    if (floatingPrompt) {
      floatingPrompt.remove();
    }
  }

  // Create floating install prompt
  private createFloatingInstallPrompt(): void {
    const prompt = document.createElement('div');
    prompt.id = 'pwa-floating-prompt';
    prompt.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #007AFF;
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,122,255,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 1000;
        max-width: 300px;
        animation: slideUp 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-weight: 600;">📱 Install RevivaTech</div>
          <button id="pwa-install-action" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
          ">Install</button>
          <button id="pwa-install-close" style="
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
          ">×</button>
        </div>
      </div>
    `;

    document.body.appendChild(prompt);

    // Add event listeners
    document.getElementById('pwa-install-action')?.addEventListener('click', () => {
      this.promptInstall();
    });

    document.getElementById('pwa-install-close')?.addEventListener('click', () => {
      prompt.remove();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (document.getElementById('pwa-floating-prompt')) {
        prompt.remove();
      }
    }, 10000);
  }

  // Prompt user to install
  public async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('⚠️ PWA: Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;
      
      console.log(`📱 PWA: Install prompt ${outcome}`);
      
      if (outcome === 'accepted') {
        this.trackInstallation();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ PWA: Install prompt failed:', error);
      return false;
    }
  }

  // Setup update notifications
  private setupUpdateNotifications(): void {
    if (this.swRegistration) {
      this.swRegistration.addEventListener('updatefound', () => {
        console.log('🔄 PWA: Update found');
      });
    }
  }

  // Show update notification
  private showUpdateNotification(): void {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(40,167,69,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 1001;
        max-width: 300px;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-weight: 600;">🔄 Update Available</div>
          <button id="pwa-update-action" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
          ">Update</button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    document.getElementById('pwa-update-action')?.addEventListener('click', () => {
      this.updateApp();
      notification.remove();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  // Update app
  public updateApp(): void {
    if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // Setup background sync
  private setupBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('🔄 PWA: Background sync supported');
    }
  }

  // Queue booking for background sync
  public queueBookingForSync(bookingData: any): void {
    if (this.swRegistration) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CACHE_BOOKING',
        booking: bookingData
      });
    }
  }

  // Request persistent storage
  public async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        console.log(`📱 PWA: Persistent storage ${granted ? 'granted' : 'denied'}`);
        return granted;
      } catch (error) {
        console.error('❌ PWA: Persistent storage request failed:', error);
        return false;
      }
    }
    return false;
  }

  // Track installation for analytics
  private trackInstallation(): void {
    // Send analytics event
    console.log('📊 PWA: Tracking installation');
    
    // You can integrate with your analytics service here
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'App Installed'
      });
    }
  }

  // Get installation status
  public getInstallStatus(): boolean {
    return this.isInstalled;
  }

  // Check if install prompt is available
  public isInstallAvailable(): boolean {
    return this.installPrompt !== null;
  }
}

// Export singleton instance
export const pwaManager = new PWAManager();

// Utility function to initialize PWA features
export function initializePWA() {
  if (typeof window !== 'undefined') {
    console.log('🚀 Initializing PWA features...');
    return pwaManager;
  }
  return null;
}

// Check if device supports PWA
export function isPWASupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

// Check if running as PWA
export function isRunningAsPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}