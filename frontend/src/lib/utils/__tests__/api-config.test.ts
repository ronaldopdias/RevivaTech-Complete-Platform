/**
 * Unit tests for Environment-Aware URL Resolution
 * Tests all URL resolution scenarios and environment detection
 */

import { 
  EnvironmentAwareUrlResolver,
  getApiUrl,
  getWebSocketUrl,
  validateConfiguration,
  getDebugInfo,
  Environment,
  type ConfigValidationResult,
  type DebugInfo
} from '../api-config';

// Mock window object for client-side tests
const mockWindow = (hostname: string, protocol: string = 'https:') => {
  Object.defineProperty(global, 'window', {
    value: {
      location: {
        hostname,
        protocol
      }
    },
    writable: true,
    configurable: true
  });
};

// Mock process.env for environment variable tests
const mockEnv = (env: Record<string, string>) => {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...env };
  return () => {
    process.env = originalEnv;
  };
};

// Remove window for server-side tests
const mockServerSide = () => {
  Object.defineProperty(global, 'window', {
    value: undefined,
    writable: true,
    configurable: true
  });
};

describe('EnvironmentAwareUrlResolver', () => {
  let resolver: EnvironmentAwareUrlResolver;

  beforeEach(() => {
    resolver = new (EnvironmentAwareUrlResolver as any)();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Server-side URL Resolution', () => {
    beforeEach(() => {
      mockServerSide();
    });

    it('should return container URL for internal API calls', () => {
      const restoreEnv = mockEnv({
        BACKEND_INTERNAL_URL: 'http://revivatech_backend:3011'
      });

      expect(resolver.getInternalApiUrl()).toBe('http://revivatech_backend:3011');
      
      restoreEnv();
    });

    it('should use default container URL when environment variable missing', () => {
      const restoreEnv = mockEnv({});

      expect(resolver.getInternalApiUrl()).toBe('http://revivatech_backend:3011');
      
      restoreEnv();
    });

    it('should return internal URL for universal getApiUrl() call', () => {
      const restoreEnv = mockEnv({
        BACKEND_INTERNAL_URL: 'http://revivatech_backend:3011'
      });

      expect(resolver.getApiUrl()).toBe('http://revivatech_backend:3011');
      
      restoreEnv();
    });

    it('should throw error when trying to get external URL server-side', () => {
      expect(() => resolver.getExternalApiUrl()).toThrow(
        'External API URL should only be used client-side'
      );
    });

    it('should return WebSocket URL with ws: protocol for server-side', () => {
      const restoreEnv = mockEnv({
        BACKEND_INTERNAL_URL: 'http://revivatech_backend:3011'
      });

      expect(resolver.getWebSocketUrl()).toBe('ws://revivatech_backend:3011');
      
      restoreEnv();
    });
  });

  describe('Client-side URL Resolution', () => {
    it('should return production HTTPS URL for production domain', () => {
      mockWindow('api.revivatech.co.uk', 'https:');

      expect(resolver.getExternalApiUrl()).toBe('https://api.revivatech.co.uk');
    });

    it('should return environment variable URL for development', () => {
      mockWindow('localhost', 'http:');
      const restoreEnv = mockEnv({
        NEXT_PUBLIC_API_URL: 'http://localhost:3011'
      });

      expect(resolver.getExternalApiUrl()).toBe('http://localhost:3011');
      
      restoreEnv();
    });

    it('should return empty string for proxy routing when no env var', () => {
      mockWindow('localhost', 'http:');
      const restoreEnv = mockEnv({});

      expect(resolver.getExternalApiUrl()).toBe('');
      
      restoreEnv();
    });

    it('should throw error when trying to get internal URL client-side', () => {
      mockWindow('localhost', 'http:');

      expect(() => resolver.getInternalApiUrl()).toThrow(
        'Internal API URL should only be used server-side'
      );
    });

    it('should return external URL for universal getApiUrl() call', () => {
      mockWindow('localhost', 'http:');
      const restoreEnv = mockEnv({
        NEXT_PUBLIC_API_URL: 'http://localhost:3011'
      });

      expect(resolver.getApiUrl()).toBe('http://localhost:3011');
      
      restoreEnv();
    });
  });

  describe('WebSocket URL Resolution', () => {
    it('should use wss: protocol for HTTPS pages', () => {
      mockWindow('localhost', 'https:');
      const restoreEnv = mockEnv({});

      expect(resolver.getWebSocketUrl()).toBe('wss://localhost:3011');
      
      restoreEnv();
    });

    it('should use ws: protocol for HTTP pages', () => {
      mockWindow('localhost', 'http:');
      const restoreEnv = mockEnv({});

      expect(resolver.getWebSocketUrl()).toBe('ws://localhost:3011');
      
      restoreEnv();
    });

    it('should use production WebSocket URL for production domain', () => {
      mockWindow('api.revivatech.co.uk', 'https:');

      expect(resolver.getWebSocketUrl()).toBe('wss://api.revivatech.co.uk');
    });

    it('should use environment variable when configured', () => {
      mockWindow('localhost', 'https:');
      const restoreEnv = mockEnv({
        NEXT_PUBLIC_WEBSOCKET_URL: 'wss://custom.example.com'
      });

      expect(resolver.getWebSocketUrl()).toBe('wss://custom.example.com');
      
      restoreEnv();
    });
  });

  describe('Environment Detection', () => {
    it('should detect server-side environment correctly', () => {
      mockServerSide();
      expect(resolver.isServerSide()).toBe(true);
    });

    it('should detect client-side environment correctly', () => {
      mockWindow('localhost');
      expect(resolver.isServerSide()).toBe(false);
    });

    it('should detect development environment', () => {
      const restoreEnv = mockEnv({ NODE_ENV: 'development' });
      const devResolver = new (EnvironmentAwareUrlResolver as any)();
      
      expect(devResolver.isDevelopment()).toBe(true);
      expect(devResolver.isProduction()).toBe(false);
      
      restoreEnv();
    });

    it('should detect production environment', () => {
      const restoreEnv = mockEnv({ NODE_ENV: 'production' });
      const prodResolver = new (EnvironmentAwareUrlResolver as any)();
      
      expect(prodResolver.isProduction()).toBe(true);
      expect(prodResolver.isDevelopment()).toBe(false);
      
      restoreEnv();
    });
  });

  describe('Health Check URL', () => {
    it('should return health check URL with base URL', () => {
      mockWindow('localhost');
      const restoreEnv = mockEnv({
        NEXT_PUBLIC_API_URL: 'http://localhost:3011'
      });

      expect(resolver.getHealthCheckUrl()).toBe('http://localhost:3011/health');
      
      restoreEnv();
    });

    it('should return relative health check URL for proxy routing', () => {
      mockWindow('localhost');
      const restoreEnv = mockEnv({});

      expect(resolver.getHealthCheckUrl()).toBe('/api/health');
      
      restoreEnv();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate server-side configuration successfully', () => {
      mockServerSide();
      const restoreEnv = mockEnv({
        BACKEND_INTERNAL_URL: 'http://revivatech_backend:3011',
        DATABASE_INTERNAL_HOST: 'revivatech_database',
        REDIS_INTERNAL_URL: 'redis://revivatech_redis:6379'
      });

      const result: ConfigValidationResult = resolver.validateConfiguration();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      restoreEnv();
    });

    it('should identify missing server-side configuration', () => {
      mockServerSide();
      const restoreEnv = mockEnv({});

      const result: ConfigValidationResult = resolver.validateConfiguration();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('BACKEND_INTERNAL_URL is required for server-side operations');
      expect(result.errors).toContain('DATABASE_INTERNAL_HOST is required for server-side operations');
      
      restoreEnv();
    });

    it('should validate production client-side configuration', () => {
      mockWindow('localhost');
      const restoreEnv = mockEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.revivatech.co.uk'
      });

      const prodResolver = new (EnvironmentAwareUrlResolver as any)();
      const result: ConfigValidationResult = prodResolver.validateConfiguration();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      restoreEnv();
    });

    it('should identify insecure production configuration', () => {
      mockWindow('localhost');
      const restoreEnv = mockEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://api.revivatech.co.uk' // HTTP in production
      });

      const prodResolver = new (EnvironmentAwareUrlResolver as any)();
      const result: ConfigValidationResult = prodResolver.validateConfiguration();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('NEXT_PUBLIC_API_URL must use HTTPS in production');
      
      restoreEnv();
    });
  });

  describe('Debug Information', () => {
    it('should provide comprehensive debug info for server-side', () => {
      mockServerSide();
      const restoreEnv = mockEnv({
        BACKEND_INTERNAL_URL: 'http://revivatech_backend:3011',
        NODE_ENV: 'development'
      });

      const debugInfo: DebugInfo = resolver.getDebugInfo();
      
      expect(debugInfo.environment).toBe(Environment.DEVELOPMENT);
      expect(debugInfo.isServerSide).toBe(true);
      expect(debugInfo.internalApiUrl).toBe('http://revivatech_backend:3011');
      expect(debugInfo.externalApiUrl).toBe('[SERVER-SIDE]');
      
      restoreEnv();
    });

    it('should provide comprehensive debug info for client-side', () => {
      mockWindow('localhost');
      const restoreEnv = mockEnv({
        NEXT_PUBLIC_API_URL: 'http://localhost:3011',
        NODE_ENV: 'development'
      });

      const debugInfo: DebugInfo = resolver.getDebugInfo();
      
      expect(debugInfo.environment).toBe(Environment.DEVELOPMENT);
      expect(debugInfo.isServerSide).toBe(false);
      expect(debugInfo.internalApiUrl).toBe('[CLIENT-SIDE]');
      expect(debugInfo.externalApiUrl).toBe('http://localhost:3011');
      
      restoreEnv();
    });
  });
});

describe('Convenience Functions', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should export convenience functions that work correctly', () => {
    mockWindow('localhost');
    const restoreEnv = mockEnv({
      NEXT_PUBLIC_API_URL: 'http://localhost:3011'
    });

    expect(getApiUrl()).toBe('http://localhost:3011');
    expect(getWebSocketUrl()).toBe('ws://localhost:3011');
    expect(getHealthCheckUrl()).toBe('http://localhost:3011/health');
    expect(isServerSide()).toBe(false);
    
    restoreEnv();
  });

  it('should validate configuration through convenience function', () => {
    mockServerSide();
    const restoreEnv = mockEnv({
      BACKEND_INTERNAL_URL: 'http://revivatech_backend:3011',
      DATABASE_INTERNAL_HOST: 'revivatech_database'
    });

    const result = validateConfiguration();
    expect(result.isValid).toBe(true);
    
    restoreEnv();
  });

  it('should provide debug info through convenience function', () => {
    mockWindow('localhost');
    const restoreEnv = mockEnv({ NODE_ENV: 'development' });

    const debugInfo = getDebugInfo();
    expect(debugInfo.environment).toBe(Environment.DEVELOPMENT);
    expect(debugInfo.isServerSide).toBe(false);
    
    restoreEnv();
  });
});