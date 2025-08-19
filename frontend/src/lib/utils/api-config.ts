/**
 * Environment-Aware API Configuration Utility
 * Provides robust URL resolution for different deployment scenarios
 * Separates internal container communication from external client access
 * Integrated with comprehensive environment validation system
 */

import { validateEnvironment, getBackendInternalUrl } from './env-validator';

export interface EnvironmentConfig {
  // Internal container communication URLs (server-side only)
  readonly BACKEND_INTERNAL_URL: string;
  readonly DATABASE_INTERNAL_HOST: string;
  readonly REDIS_INTERNAL_URL: string;
  
  // External access URLs (client-side)
  readonly NEXT_PUBLIC_API_URL?: string;
  readonly NEXT_PUBLIC_WEBSOCKET_URL?: string;
  readonly NEXT_PUBLIC_DOMAIN: string;
}

export interface ApiUrlResolver {
  // Server-side URL resolution (internal container network)
  getInternalApiUrl(): string;
  
  // Client-side URL resolution (external access or proxy)
  getExternalApiUrl(): string;
  
  // Universal URL resolution (environment-aware)
  getApiUrl(): string;
  
  // Environment detection
  isServerSide(): boolean;
  isDevelopment(): boolean;
  isProduction(): boolean;
  
  // WebSocket URL resolution
  getWebSocketUrl(): string;
  
  // Health check URL
  getHealthCheckUrl(): string;
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging', 
  PRODUCTION = 'production'
}

export enum UrlType {
  INTERNAL = 'internal',    // Server-side container communication
  EXTERNAL = 'external',    // Client-side external access
  PROXY = 'proxy'          // Client-side proxy routing
}

class EnvironmentAwareUrlResolver implements ApiUrlResolver {
  private environment: Environment;
  
  constructor() {
    this.environment = this.detectEnvironment();
  }
  
  /**
   * Get internal API URL for server-side container communication
   */
  getInternalApiUrl(): string {
    if (!this.isServerSide()) {
      throw new Error('Internal API URL should only be used server-side');
    }
    
    // Use centralized environment validation for consistency
    return getBackendInternalUrl();
  }
  
  /**
   * Get external API URL for client-side access
   */
  getExternalApiUrl(): string {
    if (this.isServerSide()) {
      throw new Error('External API URL should only be used client-side');
    }
    
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    
    // Production domain detection
    if (hostname.includes('revivatech.co.uk')) {
      return 'https://api.revivatech.co.uk';
    }
    
    // Development: use environment variable or proxy
    return process.env.NEXT_PUBLIC_API_URL || '';
  }
  
  /**
   * Universal API URL resolution - automatically detects environment
   * This is the primary method to use in most cases
   */
  getApiUrl(): string {
    if (this.isServerSide()) {
      // Server-side: use internal container networking
      return this.getInternalApiUrl();
    } else {
      // Client-side: use external URL or proxy routing
      return this.getExternalApiUrl();
    }
  }
  
  /**
   * Get WebSocket URL with protocol detection
   */
  getWebSocketUrl(): string {
    if (this.isServerSide()) {
      // Server-side WebSocket connections use internal networking
      const internalUrl = this.getInternalApiUrl();
      return internalUrl.replace('http:', 'ws:').replace('https:', 'wss:');
    }
    
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const protocol = typeof window !== 'undefined' 
      ? window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      : 'ws:';
    
    // Production domain detection
    if (hostname.includes('revivatech.co.uk')) {
      return 'wss://api.revivatech.co.uk';
    }
    
    // Development: use environment variable or construct from hostname
    if (process.env.NEXT_PUBLIC_WEBSOCKET_URL) {
      return process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    }
    
    const port = this.isDevelopment() ? ':3011' : '';
    return `${protocol}//${hostname}${port}`;
  }
  
  /**
   * Get health check URL for service monitoring
   */
  getHealthCheckUrl(): string {
    const baseUrl = this.getApiUrl();
    return baseUrl ? `${baseUrl}/health` : '/api/health';
  }
  
  /**
   * Detect if code is running server-side
   */
  isServerSide(): boolean {
    return typeof window === 'undefined';
  }
  
  /**
   * Detect development environment
   */
  isDevelopment(): boolean {
    return this.environment === Environment.DEVELOPMENT;
  }
  
  /**
   * Detect production environment
   */
  isProduction(): boolean {
    return this.environment === Environment.PRODUCTION;
  }
  
  /**
   * Get current environment configuration
   */
  getEnvironmentConfig(): EnvironmentConfig {
    return {
      BACKEND_INTERNAL_URL: process.env.BACKEND_INTERNAL_URL || 'http://revivatech_backend:3011',
      DATABASE_INTERNAL_HOST: process.env.DATABASE_INTERNAL_HOST || 'revivatech_database',
      REDIS_INTERNAL_URL: process.env.REDIS_INTERNAL_URL || 'redis://revivatech_redis:6379',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
      NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || 'localhost'
    };
  }
  
  /**
   * Validate current environment configuration
   * Uses centralized environment validation system
   */
  validateConfiguration(): ConfigValidationResult {
    const validation = validateEnvironment();
    const config = this.getEnvironmentConfig();
    
    return {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      environment: this.environment,
      config
    };
  }
  
  /**
   * Get debug information about current configuration
   */
  getDebugInfo(): DebugInfo {
    return {
      environment: this.environment,
      isServerSide: this.isServerSide(),
      internalApiUrl: this.isServerSide() ? this.getInternalApiUrl() : '[CLIENT-SIDE]',
      externalApiUrl: !this.isServerSide() ? this.getExternalApiUrl() : '[SERVER-SIDE]',
      webSocketUrl: this.getWebSocketUrl(),
      healthCheckUrl: this.getHealthCheckUrl(),
      config: this.getEnvironmentConfig()
    };
  }
  
  private detectEnvironment(): Environment {
    const nodeEnv = process.env.NODE_ENV;
    
    switch (nodeEnv) {
      case 'production':
        return Environment.PRODUCTION;
      case 'staging':
        return Environment.STAGING;
      default:
        return Environment.DEVELOPMENT;
    }
  }
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  environment: Environment;
  config: EnvironmentConfig;
}

export interface DebugInfo {
  environment: Environment;
  isServerSide: boolean;
  internalApiUrl: string;
  externalApiUrl: string;
  webSocketUrl: string;
  healthCheckUrl: string;
  config: EnvironmentConfig;
}

// Singleton instance for consistent configuration across application
const urlResolver = new EnvironmentAwareUrlResolver();

export default urlResolver;

// Convenience functions for common use cases
export const getApiUrl = (): string => urlResolver.getApiUrl();
export const getWebSocketUrl = (): string => urlResolver.getWebSocketUrl();
export const getHealthCheckUrl = (): string => urlResolver.getHealthCheckUrl();
export const isServerSide = (): boolean => urlResolver.isServerSide();
export const isDevelopment = (): boolean => urlResolver.isDevelopment();
export const isProduction = (): boolean => urlResolver.isProduction();
export const validateConfiguration = (): ConfigValidationResult => urlResolver.validateConfiguration();
export const getDebugInfo = (): DebugInfo => urlResolver.getDebugInfo();

// Legacy compatibility - for gradual migration
export const getApiBaseUrl = getApiUrl; // Alias for backward compatibility