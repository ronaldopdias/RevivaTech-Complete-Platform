// Advanced Image Optimization Service
// Handles WebP conversion, responsive images, lazy loading, and CDN optimization

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  responsive?: boolean;
  lazy?: boolean;
  placeholder?: 'blur' | 'empty' | 'data';
  priority?: boolean;
}

interface ResponsiveImageConfig {
  breakpoints: { [key: string]: number };
  sizes: string;
  devicePixelRatios: number[];
}

interface OptimizedImage {
  src: string;
  webpSrc?: string;
  avifSrc?: string;
  srcSet?: string;
  webpSrcSet?: string;
  avifSrcSet?: string;
  sizes?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  alt: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

class ImageOptimizationService {
  private cdnBaseUrl: string;
  private defaultOptions: ImageOptimizationOptions;
  private responsiveConfig: ResponsiveImageConfig;

  constructor() {
    this.cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
    this.defaultOptions = {
      quality: 85,
      format: 'auto',
      responsive: true,
      lazy: true,
      placeholder: 'blur',
      priority: false
    };
    
    this.responsiveConfig = {
      breakpoints: {
        xs: 640,
        sm: 768,
        md: 1024,
        lg: 1280,
        xl: 1920
      },
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
      devicePixelRatios: [1, 2, 3]
    };
  }

  // Generate optimized image configuration
  optimizeImage(
    src: string, 
    alt: string, 
    options: ImageOptimizationOptions = {}
  ): OptimizedImage {
    const opts = { ...this.defaultOptions, ...options };
    const isExternal = this.isExternalImage(src);
    
    // Base optimized image
    const optimized: OptimizedImage = {
      src: this.generateOptimizedUrl(src, opts),
      alt,
      loading: opts.lazy ? 'lazy' : 'eager',
      priority: opts.priority || false
    };

    // Add dimensions if provided
    if (opts.width) optimized.width = opts.width;
    if (opts.height) optimized.height = opts.height;

    // Generate modern format sources (WebP, AVIF)
    if (opts.format === 'auto' || opts.format === 'webp') {
      optimized.webpSrc = this.generateOptimizedUrl(src, { ...opts, format: 'webp' });
    }
    
    if (opts.format === 'auto' || opts.format === 'avif') {
      optimized.avifSrc = this.generateOptimizedUrl(src, { ...opts, format: 'avif' });
    }

    // Generate responsive srcSets
    if (opts.responsive && opts.width) {
      optimized.srcSet = this.generateSrcSet(src, opts);
      optimized.sizes = this.responsiveConfig.sizes;
      
      if (optimized.webpSrc) {
        optimized.webpSrcSet = this.generateSrcSet(src, { ...opts, format: 'webp' });
      }
      
      if (optimized.avifSrc) {
        optimized.avifSrcSet = this.generateSrcSet(src, { ...opts, format: 'avif' });
      }
    }

    // Generate placeholder
    if (opts.placeholder === 'blur') {
      optimized.placeholder = this.generateBlurPlaceholder(src, opts);
    }

    return optimized;
  }

  // Generate responsive image set for different screen sizes
  generateResponsiveImageSet(
    src: string,
    alt: string,
    breakpointSizes: { [breakpoint: string]: { width: number; height?: number } },
    options: ImageOptimizationOptions = {}
  ): { [breakpoint: string]: OptimizedImage } {
    const imageSet: { [breakpoint: string]: OptimizedImage } = {};

    for (const [breakpoint, dimensions] of Object.entries(breakpointSizes)) {
      const breakpointOptions = {
        ...options,
        width: dimensions.width,
        height: dimensions.height,
        responsive: false // Disable automatic responsive for custom breakpoints
      };

      imageSet[breakpoint] = this.optimizeImage(src, alt, breakpointOptions);
    }

    return imageSet;
  }

  // Generate art direction responsive images
  generateArtDirectedImages(
    images: { src: string; breakpoint: string; width: number; height?: number }[],
    alt: string,
    options: ImageOptimizationOptions = {}
  ): { sources: any[]; defaultImage: OptimizedImage } {
    const sources = images.map(img => {
      const optimized = this.optimizeImage(img.src, alt, {
        ...options,
        width: img.width,
        height: img.height
      });

      return {
        media: `(min-width: ${this.responsiveConfig.breakpoints[img.breakpoint]}px)`,
        srcSet: optimized.srcSet || optimized.src,
        type: 'image/webp' // Prefer WebP when supported
      };
    });

    // Default image for fallback
    const defaultImage = this.optimizeImage(images[images.length - 1].src, alt, options);

    return { sources, defaultImage };
  }

