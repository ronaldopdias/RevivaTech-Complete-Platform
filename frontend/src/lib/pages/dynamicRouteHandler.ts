/**
 * Dynamic Route Handler for Next.js
 * 
 * This system handles configuration-based routing for dynamic pages,
 * enabling pages to be created from configuration files without hardcoded routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PageConfig, RouteConfig } from '@/types/config';
import { PageFactory } from './pageFactory';
import { ReactNode } from 'react';

// Dynamic route handler interface
export interface DynamicRouteHandler {
  handleRequest: (request: NextRequest, params: any) => Promise<NextResponse>;
  resolvePageConfig: (path: string) => Promise<PageConfig | null>;
  generateStaticParams: () => Promise<string[]>;
  revalidate: (path: string) => Promise<boolean>;
}

// Route resolution interface
export interface RouteResolver {
  resolve: (path: string) => Promise<RouteResolution>;
  getStaticPaths: () => Promise<string[]>;
  isValidPath: (path: string) => boolean;
}

// Route resolution result
export interface RouteResolution {
  config: PageConfig | null;
  params: Record<string, string>;
  redirect?: string;
  notFound?: boolean;
}

// Page generation interface
export interface PageGenerator {
  generatePage: (config: PageConfig, params: Record<string, string>) => Promise<ReactNode>;
  generateMetadata: (config: PageConfig) => Promise<any>;
  generateStaticProps: (config: PageConfig) => Promise<any>;
}

// Cache interface for page configurations
export interface PageConfigCache {
  get: (key: string) => Promise<PageConfig | null>;
  set: (key: string, config: PageConfig, ttl?: number) => Promise<void>;
  invalidate: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

// Dynamic route handler implementation
export class NextJSDynamicRouteHandler implements DynamicRouteHandler {
  private pageFactory: PageFactory;
  private routeResolver: RouteResolver;
  private pageGenerator: PageGenerator;
  private cache: PageConfigCache;
  private configLoader: PageConfigLoader;

  constructor(
    pageFactory: PageFactory,
    routeResolver: RouteResolver,
    pageGenerator: PageGenerator,
    cache: PageConfigCache,
    configLoader: PageConfigLoader
  ) {
    this.pageFactory = pageFactory;
    this.routeResolver = routeResolver;
    this.pageGenerator = pageGenerator;
    this.cache = cache;
    this.configLoader = configLoader;
  }

  /**
   * Handles incoming requests for dynamic pages
   */
  async handleRequest(request: NextRequest, params: any): Promise<NextResponse> {
    try {
      const path = this.extractPath(request, params);
      
      // Resolve route configuration
      const resolution = await this.routeResolver.resolve(path);
      
      if (resolution.notFound) {
        return new NextResponse(null, { status: 404 });
      }

      if (resolution.redirect) {
        return NextResponse.redirect(new URL(resolution.redirect, request.url));
      }

      if (!resolution.config) {
        return new NextResponse(null, { status: 404 });
      }

      // Generate page
      const page = await this.pageGenerator.generatePage(resolution.config, resolution.params);
      
      // Return response with appropriate headers
      return new NextResponse(page as any, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': this.getCacheControl(resolution.config),
          'X-Page-Type': 'dynamic',
          'X-Config-Path': path
        }
      });

    } catch (error) {
      console.error('Dynamic route handler error:', error);
      return new NextResponse(null, { status: 500 });
    }
  }

  /**
   * Resolves page configuration for a given path
   */
  async resolvePageConfig(path: string): Promise<PageConfig | null> {
    try {
      // Check cache first
      const cached = await this.cache.get(path);
      if (cached) {
        return cached;
      }

      // Load from configuration files
      const config = await this.configLoader.load(path);
      
      if (config) {
        // Validate configuration
        const validation = this.pageFactory.validateConfig(config);
        if (!validation.valid) {
          console.error(`Invalid page configuration for ${path}:`, validation.errors);
          return null;
        }

        // Cache the configuration
        await this.cache.set(path, config, 3600); // Cache for 1 hour
        
        return config;
      }

      return null;
    } catch (error) {
      console.error(`Error resolving page config for ${path}:`, error);
      return null;
    }
  }

  /**
   * Generates static parameters for static generation
   */
  async generateStaticParams(): Promise<string[]> {
    try {
      return await this.routeResolver.getStaticPaths();
    } catch (error) {
      console.error('Error generating static params:', error);
      return [];
    }
  }

  /**
   * Revalidates a page configuration
   */
  async revalidate(path: string): Promise<boolean> {
    try {
      await this.cache.invalidate(path);
      const config = await this.resolvePageConfig(path);
      return config !== null;
    } catch (error) {
      console.error(`Error revalidating ${path}:`, error);
      return false;
    }
  }

  /**
   * Extracts the path from request and parameters
   */
  private extractPath(request: NextRequest, params: any): string {
    const { pathname } = new URL(request.url);
    
    // Remove leading slash and normalize
    return pathname.replace(/^\//, '') || 'index';
  }

  /**
   * Gets cache control headers based on page configuration
   */
  private getCacheControl(config: PageConfig): string {
    const features = config.features || [];
    
    // Dynamic pages with user-specific content
    if (config.auth?.required) {
      return 'no-cache, no-store, must-revalidate';
    }

    // Pages with real-time features
    if (features.includes('realtime')) {
      return 'no-cache, must-revalidate';
    }

    // Regular pages with static content
    return 'public, max-age=3600, s-maxage=7200';
  }
}

