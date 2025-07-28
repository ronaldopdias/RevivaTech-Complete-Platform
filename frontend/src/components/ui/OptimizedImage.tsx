'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cdnService, type AssetOptimization } from '@/lib/services/cdnService';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  loading?: 'lazy' | 'eager';
  optimization?: AssetOptimization;
  fallback?: string;
  quality?: number;
}

// Generate optimized image sources using CDN service
function generateOptimizedSources(src: string, width?: number, height?: number, quality?: number) {
  const isExternalImage = src.startsWith('http');
  
  if (isExternalImage) {
    return {
      webp: src,
      avif: src,
      fallback: src,
    };
  }

  // Use CDN service for optimization
  const baseOptions: AssetOptimization = {
    width,
    height,
    quality: quality || 85,
    fit: 'cover',
  };

  const sources = {
    webp: cdnService.getImageUrl(src, { ...baseOptions, format: 'webp' }),
    avif: cdnService.getImageUrl(src, { ...baseOptions, format: 'avif' }),
    fallback: cdnService.getImageUrl(src, baseOptions),
  };

  return sources;
}

// Intersection Observer hook for lazy loading
function useIntersectionObserver(elementRef: React.RefObject<HTMLElement>, options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return isIntersecting;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  style,
  onClick,
  loading = 'lazy',
  optimization,
  fallback,
  quality = 85,
}: OptimizedImageProps) {
  const imageRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(imageRef, { threshold: 0.1 });
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Don't lazy load if priority is set or if it's above the fold
  const shouldLoad = priority || isVisible || loading === 'eager';

  const sources = generateOptimizedSources(currentSrc, width, height, quality);

  // Handle fallback on error
  const handleImageError = () => {
    if (fallback && currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setImageError(false);
    } else {
      setImageError(true);
    }
  };

  // Generate blur placeholder
  const defaultBlurDataURL = 
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAhEQACAQIHAQAAAAAAAAAAAAABAgADBAUREiExgZGhsf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7ew==';

  if (imageError) {
    return (
      <div 
        ref={imageRef}
        className={`bg-muted flex items-center justify-center ${className}`}
        style={style}
      >
        <span className="text-muted-foreground text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div ref={imageRef} className={className} style={style} onClick={onClick}>
      {shouldLoad ? (
        <picture>
          {/* AVIF format for modern browsers */}
          <source srcSet={sources.avif} type="image/avif" />
          
          {/* WebP format for most browsers */}
          <source srcSet={sources.webp} type="image/webp" />
          
          {/* Fallback to original format */}
          <Image
            src={sources.fallback}
            alt={alt}
            width={width}
            height={height}
            fill={fill}
            sizes={sizes}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={blurDataURL || defaultBlurDataURL}
            className={`transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            style={{
              objectFit: 'cover',
              ...style,
            }}
          />
        </picture>
      ) : (
        // Placeholder while not visible
        <div 
          className={`bg-muted animate-pulse ${fill ? 'absolute inset-0' : ''}`}
          style={{
            width: fill ? '100%' : width,
            height: fill ? '100%' : height,
            ...style,
          }}
        />
      )}
    </div>
  );
}

export default OptimizedImage;