  // Generate picture element configuration
  generatePictureElement(
    src: string,
    alt: string,
    options: ImageOptimizationOptions = {}
  ): { sources: any[]; img: OptimizedImage } {
    const optimized = this.optimizeImage(src, alt, options);
    const sources = [];

    // AVIF source (most modern)
    if (optimized.avifSrcSet || optimized.avifSrc) {
      sources.push({
        srcSet: optimized.avifSrcSet || optimized.avifSrc,
        type: 'image/avif',
        sizes: optimized.sizes
      });
    }

    // WebP source (widely supported)
    if (optimized.webpSrcSet || optimized.webpSrc) {
      sources.push({
        srcSet: optimized.webpSrcSet || optimized.webpSrc,
        type: 'image/webp',
        sizes: optimized.sizes
      });
    }

    return { sources, img: optimized };
  }

  // Preload critical images
  generatePreloadTags(
    images: { src: string; options?: ImageOptimizationOptions }[]
  ): Array<{ href: string; as: string; rel: string; type?: string }> {
    return images.map(({ src, options = {} }) => {
      const opts = { ...this.defaultOptions, ...options, priority: true };
      const optimizedSrc = this.generateOptimizedUrl(src, opts);

      const preloadTag: any = {
        href: optimizedSrc,
        as: 'image',
        rel: 'preload'
      };

      // Add type for modern formats
      if (opts.format === 'webp') {
        preloadTag.type = 'image/webp';
      } else if (opts.format === 'avif') {
        preloadTag.type = 'image/avif';
      }

      return preloadTag;
    });
  }

  // Lazy loading intersection observer setup
  generateLazyLoadConfig() {
    return {
      threshold: 0.1,
      rootMargin: '50px 0px',
      observerOptions: {
        threshold: [0, 0.1, 0.5, 1],
        rootMargin: '50px'
      }
    };
  }

  // Image compression utility
  async compressImageClient(
    file: File,
    options: { quality?: number; maxWidth?: number; maxHeight?: number; format?: string } = {}
  ): Promise<{ file: File; compressedSize: number; originalSize: number; compressionRatio: number }> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Calculate dimensions
        const { width, height } = this.calculateDimensions(
          img.width, 
          img.height, 
          options.maxWidth || 1920, 
          options.maxHeight || 1080
        );

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now()
            });

            resolve({
              file: compressedFile,
              compressedSize: blob.size,
              originalSize: file.size,
              compressionRatio: ((file.size - blob.size) / file.size) * 100
            });
          },
          options.format || 'image/jpeg',
          (options.quality || 85) / 100
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Private helper methods
  private generateOptimizedUrl(src: string, options: ImageOptimizationOptions): string {
    if (this.isExternalImage(src)) {
      return src; // External images can't be optimized through our system
    }

    // Build optimization query parameters
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format && options.format !== 'auto') params.set('f', options.format);
    if (options.fit) params.set('fit', options.fit);

    const baseUrl = this.cdnBaseUrl || '/_next/image';
    return `${baseUrl}?url=${encodeURIComponent(src)}&${params.toString()}`;
  }

  private generateSrcSet(src: string, options: ImageOptimizationOptions): string {
    if (!options.width) return '';

    const srcSetEntries = [];
    const baseWidth = options.width;

    // Generate for different device pixel ratios
    for (const ratio of this.responsiveConfig.devicePixelRatios) {
      const width = Math.round(baseWidth * ratio);
      const url = this.generateOptimizedUrl(src, { ...options, width });
      srcSetEntries.push(`${url} ${width}w`);
    }

    return srcSetEntries.join(', ');
  }

  private generateBlurPlaceholder(src: string, options: ImageOptimizationOptions): string {
    // Generate a tiny blurred version for placeholder
    const placeholderOptions = {
      ...options,
      width: 10,
      height: 10,
      quality: 20,
      format: 'jpeg' as const
    };

    return this.generateOptimizedUrl(src, placeholderOptions);
  }

  private isExternalImage(src: string): boolean {
    return src.startsWith('http') && !src.includes(window?.location?.hostname || '');
  }

  private calculateDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth: number, 
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { 
      width: Math.round(width), 
      height: Math.round(height) 
    };
  }

  // Performance monitoring
  async trackImagePerformance(imageSrc: string, loadTime: number, fileSize: number) {
    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track-api',
          data: {
            endpoint: '/image-load',
            responseTime: loadTime,
            responseSize: fileSize,
            statusCode: 200,
            metadata: {
              imageSrc,
              type: 'image-performance'
            }
          }
        })
      });
    } catch (error) {
      console.warn('Failed to track image performance:', error);
    }
  }
}

// Export singleton instance
export const imageOptimizationService = new ImageOptimizationService();

// Export types
export type {
  ImageOptimizationOptions,
  ResponsiveImageConfig,
  OptimizedImage
};

export default imageOptimizationService;