// Route resolver implementation
export class FileSystemRouteResolver implements RouteResolver {
  private configPaths: string[];
  private routeMappings: Map<string, string>;

  constructor(configPaths: string[]) {
    this.configPaths = configPaths;
    this.routeMappings = new Map();
    this.initializeRouteMappings();
  }

  /**
   * Resolves a path to its configuration
   */
  async resolve(path: string): Promise<RouteResolution> {
    // Normalize path
    const normalizedPath = this.normalizePath(path);
    
    // Check for exact match
    if (this.routeMappings.has(normalizedPath)) {
      const configPath = this.routeMappings.get(normalizedPath)!;
      const config = await this.loadConfig(configPath);
      
      if (config) {
        return {
          config,
          params: this.extractParams(path, normalizedPath)
        };
      }
    }

    // Check for dynamic routes
    const dynamicMatch = this.findDynamicMatch(normalizedPath);
    if (dynamicMatch) {
      const config = await this.loadConfig(dynamicMatch.configPath);
      
      if (config) {
        return {
          config,
          params: dynamicMatch.params
        };
      }
    }

    // Check for redirects
    const redirect = this.findRedirect(normalizedPath);
    if (redirect) {
      return {
        config: null,
        params: {},
        redirect
      };
    }

    return {
      config: null,
      params: {},
      notFound: true
    };
  }

  /**
   * Gets all static paths for generation
   */
  async getStaticPaths(): Promise<string[]> {
    const paths: string[] = [];
    
    for (const [route] of this.routeMappings) {
      if (!route.includes('[') && !route.includes('*')) {
        paths.push(route);
      }
    }

    return paths;
  }

  /**
   * Checks if a path is valid for this resolver
   */
  isValidPath(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.routeMappings.has(normalizedPath) || !!this.findDynamicMatch(normalizedPath);
  }

  /**
   * Initializes route mappings from configuration paths
   */
  private initializeRouteMappings(): void {
    this.configPaths.forEach(configPath => {
      const route = this.configPathToRoute(configPath);
      this.routeMappings.set(route, configPath);
    });
  }

  /**
   * Converts configuration path to route
   */
  private configPathToRoute(configPath: string): string {
    return configPath
      .replace(/^config\/pages\//, '')
      .replace(/\.config\.(ts|js)$/, '')
      .replace(/\/index$/, '');
  }

  /**
   * Normalizes path for consistent matching
   */
  private normalizePath(path: string): string {
    return path.replace(/^\//, '').replace(/\/$/, '') || 'index';
  }

  /**
   * Finds dynamic route matches
   */
  private findDynamicMatch(path: string): { configPath: string; params: Record<string, string> } | null {
    for (const [route, configPath] of this.routeMappings) {
      if (route.includes('[') || route.includes('*')) {
        const params = this.matchDynamicRoute(path, route);
        if (params) {
          return { configPath, params };
        }
      }
    }
    return null;
  }

  /**
   * Matches dynamic route patterns
   */
  private matchDynamicRoute(path: string, pattern: string): Record<string, string> | null {
    const pathParts = path.split('/');
    const patternParts = pattern.split('/');

    if (pathParts.length !== patternParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < pathParts.length; i++) {
      const pathPart = pathParts[i];
      const patternPart = patternParts[i];

      if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
        const paramName = patternPart.slice(1, -1);
        params[paramName] = pathPart;
      } else if (patternPart === '*') {
        params.catchAll = pathParts.slice(i).join('/');
        break;
      } else if (pathPart !== patternPart) {
        return null;
      }
    }

    return params;
  }

  /**
   * Extracts parameters from path
   */
  private extractParams(path: string, normalizedPath: string): Record<string, string> {
    // This would extract parameters from the path
    // Implementation depends on your parameter extraction logic
    return {};
  }

  /**
   * Finds redirect for a path
   */
  private findRedirect(path: string): string | null {
    // Implement redirect logic based on configuration
    const redirects: Record<string, string> = {
      'old-page': 'new-page',
      'deprecated': 'services'
    };

    return redirects[path] || null;
  }

  /**
   * Loads configuration from file path
   */
  private async loadConfig(configPath: string): Promise<PageConfig | null> {
    try {
      const module = await import(`@/config/pages/${configPath}`);
      return module.default || module[Object.keys(module)[0]];
    } catch (error) {
      console.error(`Error loading config from ${configPath}:`, error);
      return null;
    }
  }
}

// Page configuration loader interface
export interface PageConfigLoader {
  load: (path: string) => Promise<PageConfig | null>;
  loadAll: () => Promise<Record<string, PageConfig>>;
  watch: (callback: (path: string, config: PageConfig) => void) => void;
}

// File system configuration loader
export class FileSystemConfigLoader implements PageConfigLoader {
  private configDirectory: string;

