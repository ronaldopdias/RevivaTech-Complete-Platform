import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Production performance optimization
  poweredByHeader: false,
  reactStrictMode: false, // Disabled to reduce hot reload cycles in development
  compress: true,
  productionBrowserSourceMaps: false,
  generateEtags: true,
  
  // WebSocket and HMR configuration - Optimized for reduced noise
  devIndicators: {
    position: 'bottom-right',
    // Note: buildActivity option is deprecated in Next.js 15.3+ and removed
  },
  
  
  // Custom server configuration for WebSocket handling
  assetPrefix: process.env.NODE_ENV === 'development' ? undefined : undefined,
  
  // Compiler options for better HMR handling
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Skip ESLint during production builds
  eslint: {
    ignoreDuringBuilds: process.env.SKIP_LINT === 'true',
  },
  
  // Cross-origin configuration for dual domain setup
  allowedDevOrigins: [
    'revivatech.co.uk',
    'revivatech.com.br', 
    'localhost:3010',
    'localhost:3000',
    '192.168.1.199:3010',
    '100.122.130.67:3010'
  ],
  
  // PWA Configuration with aggressive cache busting for auth changes
  headers: async () => [
    // Cross-origin headers for development domain access
    {
      source: '/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization',
        },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
        {
          key: 'Service-Worker-Allowed',
          value: '/',
        },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    // Force no cache for auth-related pages and components
    {
      source: '/(login|admin|dashboard)/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
        {
          key: 'Pragma',
          value: 'no-cache',
        },
        {
          key: 'Expires',
          value: '0',
        },
      ],
    },
    // Fix webpack chunk loading in development
    {
      source: '/_next/static/chunks/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: process.env.NODE_ENV === 'development' 
            ? 'no-cache, no-store, must-revalidate' 
            : 'public, max-age=31536000, immutable',
        },
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
      ],
    },
    // Fix webpack HMR in development
    {
      source: '/_next/static/webpack/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate',
        },
        {
          key: 'Access-Control-Allow-Origin',
          value: '*',
        },
      ],
    },
  ],
  
  // Experimental WebSocket configuration for HMR cross-origin support
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  
  // API rewrites disabled - using simple API routes instead
  // async rewrites() {
  //   console.log('🔧 Next.js rewrites configuration loading...');
  //   return [
  //     {
  //       source: '/api/((?!auth).*)',
  //       destination: 'http://revivatech_backend:3011/api/$1', // Proxy to backend container
  //     },
  //   ];
  // },

  // Output file tracing exclusions (moved from experimental)
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@tensorflow/**/*',
      'node_modules/ioredis/**/*',
      'node_modules/pg/**/*'
    ]
  },

  // Production optimizations and experimental features
  experimental: {
    // Bundle optimization for better performance
    optimizePackageImports: [
      'lucide-react', 
      '@headlessui/react', 
      'framer-motion', 
      'recharts',
      'chart.js',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs'
    ],
    // Production optimizations
    ...(process.env.NODE_ENV === 'production' && {
      forceSwcTransforms: true,
      swcTraceProfiling: false,
      serverMinification: true
    })
  },
  
  // Advanced Image optimization with CDN support
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.revivatech.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'cdn.revivatech.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-cdn.revivatech.co.uk',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
      },
    ],
    // Disabled custom CDN loader - using local images
    // loader: 'custom',
    // loaderFile: './src/lib/image-loader.js',
  },
  
  // Webpack configuration for both development and production
  webpack: (config: any, { isServer, dev }: any) => {
    // Development optimizations for faster rebuilds and better Fast Refresh
    if (dev && !isServer && process.env.NODE_ENV === 'development') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next', '**/coverage'],
      };
      
      // Optimize source maps for development
      // config.devtool = 'cheap-module-source-map'; // Removed to prevent devtool warning
      
      // Reduce module resolution overhead
      config.resolve.cacheWithContext = false;
      config.cache = {
        type: 'filesystem',
        allowCollectingMemory: true,
        memoryCacheUnaffected: true,
      };
      
      // Optimize module replacement for Fast Refresh
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    
    // Ensure proper module loading for domain access
    if (!isServer) {
      config.output = {
        ...config.output,
        publicPath: '/_next/',
        crossOriginLoading: 'anonymous',
      };
      
      // Ensure webpack modules load correctly with HTTPS
      config.module = {
        ...config.module,
        parser: {
          ...config.module?.parser,
          javascript: {
            ...config.module?.parser?.javascript,
            dynamicImportMode: 'eager',
          },
        },
      };
    }
    
    // Path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@shared': path.resolve(__dirname, '../shared'),
    };

    // Handle Node.js modules that should only run on server
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        pg: false,
        'pg-hstore': false,
        ioredis: false,
      };

    }

    // Bundle analyzer for production builds
    if (process.env.ANALYZE === 'true' && process.env.NODE_ENV === 'production') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: './bundle-analysis.html',
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;
