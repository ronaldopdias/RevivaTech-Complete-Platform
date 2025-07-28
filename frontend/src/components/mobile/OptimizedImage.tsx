'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { ImageIcon, Loader2, AlertCircle, Eye, Download, Share2, RotateCcw } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty' | 'shimmer';
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  fallback?: string;
  // Mobile-specific props
  mobileQuality?: number;
  enablePinchZoom?: boolean;
  enableSwipeGesture?: boolean;
  preloadOnHover?: boolean;
  adaptiveLoading?: boolean;
  networkAware?: boolean;
  webpSupport?: boolean;
  avifSupport?: boolean;
}

interface ImageLoadingState {
  loaded: boolean;
  loading: boolean;
  error: boolean;
  retryCount: number;
  networkSpeed: 'slow' | 'medium' | 'fast';
  supportsWebp: boolean;
  supportsAvif: boolean;
}

const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 1000;

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'shimmer',
  sizes = '100vw',
  onLoad,
  onError,
  lazy = true,
  aspectRatio = 'auto',
  objectFit = 'cover',
  fallback,
  mobileQuality = 60,
  enablePinchZoom = false,
  enableSwipeGesture = false,
  preloadOnHover = false,
  adaptiveLoading = true,
  networkAware = true,
  webpSupport = true,
  avifSupport = true
}: OptimizedImageProps) {
  const [loadingState, setLoadingState] = useState<ImageLoadingState>({
    loaded: false,
    loading: false,
    error: false,
    retryCount: 0,
    networkSpeed: 'medium',
    supportsWebp: false,
    supportsAvif: false
  });
  
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '200px' });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      setIsMobile(/android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iphone|kindle|lge |maemo|midp|mmp|mobile|motorola|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Network detection
  useEffect(() => {
    if (networkAware && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkInfo(connection);
      
      const updateNetworkSpeed = () => {
        if (connection.effectiveType) {
          switch (connection.effectiveType) {
            case 'slow-2g':
            case '2g':
              setLoadingState(prev => ({ ...prev, networkSpeed: 'slow' }));
              break;
            case '3g':
              setLoadingState(prev => ({ ...prev, networkSpeed: 'medium' }));
              break;
            case '4g':
            case '5g':
              setLoadingState(prev => ({ ...prev, networkSpeed: 'fast' }));
              break;
          }
        }
      };
      
      updateNetworkSpeed();
      connection.addEventListener('change', updateNetworkSpeed);
      
      return () => {
        connection.removeEventListener('change', updateNetworkSpeed);
      };
    }
  }, [networkAware]);

  // Format support detection
  useEffect(() => {
    const checkFormatSupport = async () => {
      const webpSupported = await checkWebpSupport();
      const avifSupported = await checkAvifSupport();
      
      setLoadingState(prev => ({
        ...prev,
        supportsWebp: webpSupported,
        supportsAvif: avifSupported
      }));
    };
    
    checkFormatSupport();
  }, []);

  const checkWebpSupport = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const webp = new Image();
      webp.onload = webp.onerror = () => resolve(webp.height === 2);
      webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  };

  const checkAvifSupport = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => resolve(avif.height === 2);
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  };

  // Generate optimized image URL
  const generateOptimizedSrc = useCallback(() => {
    if (!src) return '';
    
    let optimizedSrc = src;
    let format = 'auto';
    let currentQuality = quality;
    
    // Adjust quality based on network and device
    if (networkAware && loadingState.networkSpeed === 'slow') {
      currentQuality = Math.min(currentQuality, 40);
    } else if (isMobile) {
      currentQuality = mobileQuality;
    }
    
    // Choose best format
    if (loadingState.supportsAvif && avifSupport) {
      format = 'avif';
    } else if (loadingState.supportsWebp && webpSupport) {
      format = 'webp';
    }
    
    // Build optimized URL (assuming CDN or image optimization service)
    const url = new URL(src, window.location.origin);
    
    // Add optimization parameters
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    url.searchParams.set('q', currentQuality.toString());
    if (format !== 'auto') url.searchParams.set('f', format);
    if (adaptiveLoading) url.searchParams.set('auto', 'compress');
    
    return url.toString();
  }, [src, quality, mobileQuality, isMobile, loadingState, networkAware, webpSupport, avifSupport, width, height, adaptiveLoading]);

  // Load image with retry logic
  const loadImage = useCallback(async (imageSrc: string) => {
    setLoadingState(prev => ({ ...prev, loading: true, error: false }));
    
    try {
      const img = new Image();
      
      // Set up promise to handle load/error
      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });
      
      // Set source and wait for load
      img.src = imageSrc;
      await loadPromise;
      
      setCurrentSrc(imageSrc);
      setLoadingState(prev => ({ 
        ...prev, 
        loaded: true, 
        loading: false, 
        error: false,
        retryCount: 0
      }));
      
      onLoad?.();
    } catch (error) {
      console.error('Image load error:', error);
      
      if (loadingState.retryCount < MAX_RETRY_COUNT) {
        // Retry with delay
        setTimeout(() => {
          setLoadingState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
          loadImage(imageSrc);
        }, RETRY_DELAY * (loadingState.retryCount + 1));
      } else {
        // Max retries reached, show error
        setLoadingState(prev => ({ 
          ...prev, 
          loading: false, 
          error: true 
        }));
        onError?.();
      }
    }
  }, [loadingState.retryCount, onLoad, onError]);

  // Start loading when in view or if priority
  useEffect(() => {
    if ((isInView || priority) && !loadingState.loaded && !loadingState.loading) {
      const optimizedSrc = generateOptimizedSrc();
      if (optimizedSrc) {
        loadImage(optimizedSrc);
      }
    }
  }, [isInView, priority, loadingState.loaded, loadingState.loading, generateOptimizedSrc, loadImage]);

  // Preload on hover
  const handleMouseEnter = useCallback(() => {
    if (preloadOnHover && !loadingState.loaded && !loadingState.loading) {
      const optimizedSrc = generateOptimizedSrc();
      if (optimizedSrc) {
        loadImage(optimizedSrc);
      }
    }
  }, [preloadOnHover, loadingState.loaded, loadingState.loading, generateOptimizedSrc, loadImage]);

  // Touch gestures for zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enablePinchZoom || e.touches.length !== 2) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    setTouchStartDistance(distance);
  }, [enablePinchZoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enablePinchZoom || e.touches.length !== 2 || touchStartDistance === 0) return;
    
    e.preventDefault();
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    const scale = distance / touchStartDistance;
    const newZoom = Math.min(Math.max(zoomLevel * scale, 1), 3);
    setZoomLevel(newZoom);
    
    if (newZoom > 1) {
      setIsZoomed(true);
    }
  }, [enablePinchZoom, touchStartDistance, zoomLevel]);

  const handleTouchEnd = useCallback(() => {
    setTouchStartDistance(0);
    
    if (zoomLevel < 1.1) {
      setZoomLevel(1);
      setIsZoomed(false);
    }
  }, [zoomLevel]);

  // Double tap to zoom
  const handleDoubleClick = useCallback(() => {
    if (!enablePinchZoom) return;
    
    if (isZoomed) {
      setZoomLevel(1);
      setIsZoomed(false);
    } else {
      setZoomLevel(2);
      setIsZoomed(true);
    }
  }, [enablePinchZoom, isZoomed]);

  // Retry loading
  const retryLoad = useCallback(() => {
    setLoadingState(prev => ({ 
      ...prev, 
      error: false, 
      retryCount: 0 
    }));
    const optimizedSrc = generateOptimizedSrc();
    if (optimizedSrc) {
      loadImage(optimizedSrc);
    }
  }, [generateOptimizedSrc, loadImage]);

  // Render placeholder
  const renderPlaceholder = () => {
    const placeholderClass = `w-full h-full flex items-center justify-center ${
      aspectRatio !== 'auto' ? `aspect-[${aspectRatio}]` : ''
    }`;
    
    switch (placeholder) {
      case 'blur':
        return (
          <div className={`${placeholderClass} bg-gray-200 backdrop-blur-sm`}>
            <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />
          </div>
        );
      
      case 'shimmer':
        return (
          <div className={`${placeholderClass} bg-gray-200 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        );
      
      default:
        return (
          <div className={`${placeholderClass} bg-gray-100`}>
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        );
    }
  };

  // Render loading state
  const renderLoading = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="text-sm text-gray-500">Loading...</span>
        {loadingState.retryCount > 0 && (
          <span className="text-xs text-gray-400">
            Retry {loadingState.retryCount}/{MAX_RETRY_COUNT}
          </span>
        )}
      </div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-2 text-center p-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <span className="text-sm text-gray-600">Failed to load image</span>
        <button
          onClick={retryLoad}
          className="flex items-center gap-2 px-3 py-1 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: aspectRatio !== 'auto' ? aspectRatio : undefined }}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      {/* Placeholder */}
      {!loadingState.loaded && !loadingState.loading && !loadingState.error && renderPlaceholder()}
      
      {/* Loading State */}
      {loadingState.loading && renderLoading()}
      
      {/* Error State */}
      {loadingState.error && renderError()}
      
      {/* Image */}
      {loadingState.loaded && currentSrc && (
        <motion.img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          className={`w-full h-full object-${objectFit} transition-transform duration-300 ${
            isZoomed ? 'cursor-zoom-out' : enablePinchZoom ? 'cursor-zoom-in' : ''
          }`}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center'
          }}
          sizes={sizes}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
      
      {/* Network Info Indicator (Development) */}
      {process.env.NODE_ENV === 'development' && networkInfo && (
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {networkInfo.effectiveType} • {Math.round(networkInfo.downlink || 0)}Mbps
        </div>
      )}
      
      {/* Zoom Overlay */}
      {isZoomed && (
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
          {Math.round(zoomLevel * 100)}%
        </div>
      )}
    </div>
  );
}

export default OptimizedImage;