  constructor(configDirectory: string = '/config/pages') {
    this.configDirectory = configDirectory;
  }

  /**
   * Loads configuration for a specific path
   */
  async load(path: string): Promise<PageConfig | null> {
    try {
      const configPath = this.pathToConfigPath(path);
      const module = await import(`@${this.configDirectory}/${configPath}`);
      return module.default || module[Object.keys(module)[0]];
    } catch (error) {
      console.error(`Error loading config for ${path}:`, error);
      return null;
    }
  }

  /**
   * Loads all configurations
   */
  async loadAll(): Promise<Record<string, PageConfig>> {
    const configs: Record<string, PageConfig> = {};
    
    // This would scan the config directory and load all configurations
    // Implementation depends on your file system structure
    
    return configs;
  }

  /**
   * Watches for configuration changes
   */
  watch(callback: (path: string, config: PageConfig) => void): void {
    // Implementation for watching configuration changes
    // This would use file system watchers in development
    if (process.env.NODE_ENV === 'development') {
      // Set up file watchers
    }
  }

  /**
   * Converts path to configuration file path
   */
  private pathToConfigPath(path: string): string {
    return `${path.replace(/\//g, '/')}.config.ts`;
  }
}

// Memory cache implementation
export class MemoryPageConfigCache implements PageConfigCache {
  private cache: Map<string, { config: PageConfig; expires: number }>;

  constructor() {
    this.cache = new Map();
  }

  async get(key: string): Promise<PageConfig | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.config;
  }

  async set(key: string, config: PageConfig, ttl: number = 3600): Promise<void> {
    const expires = Date.now() + (ttl * 1000);
    this.cache.set(key, { config, expires });
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// Utility functions
export const dynamicRouteUtils = {
  /**
   * Creates a dynamic route handler with default configuration
   */
  createHandler: (
    pageFactory: PageFactory,
    configPaths: string[]
  ): DynamicRouteHandler => {
    const routeResolver = new FileSystemRouteResolver(configPaths);
    const cache = new MemoryPageConfigCache();
    const configLoader = new FileSystemConfigLoader();
    
    // Page generator would be implemented based on your React rendering needs
    const pageGenerator: PageGenerator = {
      generatePage: async (config, params) => {
        // Implementation depends on your page generation logic
        return null as any;
      },
      generateMetadata: async (config) => {
        return {
          title: config.meta.title,
          description: config.meta.description,
          keywords: config.meta.keywords?.join(', '),
          openGraph: {
            title: config.meta.title,
            description: config.meta.description,
            images: config.meta.ogImage ? [config.meta.ogImage] : []
          }
        };
      },
      generateStaticProps: async (config) => {
        return {
          props: {
            config
          },
          revalidate: 3600
        };
      }
    };

    return new NextJSDynamicRouteHandler(
      pageFactory,
      routeResolver,
      pageGenerator,
      cache,
      configLoader
    );
  },

  /**
   * Generates Next.js API route handler
   */
  createAPIHandler: (handler: DynamicRouteHandler) => {
    return async (request: NextRequest, context: { params: any }) => {
      return handler.handleRequest(request, context.params);
    };
  },

  /**
   * Generates Next.js page component
   */
  createPageComponent: (handler: DynamicRouteHandler) => {
    return async ({ params }: { params: any }) => {
      const path = Object.values(params).join('/');
      const config = await handler.resolvePageConfig(path);
      
      if (!config) {
        return { notFound: true };
      }

      return {
        props: { config },
        revalidate: 3600
      };
    };
  }
};

export default NextJSDynamicRouteHandler;