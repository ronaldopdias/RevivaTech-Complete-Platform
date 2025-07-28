import { DeviceImageConfig, ImageVariant, ImageProvider } from '@/lib/services/types';

// Image CDN configuration for device images
export interface DeviceImageConfig {
  provider: ImageProvider;
  baseUrl: string;
  fallbackUrl: string;
  variants: Record<string, ImageVariant>;
  optimizations: {
    format: 'webp' | 'avif' | 'auto';
    quality: number;
    progressive: boolean;
    lazy: boolean;
  };
  cache: {
    enabled: boolean;
    ttl: number; // seconds
    maxAge: number; // seconds
  };
}

export type ImageProvider = 'cloudinary' | 'imagekit' | 'local' | 'cdn';

export interface ImageVariant {
  width: number;
  height: number;
  crop: 'fill' | 'fit' | 'scale' | 'thumb';
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png' | 'auto';
}

// Device image configuration
export const deviceImageConfig: DeviceImageConfig = {
  provider: 'cloudinary', // Can be switched to 'imagekit', 'local', or 'cdn'
  baseUrl: 'https://res.cloudinary.com/revivatech/image/upload/',
  fallbackUrl: '/images/devices/placeholder-device.jpg',
  
  // Image variants for different use cases
  variants: {
    thumbnail: {
      width: 150,
      height: 150,
      crop: 'thumb',
      quality: 80,
      format: 'webp'
    },
    card: {
      width: 300,
      height: 200,
      crop: 'fill',
      quality: 85,
      format: 'webp'
    },
    detail: {
      width: 600,
      height: 400,
      crop: 'fit',
      quality: 90,
      format: 'webp'
    },
    hero: {
      width: 1200,
      height: 800,
      crop: 'fill',
      quality: 95,
      format: 'webp'
    },
    gallery: {
      width: 800,
      height: 600,
      crop: 'fit',
      quality: 90,
      format: 'webp'
    }
  },

  optimizations: {
    format: 'auto', // Automatically choose best format
    quality: 85,
    progressive: true,
    lazy: true
  },

  cache: {
    enabled: true,
    ttl: 86400, // 24 hours
    maxAge: 604800 // 7 days
  }
};

// Image URL builders for different providers
export const imageUrlBuilders = {
  cloudinary: (imagePath: string, variant: string): string => {
    const config = deviceImageConfig;
    const variantConfig = config.variants[variant];
    
    if (!variantConfig) {
      return `${config.baseUrl}${imagePath}`;
    }

    const transformations = [
      `w_${variantConfig.width}`,
      `h_${variantConfig.height}`,
      `c_${variantConfig.crop}`,
      `q_${variantConfig.quality || config.optimizations.quality}`,
      `f_${variantConfig.format || config.optimizations.format}`
    ];

    if (config.optimizations.progressive) {
      transformations.push('fl_progressive');
    }

    return `${config.baseUrl}${transformations.join(',')}/${imagePath}`;
  },

  imagekit: (imagePath: string, variant: string): string => {
    const config = deviceImageConfig;
    const variantConfig = config.variants[variant];
    
    if (!variantConfig) {
      return `${config.baseUrl}${imagePath}`;
    }

    const params = new URLSearchParams({
      'tr': `w-${variantConfig.width},h-${variantConfig.height},c-${variantConfig.crop},q-${variantConfig.quality || config.optimizations.quality},f-${variantConfig.format || config.optimizations.format}`
    });

    return `${config.baseUrl}${imagePath}?${params.toString()}`;
  },

  local: (imagePath: string, variant: string): string => {
    // For local images, we return the path as-is
    // In production, this would be handled by Next.js Image optimization
    return imagePath;
  },

  cdn: (imagePath: string, variant: string): string => {
    const config = deviceImageConfig;
    const variantConfig = config.variants[variant];
    
    if (!variantConfig) {
      return `${config.baseUrl}${imagePath}`;
    }

    // Generic CDN with query parameters
    const params = new URLSearchParams({
      width: variantConfig.width.toString(),
      height: variantConfig.height.toString(),
      crop: variantConfig.crop,
      quality: (variantConfig.quality || config.optimizations.quality).toString(),
      format: variantConfig.format || config.optimizations.format
    });

    return `${config.baseUrl}${imagePath}?${params.toString()}`;
  }
};

// Helper function to get optimized device image URL
export const getDeviceImageUrl = (
  imagePath: string, 
  variant: keyof typeof deviceImageConfig.variants = 'card'
): string => {
  const config = deviceImageConfig;
  
  try {
    const builder = imageUrlBuilders[config.provider];
    if (!builder) {
      console.warn(`Image provider "${config.provider}" not supported`);
      return config.fallbackUrl;
    }

    return builder(imagePath, variant);
  } catch (error) {
    console.error('Error building image URL:', error);
    return config.fallbackUrl;
  }
};

// Helper function to get multiple variants of an image
export const getDeviceImageVariants = (imagePath: string): Record<string, string> => {
  const variants: Record<string, string> = {};
  
  Object.keys(deviceImageConfig.variants).forEach(variant => {
    variants[variant] = getDeviceImageUrl(imagePath, variant as keyof typeof deviceImageConfig.variants);
  });

  return variants;
};

// Preload critical device images
export const preloadDeviceImages = (imagePaths: string[], variant: string = 'card'): void => {
  if (typeof window === 'undefined') return;

  imagePaths.forEach(imagePath => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getDeviceImageUrl(imagePath, variant as keyof typeof deviceImageConfig.variants);
    document.head.appendChild(link);
  });
};

// Image placeholder while loading
export const getImagePlaceholder = (width: number, height: number): string => {
  // Generate a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
        Loading...
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Error image when device image fails to load
export const getErrorImage = (width: number, height: number): string => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fee2e2"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#dc2626" font-family="Arial, sans-serif" font-size="12">
        Image not found
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Device image paths for different categories
export const deviceImagePaths = {
  apple: {
    macbook: 'devices/apple/macbooks/',
    iphone: 'devices/apple/iphones/',
    ipad: 'devices/apple/ipads/',
    imac: 'devices/apple/imacs/',
    macMini: 'devices/apple/mac-minis/',
    macStudio: 'devices/apple/mac-studios/'
  },
  pc: {
    dell: 'devices/pc/dell/',
    hp: 'devices/pc/hp/',
    lenovo: 'devices/pc/lenovo/',
    asus: 'devices/pc/asus/',
    msi: 'devices/pc/msi/',
    microsoft: 'devices/pc/microsoft/'
  },
  android: {
    samsung: 'devices/android/samsung/',
    google: 'devices/android/google/',
    oneplus: 'devices/android/oneplus/',
    xiaomi: 'devices/android/xiaomi/'
  },
  gaming: {
    playstation: 'devices/gaming/playstation/',
    xbox: 'devices/gaming/xbox/',
    nintendo: 'devices/gaming/nintendo/',
    steam: 'devices/gaming/steam/',
    asus: 'devices/gaming/asus/'
  }
};

export default {
  config: deviceImageConfig,
  builders: imageUrlBuilders,
  getUrl: getDeviceImageUrl,
  getVariants: getDeviceImageVariants,
  preload: preloadDeviceImages,
  placeholder: getImagePlaceholder,
  error: getErrorImage,
  paths: deviceImagePaths
};