/**
 * Custom Image Loader for CDN Optimization
 * Optimizes images through Cloudflare Polish and custom CDN
 */

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.revivatech.co.uk';

export default function imageLoader({ src, width, quality }) {
  // Handle external URLs (return as-is)
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // Handle relative URLs - route through CDN
  const params = new URLSearchParams();
  
  // Set width for responsive images
  if (width) {
    params.set('w', width.toString());
  }
  
  // Set quality (default 75)
  const q = quality || 75;
  params.set('q', q.toString());
  
  // Enable format optimization
  params.set('f', 'auto'); // Auto-format (WebP/AVIF when supported)
  
  // Enable compression
  params.set('compress', 'true');
  
  // Construct CDN URL with optimization parameters
  const optimizedSrc = src.startsWith('/') ? src : `/${src}`;
  return `${CDN_BASE_URL}${optimizedSrc}?${params.toString()}`;
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(src, sizes = [640, 750, 828, 1080, 1200, 1920]) {
  return sizes
    .map(size => `${imageLoader({ src, width: size })} ${size}w`)
    .join(', ');
}

/**
 * Preload critical images
 */
export function preloadImage(src, options = {}) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = imageLoader({ src, ...options });
  
  // Add to head
  document.head.appendChild(link);
}

/**
 * Lazy load images with intersection observer
 */
export function createLazyImageObserver(callback) {
  if (typeof window === 'undefined') return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '50px', // Start loading 50px before entering viewport
    threshold: 0.1
  });
  
  return observer;
}