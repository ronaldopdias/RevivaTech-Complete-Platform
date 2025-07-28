/**
 * CDN Service - Global Content Delivery Network Integration
 * Optimizes static asset delivery with multi-provider support
 */

export interface CDNConfig {
  provider: 'cloudflare' | 'aws-cloudfront' | 'fastly' | 'bunny' | 'local';
  baseUrl: string;
  zones: {
    images: string;
    static: string;
    api: string;
  };
  settings: {
    cacheTtl: number;
    compression: boolean;
    minification: boolean;
    webpOptimization: boolean;
    avifOptimization: boolean;
  };
}

export interface AssetOptimization {
  format?: 'webp' | 'avif' | 'auto';
  quality?: number;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  cache?: boolean;
}

class CDNService {
  private config: CDNConfig;
  private isEnabled: boolean;

  constructor() {
    this.config = this.loadConfig();
    this.isEnabled = this.config.provider !== 'local' && typeof window !== 'undefined';
  }

  private loadConfig(): CDNConfig {
    // Default configuration - can be overridden via environment
    const defaultConfig: CDNConfig = {
      provider: (process.env.NEXT_PUBLIC_CDN_PROVIDER as any) || 'local',
      baseUrl: process.env.NEXT_PUBLIC_CDN_BASE_URL || '',
      zones: {
        images: process.env.NEXT_PUBLIC_CDN_IMAGES_ZONE || '/images',
        static: process.env.NEXT_PUBLIC_CDN_STATIC_ZONE || '/static',
        api: process.env.NEXT_PUBLIC_CDN_API_ZONE || '/api',
      },
      settings: {
        cacheTtl: parseInt(process.env.NEXT_PUBLIC_CDN_CACHE_TTL || '86400'),
        compression: process.env.NEXT_PUBLIC_CDN_COMPRESSION !== 'false',
        minification: process.env.NEXT_PUBLIC_CDN_MINIFICATION !== 'false',
        webpOptimization: process.env.NEXT_PUBLIC_CDN_WEBP !== 'false',
        avifOptimization: process.env.NEXT_PUBLIC_CDN_AVIF !== 'false',
      },
    };

    return defaultConfig;
  }

  /**
   * Get optimized URL for images with automatic format detection
   */
  getImageUrl(path: string, options: AssetOptimization = {}): string {
    if (!this.isEnabled || !path) {
      return path;
    }

    const {
      format = 'auto',
      quality = 85,
      width,
      height,
      fit = 'cover',
      cache = true
    } = options;

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Build CDN URL based on provider
    let cdnUrl = '';
    
    switch (this.config.provider) {
      case 'cloudflare':
        cdnUrl = this.buildCloudflareImageUrl(cleanPath, options);
        break;
      case 'aws-cloudfront':
        cdnUrl = this.buildCloudFrontImageUrl(cleanPath, options);
        break;
      case 'bunny':
        cdnUrl = this.buildBunnyImageUrl(cleanPath, options);
        break;
      default:
        cdnUrl = `${this.config.baseUrl}${this.config.zones.images}/${cleanPath}`;
    }

    return cdnUrl;
  }

  /**
   * Get optimized URL for static assets (CSS, JS, fonts)
   */
  getStaticUrl(path: string): string {
    if (!this.isEnabled || !path) {
      return path;
    }

    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.config.baseUrl}${this.config.zones.static}/${cleanPath}`;
  }

  /**
   * Get CDN URL for API endpoints with edge caching
   */
  getApiUrl(path: string): string {
    if (!this.isEnabled || !path) {
      return path;
    }

    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.config.baseUrl}${this.config.zones.api}/${cleanPath}`;
  }

  /**
   * Cloudflare Image Resizing URL builder
   */
  private buildCloudflareImageUrl(path: string, options: AssetOptimization): string {
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.fit) params.set('fit', options.fit);
    if (options.format && options.format !== 'auto') params.set('f', options.format);

    const queryString = params.toString();
    const baseUrl = `${this.config.baseUrl}/cdn-cgi/image`;
    
    return queryString 
      ? `${baseUrl}/${queryString}/${path}`
      : `${this.config.baseUrl}${this.config.zones.images}/${path}`;
  }

  /**
   * AWS CloudFront URL builder with Lambda@Edge optimization
   */
  private buildCloudFrontImageUrl(path: string, options: AssetOptimization): string {
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format && options.format !== 'auto') params.set('format', options.format);

    const queryString = params.toString();
    const baseUrl = `${this.config.baseUrl}${this.config.zones.images}/${path}`;
    
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Bunny CDN URL builder with optimizer
   */
  private buildBunnyImageUrl(path: string, options: AssetOptimization): string {
    const params = new URLSearchParams();
    
    if (options.width) params.set('width', options.width.toString());
    if (options.height) params.set('height', options.height.toString());
    if (options.quality) params.set('quality', options.quality.toString());
    if (options.format && options.format !== 'auto') params.set('format', options.format);

    const queryString = params.toString();
    const baseUrl = `${this.config.baseUrl}${this.config.zones.images}/${path}`;
    
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Preload critical resources
   */
  preloadResource(url: string, type: 'image' | 'script' | 'style' | 'font' = 'image'): void {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'image':
        link.as = 'image';
        break;
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
      case 'font':
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        break;
    }

    document.head.appendChild(link);
  }

  /**
   * Detect optimal image format support
   */
  getSupportedFormat(): 'avif' | 'webp' | 'jpeg' {
    if (typeof window === 'undefined') return 'jpeg';

    // Check AVIF support
    if (this.config.settings.avifOptimization && this.supportsAVIF()) {
      return 'avif';
    }

    // Check WebP support
    if (this.config.settings.webpOptimization && this.supportsWebP()) {
      return 'webp';
    }

    return 'jpeg';
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private supportsAVIF(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      provider: this.config.provider,
      enabled: this.isEnabled,
      supportedFormat: this.getSupportedFormat(),
      zones: this.config.zones,
      settings: this.config.settings,
    };
  }

  /**
   * Purge cache for specific URLs (implementation depends on CDN provider)
   */
  async purgeCache(urls: string[]): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      // Implementation would depend on CDN provider API
      console.log(`Purging cache for URLs: ${urls.join(', ')}`);
      return true;
    } catch (error) {
      console.error('Cache purge failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cdnService = new CDNService();

// Export types for external use
export type { CDNConfig, AssetOptimization };